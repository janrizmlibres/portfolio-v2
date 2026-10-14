import { describe, expect, it } from "vitest";
import { lean, weakGpu } from "@/lib/universe/tier";
import { KEY, readKept, startVersion } from "./lite";
import { reframes, TIER_SCRIPT } from "./tier";

describe("a resize composes the film again only when the frame it's composed for changes", () => {
  const phone = { w: 390, h: 664, screen: 844 };

  it("a phone's toolbar showing or hiding changes nothing", () => {
    expect(reframes(phone, { ...phone, h: 750 })).toBe(false);
  });

  it("a new width, a new screen height or a turn to landscape does", () => {
    expect(reframes(phone, { ...phone, w: 430 })).toBe(true);
    expect(reframes({ w: 1280, h: 800, screen: 800 }, { w: 1280, h: 700, screen: 700 })).toBe(true);
    expect(reframes(phone, { w: 844, h: 340, screen: 390 })).toBe(true);
  });

  it("a landscape window that drops under a phone held sideways's height does, though its screen is the same", () => {
    expect(reframes({ w: 900, h: 520, screen: 520 }, { w: 900, h: 480, screen: 520 })).toBe(true);
  });
});

describe("the head script starts each visit as the start rule says (lite.ts)", () => {
  type Device = { gpu: string; memory?: number; cores?: number };
  const POCO: Device = { gpu: "Mali-G720 MC7", memory: 8, cores: 8 };
  const devices: Device[] = [
    POCO,
    { gpu: "Mali-T880", memory: 8, cores: 8 },
    { gpu: "Adreno (TM) 618", memory: 4, cores: 4 },
    { gpu: "ANGLE (Apple, ANGLE Metal Renderer: Apple M5, Unspecified Version)" },
  ];
  const stored = [null, '{"choice":"lite"}', '{"choice":"full"}', '{"verdict":"slow"}', '{"choice":"full","verdict":"slow"}', "lite"];

  // the page as the head script sees it, then the script run on it: what it leaves on <html>
  function run({ webgl, reduced, asked, kept, device }: { webgl: boolean; reduced: boolean; asked: string | null; kept: string | null; device: Device }) {
    const d = document.documentElement;
    for (const k of ["film", "lite", "gpu"]) delete d.dataset[k];
    history.replaceState(null, "", asked ? `/?film=${asked}` : "/");
    if (kept === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, kept);
    Object.defineProperty(navigator, "deviceMemory", { value: device.memory, configurable: true });
    Object.defineProperty(navigator, "hardwareConcurrency", { value: device.cores ?? 0, configurable: true });
    Object.assign(window, { matchMedia: (q: string) => ({ matches: reduced && q.includes("reduce") }) });
    Object.assign(globalThis, { WebGL2RenderingContext: webgl ? function () {} : undefined });
    const gl = { RENDERER: 1, getExtension: (n: string) => (n === "WEBGL_debug_renderer_info" ? { UNMASKED_RENDERER_WEBGL: 2 } : null), getParameter: () => device.gpu };
    HTMLCanvasElement.prototype.getContext = (() => (webgl ? gl : null)) as never;
    new Function(TIER_SCRIPT)();
    return { film: d.dataset.film, lite: d.dataset.lite !== undefined };
  }

  it("starts the Poco X7 Pro in the film, on its signals alone", () => {
    expect(run({ webgl: true, reduced: false, asked: null, kept: null, device: POCO })).toEqual({ film: "film", lite: false });
  });

  it("starts a weak GPU in lite, and a visitor who chose the film in the film", () => {
    expect(run({ webgl: true, reduced: false, asked: null, kept: null, device: devices[1]! })).toEqual({ film: "still", lite: true });
    expect(run({ webgl: true, reduced: false, asked: null, kept: '{"choice":"full"}', device: devices[1]! })).toEqual({ film: "film", lite: false });
  });

  it("agrees with startVersion for every case", () => {
    const at = { film: "film", lite: "still", still: "still", plain: "plain" } as const;
    let cases = 0;
    for (const webgl of [true, false])
      for (const reduced of [false, true])
        for (const asked of [null, "film", "still", "plain"])
          for (const kept of stored)
            for (const device of devices) {
              const v = startVersion({ webgl, reduced, asked, kept: readKept(kept), weak: weakGpu(device.gpu) || lean(device) });
              expect(run({ webgl, reduced, asked, kept, device }), JSON.stringify({ webgl, reduced, asked, kept, device })).toEqual({ film: at[v], lite: v === "lite" });
              cases++;
            }
    expect(cases).toBe(384);
  });
});
