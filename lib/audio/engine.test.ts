import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSound, type ShotManifest, type StemManifest } from "./engine";
import { FakeContext, FakeNode, FakeParam, fakeFetch } from "./fake-context";

const LAYERS = ["bed", "keys", "pulse", "lead", "drone", "thinking"];
const MANIFEST: StemManifest = {
  loop: 24,
  sampleRate: 48000,
  frames: 24 * 48000,
  stems: Object.fromEntries(
    LAYERS.map((n) => [
      n,
      {
        files: {
          webm: { stereo: { file: `${n}.aaaa.webm`, bytes: 1000 }, mono: { file: `${n}.bbbb.mono.webm`, bytes: 1000 } },
          mp3: { stereo: { file: `${n}.cccc.mp3`, bytes: 1000 }, mono: { file: `${n}.dddd.mono.mp3`, bytes: 1000 } },
        },
      },
    ]),
  ),
};

function store(entries: Record<string, string> = {}) {
  const m = new Map(Object.entries(entries));
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
}

const SHOTS: ShotManifest = Object.fromEntries(
  ["dock", "dive", "relay", "inst-celesta-74", "inst-bell-74", "emote-greet", "ui-click", "chirp1", "toggle", "warp"].map((n) => [
    n,
    {
      seconds: 3,
      files: {
        webm: { stereo: { file: `${n}.eeee.webm`, bytes: 500 }, mono: { file: `${n}.ffff.mono.webm`, bytes: 500 } },
        mp3: { stereo: { file: `${n}.gggg.mp3`, bytes: 500 }, mono: { file: `${n}.hhhh.mono.mp3`, bytes: 500 } },
      },
    },
  ]),
);

function setup({ opus = true, phone = false, storage = store(), scenes = undefined as string[] | undefined } = {}) {
  const ctx = new FakeContext();
  const net = fakeFetch();
  const sound = createSound({
    ctx: ctx as unknown as AudioContext,
    manifest: MANIFEST,
    shots: SHOTS,
    scenes,
    fetchBytes: net.fetchBytes,
    canPlay: () => (opus ? "maybe" : ""),
    phone,
    storage,
  });
  return { ctx, net, sound, storage };
}

const flush = () => new Promise((r) => setTimeout(r, 0));
/** what was fetched for the score, leaving out the one-shots */
const stemUrls = (net: { urls: string[] }) => net.urls.filter((u) => !u.includes("/fx/"));
/** the score's sources, leaving out the one-shots' */
const sources = (ctx: FakeContext) => ctx.created.filter((n) => n.kind === "source" && n.buffer && !(n.buffer as { url: string }).url.includes("/fx/"));
const shotSource = (ctx: FakeContext, name: string) => ctx.created.find((n) => n.kind === "source" && (n.buffer as { url?: string } | undefined)?.url?.includes(`/fx/${name}.`));
const sourceOf = (ctx: FakeContext, layer: string) => sources(ctx).find((s) => (s.buffer as { url: string }).url.includes(`/${layer}.`));
const param = (n: unknown, p: string) => (n as Record<string, FakeParam>)[p]!;
const allTargets = (ctx: FakeContext) => ctx.created.flatMap((n) => Object.values(n).filter((v) => v instanceof FakeParam).flatMap((p) => (p as FakeParam).events.filter((e) => e[0] === "target")));

async function awake(opts?: Parameters<typeof setup>[0]) {
  const s = setup(opts);
  await s.sound.loadHero();
  s.sound.wake();
  await flush();
  await flush();
  return s;
}

