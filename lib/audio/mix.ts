/**
 * The score's mix: each layer's level from where the film is, how fast it's moving and what the chat is doing. The
 * page decides these targets; the audio thread smooths towards them, and only changes are sent.
 *
 * The parts are the agreed arc: the bed alone in the hero, the keys at home, the pulse on the road with the drone
 * rising with speed, the lead over a lower pulse at Athena, everything at the crawler, thinning after, a thin bed at
 * Contact. The levels are set by ear on the real site.
 */
export type ChatStatus = "ready" | "submitted" | "streaming";
/** A level per layer, plus `rate` (the free layer's playback rate), `bright` (0 closed, 1 open) and `duck` (the chat's dip). */
export type Targets = Record<string, number>;
type Part = {
  mix: Record<string, number>;
  bright: number;
  /** what scroll speed (0–1) adds */
  speed?: Record<string, number>;
};

/** The one layer whose pitch follows scroll speed. It runs free of the others, since a rate moves pitch and tempo together. */
export const FREE_LAYER = "drone";
/** The unpulsed layers, which loop at lengths of their own so they never line up with the pulse the same way twice. */
export const OWN_LENGTH = ["bed", "drone", "thinking"] as const;
/** The layer Tycho thinks over: loaded once he first thinks. */
export const THINKING = "thinking";

const PARTS: Record<string, Part> = {
  // the bed alone: the hero needs ambience, nothing more
  hero: { mix: { bed: 0.9 }, bright: 0.5 },
  home: { mix: { bed: 0.9, keys: 0.8 }, bright: 0.6 },
  // the pulse comes in, and the drone rises with speed
  road: {
    mix: { bed: 0.7, keys: 0.5, pulse: 0.8, drone: 0.15 },
    bright: 0.6,
    speed: { drone: 0.85, pulse: 0.3, bright: 0.4, rate: 0.5 },
  },
  athena: { mix: { bed: 0.8, keys: 0.8, lead: 0.9, pulse: 0.35 }, bright: 0.7 },
  // everything, building into the climax
  crawler: { mix: { bed: 1, keys: 0.8, pulse: 1, lead: 1, drone: 0.5 }, bright: 1, speed: { drone: 0.5, rate: 0.5 } },
  own: { mix: { bed: 0.85, keys: 0.5, lead: 0.4 }, bright: 0.6 },
  // a thin bed under the instrument
  contact: { mix: { bed: 0.55 }, bright: 0.45 },
};

/** Scenes that play another scene's part; any other scene plays its own, or its section's. */
const SCENE_PART: Record<string, string> = { around: "home", ride: "road", recap: "road" };
const SECTION_PART: Record<string, string> = {
  "sec-hero": "hero",
  "sec-about": "home",
  "sec-work": "road",
  "sec-projects": "athena",
  "sec-contact": "contact",
};

export function partOf(scene: { id: string; sec: string }) {
  return SCENE_PART[scene.id] ?? (PARTS[scene.id] ? scene.id : (SECTION_PART[scene.sec] ?? "hero"));
}

/** The layers that sound from the first frame: the ones that load under the wake-up's charge. */
export const HERO_LAYERS = Object.keys(PARTS.hero!.mix).filter((n) => PARTS.hero!.mix[n]! > 0);

/** How far the score ducks while Tycho thinks and answers: the engine's defaults, before the mixer's trims. */
export const DUCK: Record<ChatStatus, number> = { ready: 1, submitted: 0.72, streaming: 0.88 };

export function mixTargets(layers: string[], scene: { id: string; sec: string }, speed: number, chat: ChatStatus): Targets {
  const part = PARTS[partOf(scene)]!;
  const sp = part.speed ?? {};
  const v = Math.max(0, Math.min(1, speed));
  const t: Targets = {};
  for (const n of layers) t[n] = Math.min(1.2, (part.mix[n] ?? 0) + v * (sp[n] ?? 0));
  if (layers.includes(THINKING)) t[THINKING] = chat === "submitted" ? 1 : 0;
  t.rate = 1 + v * (sp.rate ?? 0);
  t.bright = Math.min(1, part.bright + v * (sp.bright ?? 0));
  t.duck = DUCK[chat];
  return t;
}

/** How far a target must move before it's worth sending. */
const STEP: Record<string, number> = { rate: 0.002 };

/** The targets that differ from what was last sent. */
export function diffTargets(sent: Targets, t: Targets): Targets {
  const out: Targets = {};
  for (const [k, v] of Object.entries(t)) {
    const was = sent[k];
    if (was === undefined || Math.abs(was - v) >= (STEP[k] ?? 0.005)) out[k] = v;
  }
  return out;
}
