/**
 * Where everything in the voyage sits, in the sky's own coordinates (the unit sphere of the PCA layout). Home orbits
 * his own star. Work's relay stands just off it, aimed back at his university's stars (work.ts).
 * LogoLife's two worlds sit by their own stars near the sky's centre: Athena, and the AI Web Crawler, whose pipeline
 * hangs below it as a shaft. The personal work is the ribbon: its frames, the pipeline's records grown, wound in a spiral
 * down from under the shaft's foot.
 *
 * The relay is the script's (plain math), turned into three.js vectors, so the camera flies to the relay the text was
 * timed on. Star ids are this snapshot of the sky's.
 */
import { CatmullRomCurve3, Vector3 } from "three";
import { ATHENA, CRAWLER, HIS_STAR, MOONS, PIPELINE } from "@/lib/content/voyage";
import { homeOf, type V3 } from "./route";
import { RIBBON, type VoyageScript } from "./script";

export const UP = new Vector3(0, 1, 0);
const V = (x: number, y: number, z: number) => new Vector3(x, y, z);
const v3 = (p: V3) => new Vector3(p[0], p[1], p[2]);

// moons' sizes, in sky units: the crawler's are its companion craft, the relay (the Crawler Dashboard) and the tug (the
// Data Maintenance Pipeline), drawn large enough that their parts read
const MOON_R: Record<string, number> = { "counselor-dashboard": 0.0028, "e2e-testing-suite": 0.0022, "crawler-dashboard": 0.0032, "data-maintenance-pipeline": 0.0026 };
// how fast each moon goes round, in radians per screen of scroll: the relay close in and quick, the tug further out and
// slower
const MOON_SPEED: Record<string, number> = { "crawler-dashboard": 0.9, "data-maintenance-pipeline": 0.35 };
// how far out each moon goes round, in its world's radii, where it isn't the default: the crawler's tug rides closer in,
// so it and its label stay inside the frame while the crawler is read
const MOON_RAD: Record<string, number> = { "data-maintenance-pipeline": 2.85 };
// where each of the crawler's companions starts round its orbit, so that while it's read (from the side Athena's on) both
// pass under it, clear of the text, the route map, Tycho and the corners
const MOON_PHASE: Record<string, number> = { "crawler-dashboard": 2.15, "data-maintenance-pipeline": 4.0 };

export function layWorld(script: VoyageScript, starAt: (id: string) => V3) {
  const star = (id: string) => v3(starAt(id));
  const SUN = star(HIS_STAR);
  const home = homeOf(starAt(HIS_STAR));
  const HOME = { P: v3(home.P), r: home.r };

  // ---------------------------------------------------------------- Work: the relay by home (work.ts)
  // its frame: `axis` the way it throws, `side` to its right, `up`, and its size (`scale`, the sky's units per model
  // unit); `at` places a point given in its model's frame (x to its right, y along its throw, z up)
  const r = script.relay, rP = v3(r.P), rAxis = v3(r.axis), rSide = v3(r.side), rUp = v3(r.up);
  const relay = {
    ...r, P: rP, axis: rAxis, side: rSide, up: rUp,
    at: (x: number, y: number, z: number) => rP.clone().addScaledVector(rSide, x * r.scale).addScaledVector(rAxis, y * r.scale).addScaledVector(rUp, z * r.scale),
  };

  // ---------------------------------------------------------------- LogoLife's worlds and their moons
  const ATH = { P: star(ATHENA.star).add(V(-0.014, 0.006, 0.012)), r: 0.0095, lightP: star(ATHENA.star) };
  // the crawler is drawn at `size` of the storyboard's radius; its output port, where the records leave, is `mouth` of
  // that up its axis
  const CRW = { P: star(CRAWLER.star).add(V(-0.012, 0.005, 0.012)), r: 0.0078, lightP: star(CRAWLER.star), size: 1.3, mouth: 0.5 };
  const parents = { athena: ATH, "ai-web-crawler": CRW };
  // each moon circles its world in a tilted plane; its angle turns with the scroll
  const moons = MOONS.map((m, k) => {
    const p = parents[m.of], n = V(0.15 + 0.2 * k, 1, 0.3 - 0.25 * k).normalize();
    const a = new Vector3().crossVectors(n, V(1, 0, 0)).normalize(), b = new Vector3().crossVectors(n, a).normalize();
    return { ...m, parent: p, a, b, rad: p.r * (MOON_RAD[m.slug] ?? (k % 2 ? 3.3 : 2.5)), phase: MOON_PHASE[m.slug] ?? k * 2.2, r: MOON_R[m.slug] ?? 0.0024, speed: MOON_SPEED[m.slug] ?? 0.85 };
  });
  const moonAt = (m: (typeof moons)[number], ang: number) => m.parent.P.clone().addScaledVector(m.a, Math.cos(ang) * m.rad).addScaledVector(m.b, Math.sin(ang) * m.rad);

  // the stream: records flow from the crawler's output port, up off its top, to Athena
  const mouth = CRW.P.clone().addScaledVector(UP, CRW.r * CRW.size * CRW.mouth);
  const stream = new CatmullRomCurve3([mouth, mouth.clone().addScaledVector(UP, CRW.r * 1.2), CRW.P.clone().lerp(ATH.P, 0.5).add(V(0, 0.025, 0.02)), ATH.P.clone()], false, "centripetal");

  // ---------------------------------------------------------------- the crawler's pipeline: a shaft below it, one level per stage
  const SP = 0.0125;
  const top = CRW.P.clone().addScaledVector(UP, -CRW.r * 1.6);
  const shaft = {
    top, SP, R: 0.0058,
    // one level per stage, SP apart; the report is the deck just under Save, its bars standing round Save's magazine
    levels: PIPELINE.map((s, k) => ({ ...s, k, d: s.id === "report" ? (k - 1) * SP + 0.5 * SP : k * SP })),
    at: (depth: number, ang = 0, rad = 0) => V(top.x + Math.cos(ang) * rad, top.y - depth, top.z + Math.sin(ang) * rad),
  };
  const depth = (id: string) => shaft.levels.find((l) => l.id === id)!.d;

  // ---------------------------------------------------------------- the personal work: the ribbon, under the shaft
  // (no machine of its own: they're the pipeline's data): its frames come out of Save's store, down the bore, and stand free in a spiral round the shaft's axis,
  // winding down from a frame's height under the report's deck. The first faces 0.74 rad round from the crawler's star,
  // so its metal is lit from the side, and the climax ends looking at it (stage.ts).
  const toStar = CRW.lightP.clone().sub(CRW.P);
  const axis = shaft.at(depth("report") + 0.0235), a0 = Math.atan2(toStar.z, toStar.x) + 0.74, drop = 0.0042;
  const RIB = {
    ...RIBBON, axis, a0, drop, step: script.times.RIBBON_STEP, cards: script.cards,
    /** where the frames come out of: Save's store, on the shaft's axis */
    store: shaft.at(depth("save")),
    /** the spiral's middle, on its axis */
    C: axis.clone().addScaledVector(UP, -0.5 * drop * script.times.thEnd),
    /** the way out from the axis at angle `ang` round the spiral */
    out: (ang: number) => V(Math.cos(a0 + ang), 0, Math.sin(a0 + ang)),
    at: (ang: number, rad: number = RIBBON.R) => axis.clone().add(V(Math.cos(a0 + ang) * rad, -ang * drop, Math.sin(a0 + ang) * rad)),
  };

  return { star, SUN, HOME, relay, ATH, CRW, moons, moonAt, stream, shaft, depth, RIB };
}

export type World = ReturnType<typeof layWorld>;
