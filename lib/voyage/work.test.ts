import { describe, expect, it } from "vitest";
import { BREAKTHROUGHS, ROLES, type Breakthrough, type Role } from "@/lib/content/voyage";
import { BEAT, builtAt, busyAt, callsAt, callsOf, gapsOf, planWork, quartersOf, relayOf, spinAt } from "./work";
import type { V3 } from "./route";

const role = (id: string, from: string, to: string): Role => ({ id, company: id, role: "r", from, to, span: "", shipped: "", stack: [] });
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a: V3) => Math.hypot(...a);
const unit = (a: V3): V3 => { const l = len(a); return [a[0] / l, a[1] / l, a[2] / l]; };
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const HOME: V3 = [0.2, -0.24, -0.25], CAMPUS: V3 = [0.635, 0.1, 0.05];

describe("relayOf: Work's one relay, by home", () => {
  const r = relayOf({ home: HOME, start: CAMPUS });

  it("stands just off home, towards his university's stars, aimed back at them (it throws you back to where it began)", () => {
    expect(len(sub(r.P, HOME))).toBeGreaterThan(0.03);
    expect(len(sub(r.P, HOME))).toBeLessThan(0.1);
    expect(dot(r.axis, unit(sub(CAMPUS, r.P)))).toBeCloseTo(1, 6);
  });

  it("is the relay finished (Janriz, 2026-10-11: 'the work intro relay is the final constructed form')", () => {
    expect(r.grade).toBe("flagship");
  });
});

describe("quartersOf: a company a quarter of home's ring, oldest first", () => {
  it("gives the four companies the four quarters, the oldest first", () => {
    expect(quartersOf(ROLES).map((q) => [q.i, q.role.id])).toEqual([[0, "yearbook"], [1, "elinnov"], [2, "tolstoy"], [3, "logolife"]]);
  });

  it("says so if there are more companies than the ring has quarters (a fifth needs the model to change)", () => {
    const five = ["a", "b", "c", "d", "e"].map((id, i) => role(id, `202${i}-01`, `202${i}-06`));
    expect(() => quartersOf(five)).toThrow(/four quarters/);
  });
});

describe("gapsOf: which breakthroughs come by after each company's quarter", () => {
  it("puts each after the company it came out during, up to the next one's start, every one once, oldest first", () => {
    expect(gapsOf(quartersOf(ROLES), BREAKTHROUGHS).map((g) => g.map((m) => m.id))).toEqual([
      ["gpt-4-turbo", "claude-3", "gpt-4o"],
      ["o1", "mcp", "claude-code", "gpt-4-1"],
      ["gpt-5"],
      ["opus-4-5", "opus-4-6", "glasswing", "fable-5", "claude-5-5"],
    ]);
  });

  it("puts one older than every company after the first, and one newer than every one after the last", () => {
    const early: Breakthrough = { id: "early", date: "2020-01", label: "", name: "", why: "" };
    const late: Breakthrough = { id: "late", date: "2030-01", label: "", name: "", why: "" };
    const g = gapsOf(quartersOf(ROLES), [...BREAKTHROUGHS, early, late]);
    expect(g[0]![0]!.id).toBe("early");
    expect(g.at(-1)!.at(-1)!.id).toBe("late");
  });
});

describe("callsOf: each breakthrough's craft, and its way by", () => {
  const calls = callsOf(gapsOf(quartersOf(ROLES), BREAKTHROUGHS)).flat();

  it("docks the ones he built with at the hub, as the freighter, the work pod, the hauler and the crane ship, in date order", () => {
    expect(calls.filter((c) => c.way === "dock").map((c) => [c.mark.id, c.kind])).toEqual([["gpt-4o", "craft"], ["mcp", "pod"], ["gpt-4-1", "hauler"], ["gpt-5", "crane"]]);
    for (const c of calls) expect(c.way === "dock").toBe(!!c.mark.built);
  });

  it("never brings two of the same craft in a row, nor passes two the same way in a row (Janriz: 'the supply ships feel repetitive')", () => {
    for (let i = 1; i < calls.length; i++) expect([calls[i]!.mark.id, calls[i]!.kind]).not.toEqual([calls[i]!.mark.id, calls[i - 1]!.kind]);
    const passes = calls.filter((c) => c.way !== "dock");
    for (let i = 1; i < passes.length; i++) expect(passes[i]!.way).not.toBe(passes[i - 1]!.way);
    expect(new Set(calls.map((c) => c.kind))).toEqual(new Set(["craft", "hauler", "pod", "shuttle", "crane"]));
  });
});

