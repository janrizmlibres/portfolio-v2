import { describe, expect, it } from "vitest";
import { createHandSound, defineStarLit, noteFor, SCALE } from "./hand-sound";
import type { OneShot } from "./standin";

function fakeSound() {
  const log: string[] = [];
  const sound = {
    play: (name: string, _at?: number, level = 1) => void log.push(`${name} ${level.toFixed(2)}`),
    prepare: () => Promise.resolve(),
    instrument: { play: (note: number, intensity: number) => void log.push(`note ${note} ${intensity.toFixed(2)}`), use: () => {} },
    voice: { grain: () => ({}) as AudioBuffer },
  };
  return { log, sound };
}

describe("the hand's sounds: the sky under the pointer, and the drag", () => {
  it("gives every star a note of D minor pentatonic, the same note every time", () => {
    expect(SCALE).toEqual([74, 77, 79, 81, 84, 86, 89, 91, 93, 96, 98]);
    expect(noteFor(3)).toBe(noteFor(3));
    for (const s of [0, 7, 42, 92]) expect(SCALE).toContain(noteFor(s));
  });

  it("plays a star's note at Contact, softer for a slow pointer, once the voice has loaded", async () => {
    const { log, sound } = fakeSound();
    const hand = createHandSound(() => sound, "celesta");
    hand.star!(5, true, 200);
    await Promise.resolve();
    await Promise.resolve();
    hand.star!(5, true, 200);
    expect(log.filter((l) => l.startsWith("note"))).toHaveLength(1);
    expect(log.at(-1)).toMatch(/^note \d+ 0\.\d\d$/);
  });

  it("rings a bell for a star hovered anywhere else, its own note, louder the faster the pointer moves", async () => {
    const { log, sound } = fakeSound();
    const hand = createHandSound(() => sound, "celesta");
    hand.star!(5, false, 100);
    await Promise.resolve();
    await Promise.resolve();
    hand.star!(5, false, 100);
    hand.star!(6, false, 3000);
    hand.star!(null, false, 3000);
    const bells = log.filter((l) => l.startsWith("inst-bell-"));
    expect(bells).toHaveLength(2);
    expect(bells[0]!.split(" ")[0]).toBe(`inst-bell-${noteFor(5)}`);
    expect(+bells[1]!.split(" ")[1]!).toBeGreaterThan(+bells[0]!.split(" ")[1]!);
    expect(log.some((l) => l.startsWith("note"))).toBe(false);
  });

  it("makes no sound for a star hovered in the hero, its first frame included, and rings the bell once past it", async () => {
    const { log, sound } = fakeSound();
    let inHero = true;
    const hand = createHandSound(() => sound, "celesta", { skyWhole: () => inHero, quiet: () => inHero });
    hand.star!(2, false, 300);
    await Promise.resolve();
    await Promise.resolve();
    hand.star!(3, false, 3000);
    expect(log).toEqual([]);
    inHero = false;
    hand.star!(4, false, 300);
    expect(log.at(-1)).toMatch(/^inst-bell-/);
  });

  it("still plays a star's note at Contact, and for a star tapped where the sky is seen whole", async () => {
    const { log, sound } = fakeSound();
    const hand = createHandSound(() => sound, "celesta", { skyWhole: () => true, quiet: () => true });
    hand.star!(2, true, 300);
    await Promise.resolve();
    await Promise.resolve();
    hand.star!(3, true, 300);
    expect(log.at(-1)).toMatch(/^note /);
    hand.tap!(4, false);
    expect(log.at(-1)).toMatch(/^note /);
  });

  it("stays silent while the sky is dragged and turned", () => {
    const hand = createHandSound(() => fakeSound().sound, "celesta");
    expect(hand.turn).toBeUndefined();
    expect(hand.fling).toBeUndefined();
  });

  it("is silent with no engine", () => {
    const hand = createHandSound(() => null, "celesta");
    expect(() => (hand.star!(1, true, 100), hand.tap!(1, true))).not.toThrow();
  });
});

describe("a star lit as Tycho reads: a soft high bell, stepping on so a run of them never repeats", () => {
  it("defines star-lit once the notes have loaded, each call a different high note at the given level", async () => {
    const played: Array<[string, number]> = [];
    const defined = new Map<string, OneShot>();
    const sound = {
      prepare: (names: string[]) => (played.push(["prepare", names.length]), Promise.resolve()),
      voice: { grain: (name: string) => ({ name }) as unknown as AudioBuffer },
      define: (name: string, shot: OneShot) => void defined.set(name, shot),
    };
    const notes: string[] = [];
    await defineStarLit(sound, (buf) => (_ctx, _dest, _at, level = 1) => void notes.push(`${(buf as unknown as { name: string }).name} ${level}`));
    const lit = defined.get("star-lit")!;
    const none = null as unknown as never;
    lit(none, none, 0, 0.5);
    lit(none, none, 0, 1);
    lit(none, none, 0, 1);
    expect(new Set(notes.map((n) => n.split(" ")[0])).size).toBe(3);
    expect(notes.every((n) => /^inst-bell-(8[6-9]|9\d) /.test(n))).toBe(true);
    expect(+notes[0]!.split(" ")[1]!).toBeLessThan(+notes[1]!.split(" ")[1]!);
  });
});
