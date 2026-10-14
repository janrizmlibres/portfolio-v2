/**
 * The universe's readiness. The page is complete in HTML from first paint, so nothing here gates it:
 * the universe waits until the page has painted and gone idle, checks for WebGL, and only then imports
 * three.js and builds the sky. Without WebGL, or if loading fails, the page simply stays as it is.
 *
 *   waiting → loading → ready
 *                     ↘ failed
 *           ↘ unsupported
 */

export type UniverseStatus = "waiting" | "loading" | "ready" | "failed" | "unsupported";

type Deps<T> = {
  supportsWebGL: () => boolean;
  afterFirstPaint: () => Promise<void>;
  load: () => Promise<T>;
  /** Tears down a universe nobody will show: one that arrived after cancel(), or was ready when cancelled. */
  discard: (universe: T) => void;
};

export function createUniverseLoader<T>({ supportsWebGL, afterFirstPaint, load, discard }: Deps<T>) {
  let status: UniverseStatus = "waiting";
  let result: T | null = null;
  let started: Promise<void> | null = null;
  let cancelled = false;
  const listeners = new Set<(s: UniverseStatus) => void>();

  const set = (s: UniverseStatus) => {
    if (cancelled) return;
    status = s;
    listeners.forEach((fn) => fn(s));
  };

  async function run() {
    await afterFirstPaint();
    if (cancelled) return;
    if (!supportsWebGL()) return set("unsupported");
    set("loading");
    let universe: T;
    try {
      universe = await load();
    } catch {
      return set("failed");
    }
    if (cancelled) return discard(universe);
    result = universe;
    set("ready");
  }

  return {
    get status() { return status; },
    get result() { return result; },
    start() { return (started ??= run()); },
    subscribe(fn: (s: UniverseStatus) => void) {
      listeners.add(fn);
      return () => { listeners.delete(fn); };
    },
    cancel() {
      cancelled = true;
      listeners.clear();
      if (result !== null) discard(result);
      result = null;
    },
  };
}

type IdleWindow = Pick<Window, "addEventListener"> & {
  document: Pick<Document, "readyState">;
  requestIdleCallback?: (fn: () => void, opts?: { timeout: number }) => number;
  setTimeout?: (fn: () => void, ms: number) => unknown;
};

/** Resolves once the page has fired `load` and the main thread has an idle moment (at most 2 s later). */
export function whenIdleAfterLoad(win: IdleWindow = window): Promise<void> {
  const idle = () =>
    new Promise<void>((resolve) => {
      if (win.requestIdleCallback) win.requestIdleCallback(() => resolve(), { timeout: 2000 });
      else (win.setTimeout ?? setTimeout)(() => resolve(), 200);
    });
  if (win.document.readyState === "complete") return idle();
  return new Promise<void>((resolve) => win.addEventListener("load", () => resolve(), { once: true })).then(idle);
}

/**
 * Whether this browser can draw WebGL2 on a GPU, checked on a throwaway canvas. A browser without a usable GPU
 * falls back to software rendering, which draws the sky on the CPU and starves the page's main thread; that
 * counts as unsupported, and the page stays plain.
 */
export function supportsWebGL2(): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl2", { failIfMajorPerformanceCaveat: true });
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}