describe("loading: the hero's layers under the wake-up's loader, the rest after the wake", () => {
  it("loads only the hero's layers under the loader, and decodes them before the click", async () => {
    const { ctx, net, sound } = setup();
    await sound.loadHero();
    expect(stemUrls(net)).toEqual(["/audio/bed.aaaa.webm"]);
    expect(ctx.decoded.filter((u) => !u.includes("/fx/"))).toEqual(["/audio/bed.aaaa.webm"]);
    expect(ctx.state).toBe("suspended");
    expect(sound.stats().bytesBeforeWake).toBe(1000);
  });

  it("loads the rest after the wake (the thinking layer waits for Tycho to think), and each joins in phase, fading in at its part's level", async () => {
    const { ctx, net, sound } = setup();
    await sound.loadHero();
    ctx.currentTime = 10;
    sound.wake();
    ctx.currentTime = 13.5;
    await flush();
    await flush();
    expect(stemUrls(net).slice(1).sort()).toEqual(LAYERS.filter((n) => n !== "bed" && n !== "thinking").map((n) => `/audio/${n}.aaaa.webm`).sort());
    const grid = sourceOf(ctx, "bed")!.started![0]!;
    const keys = sourceOf(ctx, "keys")!;
    // started at 13.5, as far into its loop as the bed is
    expect(keys.started![0]).toBe(13.5);
    expect(keys.started![1]).toBeCloseTo((13.5 - grid) % 24);
    // the hero holds only the bed; home brings the keys in, fading from silence
    sound.setPlace({ id: "home", sec: "sec-about" });
    const keysGain = [...keys.outs][0] as FakeNode;
    const ev = param(keysGain, "gain").events.filter((e) => e[0] === "target");
    expect(ev.at(-1)![1]).toBeGreaterThan(0);
  });

  it("joins a stem whose loop is a length of its own as far into its own loop as the grid has run", async () => {
    const { ctx, sound } = setup();
    // the bed's 37 s and the pulse's 24 s never line up the same way twice
    ctx.durationOf = (url) => (url.includes("/drone.") ? 37 : 24);
    await sound.loadHero();
    ctx.currentTime = 10;
    sound.wake();
    ctx.currentTime = 50;
    await flush();
    await flush();
    const grid = sourceOf(ctx, "bed")!.started![0]!;
    expect(sourceOf(ctx, "drone")!.started![1]).toBeCloseTo((50 - grid) % 37);
    expect(sourceOf(ctx, "keys")!.started![1]).toBeCloseTo((50 - grid) % 24);
  });

  it("starts every stem of the score on one audio-clock time", async () => {
    const { ctx } = await awake();
    const starts = sources(ctx).map((s) => s.started![0]! - ((s.started![1] as number) ?? 0));
    expect(new Set(starts.map((x) => x.toFixed(6))).size).toBe(1);
  });

  it("loads mono stems on a phone", async () => {
    const { net, sound } = setup({ phone: true });
    await sound.loadHero();
    expect(stemUrls(net)).toEqual(["/audio/bed.bbbb.mono.webm"]);
  });

  it("loads MP3 where the browser can't play Opus/WebM", async () => {
    const { net, sound } = setup({ opus: false });
    await sound.loadHero();
    expect(stemUrls(net)).toEqual(["/audio/bed.cccc.mp3"]);
    expect(sound.stats().format).toBe("mp3 stereo");
  });

  it("falls back to MP3 when Opus/WebM fails to decode, and keeps to MP3 for the rest", async () => {
    const s = setup();
    s.ctx.failDecode = (url) => url.endsWith(".webm");
    await s.sound.loadHero();
    s.sound.wake();
    await flush();
    await flush();
    expect(stemUrls(s.net)[0]).toBe("/audio/bed.aaaa.webm");
    expect(stemUrls(s.net)[1]).toBe("/audio/bed.cccc.mp3");
    expect(stemUrls(s.net).slice(2).every((u) => u.endsWith(".mp3"))).toBe(true);
    expect(s.sound.stats().fallback).toBe(true);
  });
});

describe("the wake: the click starts the sound", () => {
  it("resumes the context in the click, fades the score in over 2 s from silence, and plays the wake sound", async () => {
    const { ctx, sound } = setup();
    await sound.loadHero();
    ctx.currentTime = 5;
    sound.wake();
    expect(ctx.resumes).toBe(1);
    const score = sound.nodes.score;
    expect(param(score, "gain").events).toContainEqual(["ramp", 1, 7]);
    expect(param(score, "gain").events.find((e) => e[0] === "set")).toEqual(["set", 0, 5]);
    expect(sound.state).toMatchObject({ woken: true, on: true });
    expect(ctx.created.some((n) => n.kind === "oscillator" && n.started)).toBe(true);
  });
});

