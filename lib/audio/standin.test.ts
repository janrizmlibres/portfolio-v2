import { describe, expect, it } from "vitest";
import { FakeContext, FakeNode } from "./fake-context";
import { noteBankVoice } from "./standin";

describe("the instrument's recorded voice: one sample per note of its scale", () => {
  const buf = (n: number) => ({ note: n }) as unknown as AudioBuffer;
  const bank = new Map([74, 77, 79].map((n) => [n, buf(n)]));

  it("plays a note's own sample at its own speed", () => {
    const ctx = new FakeContext();
    noteBankVoice(bank)(ctx as unknown as AudioContext, ctx.destination as unknown as AudioNode, 77, 0.5, false, 1);
    const src = ctx.created.find((n) => n.kind === "source") as FakeNode;
    expect((src.buffer as unknown as { note: number }).note).toBe(77);
    expect((src as unknown as { playbackRate: { value: number } }).playbackRate.value).toBe(1);
  });

  it("plays a note it has no sample for from the nearest, repitched", () => {
    const ctx = new FakeContext();
    noteBankVoice(bank)(ctx as unknown as AudioContext, ctx.destination as unknown as AudioNode, 81, 0.5, false, 1);
    const src = ctx.created.find((n) => n.kind === "source") as FakeNode;
    expect((src.buffer as unknown as { note: number }).note).toBe(79);
    expect((src as unknown as { playbackRate: { value: number } }).playbackRate.value).toBeCloseTo(2 ** (2 / 12));
  });
});