describe("planWork: the times of Work's beats, in screens of scroll", () => {
  const plan = planWork({ t0: 5.7, roles: ROLES, marks: BREAKTHROUGHS });

  it("leaves from the relay first; after its flash, the bare core; then each company's build and the gap after it; then the closed ring", () => {
    const D = plan.depart.at;
    const seq = [D.come, D.hold, D.align, D.charge, D.throw, plan.core, ...plan.quarters.flatMap((q) => [q.build, q.gap]), plan.end];
    expect(seq[0]![0]).toBe(5.7);
    for (let i = 1; i < seq.length; i++) {
      expect(seq[i]![0]).toBeCloseTo(seq[i - 1]![1], 9);
      expect(seq[i]![1]).toBeGreaterThan(seq[i]![0]);
    }
    expect(plan.flash).toBe(D.throw[1]);
    expect(plan.total).toBe(plan.end[1]);
  });

  it("gives every company the same build, and its breakthroughs each their own time in its gap, in date order", () => {
    for (const q of plan.quarters) {
      expect(q.build[1] - q.build[0]).toBeCloseTo(BEAT.build, 9);
      for (const c of q.calls) { expect(c.at[0]).toBeGreaterThanOrEqual(q.gap[0] - 1e-9); expect(c.at[1]).toBeLessThanOrEqual(q.gap[1] + 1e-9); }
      for (let j = 1; j < q.calls.length; j++) expect(q.calls[j]!.at[0]).toBeGreaterThanOrEqual(q.calls[j - 1]!.at[0] + Math.min(BEAT.every, BEAT.dock) - 1e-9);
    }
  });

  it("is shorter than the chain of relays it replaced: Work after the jump in under 11 screens (it was 15)", () => {
    expect(plan.total - plan.flash).toBeLessThan(11);
  });
});

describe("builtAt, spinAt, busyAt, callsAt: the build at any moment", () => {
  const plan = planWork({ t0: 5.7, roles: ROLES, marks: BREAKTHROUGHS });
  const steps = (a: number, b: number, n = 40) => [...Array(n + 1)].map((_, k) => a + ((b - a) * k) / n);

  it("is whole before the jump, only its core just after it, a quarter more after each build, and whole again at the end", () => {
    expect(builtAt(plan, plan.depart.at.come[0])).toBe(4);
    expect(builtAt(plan, plan.core[0] + 0.01)).toBe(0);
    plan.quarters.forEach((q) => {
      expect(builtAt(plan, q.build[0])).toBeCloseTo(q.i, 6);
      expect(builtAt(plan, q.gap[0] + 0.01)).toBeCloseTo(q.i + 1, 6);
      const xs = steps(q.build[0], q.build[1]).map((t) => builtAt(plan, t));
      for (let k = 1; k < xs.length; k++) expect(xs[k]!).toBeGreaterThanOrEqual(xs[k - 1]!);
    });
    expect(builtAt(plan, plan.end[1])).toBe(4);
  });

  it("holds the ring still while a quarter builds, and turns it a quarter in the gap after, so the next is built on the same side; once closed, it turns on", () => {
    plan.quarters.forEach((q) => {
      expect(spinAt(plan, q.build[0])).toBeCloseTo(q.i, 6);
      expect(spinAt(plan, q.build[1])).toBeCloseTo(q.i, 6);
    });
    plan.quarters.slice(0, -1).forEach((q) => expect(spinAt(plan, q.gap[1])).toBeCloseTo(q.i + 1, 6));
    const after = steps(plan.quarters.at(-1)!.gap[0], plan.end[1]).map((t) => spinAt(plan, t));
    for (let k = 1; k < after.length; k++) expect(after[k]!).toBeGreaterThan(after[k - 1]!);
  });

  it("is busiest while a quarter builds", () => {
    const q = plan.quarters[1]!;
    expect(busyAt(plan, (q.build[0] + q.build[1]) / 2)).toBe(1);
    expect(busyAt(plan, (q.gap[0] + q.gap[1]) / 2)).toBeLessThan(0.6);
  });

  it("has each breakthrough's craft in play only during its call, from 0 to 1", () => {
    for (const q of plan.quarters)
      for (const c of q.calls) {
        const mid = callsAt(plan, (c.at[0] + c.at[1]) / 2).find((x) => x.mark.id === c.mark.id)!;
        expect(mid.k).toBeCloseTo(0.5, 6);
        expect(callsAt(plan, c.at[1] + 0.01).some((x) => x.mark.id === c.mark.id)).toBe(false);
      }
  });
});
