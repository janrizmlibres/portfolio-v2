import { afterEach, describe, expect, it, vi } from "vitest";
import { createUniverseLoader, supportsWebGL2, whenIdleAfterLoad, type UniverseStatus } from "./loader";

function deferred<T = void>() {
  let resolve!: (v: T) => void, reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
const flush = () => new Promise((r) => setTimeout(r, 0));

function setup(over: Partial<Parameters<typeof createUniverseLoader<string>>[0]> = {}) {
  const painted = deferred();
  const loaded = deferred<string>();
  const deps = {
    supportsWebGL: vi.fn(() => true),
    afterFirstPaint: vi.fn(() => painted.promise),
    load: vi.fn(() => loaded.promise),
    discard: vi.fn(),
    ...over,
  };
  const loader = createUniverseLoader<string>(deps);
  const seen: UniverseStatus[] = [];
  loader.subscribe((s) => seen.push(s));
  return { loader, deps, painted, loaded, seen };
}

describe("createUniverseLoader", () => {
  it("waits for first paint before loading anything", async () => {
    const { loader, deps, painted } = setup();
    loader.start();
    await flush();
    expect(loader.status).toBe("waiting");
    expect(deps.load).not.toHaveBeenCalled();
    painted.resolve();
    await flush();
    expect(deps.load).toHaveBeenCalledOnce();
    expect(loader.status).toBe("loading");
  });

  it("is ready with the loaded universe once it arrives", async () => {
    const { loader, painted, loaded, seen } = setup();
    loader.start();
    painted.resolve();
    loaded.resolve("universe");
    await flush();
    expect(loader.status).toBe("ready");
    expect(loader.result).toBe("universe");
    expect(seen).toEqual(["loading", "ready"]);
  });

  it("never loads without WebGL, and says so", async () => {
    const { loader, deps, painted, seen } = setup({ supportsWebGL: vi.fn(() => false) });
    loader.start();
    painted.resolve();
    await flush();
    expect(deps.load).not.toHaveBeenCalled();
    expect(loader.status).toBe("unsupported");
    expect(seen).toEqual(["unsupported"]);
  });

  it("fails quietly when loading throws, leaving the page as it is", async () => {
    const { loader, painted, loaded } = setup();
    const done = loader.start();
    painted.resolve();
    loaded.reject(new Error("chunk failed"));
    await expect(done).resolves.toBeUndefined();
    expect(loader.status).toBe("failed");
  });

  it("loads once, however often it's started", async () => {
    const { loader, deps, painted } = setup();
    loader.start();
    loader.start();
    painted.resolve();
    await flush();
    expect(deps.load).toHaveBeenCalledOnce();
  });

  it("discards a universe that arrives after it was cancelled, and tells no one", async () => {
    const { loader, deps, painted, loaded, seen } = setup();
    loader.start();
    painted.resolve();
    await flush();
    loader.cancel();
    loaded.resolve("late");
    await flush();
    expect(deps.discard).toHaveBeenCalledWith("late");
    expect(loader.result).toBeNull();
    expect(seen).toEqual(["loading"]);
  });

  it("discards a ready universe when cancelled", async () => {
    const { loader, deps, painted, loaded } = setup();
    loader.start();
    painted.resolve();
    loaded.resolve("universe");
    await flush();
    loader.cancel();
    expect(deps.discard).toHaveBeenCalledWith("universe");
  });
});

describe("whenIdleAfterLoad", () => {
  function fakeWindow(readyState: DocumentReadyState) {
    const listeners: Record<string, () => void> = {};
    const idle: Array<() => void> = [];
    return {
      win: {
        document: { readyState },
        addEventListener: (type: string, fn: () => void) => { listeners[type] = fn; },
        requestIdleCallback: (fn: () => void) => { idle.push(fn); return 1; },
      },
      fireLoad: () => listeners.load?.(),
      runIdle: () => idle.splice(0).forEach((f) => f()),
    };
  }

  it("waits for the load event, then for an idle moment", async () => {
    const f = fakeWindow("interactive");
    let done = false;
    whenIdleAfterLoad(f.win as never).then(() => { done = true; });
    f.runIdle();
    await flush();
    expect(done).toBe(false);
    f.fireLoad();
    await flush();
    f.runIdle();
    await flush();
    expect(done).toBe(true);
  });

  it("only waits for idle when the page has already loaded", async () => {
    const f = fakeWindow("complete");
    let done = false;
    whenIdleAfterLoad(f.win as never).then(() => { done = true; });
    await flush();
    expect(done).toBe(false);
    f.runIdle();
    await flush();
    expect(done).toBe(true);
  });
});

describe("supportsWebGL2", () => {
  afterEach(() => vi.restoreAllMocks());

  it("refuses software rendering, which would starve the page's main thread", () => {
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(supportsWebGL2()).toBe(false);
    expect(getContext).toHaveBeenCalledWith("webgl2", expect.objectContaining({ failIfMajorPerformanceCaveat: true }));
  });

  it("accepts a hardware context", () => {
    const fake = { getExtension: () => ({ loseContext: () => {} }) };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(fake as never);
    expect(supportsWebGL2()).toBe(true);
  });
});
