/**
 * Tycho's voice while a reply is revealed in his bubble: wordless robot chirps, through his suit radio, on the
 * opening of each sentence (Voice verdict).
 * - One or two chirps a word, each bending, sweeping, dipping or trilling: designed FM grains (made in Surge XT)
 *   played along the shape, or live FM until they've loaded, whose modulator holds a fixed frequency while the
 *   pitch moves, so a sweep turns slightly metallic. Sines and FM only, never square or saw.
 * - Performed, not random: pitch falls across a sentence, a phrase's last chirp sweeps up for a question and down
 *   otherwise, and the same word always makes the same chirp.
 * - Only the first three words of each sentence, as a phrase; he's quiet while the rest appears.
 * - The suit radio: a comm band with a little drive, and Apollo's Quindar tones opening and closing each reply.
 * Every sound is scheduled from the reveal itself, a word at a time, so it keeps exact time with the text.
 * He plays on the sound engine's one context, after the score's chat duck, and follows the sound toggle and the
 * remembered mute through it. The final timbre belongs to the score.
 */
import type { Block } from "@/lib/chat/reply";
import { PACE } from "@/lib/chat/reveal";
import { spansOf } from "@/lib/chat/sentences";
import { currentSound } from "@/lib/audio/current";

// his phrases break at a colon or a semicolon too
const PHRASE_END = /[.!?:;]["')\]]*$/;

const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);
const rand = (seed: number) => () => ((seed = (Math.imul(seed, 1103515245) + 12345) | 0) >>> 0) / 2 ** 32;

/** The words of each sentence that are voiced: its opening phrase. */
const PHRASE = 3;
/** The reveal's slot per word, in seconds. */
const SLOT = 1 / PACE;
/** His middle pitch, in Hz. */
const PITCH = 860;

/** Where he's heard: the engine's one context, his suit radio on it, the master for the Quindar tones, and the
 * designed chirp grains (loaded with the one-shots). */
type Audio = { ctx: BaseAudioContext; radio: AudioNode; master: AudioNode; grain?: (name: string) => AudioBuffer | undefined };

/** The grains' pitch: each was rendered at A5. */
const GRAIN_HZ = 880;
const GRAINS = ["chirp1", "chirp2", "chirp3", "chirp4"];

/** Apollo's Quindar tones: 2525 Hz opens a transmission, 2475 Hz closes it, a quarter second each. */
function quindar(a: Audio, at: number, open: boolean) {
  const o = a.ctx.createOscillator(), g = a.ctx.createGain();
  o.frequency.value = open ? 2525 : 2475;
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(0.06, at + 0.01);
  g.gain.setValueAtTime(0.06, at + 0.24);
  g.gain.linearRampToValueAtTime(0, at + 0.25);
  o.connect(g).connect(a.master);
  o.start(at);
  o.stop(at + 0.26);
  o.onended = () => g.disconnect();
  return at + 0.25;
}

type Shape = "up" | "down" | "bend" | "dip" | "trill" | "flat";
const SHAPES: Shape[] = ["up", "down", "bend", "dip", "flat", "trill", "bend", "down"];
// where each shape ends, as a multiple of where it starts
const LANDS: Record<Shape, number> = { up: 1.5, down: 0.7, bend: 0.95, dip: 1.1, flat: 1.12, trill: 1.05 };

/** Follows a chirp's pitch shape on `p` from `f0` to `f1` (in whatever unit `p` takes). */
function contour(p: AudioParam, t: number, dur: number, f0: number, f1: number, shape: Shape) {
  p.setValueAtTime(f0, t);
  if (shape === "up" || shape === "down" || shape === "trill") p.exponentialRampToValueAtTime(f1, t + dur);
  else if (shape === "bend") {
    p.exponentialRampToValueAtTime(f0 * 1.4, t + dur * 0.45);
    p.exponentialRampToValueAtTime(f1, t + dur);
  } else if (shape === "dip") {
    p.exponentialRampToValueAtTime(f0 * 0.72, t + dur * 0.4);
    p.exponentialRampToValueAtTime(f1, t + dur);
  } else if (shape === "flat") p.setValueAtTime(f1, t + dur * 0.55);
}

/** One designed chirp: a grain played at the chirp's pitch, along the same shape, under the same envelope. */
function grainChirp(a: Audio, buf: AudioBuffer, t: number, dur: number, f0: number, f1: number, shape: Shape) {
  const { ctx } = a;
  const level = 0.3, src = ctx.createBufferSource(), env = ctx.createGain();
  src.buffer = buf;
  contour(src.playbackRate, t, dur, f0 / GRAIN_HZ, f1 / GRAIN_HZ, shape);
  let lfo: OscillatorNode | null = null;
  if (shape === "trill") {
    lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    lfo.frequency.value = 21;
    lg.gain.value = (f0 / GRAIN_HZ) * 0.09;
    lfo.connect(lg).connect(src.playbackRate);
    lfo.start(t);
    lfo.stop(t + dur + 0.1);
  }
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(level, t + 0.006);
  env.gain.setTargetAtTime(level * 0.7, t + 0.02, dur * 0.5);
  env.gain.setTargetAtTime(0, t + dur * 0.85, 0.02);
  src.connect(env).connect(a.radio);
  src.start(t);
  src.stop(t + dur + 0.1);
  src.onended = () => env.disconnect();
}

