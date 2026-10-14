import { describe, expect, it } from "vitest";
import { respond, stallDue, STALL_MS, type Phase } from "./gate";
import type { Milestone } from "./count";

const ALL: Phase[] = ["loading", "charging", "dozing", "stalled", "waking", "done"];
const waits: Phase[] = ["dozing", "stalled"];

describe("the wake: what a click, tap or key does while he sleeps", () => {
  it("a click or tap on his ring or the wake button wakes him once he's dozing, or once the 3D has stalled", () => {
    for (const p of waits) expect(respond(p, { type: "click", on: true })).toBe("wake");
  });

  it("a click or tap anywhere else does nothing and reaches nothing", () => {
    for (const p of waits) {
      expect(respond(p, { type: "click", on: false })).toBe("block");
      expect(respond(p, { type: "click" })).toBe("block");
    }
  });

  it("Enter and Space wake him", () => {
    for (const p of waits) {
      expect(respond(p, { type: "key", key: "Enter" })).toBe("wake");
      expect(respond(p, { type: "key", key: " " })).toBe("wake");
    }
  });

  it("Esc never wakes him (browsers don't count it as activation, so it can't turn the sound on)", () => {
    for (const p of ALL) expect(respond(p, { type: "key", key: "Escape" })).not.toBe("wake");
  });

  it("before he dozes, a click does nothing and reaches nothing", () => {
    for (const p of ["loading", "charging", "waking"] as Phase[]) {
      expect(respond(p, { type: "click", on: true })).toBe("block");
      expect(respond(p, { type: "key", key: "Enter" })).toBe("block");
    }
  });

  it("the development mascot lab stays in reach throughout", () => {
    for (const p of ALL) expect(respond(p, { type: "click", ui: true })).toBe("pass");
  });
});

describe("the lock: no scroll until he wakes", () => {
  it("holds the wheel, a touch's drag and the scrolling keys in every phase before he's awake", () => {
    for (const p of ALL.filter((x) => x !== "done")) {
      expect(respond(p, { type: "wheel" })).toBe("block");
      expect(respond(p, { type: "touchmove" })).toBe("block");
      for (const key of ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"]) expect(respond(p, { type: "key", key })).toBe("block");
    }
  });

  it("lets Tab move focus (to the wake button) and lets go of everything once he's awake", () => {
    for (const p of ALL) expect(respond(p, { type: "key", key: "Tab" })).toBe("pass");
    for (const input of [{ type: "click" }, { type: "wheel" }, { type: "touchmove" }, { type: "key", key: " " }] as const)
      expect(respond("done", input)).toBe("pass");
  });
});

describe("the fallback: 3D that fails, or a first scene not in after about 10 s of the loader", () => {
  const FIRST_3D = ["start", "stars", "three", "tycho", "ship", "scene", "warm"] as const;
  const LATER_3D = ["relay", "traffic", "athena", "crawler", "pipeline", "ribbon", "warp"] as const;
  const at = (loadMs: number, missing: readonly Milestone[], universe = "ready") => stallDue({ phase: "loading", loadMs, universe, missing });

  it("stalls while loading once the 3D has failed", () => {
    expect(at(1200, ["tycho"], "failed")).toBe(true);
  });

  it("stalls with the first scene still loading at 10 s, and not before", () => {
    expect(STALL_MS).toBe(10_000);
    expect(at(9_999, ["scene"], "loading")).toBe(false);
    expect(at(10_000, ["scene"], "loading")).toBe(true);
    for (const m of FIRST_3D) expect(at(10_000, [m]), m).toBe(true);
  });

  it("never stalls on a later scene or the warp, however long it takes: the loader's cap shows the button instead (count.ts)", () => {
    for (const m of LATER_3D) expect(at(60_000, [m]), m).toBe(false);
    expect(at(60_000, [...LATER_3D, "sound"])).toBe(false);
  });

  it("never stalls on the score alone: a slow audio download doesn't take the 3D away", () => {
    expect(at(60_000, ["sound"])).toBe(false);
    expect(at(60_000, [])).toBe(false);
  });

  it("never once the load is done: the charge-up is a show", () => {
    for (const p of ALL.filter((x) => x !== "loading")) expect(stallDue({ phase: p, loadMs: 60_000, universe: "failed", missing: ["tycho"] })).toBe(false);
  });
});
