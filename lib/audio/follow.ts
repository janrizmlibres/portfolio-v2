/**
 * The score follows the film: which scene it's in, and how fast it's moving. Both are read from the film's own
 * time (in screens), once a frame on GSAP's ticker, and sent to the sound engine only when they change.
 */
import gsap from "gsap";
import type { Place } from "./engine";
import { heldScenes } from "./memory";

/** The scene the film is in: the last one to have started (the first, before the film starts). */
export function sceneAt<S extends { t0: number }>(scenes: S[], t: number): S | undefined {
  return scenes.findLast((s) => s.t0 <= t) ?? scenes[0];
}

/** Screens a second that count as full speed. */
const FULL = 2.5;
/** The window the speed is measured over, in ms. */
const WINDOW = 120;
/** How far the speed must move before it's sent again. */
const STEP = 0.04;

/** The film's speed, 0–1, from its time each frame. `step` returns a speed to send, or null. */
export function createSpeedGauge() {
  const hist: Array<[number, number]> = [];
  let sent = 0;
  return {
    step(t: number, ms: number): number | null {
      hist.push([ms, t]);
      while (hist.length > 2 && ms - hist[0]![0] > WINDOW) hist.shift();
      const [m0, t0] = hist[0]!;
      const v = ms > m0 ? Math.min(1, Math.abs(t - t0) / ((ms - m0) / 1000) / FULL) : 0;
      if (Math.abs(v - sent) <= STEP && !(v === 0 && sent > 0)) return null;
      sent = v;
      return v;
    },
  };
}

/** A scene change's moment in film time, the stretch after it (in screens) its sound belongs to, and the one-shot. */
export type Cue = { at: number; span: number; shot: string };
/** A move further than this in one frame is a jump (a deep link, a replay), not a scroll. */
const JUMP = 3;

/**
 * The cues the film crosses between two frames, in order: only going forward, since an arrival sounds when it's
 * arrived at, and never across a jump, which passes moments it never shows.
 */
export function cuesCrossed<C extends { at: number }>(cues: C[], from: number, to: number): C[] {
  if (to <= from || to - from > JUMP) return [];
  return cues.filter((c) => c.at > from && c.at <= to);
}

type Playing = { stop: () => void } | undefined;

/**
 * Plays each scene change's sound as its moment is reached, and stops it once the film leaves the stretch it belongs
 * to, either way: a fast scroll cuts it short rather than letting it ring over what comes next. A jump stops them all.
 */
export function createCuePlayer(cues: Cue[], play: (shot: string) => Playing) {
  let active: Array<{ cue: Cue; playing: Playing }> = [];
  return {
    step(from: number, to: number) {
      const jump = Math.abs(to - from) > JUMP;
      active = active.filter(({ cue, playing }) => {
        const inside = !jump && to >= cue.at - 0.02 && to <= cue.at + cue.span;
        if (!inside) playing?.stop();
        return inside;
      });
      for (const cue of cuesCrossed(cues, from, to)) active.push({ cue, playing: play(cue.shot) });
    },
  };
}

/**
 * Which scene changes' sounds the engine should hold with the film at `t` (memory.ts), sent only when the set
 * changes; `reset` for an engine that has just arrived.
 */
export function createSceneHolder(cues: Cue[]) {
  let sent: string | null = null;
  return {
    step(t: number): string[] | null {
      const held = heldScenes(cues, t);
      const key = held.join(" ");
      if (key === sent) return null;
      sent = key;
      return held;
    },
    reset() {
      sent = null;
    },
  };
}

type Follower = { setPlace: (p: Place) => void; setSpeed: (v: number) => void; play: (shot: string) => Playing; keep: (names: string[]) => void };

/**
 * Plays the score to the film: its scene and speed, each frame, once the engine is there, and each scene change's
 * one-shot as its moment is crossed, holding only the ones near. Returns the teardown.
 */
export function followFilm(sound: () => Follower | null, film: { t: number }, scenes: Array<Place & { t0: number }>, cues: Cue[] = []) {
  const gauge = createSpeedGauge();
  let part: string | null = null;
  let heard: Follower | null = null;
  let last: number | null = null;
  const player = createCuePlayer(cues, (shot) => heard?.play(shot));
  const holder = createSceneHolder(cues);
  const tick = () => {
    const s = sound();
    if (!s) return;
    // an engine that has just arrived hears where the film is
    if (s !== heard) {
      heard = s;
      part = null;
      holder.reset();
    }
    const t = film.t;
    const held = holder.step(t);
    if (held) s.keep(held);
    if (last !== null) player.step(last, t);
    last = t;
    const scene = sceneAt(scenes, t);
    if (scene && scene.id !== part) {
      part = scene.id;
      s.setPlace({ id: scene.id, sec: scene.sec });
    }
    const v = gauge.step(t, performance.now());
    if (v !== null) s.setSpeed(v);
  };
  gsap.ticker.add(tick);
  return () => gsap.ticker.remove(tick);
}
