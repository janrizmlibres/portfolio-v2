import { describe, expect, it } from "vitest";
import { createReplay } from "./replay";

// a click on a link, as the document sees it
const click = (a: Partial<HTMLAnchorElement> & { back?: boolean }, mods: Partial<MouseEvent> = {}) => {
  const el = {
    closest: (sel: string) => (sel === "a[data-back]" && a.back ? { getAttribute: () => a.href ?? "#sec-hero" } : null),
  };
  let prevented = false;
  const e = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, defaultPrevented: false, target: el, ...mods, preventDefault: () => { prevented = true; } };
  return { e: e as unknown as MouseEvent, prevented: () => prevented };
};

function rig({ reduced = false, active = true, score = false, wake = undefined as boolean | undefined } = {}) {
  const log: string[] = [];
  const fades: Array<{ to: number; s: number; done: () => void }> = [];
  const state: { value: unknown } = { value: { other: 1 } };
  const replay = createReplay({
    veil: { fade: (to, s) => new Promise<void>((done) => { log.push(`fade ${to} ${s}`); fades.push({ to, s, done }); }) },
    wait: (s) => { log.push(`wait ${s}`); return Promise.resolve(); },
    jumpToStart: () => log.push("jump"),
    dip: score ? (down, s) => log.push(`dip ${down ? "down" : "up"} ${s}`) : undefined,
    history: {
      get state() { return state.value; },
      replaceState: (s: unknown) => { state.value = s; log.push("replace"); },
      pushState: (_s: unknown, _t: string, url?: string | URL | null) => log.push(`push ${url}`),
    },
    scrollY: () => 5000,
    reduced: () => reduced,
    active: () => active,
    ...(wake === undefined ? {} : { rewake: () => { log.push("rewake"); return wake; } }),
  });
  // lets the promise chain run to its next fade
  const settle = () => new Promise((r) => setTimeout(r, 0));
  return { replay, log, fades, state, settle };
}

describe("replay: Replay experience, where this page has no wake-up, sends you to the very start as Edolus's replay does", () => {
  it("fades to black, holds, lands on the film's first frame under the black, and fades back in", async () => {
    const { replay, log, fades, settle } = rig();
    const c = click({ back: true });
    replay.onClick(c.e);
    expect(c.prevented()).toBe(true);
    expect(log).toContain("fade 1 0.6");
    expect(log).not.toContain("jump");
    fades[0]!.done();
    await settle();
    expect(log.slice(log.indexOf("fade 1 0.6") + 1)).toEqual(["jump", "wait 0.4", "fade 0 1"]);
  });

  it("keeps Back honest: saves where you were on the entry being left, then pushes the start's address", () => {
    const { replay, log, state } = rig();
    replay.onClick(click({ back: true, href: "#sec-hero" }).e);
    expect(state.value).toEqual({ other: 1, deepLinkY: 5000 });
    expect(log.slice(0, 2)).toEqual(["replace", "push #sec-hero"]);
  });

  it("under reduced motion only crossfades: shorter, with no hold", async () => {
    const { replay, log, fades, settle } = rig({ reduced: true });
    replay.onClick(click({ back: true }).e);
    fades[0]!.done();
    await settle();
    expect(log.filter((l) => l.startsWith("fade") || l.startsWith("wait") || l === "jump")).toEqual(["fade 1 0.25", "jump", "fade 0 0.4"]);
  });

  it("leaves every other click alone: other links, a modified click, and the plain page", () => {
    for (const [c, opts] of [
      [click({ back: false }), {}],
      [click({ back: true }, { metaKey: true }), {}],
      [click({ back: true }, { button: 1 }), {}],
      [click({ back: true }), { active: false }],
    ] as const) {
      const { replay, log } = rig(opts);
      replay.onClick(c.e);
      expect(c.prevented()).toBe(false);
      expect(log).toEqual([]);
    }
  });

  it("starts from code as from a click (the route map's Start): saves where you were, pushes the address, plays", async () => {
    const { replay, log, state, fades, settle } = rig();
    replay.start("#sec-hero");
    expect(state.value).toEqual({ other: 1, deepLinkY: 5000 });
    expect(log.slice(0, 3)).toEqual(["replace", "push #sec-hero", "fade 1 0.6"]);
    fades[0]!.done();
    await settle();
    expect(log).toContain("jump");
    // a second start while it's under way does nothing
    replay.start("#sec-hero");
    expect(log.filter((l) => l.startsWith("push"))).toHaveLength(1);
  });

  it("ignores a second click while it's under way", async () => {
    const { replay, log, fades, settle } = rig();
    replay.onClick(click({ back: true }).e);
    const again = click({ back: true });
    replay.onClick(again.e);
    expect(again.prevented()).toBe(true);
    expect(log.filter((l) => l.startsWith("push"))).toHaveLength(1);
    fades[0]!.done();
    await settle();
    fades[1]!.done();
    await settle();
    replay.onClick(click({ back: true }).e);
    expect(log.filter((l) => l.startsWith("push"))).toHaveLength(2);
  });
});

describe("replay: the score under the black", () => {
  it("dips with the fade to black and comes back with the fade in, never stopping", async () => {
    const { replay, log, fades, settle } = rig({ score: true });
    replay.onClick(click({ back: true }).e);
    expect(log).toContain("dip down 0.6");
    fades[0]!.done();
    await settle();
    expect(log.slice(log.indexOf("jump"))).toEqual(["jump", "wait 0.4", "fade 0 1", "dip up 1"]);
  });
});

describe("replay: Replay experience goes back to the wake-up, where this page has one", () => {
  it("fades to black, lands on the first frame, brings the wake-up back from its loader, and drops the black at once under it", async () => {
    const { replay, log, fades, settle } = rig({ wake: true, score: true });
    replay.onClick(click({ back: true }).e);
    expect(log).toContain("fade 1 0.5");
    fades[0]!.done();
    await settle();
    expect(log.slice(log.indexOf("fade 1 0.5") + 1)).toEqual(["jump", "rewake", "fade 0 0"]);
  });

  it("keeps the score under the black: the wake-up brings it back as he's woken", async () => {
    const { replay, log, fades, settle } = rig({ wake: true, score: true });
    replay.onClick(click({ back: true }).e);
    fades[0]!.done();
    await settle();
    fades[1]!.done();
    await settle();
    expect(log.filter((l) => l.startsWith("dip"))).toEqual(["dip down 0.5"]);
  });

  it("under reduced motion, a shorter fade to the wake-up", async () => {
    const { replay, log } = rig({ wake: true, reduced: true });
    replay.onClick(click({ back: true }).e);
    expect(log).toContain("fade 1 0.25");
  });

  it("the route map's Start never brings it back: started from code, it lands on the first frame as it always has (Janriz, 2026-10-13)", async () => {
    const { replay, log, fades, settle } = rig({ wake: true, score: true });
    replay.start("#sec-hero");
    expect(log).toContain("fade 1 0.6");
    fades[0]!.done();
    await settle();
    expect(log).not.toContain("rewake");
    expect(log.slice(log.indexOf("jump"))).toEqual(["jump", "wait 0.4", "fade 0 1", "dip up 1"]);
  });

  it("where the wake-up is off (an automated browser, ?wake=off), replays to the first frame as before", async () => {
    const { replay, log, fades, settle } = rig({ wake: false });
    replay.onClick(click({ back: true }).e);
    fades[0]!.done();
    await settle();
    expect(log.slice(log.indexOf("jump"))).toEqual(["jump", "rewake", "wait 0.4", "fade 0 1"]);
  });
});
