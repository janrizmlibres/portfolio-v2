/**
 * The voyage's script: every block of text with its windows, the scenes, and the times the film's moments happen
 * at, in screens of scroll (one screen = one window height). It's the film as storyboarded, 42.75 screens
 * in one take, and plain data: the page renders the runway from it at first paint, and the stage (which loads
 * later) builds the picture to the same times.
 *
 * The opening (home, the stars round it) runs at 85% of its first length (`O`). Work, home built job by job after the
 * relay throws you back, is timed by work.ts.
 */
import stars from "@/public/sky/stars-pca.json";
import type { Block, Line, Scene, SectionId } from "@/lib/film/block";
import type { Box } from "@/lib/film/place";
import { textTint, type Region } from "@/lib/universe/light";
import {
  ABOUT_1, ABOUT_2, ABOUT_CAPTION, ATHENA, BREAKTHROUGHS, CONTACT, CRAWLER, HIS_STAR, MOONS, NDA_LINE, OWN_INTRO, OWN_PROJECTS, PIPELINE, REPORT_BARS,
  REPORT_CUT, PORTRAIT, PROJECTS_INTRO, ROAD_START, ROLES, VOYAGE_PROFILE, WORK_INTRO,
} from "@/lib/content/voyage";
import type { WordMode } from "@/lib/film/modes";
import type { Span } from "@/lib/film/windows";
import { BEAT, planWork, relayOf } from "./work";
import { homeOf, type V3 } from "./route";

const SEC_REGION: Record<SectionId, Region> = { "sec-hero": "hero", "sec-about": "about", "sec-work": "work", "sec-projects": "projects", "sec-contact": "contact" };
const COLUMN: { land: Box; port: Box } = { land: { x: 0.06, y: 0.6, w: 0.31 }, port: { x: 0.06, y: 0.68, w: 0.88 } };
/** Where Work's relay throws you back towards: his university's stars. */
const CAMPUS_AT: V3 = [0.635, 0.1, 0.05];
/** Where a breakthrough's card is pinned while its craft comes by: in the column, which is free between companies. */
const PIN = { land: { x: 0.065, y: 0.56 }, port: { x: 0.06, y: 0.66 } };

// the ribbon: one frame per screenshot of the personal work, wound in a spiral under the shaft's foot (world.ts)
export const RIBBON = { R: 0.03, H: 0.0125, A: 1.6 } as const;
const RIBBON_STEP = (RIBBON.H * RIBBON.A) / RIBBON.R + 0.07; // radians per card

/** Each stage's words move the way the stage moves a record. */
const STAGE_MODE: Record<string, WordMode> = { init: "lift", crawl: "scatter", extract: "square", dedup1: "twin", enrich: "thicken", dedup2: "twin", save: "sink", report: "bars" };

const lines = (...xs: Array<string | Line>): Line[] => xs.map((l) => (typeof l === "string" ? { text: l } : l));
const data = (text: string): Line => ({ text, kind: "data" });

