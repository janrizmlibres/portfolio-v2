import { describe, expect, it, vi } from "vitest";
import { onStillsStale, stillsStale } from "./stage";

describe("stale stills", () => {
  it("tells every listener, until it stops listening", () => {
    const a = vi.fn(), b = vi.fn();
    const offA = onStillsStale(a);
    onStillsStale(b);
    stillsStale();
    offA();
    stillsStale();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
  });
});