describe("the mix follows the film's place and speed, and the chat, sending only changes", () => {
  it("sends each layer's target from where the film is", async () => {
    const { ctx, sound } = await awake();
    sound.setPlace({ id: "crawler", sec: "sec-projects" });
    const pulse = [...sourceOf(ctx, "pulse")!.outs][0] as FakeNode;
    expect(param(pulse, "gain").events.at(-1)!.slice(0, 2)).toEqual(["target", 1]);
  });

  it("sends nothing when the place, speed and chat haven't changed", async () => {
    const { ctx, sound } = await awake();
    sound.setPlace({ id: "ride", sec: "sec-work" });
    sound.setSpeed(0.5);
    sound.setChat("submitted");
    const before = allTargets(ctx).length;
    sound.setPlace({ id: "role-elinnov", sec: "sec-work" }); // the same part
    sound.setSpeed(0.501);
    sound.setChat("submitted");
    expect(allTargets(ctx).length).toBe(before);
  });

  it("sends the mix nothing while the sound is off, and catches it up once it's back on", async () => {
    const { ctx, sound } = await awake();
    await flush();
    sound.setSound(false);
    const before = allTargets(ctx).length;
    for (let i = 0; i <= 20; i++) sound.setSpeed(i / 20);
    sound.setPlace({ id: "home", sec: "sec-about" });
    expect(allTargets(ctx).length).toBe(before);
    sound.setSound(true);
    expect(sound.stats().sent.keys).toBeCloseTo(0.8);
  });

  it("raises the free layer's rate with scroll speed on the road", async () => {
    const { ctx, sound } = await awake();
    sound.setPlace({ id: "ride", sec: "sec-work" });
    sound.setSpeed(1);
    expect(param(sourceOf(ctx, "drone"), "playbackRate").events.at(-1)!.slice(0, 2)).toEqual(["target", 1.5]);
  });

  it("ducks the score while Tycho thinks, and lets it back when he's done", async () => {
    const { sound } = await awake();
    sound.setChat("submitted");
    expect(param(sound.nodes.duck, "gain").events.at(-1)!.slice(0, 2)).toEqual(["target", 0.72]);
    sound.setChat("ready");
    expect(param(sound.nodes.duck, "gain").events.at(-1)!.slice(0, 2)).toEqual(["target", 1]);
  });
});

describe("the chat duck acts on the score's bus only", () => {
  it("puts every stem through it, and keeps the instrument, the one-shots and Tycho's radio out of it, so they never dip with the score", async () => {
    const { ctx, sound } = await awake();
    const duck = sound.nodes.duck as unknown as FakeNode;
    sound.setChat("submitted");
    await flush();
    await flush();
    expect(sources(ctx)).toHaveLength(LAYERS.length);
    for (const s of sources(ctx)) {
      expect(ctx.routes(s).length).toBeGreaterThan(0);
      for (const r of ctx.routes(s)) expect(r).toContain(duck);
    }

    const from = ctx.created.length;
    sound.instrument.play(67, 0.5);
    sound.play("chime");
    const made = ctx.created.slice(from).filter((n) => n.kind === "oscillator" || n.kind === "source");
    expect(made.length).toBeGreaterThan(0);
    for (const n of made) {
      const routes = ctx.routes(n);
      expect(routes.length).toBeGreaterThan(0);
      for (const r of routes) expect(r).not.toContain(duck);
    }
    const radio = sound.voice.radio as unknown as FakeNode;
    const master = sound.voice.master as unknown as FakeNode;
    for (const n of [radio, master]) {
      expect(ctx.routes(n).length).toBeGreaterThan(0);
      for (const r of ctx.routes(n)) expect(r).not.toContain(duck);
    }
  });
});

