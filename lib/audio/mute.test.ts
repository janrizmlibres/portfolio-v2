import { describe, expect, it } from "vitest";
import { rememberSound, soundWasOff } from "./mute";

function store() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
}
const broken = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
};

describe("the remembered mute: a visitor who turned the sound off finds it off next visit", () => {
  it("starts with sound on", () => {
    expect(soundWasOff(store())).toBe(false);
  });

  it("remembers the sound turned off, and on again", () => {
    const s = store();
    rememberSound(s, false);
    expect(soundWasOff(s)).toBe(true);
    rememberSound(s, true);
    expect(soundWasOff(s)).toBe(false);
  });

  it("treats blocked or missing storage as sound on, without throwing", () => {
    expect(soundWasOff(broken)).toBe(false);
    expect(() => rememberSound(broken, false)).not.toThrow();
    expect(soundWasOff(null)).toBe(false);
    expect(() => rememberSound(null, false)).not.toThrow();
  });
});
