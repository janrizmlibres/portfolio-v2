import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTypewriter } from "./use-typewriter";

describe("useTypewriter", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("starts with the first word fully typed", () => {
    const { result } = renderHook(() => useTypewriter(["AI", "Full-stack"]));
    expect(result.current).toBe("AI");
  });

  it("erases char-by-char then types the next word", async () => {
    const { result } = renderHook(() =>
      useTypewriter(["AI", "Full-stack"], { holdMs: 100, eraseMs: 10, typeMs: 10, gapMs: 10 })
    );

    expect(result.current).toBe("AI");

    // Hold + erase 'I' + erase 'A'
    await act(async () => { await vi.advanceTimersByTimeAsync(100); }); // hold
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });  // erase I -> "A"
    expect(result.current).toBe("A");
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });  // erase A -> ""
    expect(result.current).toBe("");

    // Gap then type "F"
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });  // gap
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });  // type F
    expect(result.current).toBe("F");
  });

  it("respects prefers-reduced-motion by holding the first word", async () => {
    vi.stubGlobal("matchMedia", (q: string) => ({
      matches: q.includes("reduce"),
      media: q,
      addListener() {}, removeListener() {},
      addEventListener() {}, removeEventListener() {},
      dispatchEvent: () => false,
    }));
    const { result } = renderHook(() => useTypewriter(["AI", "Full-stack"]));
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(result.current).toBe("AI");
    vi.unstubAllGlobals();
  });
});
