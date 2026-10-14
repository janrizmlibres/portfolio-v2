/**
 * The warp's timing: when each of its beats plays, in seconds from the click. The beats are *Warp or scroll*'s
 * wormhole journey at its own pace, with *Make every scroll a scene*'s pull-back and flare before the hole:
 * 1. pull: the camera pulls back out to the whole sky while the text leaves (skipped in the hero, already outside);
 *    meanwhile Tycho's boosters open, his jets fire (`lift`) and he flies his one clean circle (`circle`), whose
 *    fire closes into a ring;
 * 2. flare: the stars a question explored flare on the whole sky (questions only, and only when it explored some);
 * 3. wind: the ring winds into a spark as he perches, his back to us, and winds up;
 * 4. burst: the spark bursts into a black hole, and the blast throws him back at us; `swallow`: the sky falls into
 *    it while he strains against the pull; `dive`: a glance back, a grin, and he dives in head first;
 * 5. jump: the horizon covers the frame and the page jumps to the destination, unseen; `travel`: down the throat
 *    after him, past pieces of the section left behind;
 * 6. arrive: a portal opens out of the light onto the destination and its white hole, the scene comes in to its
 *    hold and its words write in; he bursts out, swoops past and lands on his spot (`land`), where his landing plays
 *    out (`total`).
 * A link's warp gives the page back (`unlock`) in about 6 s, a question's in about 7.5, each from one length that
 * every beat scales with (`seconds`); `k` is that scale, for anything else timed on the journey's own pace. A click,
 * tap or Esc hurries the rest at `HURRY`×.
 */

export type WarpKind = "link" | "question";
export type Leg = readonly [number, number];
export type WarpPlan = {
  pull: Leg | null;
  lift: number;
  circle: Leg;
  flare: Leg | null;
  wind: Leg;
  burst: number;
  swallow: Leg;
  dive: number;
  jump: number;
  travel: Leg;
  arrive: Leg;
  land: number;
  unlock: number;
  total: number;
  k: number;
};

/** How long each kind of warp keeps the page, in seconds: the one setting the journey is tuned by. */
export const WARP_S = { link: 6, question: 7.5 };
export const HURRY = 4;

// each beat at the journey's own pace (the prototype's, at 7 s)
const D = { pull: 1.4, lift: 0.28, circle: 1.22, flare: 1.2, perch: 0.08, wind: 0.68, held: 0.25, swallow: 1.1, dive: 0.45, peak: 0.5, travel: 1.25, arrive: 1.3, land: 1.1, landing: 1.6 };

function layout(fromHero: boolean, flare: boolean): Omit<WarpPlan, "k"> {
  const pull: Leg | null = fromHero ? null : [0, D.pull];
  const lift = D.lift;
  const circle: Leg = [lift, lift + D.circle];
  // the flare plays on the whole sky, once the pull-back has reached it, while the ring hangs
  const whole = Math.max(pull ? pull[1] : 0, circle[1] - 0.1);
  const flareLeg: Leg | null = flare ? [whole, whole + D.flare] : null;
  const perch = flareLeg ? flareLeg[1] : circle[1];
  const wind: Leg = [perch - D.perch, perch - D.perch + D.wind];
  const burst = wind[1];
  // a held beat after the burst, then the sky falls in
  const swallow: Leg = [burst + D.held, burst + D.held + D.swallow];
  const dive = swallow[1] + D.dive;
  const jump = dive + D.peak;
  const travel: Leg = [jump + 0.02, jump + 0.02 + D.travel];
  const arrive: Leg = [travel[1] - 0.1, travel[1] - 0.1 + D.arrive];
  const land = arrive[0] + D.land;
  return { pull, lift, circle, flare: flareLeg, wind, burst, swallow, dive, jump, travel, arrive, land, unlock: arrive[1], total: land + D.landing };
}

export function planWarp({ kind, fromHero, flare, seconds = WARP_S[kind] }: { kind: WarpKind; fromHero: boolean; flare: boolean; seconds?: number }): WarpPlan {
  const raw = layout(fromHero, flare && kind === "question");
  // scaled so the kind's whole journey (from outside the hero; a question's with its flare) keeps the page for
  // `seconds`; one without a leg (a question's flare) is that much shorter
  const k = seconds / layout(false, kind === "question").unlock;
  const s = (l: Leg): Leg => [l[0] * k, l[1] * k];
  return {
    pull: raw.pull && s(raw.pull), lift: raw.lift * k, circle: s(raw.circle), flare: raw.flare && s(raw.flare), wind: s(raw.wind),
    burst: raw.burst * k, swallow: s(raw.swallow), dive: raw.dive * k, jump: raw.jump * k, travel: s(raw.travel),
    arrive: s(raw.arrive), land: raw.land * k, unlock: raw.unlock * k, total: raw.total * k, k,
  };
}

/** The trip in miniature: how far down the throat the warp is at `t`, 0 before it and 1 after it. */
export function tripProgress(p: WarpPlan, t: number) {
  const x = Math.min(1, Math.max(0, (t - p.travel[0]) / (p.travel[1] - p.travel[0])));
  return x * x * (3 - 2 * x);
}