describe("the sound toggle and the remembered mute", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fades out over 1 s from where it is, then suspends; on again resumes and fades in over 1 s", async () => {
    const { ctx, sound } = setup();
    await sound.loadHero();
    sound.wake();
    await vi.runAllTimersAsync();
    const toggle = param(sound.nodes.toggle, "gain");
    toggle.value = 0.83;
    ctx.currentTime = 40;
    sound.setSound(false);
    expect(toggle.events.slice(-3)).toEqual([
      ["hold", 40],
      ["set", 0.83, 40],
      ["ramp", 0, 41],
    ]);
    expect(ctx.state).toBe("running");
    await vi.advanceTimersByTimeAsync(1100);
    expect(ctx.state).toBe("suspended");
    sound.setSound(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(ctx.state).toBe("running");
    expect(toggle.events.at(-1)).toEqual(["ramp", 1, 41]);
  });

  it("remembers the sound turned off: the next wake is silent, and nothing loads until it's turned on", async () => {
    const storage = store();
    const first = setup({ storage });
    await first.sound.loadHero();
    first.sound.wake();
    first.sound.setSound(false);

    const { ctx, net, sound } = setup({ storage });
    await sound.loadHero();
    expect(net.urls).toEqual([]);
    sound.wake();
    expect(ctx.resumes).toBe(0);
    expect(sound.state).toMatchObject({ woken: true, on: false });

    sound.setSound(true);
    await vi.runAllTimersAsync();
    expect(ctx.state).toBe("running");
    expect(stemUrls(net)[0]).toBe("/audio/bed.aaaa.webm");
    // every layer but the thinking one, which waits for Tycho to think
    expect(stemUrls(net)).toHaveLength(LAYERS.length - 1);
    expect(storage.m.get("jrz-sound-v1")).toBe("on");
  });

  it("plays no one-shot and no note while the sound is off, so nothing can wake the context", async () => {
    const { ctx, sound } = setup({ storage: store({ "jrz-sound-v1": "off" }) });
    await sound.loadHero();
    sound.wake();
    const from = ctx.created.length;
    sound.play("chime");
    expect(sound.instrument.play(67, 1)).toBe(false);
    expect(ctx.created.slice(from).filter((n) => n.started)).toEqual([]);
  });

  it("puts a muted visitor's context to sleep at the wake, even where the browser started it running", async () => {
    const { ctx, sound } = setup({ storage: store({ "jrz-sound-v1": "off" }) });
    ctx.state = "running"; // a browser that lets this origin play without a gesture
    await sound.loadHero();
    sound.wake();
    await vi.runAllTimersAsync();
    expect(ctx.state).toBe("suspended");
  });
});