/**
 * One chirp: a designed grain, or, until the grains have loaded, an FM chirp: a sine carrier whose
 * pitch follows `shape` from `f0` to `f1`, brightened by a fixed modulator.
 */
function chirp(a: Audio, t: number, dur: number, f0: number, f1: number, shape: Shape, grain = 0) {
  const { ctx } = a;
  const buf = a.grain?.(GRAINS[grain % GRAINS.length]!);
  if (buf) return grainChirp(a, buf, t, dur, f0, f1, shape);
  const level = 0.24, car = ctx.createOscillator(), mod = ctx.createOscillator(), depth = ctx.createGain(), env = ctx.createGain();
  mod.frequency.value = f0 * 1.5;
  depth.gain.setValueAtTime(f0 * 0.9, t);
  depth.gain.exponentialRampToValueAtTime(f0 * 0.9 * 0.15, t + dur);
  mod.connect(depth).connect(car.frequency);
  const p = car.frequency;
  contour(p, t, dur, f0, f1, shape);
  let lfo: OscillatorNode | null = null;
  if (shape === "trill") {
    lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    lfo.frequency.value = 21;
    lg.gain.value = f0 * 0.09;
    lfo.connect(lg).connect(p);
  }
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(level, t + 0.008);
  env.gain.setTargetAtTime(level * 0.6, t + 0.02, dur * 0.4);
  env.gain.setTargetAtTime(0, t + dur * 0.82, 0.018);
  car.connect(env).connect(a.radio);
  const end = t + dur + 0.1;
  for (const n of [car, mod, lfo]) {
    n?.start(t);
    n?.stop(end);
  }
  // finished nodes are let go, so a long conversation doesn't pile them up
  car.onended = () => env.disconnect();
}

export function createVoice() {
  let a: Audio | null = null;
  let heard = 0; // units already voiced
  let nextFree = 0;
  let opened = false, closed = false, ending = false, stopped = false;

  /** The opening tone, once per reply; returns when the chirps may start. */
  function open() {
    if (!a || opened) return 0;
    opened = true;
    return quindar(a, a.ctx.currentTime + 0.02, true) + 0.05;
  }
  function close() {
    if (!a || !opened || closed || !currentSound()?.state.on) return;
    closed = true;
    quindar(a, Math.max(nextFree, a.ctx.currentTime) + 0.12, false);
  }

  /** One word's chirps across a slot, no earlier than `after`. */
  function say(word: string, f: { inSentence: number; last: boolean; question: boolean }, after: number) {
    const ctx = a!.ctx, r = rand(hash(word.toLowerCase()));
    const t = Math.max(ctx.currentTime + 0.03, nextFree, after);
    const decl = Math.max(0.8, 1.06 - 0.03 * f.inSentence);
    const k = word.replace(/[^a-z0-9]/gi, "").length > 6 ? 2 : 1, d = (SLOT * 0.82) / k;
    for (let j = 0; j < k; j++) {
      const last = f.last && j === k - 1, base = PITCH * decl * (0.88 + r() * 0.3);
      const shape = last ? (f.question ? "up" : "down") : SHAPES[Math.floor(r() * SHAPES.length)]!;
      const f1 = last ? base * (f.question ? 1.9 : 0.55) : base * LANDS[shape];
      // the same word always takes the same grain
      chirp(a!, t + j * d, d * (last ? 1.25 : 0.92), base, f1, shape, (hash(word.toLowerCase()) >>> 0) + j);
    }
    nextFree = t + SLOT * 0.86;
  }

  return {
    /** In a click, tap or key: find the engine (the wake-up's click or the sound toggle turns the sound on). */
    unlock() {
      a ??= currentSound()?.voice ?? null;
    },
    /** A new question: whatever he was saying for the last one stops. */
    reset() {
      heard = nextFree = 0;
      opened = closed = ending = stopped = false;
    },
    /** Every frame of the reveal: what has arrived and how many units show. */
    update(blocks: Block[], visible: number) {
      // with the sound off he's silent (and starting a source could wake the context)
      if (!a || stopped || !currentSound()?.state.on) return;
      // a jump (a tap that shows the rest) isn't voiced
      if (visible - heard > 3) heard = visible;
      const after = heard === 0 && visible > 0 ? open() : 0;
      const sentences = spansOf(blocks, PHRASE_END);
      for (let i = heard; i < visible; i++) {
        const s = sentences.find((x) => i >= x.from && i < x.to);
        if (!s) continue;
        const k = i - s.from;
        if (k >= PHRASE) continue;
        const word = s.text.slice(s.words[k], s.words[k + 1] ?? s.text.length).trim();
        // the phrase ends as its sentence does: rising for a question, falling otherwise
        say(word, { inSentence: k, last: k === PHRASE - 1 || i === s.to - 1, question: s.question }, after);
      }
      heard = Math.max(heard, visible);
      if (ending) close();
    },
    /** The reply has been shown in full: the radio closes once he's finished. */
    end() {
      ending = true;
      close();
    },
    /** A tap shows the rest at once, or the bubble closed: he stops. */
    stop() {
      stopped = true;
      nextFree = 0;
    },
    destroy() {
      a = null;
    },
  };
}
export type Voice = ReturnType<typeof createVoice>;
