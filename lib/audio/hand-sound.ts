/**
 * The hand's sounds (the pointer layer's hooks): at Contact it's the instrument, each star a celesta note of D minor
 * pentatonic, softer for a slow pointer; in the hero a hovered star makes no sound, though one tapped where the sky is
 * seen whole (its first frame) still plays its note; anywhere else a hovered star rings the same note on a bell,
 * quieter. Dragging and turning the sky make no sound.
 */
import type { HandSound } from "@/lib/voyage/hand";
import { noteBankVoice, type OneShot } from "./standin";

export const SCALE = [74, 77, 79, 81, 84, 86, 89, 91, 93, 96, 98];
/** A star's note: the same one every time. */
export const noteFor = (star: number) => SCALE[((star % SCALE.length) + SCALE.length) % SCALE.length]!;

/** the pointer's speed (CSS px/s) that counts as full */
const FAST_POINTER = 1500;
/** a hovered star's bell, against the instrument */
const BELL = 0.5;

type HandEngine = {
  play: (name: string, at?: number, level?: number) => unknown;
  prepare: (names: string[]) => Promise<void>;
  instrument: { play: (note: number, intensity: number, strong?: boolean) => unknown; use: (maker: ReturnType<typeof noteBankVoice>) => void };
  voice: { grain: (name: string) => AudioBuffer | undefined };
};

/**
 * `skyWhole` says the sky is seen whole and can be dragged (the hero's first frame): there, as at Contact, a tapped
 * star plays its note. `quiet` says a hovered star makes no sound here (the hero).
 */
export function createHandSound(
  sound: () => HandEngine | null,
  voice: string,
  { skyWhole = () => false, quiet = () => false }: { skyWhole?: () => boolean; quiet?: () => boolean } = {},
): HandSound {
  let ready: Promise<void> | null = null, loaded = false, bells = false;
  const share = (v: number, full: number) => Math.max(0, Math.min(1, v / full));

  /** the instrument's voice loads at the first hover, well before Contact */
  function prepare(s: HandEngine) {
    ready ??= s.prepare([...SCALE.map((n) => `inst-${voice}-${n}`), ...SCALE.map((n) => `inst-bell-${n}`)]).then(() => {
      bells = SCALE.every((n) => s.voice.grain(`inst-bell-${n}`));
      const bank = new Map<number, AudioBuffer>();
      for (const n of SCALE) {
        const b = s.voice.grain(`inst-${voice}-${n}`);
        if (b) bank.set(n, b);
      }
      if (bank.size) s.instrument.use(noteBankVoice(bank));
      loaded = bank.size > 0;
    });
  }

  return {
    star(star, atContact, pointerSpeed) {
      const s = sound();
      if (!s || star === null) return;
      prepare(s);
      const v = share(pointerSpeed, FAST_POINTER);
      if (atContact) {
        if (loaded) s.instrument.play(noteFor(star), 0.35 + 0.65 * v);
      } else if (bells && !quiet()) s.play(`inst-bell-${noteFor(star)}`, undefined, BELL * (0.35 + 0.65 * v));
    },
    tap(star, atContact) {
      const s = sound();
      if (s && (atContact || skyWhole()) && loaded) s.instrument.play(noteFor(star), 1, true);
    },
  };
}

/** The high bell notes a lit star steps through (D6 to D7), so a run of six never repeats. */
const LIT = [86, 93, 89, 96, 91, 98];
/** how soft a lit star is, against a hovered one */
const LIT_LEVEL = 0.35;

/**
 * A star lit as Tycho reads (`play("star-lit", undefined, brightness)`): a soft high bell, the voice a hovered star
 * has outside the instrument, each one the next of a few notes. Defined once the notes have loaded; silent until.
 */
export async function defineStarLit(
  sound: { prepare: (names: string[]) => Promise<void>; voice: { grain: (name: string) => AudioBuffer | undefined }; define: (name: string, shot: OneShot) => void },
  shotOf: (buffer: AudioBuffer) => OneShot,
) {
  await sound.prepare(LIT.map((n) => `inst-bell-${n}`));
  const shots = LIT.map((n) => sound.voice.grain(`inst-bell-${n}`)).filter((b): b is AudioBuffer => !!b).map(shotOf);
  if (!shots.length) return;
  let i = 0;
  sound.define("star-lit", (ctx, dest, at, level = 1) => shots[i++ % shots.length]!(ctx, dest, at, level * LIT_LEVEL));
}