describe("a hidden tab, and a context that won't come back", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fades out over 0.25 s and suspends when the tab is hidden, and resumes and fades in over 0.6 s on return", async () => {
    const { ctx, sound } = setup();
    await sound.loadHero();
    sound.wake();
    await vi.runAllTimersAsync();
    const hide = param(sound.nodes.hide, "gain");
    ctx.currentTime = 20;
    sound.setHidden(true);
    expect(hide.events.at(-1)).toEqual(["ramp", 0, 20.25]);
    await vi.advanceTimersByTimeAsync(300);
    expect(ctx.state).toBe("suspended");
    sound.setHidden(false);
    await vi.advanceTimersByTimeAsync(0);
    expect(ctx.state).toBe("running");
    expect(hide.events.at(-1)).toEqual(["ramp", 1, 20.6]);
  });

  it("stays running if the tab comes back before the fade is done", async () => {
    const { ctx, sound } = setup();
    await sound.loadHero();
    sound.wake();
    await vi.runAllTimersAsync();
    sound.setHidden(true);
    await vi.advanceTimersByTimeAsync(100);
    sound.setHidden(false);
    await vi.advanceTimersByTimeAsync(500);
    expect(ctx.state).toBe("running");
  });

  it("offers a restore when the context won't resume, and the restore resumes it", async () => {
    const { ctx, sound } = setup();
    await sound.loadHero();
    sound.wake();
    await vi.runAllTimersAsync();
    sound.setHidden(true);
    await vi.advanceTimersByTimeAsync(300);
    ctx.refuseResume = true;
    sound.setHidden(false);
    await vi.advanceTimersByTimeAsync(0);
    sound.checkClock(1000);
    expect(sound.state.restore).toBe(true);
    ctx.refuseResume = false;
    sound.restore();
    await vi.advanceTimersByTimeAsync(0);
    expect(ctx.state).toBe("running");
    ctx.currentTime += 0.5;
    sound.checkClock(1500);
    expect(sound.state.restore).toBe(false);
  });

  it("offers a restore when the context says it's running but its clock is frozen", async () => {
    const { ctx, sound } = setup();
    await sound.loadHero();
    sound.wake();
    await vi.runAllTimersAsync();
    const states: boolean[] = [];
    sound.subscribe(() => states.push(sound.state.restore));
    ctx.currentTime = 3;
    sound.checkClock(1000);
    ctx.currentTime = 3.5;
    sound.checkClock(1500);
    expect(sound.state.restore).toBe(false);
    sound.checkClock(2000); // half a second of wall time, no audio time
    expect(sound.state.restore).toBe(true);
    expect(states).toEqual([true]);
    // the restore suspends and resumes a context that claims to be running
    sound.restore();
    await vi.advanceTimersByTimeAsync(0);
    expect(ctx.suspends).toBeGreaterThan(0);
    expect(ctx.state).toBe("running");
  });

  it("resumes on return even while the hidden tab's suspend is still under way", async () => {
    const { ctx, sound } = setup();
    await sound.loadHero();
    sound.wake();
    await vi.runAllTimersAsync();
    // a real context settles its suspends and resumes in the order they're asked, a while later
    let queue = Promise.resolve();
    ctx.suspend = () => (queue = queue.then(() => new Promise<void>((r) => setTimeout(r, 50))).then(() => void (ctx.state = "suspended")));
    ctx.resume = () => (queue = queue.then(() => void (ctx.state = "running")));
    sound.setHidden(true);
    await vi.advanceTimersByTimeAsync(310);
    expect(ctx.state).toBe("running");
    sound.setHidden(false);
    await vi.advanceTimersByTimeAsync(100);
    expect(ctx.state).toBe("running");
  });

  it("never offers a restore while the wake's or the toggle's resume is under way", async () => {
    const { ctx, sound } = setup();
    ctx.resume = () => new Promise<void>((r) => setTimeout(() => ((ctx.state = "running"), r()), 50));
    const seen: boolean[] = [];
    sound.subscribe(() => seen.push(sound.state.restore));
    await sound.loadHero();
    sound.wake();
    await vi.advanceTimersByTimeAsync(100);
    sound.setSound(false);
    await vi.advanceTimersByTimeAsync(1200);
    sound.setSound(true);
    await vi.advanceTimersByTimeAsync(100);
    expect(ctx.state).toBe("running");
    expect(seen).not.toContain(true);
  });

  it("doesn't take the clock's stop while suspended for a frozen clock once it's back", async () => {
    const { ctx, sound } = setup();
    await sound.loadHero();
    sound.wake();
    await vi.runAllTimersAsync();
    ctx.currentTime = 10;
    sound.checkClock(1000);
    sound.setHidden(true);
    await vi.advanceTimersByTimeAsync(300);
    sound.checkClock(1500);
    sound.checkClock(2000);
    sound.setHidden(false);
    await vi.advanceTimersByTimeAsync(0);
    ctx.currentTime += 0.01;
    sound.checkClock(2500);
    expect(sound.state.restore).toBe(false);
  });

  it("never offers a restore while the sound is off or the tab is hidden", async () => {
    const { ctx, sound } = setup();
    await sound.loadHero();
    sound.wake();
    await vi.runAllTimersAsync();
    sound.setSound(false);
    await vi.advanceTimersByTimeAsync(1100);
    sound.checkClock(1000);
    sound.checkClock(1500);
    expect(sound.state.restore).toBe(false);
    expect(ctx.state).toBe("suspended");
  });
});

