import { describe, expect, it } from "vitest";
import { voyageScript } from "./script";
import { layRunway } from "@/lib/film/spots";
import { phase, wordWindows } from "@/lib/film/windows";

// The storyboarded film: every block's reading spot, in-window and out-window, in screens (to 0.01). The opening (the
// hero and About) was retimed when it was taken to finish: its text windows moved by at most 0.1 screens. From Work on
// everything runs 0.81 screens sooner since the orbit's peel was cut (2026-10-10); Work after its relay's throw is home
// built job by job since 2026-10-11 (work.ts), 4.7 screens shorter than the chain of relays it replaced.
const STORYBOARD: Array<[string, number, number, number, number, number]> = [["hero",0,-0.4,-0.05,0.04,0.62],["about-1",3.14,1.95,2.75,3.52,3.94],["about-2",5.13,4.2,4.88,5.39,5.81],["work-0",6.55,5.81,6.35,6.75,7],["tail",8.51,8.2,8.41,8.62,8.8],["role-yearbook",9.32,8.8,9.1,9.55,9.8],["mark-gpt-4-turbo",9.95,9.8,9.88,10.02,10.1],["mark-claude-3",10.25,10.1,10.18,10.32,10.4],["mark-gpt-4o",10.66,10.4,10.52,10.8,10.9],["role-elinnov",11.55,11.02,11.32,11.77,12.02],["mark-o1",12.17,12.02,12.1,12.24,12.32],["mark-mcp",12.58,12.32,12.45,12.72,12.82],["mark-claude-code",12.97,12.82,12.9,13.04,13.12],["mark-gpt-4-1",13.38,13.12,13.25,13.52,13.62],["role-tolstoy",14.27,13.74,14.04,14.49,14.74],["mark-gpt-5",15,14.74,14.87,15.14,15.24],["role-logolife",15.89,15.36,15.66,16.11,16.36],["mark-opus-4-5",16.51,16.36,16.44,16.58,16.66],["mark-opus-4-6",16.81,16.66,16.74,16.88,16.96],["mark-glasswing",17.11,16.96,17.04,17.18,17.26],["mark-fable-5",17.41,17.26,17.34,17.48,17.56],["mark-claude-5-5",17.71,17.56,17.64,17.78,17.86],["projects",19.7,18.88,19.38,20.03,20.38],["athena",22.23,20.48,21.13,23.33,23.83],["athena-open",22.71,21.93,22.33,23.08,23.38],["crawler",25.53,24.48,25.13,25.93,26.38],["stage-init",26.59,26.15,26.43,26.76,26.88],["stage-crawl",27.35,26.91,27.19,27.52,27.64],["stage-extract",28.11,27.67,27.95,28.28,28.4],["stage-dedup1",28.87,28.43,28.71,29.04,29.16],["stage-enrich",29.63,29.19,29.47,29.8,29.92],["stage-dedup2",30.39,29.95,30.23,30.56,30.68],["stage-save",31.15,30.71,30.99,31.32,31.44],["stage-report",31.91,31.47,31.75,32.08,32.2],["outcome",34,33.25,33.65,34.35,34.65],["own",35.82,34.85,35.35,36.3,36.7],["own-mercado",37.24,36.6,37.05,37.43,37.56],["own-flowstack",38.11,37.56,37.77,38.46,38.59],["own-pulsevr",39.52,38.59,38.8,40.25,40.65],["contact",42.55,41.75,42.35,42.75,42.75]];

