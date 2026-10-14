import { afterEach, describe, expect, it, vi } from "vitest";
import { isLocked, unlock, whenUnlocked } from "./lock";

const html = document.documentElement;

describe("the lock, for what must wait for the wake (a deep link, a reload's place)", () => {
  afterEach(() => html.classList.remove("wake", "wake-lock"));

  it("runs at once when there's no wake-up", () => {
    const fn = vi.fn();
    whenUnlocked(fn);
    expect(isLocked()).toBe(false);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("waits for the wake, then runs once", () => {
    html.classList.add("wake", "wake-lock");
    const fn = vi.fn();
    whenUnlocked(fn);
    expect(isLocked()).toBe(true);
    expect(fn).not.toHaveBeenCalled();
    unlock();
    expect(isLocked()).toBe(false);
    expect(fn).toHaveBeenCalledTimes(1);
    unlock();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("can be called off before the wake", () => {
    html.classList.add("wake", "wake-lock");
    const fn = vi.fn();
    const off = whenUnlocked(fn);
    off();
    unlock();
    expect(fn).not.toHaveBeenCalled();
  });
});