describe("the one-shots: the scene changes and the wake's relay, loaded after the wake", () => {
  it("loads only the wake's relay under the loader, so the scene changes never delay the wake", async () => {
    const { net, sound } = setup();
    await sound.loadHero();
    expect(net.urls.filter((u) => u.startsWith("/audio/fx/"))).toEqual(["/audio/fx/relay.ffff.mono.webm"]);
  });

  it("wakes on the relay's clunk, then his chirp", async () => {
    const { ctx, sound } = setup();
    await sound.loadHero();
    ctx.currentTime = 10;
    sound.wake();
    const relay = shotSource(ctx, "relay");
    expect(relay?.started?.[0]).toBeCloseTo(10.02);
    const chirp = ctx.created.filter((n) => n.kind === "oscillator" && n.started).map((n) => n.started![0]!);
    expect(Math.min(...chirp)).toBeGreaterThan(10.1);
  });

  it("loads each after the wake, in the stems' format, and plays it by name", async () => {
    const { ctx, net, sound } = await awake();
    await flush();
    expect(net.urls).toContain("/audio/fx/dock.eeee.webm");
    expect(net.urls).toContain("/audio/fx/dive.eeee.webm");
    sound.play("dock");
    const src = shotSource(ctx, "dock");
    expect(src?.started).toBeDefined();
  });

  it("hands back each sound playing, which fades out over a quarter second when stopped", async () => {
    const { ctx, sound } = await awake();
    await flush();
    ctx.currentTime = 30;
    const playing = sound.play("dock");
    const src = shotSource(ctx, "dock")!;
    const g = [...src.outs][0] as FakeNode;
    ctx.currentTime = 31;
    playing!.stop();
    const ramp = param(g, "gain").events.find((e) => e[0] === "ramp");
    expect(ramp?.[1]).toBe(0);
    expect(ramp?.[2]).toBeCloseTo(31.25);
    expect(src.stopped).toBeGreaterThanOrEqual(31.25);
    expect(src.stopped).toBeLessThan(31.5);
  });

  it("leaves the instrument's notes to be loaded on demand, once the page asks for a voice", async () => {
    const { net, sound } = await awake();
    await flush();
    expect(net.urls.some((u) => u.includes("/fx/inst-"))).toBe(false);
    await sound.prepare(["inst-celesta-74"]);
    expect(net.urls).toContain("/audio/fx/inst-celesta-74.ffff.mono.webm");
    expect(sound.voice.grain("inst-celesta-74")).toBeDefined();
  });

  it("plays a one-shot at a level, for a sound that follows the pointer's speed", async () => {
    const { ctx, sound } = await awake();
    await flush();
    sound.play("dock", undefined, 0.3);
    const g = [...shotSource(ctx, "dock")!.outs][0] as FakeNode;
    expect(param(g, "gain").value).toBeCloseTo(0.3);
  });

  it("loads the mono files on a phone", async () => {
    const { net } = await awake({ phone: true });
    await flush();
    expect(net.urls).toContain("/audio/fx/dock.ffff.mono.webm");
  });
});

describe("levels: the mixer's trims, set by ear on the real site", () => {
  it("scales a layer wherever it plays, and every layer while a part plays", async () => {
    const { sound } = await awake();
    sound.setPlace({ id: "home", sec: "sec-about" });
    const keys0 = sound.stats().sent.keys!;
    sound.levels.set({ layers: { keys: 0.5 } });
    expect(sound.stats().sent.keys).toBeCloseTo(keys0 * 0.5);
    sound.levels.set({ parts: { home: 0.5 } });
    expect(sound.stats().sent.keys).toBeCloseTo(keys0 * 0.25);
  });

  it("scales a one-shot by its own level, or its family's (emote-*)", async () => {
    const { ctx, sound } = await awake();
    await flush();
    sound.levels.set({ shots: { dock: 0.4, emote: 0.5, dive: 0.2 } });
    sound.play("dock");
    expect(param([...shotSource(ctx, "dock")!.outs][0] as FakeNode, "gain").value).toBeCloseTo(0.4);
  });

  it("sets the bell's notes as one family", async () => {
    const { ctx, sound } = await awake();
    await sound.prepare(["inst-bell-74"]);
    sound.levels.set({ shots: { bell: 0.3 } });
    sound.play("inst-bell-74");
    expect(param([...shotSource(ctx, "inst-bell-74")!.outs][0] as FakeNode, "gain").value).toBeCloseTo(0.3);
  });

  it("sets Tycho's voice and the instrument on their own buses, and the chat duck's depth", async () => {
    const { sound } = await awake();
    sound.levels.set({ voice: 0.7, instrument: 0.6, duck: { submitted: 0.5, streaming: 0.8 } });
    const target = (n: AudioNode) => param(n, "gain").events.filter((e) => e[0] === "target").at(-1)?.[1];
    expect(target(sound.nodes.voice!)).toBeCloseTo(0.7);
    expect(target(sound.nodes.instrument!)).toBeCloseTo(0.6);
    sound.setChat("submitted");
    expect(sound.stats().sent.duck).toBeCloseTo(0.5);
    expect(sound.levels.get().voice).toBeCloseTo(0.7);
  });
});

