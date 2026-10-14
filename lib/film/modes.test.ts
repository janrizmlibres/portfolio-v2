import { describe, expect, it } from "vitest";
import { WORD_MODES, wordStyle } from "./modes";

// a transform that leaves the word where it rests
const atRest = (tf: string) =>
  tf === "" || tf.split(/\)\s*/).filter(Boolean).every((part) => /^(translate[XY]?|rotate|skewX)\((-?0(\.0+)?(em|px|vw|vh|deg)?(,\s*)?)+$/.test(part) || /^scale[XY]?\(1(\.0+)?$/.test(part));
const hidden = (s: ReturnType<typeof wordStyle>) => s.opacity === 0 || /scaleY\(0(\.0+)?\)/.test(s.transform);

describe("wordStyle", () => {
  for (const mode of WORD_MODES) {
    it(`${mode}: rests in place, fully shown, once the word is in`, () => {
      const s = wordStyle(mode, { ein: 1, eout: 0, seed: 0.3, heavy: false });
      expect(s.opacity).toBe(1);
      expect(atRest(s.transform)).toBe(true);
      expect(s.ghost ?? { x: 0, opacity: 0 }).toEqual({ x: 0, opacity: 0 });
    });

    it(`${mode}: isn't seen before it writes in or after it has dissolved`, () => {
      expect(hidden(wordStyle(mode, { ein: 0, eout: 0, seed: 0.7, heavy: false }))).toBe(true);
      expect(hidden(wordStyle(mode, { ein: 1, eout: 1, seed: 0.7, heavy: false }))).toBe(true);
    });
  }

  it("thicken: fills out from thin type to its settled weight", () => {
    const thin = wordStyle("thicken", { ein: 0, eout: 0, seed: 0, heavy: false }).fontWeight!;
    const settled = wordStyle("thicken", { ein: 1, eout: 0, seed: 0, heavy: false }).fontWeight!;
    expect(thin).toBeLessThan(settled);
    expect(wordStyle("thicken", { ein: 1, eout: 0, seed: 0, heavy: true }).fontWeight!).toBeGreaterThan(settled);
  });

  it("twin: arrives with a duplicate that slides into it", () => {
    const g = wordStyle("twin", { ein: 0.2, eout: 0, seed: 0.9, heavy: false }).ghost!;
    expect(Math.abs(g.x)).toBeGreaterThan(0);
    expect(g.opacity).toBeGreaterThan(0);
  });
});