describe("voyageScript", () => {
  const script = voyageScript();
  const runway = layRunway(script.blocks, script.total);

  it("is the storyboarded film: 42.75 screens", () => {
    expect(script.total).toBeCloseTo(42.75, 2);
  });

  it("keeps the storyboarded text, block for block, in its order", () => {
    expect(runway.blocks.map((b) => b.id)).toEqual(STORYBOARD.map((r) => r[0]));
  });

  it("keeps every block's storyboarded windows and reading spot", () => {
    // the storyboard rounds to 0.01, and its pace rounded to the nearest sample where this one interpolates
    const off = (x: number, y: number) => Math.abs(x - y) <= 0.01;
    for (const [id, spot, a, z, c, d] of STORYBOARD) {
      const b = runway.blocks.find((x) => x.id === id)!;
      const got = [b.spot, b.tIn[0], b.tIn[1], Math.min(b.tOut[0], script.total), Math.min(b.tOut[1], script.total)];
      expect([id, got.every((x, i) => off(x, [spot, a, z, c, d][i]!))]).toEqual([id, true]);
    }
  });

  it("has every word of every block fully in at its reading spot", () => {
    for (const b of runway.blocks) {
      const rows = [...(b.title ? [b.title] : []), ...b.lines.map((l) => l.text)].map((t) => t.split(/\s+/).length);
      for (const w of wordWindows(rows, b.tIn, b.tOut).flat()) expect([b.id, phase(w, b.spot).opacity]).toEqual([b.id, 1]);
    }
  });

  it("opens each section with its first block, in page order", () => {
    expect(runway.sections.map((s) => s.id)).toEqual(["sec-hero", "sec-about", "sec-work", "sec-projects", "sec-contact"]);
  });

  it("lands a link to Work where its build starts, August 2023, and one to Projects on Athena, past the intros the scroll still passes", () => {
    const at = (id: string) => runway.blocks.find((b) => b.id === id)!.spot;
    const sec = (id: string) => runway.sections.find((s) => s.id === id)!;
    expect(Object.fromEntries(runway.sections.map((s) => [s.id, s.land]))).toEqual({
      "sec-hero": at("hero"), "sec-about": at("about-1"), "sec-work": at("tail"), "sec-projects": at("athena"), "sec-contact": at("contact"),
    });
    expect([sec("sec-work").top, sec("sec-projects").top]).toEqual([at("work-0"), at("projects")]);
  });

  it("writes About in word by word with the scroll, and dissolves it the same way", () => {
    for (const id of ["about-1", "about-2"]) expect(script.blocks.find((x) => x.id === id)!.mode).toBe("rise");
  });

  it("heads About's words with its title, in the column over them (Janriz, 2026-10-11), on every screen", () => {
    const about = script.blocks.find((x) => x.id === "about-1")!;
    expect([about.side, about.portSide ?? about.side]).toEqual(["column", "column"]);
  });

  it("sets every titled block's lines from their top, so a title heading them in the column sits over them, not across them", () => {
    // (the hero's name is in its lockup's flow, so its lines can be centred)
    for (const b of script.blocks.filter((x) => x.title && x.cls !== "hero"))
      for (const box of [b.body.land, b.body.port, b.body.short]) expect([b.id, !!box?.mid]).toEqual([b.id, false]);
  });

  it("hangs his portrait in the dark under the ship, its leader reaching up into the hull", () => {
    const [portrait] = script.blocks.find((x) => x.id === "about-1")!.labels!;
    expect([portrait!.ref, portrait!.rest]).toEqual(["home-edge", "home-hang"]);
  });

  it("passes the hero's lockup with the dive: the small print first, the name last", () => {
    const hero = script.blocks.find((b) => b.id === "hero")!;
    expect(hero.mode).toBe("pass");
    const [name, role, line] = hero.rowOut!;
    expect(role![0]).toBeLessThan(line![0]);
    expect(line![0]).toBeLessThan(name![0]);
    expect(name![1]).toBe(hero.tOut[1]);
    expect(role![0]).toBe(hero.tOut[0]);
  });

  it("composes the opening for a phone held sideways too", () => {
    for (const id of ["hero", "about-1", "about-2"]) expect([id, !!script.blocks.find((b) => b.id === id)!.body.short]).toEqual([id, true]);
  });

  it("pins each breakthrough's card in the column, its leader on its craft, written in as the rest of the film's words are", () => {
    const marks = script.blocks.filter((b) => b.kind === "sign");
    expect(marks).toHaveLength(13);
    for (const m of marks) {
      expect(m.mode).toBe("rise");
      expect(m.sign).toBe(m.id.replace(/^mark-/, "craft:"));
      expect(m.pin).toBeDefined();
    }
    // one at a time: each card's gone before the next writes in
    for (let i = 1; i < marks.length; i++) expect(marks[i]!.tIn[0]).toBeGreaterThanOrEqual(marks[i - 1]!.tOut[1] - 1e-9);
  });

  it("reads each company's words in the column while its quarter of home builds, its stack on leader lines to the parts it built", () => {
    for (const q of script.plan.quarters) {
      const b = script.blocks.find((x) => x.id === `role-${q.role.id}`)!;
      expect(b.side).toBe("column");
      expect(b.tIn[0]).toBeCloseTo(q.build[0], 9);
      expect(b.tOut[1]).toBeCloseTo(q.build[1], 9);
      expect(b.labels!.map((l) => l.ref)).toEqual(q.role.stack.map((_, k) => `stack:${q.role.id}:${k}`));
    }
  });

  it("moves each pipeline stage's words the way its stage moves a record", () => {
    const modes = Object.fromEntries(script.blocks.filter((b) => b.id.startsWith("stage-")).map((b) => [b.id, b.mode]));
    expect(modes).toEqual({
      "stage-init": "lift", "stage-crawl": "scatter", "stage-extract": "square", "stage-dedup1": "twin",
      "stage-enrich": "thicken", "stage-dedup2": "twin", "stage-save": "sink", "stage-report": "bars",
    });
  });

  it("deep-links each project as project-{slug}", () => {
    expect(script.blocks.flatMap((b) => (b.projId ? [b.projId] : []))).toEqual(["athena", "ai-web-crawler", "mercado", "flowstack", "pulsevr"]);
  });

  it("keeps the NDA line on the NDA work", () => {
    for (const id of ["athena", "crawler", "outcome"]) expect(script.blocks.find((b) => b.id === id)!.lines.some((l) => l.text.startsWith("⊘ NDA"))).toBe(true);
  });

  it("names the storyboarded scene times", () => {
    expect(script.times.RIDE_END).toBeCloseTo(18.58, 2);
    expect(script.times.A0).toBeCloseTo(20.98, 2);
    expect(script.times.END).toBe(script.total);
  });

  it("goes straight on from Around home to Work: no peel, Work's intro writing in as Around home's words have gone (Janriz, 2026-10-10)", () => {
    const b = (id: string) => script.blocks.find((x) => x.id === id)!;
    const s = (id: string) => script.scenes.find((x) => x.id === id);
    expect(s("peel")).toBeUndefined();
    expect(b("work-0").tIn[0]).toBeCloseTo(b("about-2").tOut[1], 6);
    expect(s("ride")!.t0).toBeCloseTo(s("around")!.t1, 6);
    // the camera reaches the relay by home as Work's intro finishes writing in
    expect(script.plan.depart.at.come[1]).toBeCloseTo(b("work-0").tIn[1], 6);
  });
});