describe("decoded memory: what the engine holds stays inside the budget", () => {
  const fxUrl = (net: { urls: string[] }, name: string) => net.urls.find((u) => u.startsWith(`/audio/fx/${name}.`));

  it("decodes the instrument's notes and the small sounds from their mono files on every tier: they're mono already, or narrow", async () => {
    const { net, sound } = await awake();
    await flush();
    for (const n of ["relay", "emote-greet", "ui-click", "chirp1", "toggle"]) expect(fxUrl(net, n)).toContain(".mono.");
    await sound.prepare(["inst-celesta-74", "inst-bell-74"]);
    expect(fxUrl(net, "inst-celesta-74")).toContain(".mono.");
    expect(fxUrl(net, "inst-bell-74")).toContain(".mono.");
  });

  it("keeps the scene changes and the warp in stereo on a desktop", async () => {
    const { net } = await awake();
    await flush();
    expect(fxUrl(net, "dock")).not.toContain(".mono.");
    expect(fxUrl(net, "warp")).not.toContain(".mono.");
  });

  it("leaves the scene changes to the film: each loads as the film nears it and is let go once it's past", async () => {
    const { net, sound } = await awake({ scenes: ["dock", "dive"] });
    await flush();
    expect(fxUrl(net, "dock")).toBeUndefined();
    expect(fxUrl(net, "warp")).toBeDefined();
    sound.keep(["dock"]);
    await flush();
    await flush();
    expect(fxUrl(net, "dock")).toBeDefined();
    expect(fxUrl(net, "dive")).toBeUndefined();
    expect(sound.play("dock")).toBeDefined();
    sound.keep(["dive"]);
    await flush();
    await flush();
    expect(sound.play("dock")).toBeUndefined();
    expect(sound.play("dive")).toBeDefined();
  });

  it("waits for the wake before loading what the film asks for, and a muted visitor downloads nothing", async () => {
    const { net, sound } = setup({ scenes: ["dock"] });
    await sound.loadHero();
    sound.keep(["dock"]);
    await flush();
    expect(fxUrl(net, "dock")).toBeUndefined();
    sound.wake();
    await flush();
    await flush();
    expect(fxUrl(net, "dock")).toBeDefined();

    const muted = setup({ scenes: ["dock"], storage: store({ "jrz-sound-v1": "off" }) });
    await muted.sound.loadHero();
    muted.sound.keep(["dock"]);
    muted.sound.wake();
    await flush();
    expect(muted.net.urls).toEqual([]);
  });

  it("keeps a sound let go while it was loading let go", async () => {
    const { sound } = await awake({ scenes: ["dock"] });
    sound.keep(["dock"]);
    sound.keep([]);
    await flush();
    await flush();
    expect(sound.play("dock")).toBeUndefined();
  });

  it("lets go what the film no longer holds while the sound is off, and loads what it holds once it's back on", async () => {
    const { net, sound } = await awake({ scenes: ["dock", "dive"] });
    sound.keep(["dive"]);
    await flush();
    await flush();
    expect(sound.stats().shots).toContain("dive");
    sound.setSound(false);
    sound.keep(["dock"]);
    await flush();
    await flush();
    expect(sound.stats().shots).not.toContain("dive");
    expect(fxUrl(net, "dock")).toBeUndefined();
    sound.setSound(true);
    await flush();
    await flush();
    expect(sound.stats().shots).toContain("dock");
  });

  it("loads the thinking layer only once Tycho first thinks, and it joins in phase", async () => {
    const { ctx, net, sound } = await awake();
    await flush();
    expect(stemUrls(net).some((u) => u.includes("/thinking."))).toBe(false);
    sound.setChat("submitted");
    await flush();
    await flush();
    expect(stemUrls(net).some((u) => u.includes("/thinking."))).toBe(true);
    expect(sourceOf(ctx, "thinking")?.started).toBeDefined();
  });

  it("counts the bytes it holds decoded, and lets them go with the sounds", async () => {
    const { sound } = await awake({ scenes: ["dock"] });
    await flush();
    const before = sound.stats().resident;
    sound.keep(["dock"]);
    await flush();
    await flush();
    // a stereo 24 s file at 48 kHz, as 32-bit floats
    expect(sound.stats().resident - before).toBe(24 * 48000 * 2 * 4);
    sound.keep([]);
    expect(sound.stats().resident).toBe(before);
  });
});

