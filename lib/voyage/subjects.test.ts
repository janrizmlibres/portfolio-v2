import { describe, expect, it } from "vitest";
import { MOONS, OWN_PROJECTS, ROLES } from "@/lib/content/voyage";
import { voyageScript } from "./script";
import { SUBJECT_SLUGS, subjectOf, wayTo } from "./subjects";

const script = voyageScript();

describe("the subjects Tycho points at", () => {
  it("has every world, moon, company and personal project on the voyage", () => {
    expect(SUBJECT_SLUGS).toEqual(
      expect.arrayContaining(["athena", "ai-web-crawler", ...MOONS.map((m) => m.slug), ...OWN_PROJECTS.map((p) => p.slug), ...ROLES.map((r) => r.id)]),
    );
  });

  it("reads each subject at a block of the script, in that block's section", () => {
    for (const slug of SUBJECT_SLUGS) {
      const s = subjectOf(slug)!;
      const b = script.blocks.find((x) => x.id === s.block);
      expect(b, slug).toBeTruthy();
      expect(s.sec, slug).toBe(b!.sec);
    }
  });

  it("points at a moon from its world's block, at the moon itself", () => {
    expect(subjectOf("counselor-dashboard")).toMatchObject({ block: "athena", ref: "moon:counselor-dashboard" });
    expect(subjectOf("data-maintenance-pipeline")).toMatchObject({ block: "crawler", ref: "moon:data-maintenance-pipeline" });
  });

  it("points at a company's stack where its quarter hangs it, and at a world itself", () => {
    expect(subjectOf("tolstoy")).toMatchObject({ block: "role-tolstoy", ref: "stack:tolstoy:0", sec: "sec-work" });
    for (const r of ROLES) {
      const s = subjectOf(r.id)!;
      expect(script.blocks.find((b) => b.id === s.block)!.labels!.map((l) => l.ref), r.id).toContain(s.ref);
    }
    expect(subjectOf("athena")).toMatchObject({ block: "athena", ref: "athena", sec: "sec-projects" });
  });

  it("knows the crawler by the slug the work projects list gives it", () => {
    expect(subjectOf("ai-crawler")).toEqual(subjectOf("ai-web-crawler"));
  });

  it("knows nothing else", () => {
    expect(subjectOf("healthcare")).toBeNull();
  });
});

describe("the way to a subject", () => {
  it("stays put when its block is being read", () => {
    expect(wayTo({ t: 20.1, sec: "sec-projects" }, { spot: 20, sec: "sec-projects" })).toBe("here");
  });

  it("glides within the section the film is in", () => {
    expect(wayTo({ t: 18, sec: "sec-projects" }, { spot: 26, sec: "sec-projects" })).toBe("glide");
  });

  it("warps to another section", () => {
    expect(wayTo({ t: 3, sec: "sec-about" }, { spot: 26, sec: "sec-projects" })).toBe("warp");
  });
});
