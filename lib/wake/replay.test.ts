import { afterEach, describe, expect, it, vi } from "vitest";
import { offerReplay, onReplayWake, replayWake, wakeClasses } from "./replay";

describe("the wake-up's replay (Replay experience)", () => {
  let off: Array<() => void> = [];
  afterEach(() => { off.forEach((f) => f()); off = []; });

  it("is there only where the wake-up runs on this page", () => {
    const fn = vi.fn();
    off.push(onReplayWake(fn));
    expect(replayWake()).toBe(false);
    expect(fn).not.toHaveBeenCalled();
    const withdraw = offerReplay();
    expect(replayWake()).toBe(true);
    expect(fn).toHaveBeenCalledTimes(1);
    withdraw();
    expect(replayWake()).toBe(false);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("marks <html> as the head script does on a load: the lock, Tycho on his stage, still under reduced motion", () => {
    expect(wakeClasses(false)).toEqual(["wake", "wake-lock", "wake-centre"]);
    expect(wakeClasses(true)).toEqual(["wake", "wake-lock", "wake-centre", "wake-still"]);
  });
});