describe("the replay: the score dips under the black and comes back, never stopping", () => {
  it("dips the score's bus, not the one-shots', and brings it back", async () => {
    const { ctx, sound } = await awake();
    await flush();
    const playing = sources(ctx);
    ctx.currentTime = 40;
    sound.dip(true, 0.6);
    const dip = param(sound.nodes.dip!, "gain");
    const down = dip.events.filter((e) => e[0] === "ramp").at(-1)!;
    expect(down[1]).toBeLessThan(0.3);
    expect(down[1]).toBeGreaterThan(0);
    expect(down[2]).toBeCloseTo(40.6);
    ctx.currentTime = 41;
    sound.dip(false, 1);
    const up = dip.events.filter((e) => e[0] === "ramp").at(-1)!;
    expect(up[1]).toBe(1);
    expect(up[2]).toBeCloseTo(42);
    expect(playing.every((s) => s.stopped === null)).toBe(true);
    const fxRoutes = ctx.routes(sound.nodes.fx as unknown as FakeNode);
    expect(fxRoutes.every((r) => !r.includes(sound.nodes.dip as unknown as FakeNode))).toBe(true);
    const scoreRoutes = ctx.routes(sound.nodes.score as unknown as FakeNode);
    expect(scoreRoutes.every((r) => r.includes(sound.nodes.dip as unknown as FakeNode))).toBe(true);
  });
});

describe("the replayed wake: the score held under the wake-up comes back as he's woken again", () => {
  it("brings the score's bus up from its dip, with the wake's relay and chirp, never restarting the score", async () => {
    const { ctx, sound } = await awake();
    await flush();
    const playing = sources(ctx);
    const relays = () => ctx.created.filter((n) => n.kind === "source" && (n.buffer as { url?: string } | undefined)?.url?.includes("/fx/relay.")).length;
    const before = relays();
    ctx.currentTime = 40;
    sound.dip(true, 0.5);
    ctx.currentTime = 50;
    sound.rewake();
    const up = param(sound.nodes.dip!, "gain").events.filter((e) => e[0] === "ramp").at(-1)!;
    expect(up[1]).toBe(1);
    expect(up[2]).toBeGreaterThan(50.5);
    expect(relays()).toBe(before + 1);
    expect(playing.every((s) => s.stopped === null)).toBe(true);
    expect(sources(ctx)).toHaveLength(playing.length);
  });

  it("lifts the dip even with the sound off, so the score isn't left dipped when it's turned on", async () => {
    const { ctx, sound } = await awake();
    ctx.currentTime = 40;
    sound.dip(true, 0.5);
    sound.setSound(false);
    ctx.currentTime = 50;
    sound.rewake();
    const up = param(sound.nodes.dip!, "gain").events.filter((e) => e[0] === "ramp").at(-1)!;
    expect(up[1]).toBe(1);
  });

  it("stays quiet with the sound off", async () => {
    const { ctx, sound } = await awake();
    sound.setSound(false);
    const n = ctx.created.length;
    sound.rewake();
    expect(ctx.created.length).toBe(n);
  });
});

describe("a one-shot started part way in", () => {
  it("plays from `from` seconds into its sound", async () => {
    const { ctx, sound } = await awake();
    await flush();
    sound.play("dock", 50, 1, 0.66);
    expect(shotSource(ctx, "dock")!.started).toEqual([50, 0.66]);
  });
});

describe("the master: nothing leaves above full scale", () => {
  it("follows the limiter with a ceiling a decibel under full scale, since the limiter's attack lets a hit through", async () => {
    const { ctx, sound } = await awake();
    const routes = ctx.routes(sound.nodes.limiter as unknown as FakeNode);
    expect(routes.length).toBeGreaterThan(0);
    for (const r of routes) {
      const ceiling = r.slice(1).find((n) => n.kind === "gain");
      expect(ceiling).toBeDefined();
      expect(param(ceiling, "gain").value).toBeLessThanOrEqual(0.9);
    }
  });
});

describe("a muted visitor downloads nothing until the sound is turned on", () => {
  it("holds a page's request for notes until then, and loads them once it's on", async () => {
    const { net, sound } = setup({ storage: store({ "jrz-sound-v1": "off" }) });
    await sound.loadHero();
    sound.wake();
    let done = false;
    const p = sound.prepare(["inst-bell-74"]).then(() => (done = true));
    await flush();
    expect(net.urls).toEqual([]);
    expect(done).toBe(false);
    sound.setSound(true);
    await p;
    expect(net.urls).toContain("/audio/fx/inst-bell-74.ffff.mono.webm");
    expect(sound.voice.grain("inst-bell-74")).toBeDefined();
  });
});
