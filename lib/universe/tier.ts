/**
 * How much the 3D draws on this device: one quality level for the visit, read by everything that draws (the sky, the
 * bodies' shadows, Tycho's canvases, the warp). `DETAIL` says what each level means. None of it moves the camera,
 * changes what's in the frame or when: a lower level is softer and its shadows coarser, never composed differently.
 * - A visit starts from what the browser says about the device (`startQuality`): a phone (a coarse pointer, or a short
 *   side under 600 px) starts at mid, and little memory with few cores, or a GPU from a well-known weak family, each
 *   take a level off.
 * - It only ever steps down, one level at a time: the sky's governor asks once the pixel ratio is at its floor and
 *   frames are still missed (governor.ts). It never comes back up within the visit: shadows and a canvas that sharpen
 *   and soften by turns would read as a fault.
 * - `?quality=high|mid|low` forces a level and holds it, in development and in automated browsers only.
 * The sky's pixel ratio is capped at 2 and lowered further until the canvas fits MAX_PIXELS (about a 2560×1600 screen
 * at DPR 1), and never below 1, where the sky would turn soft.
 */

export type Quality = "high" | "mid" | "low";
const LEVELS: readonly Quality[] = ["high", "mid", "low"];

export type Detail = {
  /** the sky's pixel ratio at most: where its governor starts */
  dpr: number;
  /** the far galaxies, made once when the sky loads */
  galaxies: number;
  /** each shadow map's side, as a share of its full size */
  shadow: number;
  /** Tycho's own canvas: its pixel ratio at most, and multisampling (fixed when his canvas is made) */
  tycho: { dpr: number; msaa: boolean };
  /** the warp's stage Tycho's drawing buffer at most, in device px */
  flight: number;
  /** the warp lighter: a coarser, plainer hole, and fewer pieces down its throat */
  lite: boolean;
};

export const DETAIL: Record<Quality, Detail> = {
  high: { dpr: 2, galaxies: 24000, shadow: 1, tycho: { dpr: 2, msaa: true }, flight: 1280, lite: false },
  mid: { dpr: 1.5, galaxies: 8000, shadow: 0.5, tycho: { dpr: 1.5, msaa: true }, flight: 768, lite: true },
  low: { dpr: 1, galaxies: 4000, shadow: 0.25, tycho: { dpr: 1, msaa: false }, flight: 512, lite: true },
};

/** What the browser says about the device. `memory` (GB) and `cores` where it reports them; `gpu`, its renderer. */
export type Signals = { width: number; height: number; coarsePointer: boolean; memory?: number; cores?: number; gpu?: string };

// old or entry-level mobile GPUs, and Intel's integrated HD Graphics before UHD: families known to be slow
export const WEAK_GPU = /Mali-(4\d\d|T\d)|Adreno \(TM\) [345]\d\d|PowerVR|Intel\(R\) HD Graphics/;
/** little memory (GB) and few cores, both reported */
export const LEAN = { memory: 4, cores: 4 };

/** A GPU from a family known to be slow. */
export const weakGpu = (gpu?: string) => !!gpu && WEAK_GPU.test(gpu);
/** Little memory with few cores, where the browser reports both. */
export const lean = ({ memory, cores }: Pick<Signals, "memory" | "cores">) =>
  memory !== undefined && cores !== undefined && memory <= LEAN.memory && cores <= LEAN.cores;

export function startQuality({ width, height, coarsePointer, memory, cores, gpu }: Signals): Quality {
  const phone = coarsePointer || Math.min(width, height) < 600;
  return LEVELS[Math.min(2, Number(phone) + Number(lean({ memory, cores })) + Number(weakGpu(gpu)))]!;
}

export type Device = { width: number; height: number; devicePixelRatio: number };
export type Tier = { dpr: number; galaxies: number };

export const MAX_PIXELS = 4_200_000;

/** The sky's pixel ratio and far galaxies at level `q`. */
export function skyTier({ width, height, devicePixelRatio }: Device, q: Quality): Tier {
  const budget = Math.sqrt(MAX_PIXELS / Math.max(1, width * height));
  return { dpr: Math.min(devicePixelRatio, DETAIL[q].dpr, Math.max(1, budget)), galaxies: DETAIL[q].galaxies };
}

/** A shadow map's side at level `q`, from its side at full quality. */
export const shadowSize = (full: number, q: Quality) => Math.max(256, full * DETAIL[q].shadow);

/** A visit's level, from `start`; held there when `pinned`. */
export function qualityLadder(start: Quality, pinned: boolean) {
  let level = start;
  const listeners = new Set<(q: Quality) => void>();
  return {
    get level() { return level; },
    /** one level down, if there is one: whether it stepped */
    lower() {
      const i = LEVELS.indexOf(level);
      if (pinned || i === LEVELS.length - 1) return false;
      level = LEVELS[i + 1]!;
      listeners.forEach((l) => l(level));
      return true;
    },
    on(cb: (q: Quality) => void) {
      listeners.add(cb);
      return () => { listeners.delete(cb); };
    },
  };
}

let visit: ReturnType<typeof qualityLadder> | null = null;

function fromBrowser() {
  const asked = new URLSearchParams(location.search).get("quality");
  const forced = (process.env.NODE_ENV !== "production" || navigator.webdriver) && LEVELS.includes(asked as Quality) ? (asked as Quality) : null;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const start = forced ?? startQuality({
    width: innerWidth,
    height: innerHeight,
    coarsePointer: matchMedia("(pointer: coarse)").matches,
    memory: nav.deviceMemory,
    cores: nav.hardwareConcurrency || undefined,
    gpu: document.documentElement.dataset.gpu || undefined,
  });
  const v = qualityLadder(start, !!forced);
  if (process.env.NODE_ENV !== "production") Object.assign(window, { __quality: () => v.level });
  return v;
}

/** The visit's level. */
export const quality = () => (visit ??= fromBrowser()).level;
/** What the visit's level means. */
export const detail = () => DETAIL[quality()];
/** Steps the visit's level down one, if it can: whether it did. */
export const lowerQuality = () => (visit ??= fromBrowser()).lower();
/** Called with the new level each time it steps down. */
export const onQuality = (cb: (q: Quality) => void) => (visit ??= fromBrowser()).on(cb);