export function voyageScript() {
  const blocks: Block[] = [], scenes: Scene[] = [];
  const block = (b: Partial<Block> & Pick<Block, "id" | "sec" | "lines" | "tIn" | "tOut">) =>
    blocks.push({ kind: "col", mode: "rise", side: "above-left", body: COLUMN, tint: textTint(SEC_REGION[b.sec]), ...b });
  const scene = (s: Scene) => scenes.push(s);

  const O = (t: number) => (t <= 2.2 ? t : 2.2 + (t - 2.2) * 0.85);

  // ---------------------------------------------------------------- 1 · the sky, and the dive into his star
  // the lockup is passed by the dive: the small print and the line go first, the name last
  block({
    id: "hero", sec: "sec-hero", title: VOYAGE_PROFILE.name, cls: "hero", side: "column", mode: "pass",
    lines: lines(data(VOYAGE_PROFILE.role), VOYAGE_PROFILE.line), tIn: [-0.4, -0.05], tOut: [0.04, 0.62],
    rowOut: [[0.16, 0.62], [0.04, 0.44], [0.08, 0.5]], passFrom: `star:${HIS_STAR}`,
    body: { land: { x: 0.065, y: 0.5, w: 0.36, mid: true }, port: { x: 0.06, y: 0.7, w: 0.86, mid: true }, short: { x: 0.05, y: 0.52, w: 0.42, mid: true } },
  });
  scene({ id: "hero", sec: "sec-hero", name: "The sky, and the dive", t0: 0, t1: 2.2 });

  // ---------------------------------------------------------------- 2–3 · About: home, then the stars round it
  // written in word by word with the scroll, each line lighting the stars of what it's about (the stage's); between
  // About's words leaving and Around home's writing in, the camera passes close by the ring's rim (about.ts)
  block({
    // its title heads its words in the column
    id: "about-1", sec: "sec-about", title: "About", lines: lines(...ABOUT_1.map((l) => l.text)), tIn: [1.95, O(2.85)], tOut: [O(3.75), O(4.25)],
    mode: "rise", side: "column",
    // his portrait, hung in the dark under the ship on a leader line reaching up into its hull
    labels: [{ text: PORTRAIT.name, sub: PORTRAIT.place, ref: "home-edge", rest: "home-hang", of: "home", photo: PORTRAIT }],
    body: { land: { x: 0.065, y: 0.44, w: 0.3 }, port: { x: 0.06, y: 0.62, w: 0.86 }, short: { x: 0.05, y: 0.46, w: 0.38 } },
  });
  scene({ id: "home", sec: "sec-about", name: "Home", t0: 2.2, t1: O(4.05) });
  block({
    id: "about-2", sec: "sec-about", title: "Around home", lines: lines(...ABOUT_2.map((l) => l.text)), tIn: [O(4.55), O(5.35)], tOut: [O(5.95), O(6.45)],
    // its heading heads the column, clear of the threads between the stars it spreads across the frame
    mode: "rise", caption: ABOUT_CAPTION, anchor: { ref: "home", r: 0.03, ax: -0.4, ay: 1.2 }, side: "column", portSide: "column",
    body: { land: { x: 0.065, y: 0.4, w: 0.32 }, port: { x: 0.06, y: 0.55, w: 0.86 }, short: { x: 0.05, y: 0.26, w: 0.4 } },
  });
  scene({ id: "around", sec: "sec-about", name: "Around home", t0: O(4.05), t1: O(6.2) });

  // ---------------------------------------------------------------- 4–9 · Work: home, built job by job
  // (work.ts): as Around home's words go, the camera turns to the relay by home while Work's intro
  // writes in; it throws you back to August 2023, where home is only its core, and each company builds a quarter of its
  // ring, oldest first, while its words are read; between them the ring turns a quarter as the breakthroughs of that
  // stretch come by, those he built with docking at the hub
  const sun = stars.stars.find((s) => s.id === HIS_STAR)!;
  const homeP = homeOf([sun.x, sun.y, sun.z] as V3).P;
  const relay = relayOf({ home: homeP, start: CAMPUS_AT });
  const plan = planWork({ t0: O(6.2), roles: ROLES, marks: BREAKTHROUGHS });
  const D = plan.depart.at;
  block({ id: "work-0", sec: "sec-work", intro: true, title: WORK_INTRO.title, lines: lines(...WORK_INTRO.lines), tIn: [O(6.45), D.come[1]], tOut: [D.hold[1] - 0.15, D.hold[1] + 0.1], side: "column" });
  // a window over `span`: written in over its first part, gone over its last
  const over = ([a, b]: [number, number], inK = 0.3, outK = 0.25): { tIn: [number, number]; tOut: [number, number] } => ({ tIn: [a, a + (b - a) * inK], tOut: [b - (b - a) * outK, b] });
  // (in the column: out of the flash, home as it was, its core alone)
  block({ id: "tail", sec: "sec-work", title: ROAD_START.title, lines: lines(ROAD_START.line), ...over(plan.core, 0.35, 0.3), side: "column" });
  plan.quarters.forEach((q) => {
    const r = q.role;
    block({
      id: `role-${r.id}`, sec: "sec-work", title: r.company, lines: lines(data(`${r.role} · ${r.span}`), r.shipped), ...over(q.build), side: "column",
      // its stack hangs on leader lines from the parts of its quarter, each once it's built
      labels: r.stack.map((text, k) => ({ text, ref: `stack:${r.id}:${k}`, of: "home" })),
      ask: { label: r.company, q: `What did he do at ${r.company}?` },
    });
    scene({ id: `role-${r.id}`, sec: "sec-work", name: r.company, t0: q.build[0], t1: q.gap[1] });
    for (const c of q.calls) {
      const m = c.mark;
      block({
        // its card pinned in the column, its leader following the craft (stage.ts)
        // (a short last word, a version's number, never ends a line on its own)
        id: `mark-${m.id}`, sec: "sec-work", kind: "sign", sign: `craft:${m.id}`, pin: PIN, title: m.name.replace(/ (\S{1,3})$/, "\u00a0$1"),
        lines: lines(data(m.label + (m.built ? " · built with" : "")), m.why),
        // a docking one's read as it comes in, holds and leaves; a passing one's while it crosses, until the next comes
        ...(c.way === "dock" ? over(c.at, 0.25, 0.2) : { tIn: [c.at[0], c.at[0] + 0.08] as [number, number], tOut: [c.at[0] + BEAT.every - 0.08, c.at[0] + BEAT.every] as [number, number] }),
        ask: { label: m.name, q: `Why does ${m.name} matter to him?` },
      });
    }
  });
  const RIDE_END = plan.total;
  scene({ id: "ride", sec: "sec-work", name: "Home, built", t0: O(6.2), t1: RIDE_END });

  // ---------------------------------------------------------------- 10 · on to Athena
  // straight from the ship to Athena: the camera draws back off the finished ring
  // while Projects' intro is read, and closes on her
  const A0 = RIDE_END + 2.4;
  block({ id: "projects", sec: "sec-projects", intro: true, title: PROJECTS_INTRO.title, lines: lines(PROJECTS_INTRO.line), tIn: [RIDE_END + 0.3, RIDE_END + 0.8], tOut: [RIDE_END + 1.45, RIDE_END + 1.8], side: "column" });
  scene({ id: "recap", sec: "sec-projects", name: "On to Athena", t0: RIDE_END, t1: A0 });

  // ---------------------------------------------------------------- 11 · Athena and her moons
  const moonLabels = (of: "athena" | "ai-web-crawler") => MOONS.filter((m) => m.of === of).map((m) => ({ text: m.title, sub: m.sub, ref: `moon:${m.slug}`, of }));
  block({
    id: "athena", sec: "sec-projects", projId: ATHENA.slug, title: ATHENA.title, sub: ATHENA.sub, lines: lines(ATHENA.line, data(ATHENA.stack), data(NDA_LINE)),
    tIn: [A0 - 0.5, A0 + 0.15], tOut: [A0 + 2.35, A0 + 2.85], anchor: { ref: "athena", rScale: 2, ax: -0.75, ay: 1.05 }, labels: moonLabels("athena"),
    ask: { label: "Athena", q: "Tell me about Athena." },
  });
  block({
    // on a phone her patterns are a list between her and her lines: at a phone's width, a label riding a wedge lands on
    // her ice or her ring
    id: "athena-open", sec: "sec-projects", lines: [], tIn: [A0 + 0.95, A0 + 1.35], tOut: [A0 + 2.1, A0 + 2.4],
    body: { land: COLUMN.land, port: { x: 0.06, y: 0.53, w: 0.88 } },
    labels: ATHENA.patterns.map((text, k) => ({ text, ref: `wedge:athena:${k}`, of: "athena" })),
  });
  scene({ id: "athena", sec: "sec-projects", name: "Athena", t0: A0 - 0.5, t1: A0 + 3.0 });

  // ---------------------------------------------------------------- 12 · upstream to the crawler, then down its pipeline
  const C0 = A0 + 4.1;
  block({
    id: "crawler", sec: "sec-projects", projId: CRAWLER.slug, title: CRAWLER.title, sub: CRAWLER.sub, lines: lines(CRAWLER.line, data(NDA_LINE)),
    tIn: [C0 - 0.6, C0 + 0.05], tOut: [C0 + 0.85, C0 + 1.3], anchor: { ref: "crawler", ax: -0.8, ay: 1.1 }, labels: moonLabels("ai-web-crawler"),
    ask: { label: "the AI Web Crawler", q: "How does the AI Web Crawler work?" },
  });
  // each stage gets 0.76 screens, and the fall ends in the film's one climax
  const TAU0 = C0 + 1.45, STEP = 0.76;
  const tau = Object.fromEntries(PIPELINE.map((s, k) => [s.id, TAU0 + k * STEP])) as Record<string, number>;
  for (const s of PIPELINE) {
    block({
      // a layer's number never ends a line on its own
      id: `stage-${s.id}`, sec: "sec-projects", title: `${s.tag} · ${s.title.replace(/ (\d+)$/, "\u00a0$1")}`, cls: "stage", lines: lines(data(s.tool), s.line),
      tIn: [tau[s.id]! - 0.5 * STEP, tau[s.id]! - 0.13 * STEP], tOut: [tau[s.id]! + 0.3 * STEP, tau[s.id]! + 0.46 * STEP],
      // the report's deck sits just under Save, low in the frame, so its title rides higher, clear of its lines
      anchor: { ref: `stage:${s.id}`, ax: -1.15, ay: s.id === "report" ? 2.4 : 0.4 }, side: "left",
      // on a portrait screen the shaft fills the top half, so its title heads its lines across the bottom
      portSide: "column", hue: s.hue, tint: s.hue, mode: STAGE_MODE[s.id]!,
      ask: { label: s.title.toLowerCase(), q: `What happens at the crawler’s “${s.title}” stage?` },
      // the report's bars, each named on a leader line
      ...(s.id === "report" ? { labels: REPORT_BARS.map((text, k) => ({ text, ref: `bar:${k}` })) } : {}),
    });
  }
  // (the climax rises up the shaft before the front launches: stage.ts)
  const CL = tau.report! + 0.95;
  block({
    id: "outcome", sec: "sec-projects", title: CRAWLER.outcomeTitle, lines: lines(CRAWLER.outcome, data(NDA_LINE)), tIn: [CL + 0.45, CL + 0.85], tOut: [CL + 1.55, CL + 1.85], side: "column", tint: textTint("crawler"),
    // the cut, on the hairline of what enriching would have cost without the dedups
    labels: [{ text: REPORT_CUT.text, sub: REPORT_CUT.sub, ref: "bar:cut" }],
  });
  const PIPE_END = CL + 1.8;
  scene({ id: "crawler", sec: "sec-projects", name: "AI Web Crawler", t0: A0 + 3.0, t1: PIPE_END });

  // ---------------------------------------------------------------- 13 · the ribbon, out of the shaft's foot
  const F0 = PIPE_END - 0.35, F1 = F0 + 2.0;
  block({ id: "own", sec: "sec-projects", title: OWN_INTRO.title, lines: lines(OWN_INTRO.line), tIn: [F0 + 0.6, F0 + 1.1], tOut: [F1 + 0.05, F1 + 0.45], side: "column", tint: textTint("own") });
  const cards = OWN_PROJECTS.flatMap((p) => p.images.map((img, i) => ({ slug: p.slug, img, i }))).map((c, k) => ({ ...c, k, ang: k * RIBBON_STEP }));
  const thEnd = cards.at(-1)!.ang, G1 = F1 + 3.9;
  const tOfTh = (th: number) => F1 + (th / thEnd) * (G1 - 0.3 - F1);
  OWN_PROJECTS.forEach((p, gi) => {
    const cs = cards.filter((c) => c.slug === p.slug), a = cs[0]!.ang, z = cs.at(-1)!.ang;
    block({
      id: `own-${p.slug}`, sec: "sec-projects", projId: p.slug, title: p.title, sub: p.sub, lines: lines(p.line, data(p.stack)),
      links: [{ label: "Live demo", href: p.demo }, { label: "Code", href: p.repo }],
      tIn: gi === 0 ? [F1 + 0.35, F1 + 0.8] : [tOfTh(a - 0.45 * RIBBON_STEP), tOfTh(a - 0.05 * RIBBON_STEP)],
      tOut: gi === OWN_PROJECTS.length - 1 ? [G1 + 0.1, G1 + 0.5] : [tOfTh(z + 0.3 * RIBBON_STEP), tOfTh(z + 0.55 * RIBBON_STEP)],
      side: "column", tint: textTint("own"), ask: { label: p.title, q: `Tell me about ${p.title}.` },
    });
  });
  scene({ id: "own", sec: "sec-projects", name: "On my own time", t0: PIPE_END - 0.35, t1: G1 });

  // ---------------------------------------------------------------- 14 · out to the whole sky: Contact
  const END = G1 + 2.6;
  block({
    id: "contact", sec: "sec-contact", title: CONTACT.title, lines: lines(CONTACT.next, CONTACT.open, { text: CONTACT.local, kind: "data", clock: true }),
    links: [...CONTACT.links, { ...CONTACT.back, back: true }], tIn: [G1 + 1.6, G1 + 2.2], tOut: [END + 5, END + 6],
    anchor: { ref: `star:${HIS_STAR}`, ax: 0, ay: 0 }, side: "star", body: { land: { x: 0.07, y: 0.4, w: 0.3 }, port: { x: 0.07, y: 0.66, w: 0.86 } },
  });
  scene({ id: "contact", sec: "sec-contact", name: "Contact", t0: G1, t1: END });

  // ---------------------------------------------------------------- where the sky answers the hand
  // the stars are the subject (hovered, one is named; clicked, it asks Tycho) on the hero's first frames, round home,
  // and at Contact once the pull-out has opened the whole sky, where a label waits for the
  // pointer to rest; the sky is seen whole, and turns under a drag, on the hero's first frame and Contact's last
  const sceneAt = (id: string) => scenes.find((x) => x.id === id)!;
  const WHOLE_SKY = G1 + 1.2;
  const sky: { stars: Span[]; contact: Span[]; drag: Span[] } = {
    stars: [[-Infinity, 0.5], [sceneAt("home").t0, sceneAt("around").t1], [WHOLE_SKY, Infinity]],
    contact: [[WHOLE_SKY, Infinity]],
    drag: [[-Infinity, 0.02], [END - 0.25, Infinity]],
  };

  scenes.sort((a, b) => a.t0 - b.t0);
  return {
    blocks,
    scenes,
    total: END,
    relay,
    plan,
    cards,
    sky,
    times: { O, RIDE_END, A0, C0, TAU0, STEP, tau, CL, PIPE_END, F0, F1, G1, END, thEnd, RIBBON_STEP },
  };
}

export type VoyageScript = ReturnType<typeof voyageScript>;
