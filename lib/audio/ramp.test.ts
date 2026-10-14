import { describe, expect, it } from "vitest";
import { rampTo } from "./ramp";

type Call = [string, ...number[]];
function param(value: number, { hold = true } = {}) {
  const calls: Call[] = [];
  const p = {
    value,
    setValueAtTime: (v: number, t: number) => void calls.push(["set", v, t]),
    linearRampToValueAtTime: (v: number, t: number) => void calls.push(["ramp", v, t]),
    cancelScheduledValues: (t: number) => void calls.push(["cancel", t]),
    ...(hold ? { cancelAndHoldAtTime: (t: number) => void calls.push(["hold", t]) } : {}),
  };
  return { p: p as unknown as AudioParam, calls };
}

describe("rampTo: a discrete fade from wherever the param is now", () => {
  it("pins the current value before ramping, so a ramp issued long after the last event doesn't jump", () => {
    const { p, calls } = param(0.37);
    rampTo(p, 0, 1, 42);
    expect(calls).toEqual([
      ["hold", 42],
      ["set", 0.37, 42],
      ["ramp", 0, 43],
    ]);
  });

  it("falls back to cancelling, then pinning, where cancelAndHoldAtTime is missing (Firefox)", () => {
    const { p, calls } = param(0.5, { hold: false });
    rampTo(p, 1, 0.6, 3);
    expect(calls).toEqual([
      ["cancel", 3],
      ["set", 0.5, 3],
      ["ramp", 1, 3.6],
    ]);
  });
});
