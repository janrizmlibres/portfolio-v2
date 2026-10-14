/**
 * The frame meter behind `?perf` (perf-hud.ts): each frame's interval against the display's own, and for a frame that
 * came late (1.5 display intervals or more), what changed in it: a shader compiled, a texture or geometry sent up to
 * the GPU, the sky's pixel ratio or the visit's quality level stepped, an idle job run, a file arriving or audio
 * decoding, and the long animation frame's scripts where the browser reports them. Plain numbers in, so it's the same
 * on a phone and in the motion probe.
 */

/** one frame, read at its start: the counters as they stand, and what the frame before it ran */
export type Sample = {
  /** the frame's timestamp (ms) */
  at: number;
  /** the film's time */
  t: number;
  /** the wake-up's phase (loading, charging, dozing) or the film */
  phase: string;
  /** the sky's draw calls and triangles over the frame before, shadow passes included */
  calls: number;
  tris: number;
  /** the sky renderer's compiled programs, and textures and geometries on the GPU */
  programs: number;
  textures: number;
  geometries: number;
  dpr: number;
  quality: string;
  /** ms of idle callbacks run since the last frame */
  idle: number;
  /** what loaded since the last frame: files arrived (`fetch glb`), audio decoding (`decode audio`) */
  io?: string[];
};

export type Hitch = { at: number; t: number; dt: number; missed: number; phase: string; flags: string[] };

/** a long animation frame (ms), with its scripts already put in words */
export type Long = { start: number; duration: number; scripts: string[] };

/** frames per judgement of the display's interval */
const WINDOW = 30;
/** a frame this long is a stall (a hidden tab), not a hitch */
const STALL_MS = 1000;
/** an idle job this long is named */
const IDLE_MS = 4;

export function createPerfMeter({ keep = 200 }: { keep?: number } = {}) {
  let last: Sample | null = null, cadence = Infinity, frames = 0, missed = 0;
  const win: number[] = [], kept: Hitch[] = [];
  const interval = () => (cadence === Infinity ? 1000 / 60 : cadence);
  const r2 = (x: number) => Math.round(x * 100) / 100;

  return {
    /** one frame: the hitch it was, if it came late */
    feed(s: Sample): Hitch | null {
      const prev = last;
      last = s;
      if (!prev) return null;
      const dt = s.at - prev.at;
      if (dt > STALL_MS || dt <= 0) return null;
      frames++;
      win.push(dt);
      if (win.length === WINDOW) {
        const sorted = [...win].sort((a, b) => a - b);
        cadence = Math.min(cadence, sorted[WINDOW >> 1]!);
        win.length = 0;
      }
      const every = interval();
      if (dt < every * 1.5) return null;
      const n = Math.max(1, Math.round(dt / every) - 1);
      missed += n;
      const flags: string[] = [];
      if (s.programs > prev.programs) flags.push(`shader+${s.programs - prev.programs}`);
      if (s.textures > prev.textures) flags.push(`texture+${s.textures - prev.textures}`);
      if (s.geometries > prev.geometries) flags.push(`geometry+${s.geometries - prev.geometries}`);
      if (s.dpr !== prev.dpr) flags.push(`dpr ${r2(prev.dpr)}→${r2(s.dpr)}`);
      if (s.quality !== prev.quality) flags.push(`quality ${prev.quality}→${s.quality}`);
      if (s.idle >= IDLE_MS) flags.push(`idle ${Math.round(s.idle)}ms`);
      flags.push(...new Set(s.io ?? []));
      const h = { at: s.at, t: s.t, dt: r2(dt), missed: n, phase: s.phase, flags };
      kept.push(h);
      if (kept.length > keep) kept.shift();
      return h;
    },
    /** a long animation frame, reported after it ended: named on the hitch it overlaps */
    long(l: Long) {
      const h = kept.findLast((x) => x.at - x.dt < l.start + l.duration && l.start < x.at);
      h?.flags.push(`long ${Math.round(l.duration)}ms${l.scripts.length ? `: ${l.scripts.join(", ")}` : ""}`);
    },
    hitches: () => kept,
    totals: () => ({ frames, missed, cadence: r2(interval()) }),
  };
}
