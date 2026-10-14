/**
 * The site's sound, on raw Web Audio: one context for everything (ADR 0006).
 *
 * The graph:
 *   stems → each layer's mix gain → score (its start fade) → bright → duck → dip ─┐
 *   instrument, one-shots, UI sounds → fx ───────────────────────────────────────┤
 *   Tycho's chirps → suit radio ─────────────────────────────────────────────────┼→ post → hide → toggle → limiter → ceiling → out
 *   Quindar tones (the master) ──────────────────────────────────────────────────┘
 * The chat duck acts on the score's bus only: everything else joins after it, so it never dips with the score. So does
 * the replay's dip: the score sinks under the black and comes back with the first frame, never stopping.
 *
 * - **The score** plays from pre-rendered stems that loop sample-exact. They share one audio-clock start (the grid),
 *   so a stem that arrives late starts as far into its own loop as the grid has run, and fades in at its part's
 *   level. The unpulsed stems loop at lengths of their own, so the bed never lines up with the pulse the same way twice.
 * - **The mix**: the page says where the film is, how fast it moves and what the chat is doing; the engine turns
 *   that into each layer's target and sends only changes, smoothed on the audio thread by `setTargetAtTime`.
 * - **Discrete fades** (the toggle, a hidden tab, the score's start) are native ramps that pin the current value.
 * - **Loading**: the hero's layers load under the wake-up's loader and decode before the click, since decoding needs
 *   no running context. The rest load after the wake, the thinking layer once Tycho first thinks. Of the one-shots,
 *   the scene changes are held only near their moments (`keep`), and the instrument's notes load when asked for
 *   (`prepare`); what each decodes from is in memory.ts.
 * - **The sound toggle** fades out over 1 s, then suspends the context; a visitor who turned it off finds it off on
 *   their next visit, and their wake is silent. A hidden tab fades out and suspends; the context resumes on return.
 *   When the context won't resume, or says it's running while its clock is frozen, the page offers a restore.
 */
import { pickFormat, withFallback, type Channels, type Fmt } from "./format";
import { shotChannels } from "./memory";
import { diffTargets, DUCK, FREE_LAYER, HERO_LAYERS, mixTargets, partOf, THINKING, type ChatStatus, type Targets } from "./mix";
import { rememberSound, soundWasOff } from "./mute";
import { rampTo } from "./ramp";
import { chime, pluckVoice, sampleShot, suitRadio, wakeChirp, type OneShot, type Voice, type VoiceMaker } from "./standin";
import { createVoicePool } from "./voices";

export type StemFile = { file: string; bytes: number };
/** What the stem pipeline writes: each stem's files by format and channels, and the pulsed layers' loop (an unpulsed stem may loop at a length of its own). */
export type StemManifest = {
  loop: number;
  sampleRate: number;
  frames: number;
  stems: Record<string, { files: Record<Fmt, Record<Channels, StemFile>> }>;
};
/** What the pipeline writes for the one-shots: each one's files by format and channels. */
export type ShotManifest = Record<string, { seconds: number; files: Record<Fmt, Record<Channels, StemFile>> }>;
export type Place = { id: string; sec: string };
/** The mixer's trims: a multiplier per layer, per part and per one-shot (or family: `emote` for `emote-*`), the
 * voice's and the instrument's buses, and the chat duck's depth while Tycho thinks and answers. */
export type Levels = {
  layers: Record<string, number>;
  parts: Record<string, number>;
  shots: Record<string, number>;
  voice: number;
  instrument: number;
  duck: { submitted: number; streaming: number };
};
export type SoundState = { woken: boolean; on: boolean; restore: boolean };

export type SoundDeps = {
  ctx: AudioContext;
  manifest: StemManifest;
  /** the recorded one-shots (scene changes, the wake's relay), loaded after the wake */
  shots?: ShotManifest;
  /** the scene changes' one-shots: held only while the film is near them (`keep`), never all at once */
  scenes?: string[];
  /** the mixer's trims to start from */
  levels?: Partial<Levels>;
  fetchBytes: (url: string) => Promise<ArrayBuffer>;
  canPlay: (mime: string) => string;
  /** phones get mono stems */
  phone: boolean;
  storage: Pick<Storage, "getItem" | "setItem"> | null;
  base?: string;
};

/** The bright filter's cutoff: 300 Hz closed, 18 kHz open. */
const brightHz = (b: number) => 300 * 60 ** b;
const SCORE_FADE = 2;
const TOGGLE_FADE = 1;
const HIDE_FADE = 0.25;
const SHOW_FADE = 0.6;
/** the one-shot the wake's click plays first, loaded with the hero's layers */
const RELAY = "relay";
/** how a stem that arrives late fades in */
const JOIN_TAU = 0.6;
/** how far the replay's dip takes the score (about −14 dB): under the black, still there */
const DIP = 0.2;
/** how long the score takes to come back up from the replay's dip as he's woken again: as the sky comes up */
const REWAKE_UP = 1.4;
/** the master's ceiling after the limiter: −1 dB */
const CEILING = 0.89;

export function createSound({ ctx, manifest, shots: shotFiles = {}, scenes = [], levels: startLevels, fetchBytes, canPlay, phone, storage, base = "/audio/" }: SoundDeps) {
  const layers = Object.keys(manifest.stems);
  const gain = (v: number, dest?: AudioNode) => {
    const g = ctx.createGain();
    g.gain.value = v;
    if (dest) g.connect(dest);
    return g;
  };

  // ---------------------------------------------------------------- the graph
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -3;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;
  // a decibel under full scale after the limiter: its attack lets the first milliseconds of a hit through (the climax
  // reached 0 dBFS without it)
  const ceiling = gain(CEILING);
  const meter = ctx.createAnalyser();
  meter.fftSize = 2048;
  limiter.connect(ceiling).connect(meter).connect(ctx.destination);
  const toggle = gain(0, limiter);
  const hide = gain(1, toggle);
  const post = gain(1, hide);
  const dip = gain(1, post);
  const duck = gain(1, dip);
  const bright = ctx.createBiquadFilter();
  bright.type = "lowpass";
  bright.frequency.value = 18000;
  bright.Q.value = 0.5;
  bright.connect(duck);
  const score = gain(0, bright);
  const mixes = Object.fromEntries(layers.map((n) => [n, gain(0, score)]));
  const fx = gain(1, post);
  // Tycho's voice on a bus of its own (his radio and its Quindar tones), so the mixer can set it
  const voiceBus = gain(1, post);
  const radio = suitRadio(ctx, voiceBus);

  // ---------------------------------------------------------------- state
  const picked = pickFormat(canPlay, phone);
  const ch = picked.ch;
  let fmt = picked.fmt;
  let fallback = false;
  const buffers = new Map<string, AudioBuffer>();
  const loads = new Map<string, Promise<void>>();
  const playing = new Map<string, AudioBufferSourceNode>();
  let grid: number | null = null;
  let place: Place = { id: "hero", sec: "sec-hero" };
  let speed = 0;
  let chat: ChatStatus = "ready";
  const sent: Targets = {};
  let state: SoundState = { woken: false, on: !soundWasOff(storage), restore: false };
  let hidden = false;
  let heroLoad: Promise<void> | null = null;
  let offTimer: ReturnType<typeof setTimeout> | undefined;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  let lastClock: { wall: number; audio: number } | null = null;
  let frozen = false;
  // a resume under way isn't a stuck context: the restore waits for it to settle
  let resuming = 0;
  const stats = { bytesBeforeWake: 0, decodeMs: 0, decodedBytes: 0 };
  const listeners = new Set<() => void>();

  const now = () => ctx.currentTime;
  const set = (patch: Partial<SoundState>) => {
    const next = { ...state, ...patch };
    next.restore = next.woken && next.on && !hidden && !resuming && (ctx.state !== "running" || frozen);
    if (next.woken === state.woken && next.on === state.on && next.restore === state.restore) return;
    state = next;
    listeners.forEach((fn) => fn());
  };
  const resume = () => {
    resuming++;
    const settled = () => {
      resuming--;
      set({});
    };
    return ctx.resume().then(settled, settled);
  };

  // ---------------------------------------------------------------- loading
  function load(name: string) {
    let p = loads.get(name);
    if (p) return p;
    const early = !state.woken;
    const once = async (f: Fmt) => {
      const file = manifest.stems[name]!.files[f][ch];
      const bytes = await fetchBytes(base + file.file);
      if (early) stats.bytesBeforeWake += file.bytes;
      const t0 = performance.now();
      const buf = await ctx.decodeAudioData(bytes);
      stats.decodeMs += performance.now() - t0;
      return buf;
    };
    p = withFallback(fmt, once).then(
      ({ value, fmt: got }) => {
        if (got !== fmt) {
          fmt = got;
          fallback = true;
        }
        buffers.set(name, value);
        stats.decodedBytes += value.length * value.numberOfChannels * 4;
        if (grid !== null) join(name, JOIN_TAU);
      },
      // a stem that won't load leaves its layer silent; the rest play on
      () => {},
    );
    loads.set(name, p);
    return p;
  }

  /** A recorded one-shot, once, in the stems' format; one that won't load stays silent, and one let go while it
   * loads stays let go. */
  const shotLoads = new Map<string, Promise<void>>();
  const shotBuffers = new Map<string, AudioBuffer>();
  function loadShot(name: string) {
    const s = shotFiles[name];
    if (!s) return Promise.resolve();
    let p = shotLoads.get(name);
    if (!p) {
      const c = shotChannels(name, phone);
      const mine: Promise<void> = withFallback(fmt, async (f) => ctx.decodeAudioData(await fetchBytes(`${base}fx/${s.files[f][c].file}`))).then(
        ({ value }) => {
          if (shotLoads.get(name) !== mine) return;
          shotBuffers.set(name, value);
          shots.set(name, sampleShot(value));
        },
        () => {},
      );
      shotLoads.set(name, (p = mine));
    }
    return p;
  }
  function letGo(name: string) {
    shotLoads.delete(name);
    shotBuffers.delete(name);
    shots.delete(name);
  }
  /** The instrument's notes wait to be asked for, and the scene changes for the film to come near them. */
  const scened = new Set(scenes);
  const onDemand = (name: string) => name.startsWith("inst-") || scened.has(name);
  const loadShots = () => Object.keys(shotFiles).filter((n) => !onDemand(n)).forEach((n) => void loadShot(n));
  /** the scene changes the film last asked to hold */
  let held = new Set<string>();
  const holdScenes = () => {
    for (const n of scened)
      if (!held.has(n)) {
        if (shotLoads.has(n)) letGo(n);
      } else if (grid !== null && state.on) void loadShot(n);
  };

  /** Every layer but the thinking one, the hero's first, then the one-shots. */
  const loadAll = () => {
    [...HERO_LAYERS, ...layers].filter((n) => layers.includes(n) && n !== THINKING).forEach((n) => void load(n));
    loadShots();
    holdScenes();
  };

  // ---------------------------------------------------------------- the score
  function join(name: string, tau: number) {
    if (playing.has(name) || grid === null) return;
    const src = ctx.createBufferSource();
    src.buffer = buffers.get(name)!;
    src.loop = true;
    if (name === FREE_LAYER) src.playbackRate.value = sent.rate ?? 1;
    src.connect(mixes[name]!);
    // on the grid: as far into its own loop as the grid has run (a stem may loop at a length of its own)
    const at = Math.max(now(), grid);
    src.start(at, (at - grid) % src.buffer.duration);
    playing.set(name, src);
    push(tau);
  }

  function begin() {
    if (grid !== null) return;
    grid = now() + 0.05;
    for (const n of buffers.keys()) join(n, 0.01);
    rampTo(score.gain, 1, SCORE_FADE, now());
    loadAll();
  }

  // ---------------------------------------------------------------- the mix
  function push(tau: number, duckTau = 0.3) {
    // a suspended context would pile the automation up unplayed; `sent` keeps what's owed for the way back
    if (grid === null || !state.on || hidden) return;
    const all = mixTargets(layers, place, speed, chat);
    const t: Targets = { rate: all.rate!, bright: all.bright!, duck: chat === "ready" ? all.duck! : lv.duck[chat] };
    const partTrim = lv.parts[partOf(place)] ?? 1;
    for (const n of playing.keys()) t[n] = all[n]! * (lv.layers[n] ?? 1) * partTrim;
    const d = diffTargets(sent, t);
    Object.assign(sent, d);
    const at = now();
    for (const [k, v] of Object.entries(d)) (SEND[k] ?? sendLevel(k))(v, at, tau, duckTau);
  }
  type Send = (v: number, at: number, tau: number, duckTau: number) => void;
  const SEND: Record<string, Send> = {
    rate: (v, at, tau) => playing.get(FREE_LAYER)?.playbackRate.setTargetAtTime(v, at, tau),
    bright: (v, at, tau) => bright.frequency.setTargetAtTime(brightHz(v), at, tau),
    duck: (v, at, _tau, duckTau) => duck.gain.setTargetAtTime(v, at, duckTau),
  };
  const sendLevel = (layer: string): Send => (v, at, tau) => mixes[layer]!.gain.setTargetAtTime(v, at, tau);

  // ---------------------------------------------------------------- live sounds
  const shots = new Map<string, OneShot>([
    ["wake", wakeChirp],
    ["chime", chime],
  ]);
  const instrumentBus = gain(1, fx);
  const lv: Levels = {
    layers: {},
    parts: {},
    shots: {},
    voice: 1,
    instrument: 1,
    duck: { submitted: DUCK.submitted, streaming: DUCK.streaming },
    ...startLevels,
  };
  // the emotes, the UI ticks and the bell's notes are set as families; every other sound by its own name
  const family = (name: string) => (name.startsWith("inst-bell-") ? "bell" : /^(emote|ui)-/.test(name) ? name.split("-")[0]! : name);
  const shotTrim = (name: string) => lv.shots[name] ?? lv.shots[family(name)] ?? 1;
  voiceBus.gain.value = lv.voice;
  instrumentBus.gain.value = lv.instrument;
  let voiceMaker: VoiceMaker = pluckVoice(ctx, instrumentBus);
  let pending = { intensity: 0, strong: false };
  const pool = createVoicePool<Voice>({
    start: (note, at) => {
      const v = voiceMaker(ctx, instrumentBus, note, pending.intensity, pending.strong, at);
      v.onEnded(() => pool.ended(v));
      return v;
    },
    cut: (v, at, fade) => {
      rampTo(v.env.gain, 0, fade, at);
      v.stop(at + fade + 0.02);
    },
  });

  return {
    /** Loads the hero's layers, under the wake-up's loader (its count waits on them). */
    loadHero() {
      if (heroLoad) return heroLoad;
      // a visitor who turned the sound off downloads nothing until they turn it on
      if (!state.on) return (heroLoad = Promise.resolve());
      // the hero's layers, and the relay the click plays (a few KB)
      heroLoad = Promise.all([...HERO_LAYERS.filter((n) => layers.includes(n)).map((n) => load(n)), loadShot(RELAY)]).then(() => {});
      return heroLoad;
    },

    /** The wake-up's click. Call it inside the click: resuming there is what unlocks the sound. */
    wake() {
      if (state.woken) return;
      if (!state.on) {
        set({ woken: true });
        // a browser that lets this origin play may have started the context already
        if (ctx.state === "running") void ctx.suspend().then(() => set({}));
        return;
      }
      void resume();
      set({ woken: true });
      rampTo(toggle.gain, 1, 0.02, now());
      begin();
      // his systems come on with a relay's clunk, then he chirps awake
      shots.get(RELAY)?.(ctx, fx, now() + 0.02);
      shots.get("wake")?.(ctx, fx, now() + 0.22);
    },

    /** The sound toggle. Also the way in where there was no wake-up. */
    setSound(on: boolean) {
      rememberSound(storage, on);
      clearTimeout(offTimer);
      if (on) {
        void resume();
        set({ on: true, woken: true });
        begin();
        push(0.1);
        holdScenes();
        rampTo(toggle.gain, 1, TOGGLE_FADE, now());
      } else {
        set({ on: false });
        rampTo(toggle.gain, 0, TOGGLE_FADE, now());
        offTimer = setTimeout(() => !state.on && void ctx.suspend().then(() => set({})), (TOGGLE_FADE + 0.1) * 1000);
      }
    },

    setPlace(p: Place) {
      place = p;
      push(0.4);
    },
    /** Scroll speed, 0–1. Rising, it's heard at once; falling, it eases off. */
    setSpeed(v: number) {
      const up = v > speed;
      speed = v;
      push(up ? 0.15 : 0.6);
    },
    setChat(c: ChatStatus) {
      chat = c;
      if (c !== "ready" && grid !== null && layers.includes(THINKING)) void load(THINKING);
      push(c === "submitted" ? 0.25 : 0.5);
    },

    /** The scene changes' one-shots to hold now (the film says which are near); the rest are let go. */
    keep(names: string[]) {
      held = new Set(names);
      holdScenes();
    },

    /** The replay's dip: the score sinks under the black over `seconds`, and comes back as it lifts. */
    dip(down: boolean, seconds: number) {
      rampTo(dip.gain, down ? DIP : 1, seconds, now());
    },

    /**
     * The replayed wake ("Replay experience"): the score, held under the replay's dip through the wake-up, comes back up
     * as he's woken again, with the wake's relay and chirp; it was never stopped. Quiet with the sound off.
     */
    rewake() {
      const t = now();
      rampTo(dip.gain, 1, REWAKE_UP, t);
      if (!state.woken || !state.on) return;
      void resume();
      shots.get(RELAY)?.(ctx, fx, t + 0.02);
      shots.get("wake")?.(ctx, fx, t + 0.22);
    },

    /** The tab was hidden or shown. The fades are native ramps, since animation frames stop in a hidden tab. */
    setHidden(h: boolean) {
      hidden = h;
      clearTimeout(hideTimer);
      if (state.woken && state.on) {
        if (h) {
          rampTo(hide.gain, 0, HIDE_FADE, now());
          hideTimer = setTimeout(() => hidden && void ctx.suspend().then(() => set({})), HIDE_FADE * 1000 + 50);
        } else {
          // even a running context: the hide's suspend may still be under way
          void resume();
          push(0.1);
          rampTo(hide.gain, 1, SHOW_FADE, now());
        }
      }
      set({});
    },

    /** Called every half second: a context that says it's running while its clock stands still is stuck. */
    checkClock(wall: number) {
      if (ctx.state !== "running" || hidden) {
        // a clock stopped by a suspend says nothing about the clock once it's back
        lastClock = null;
        frozen = false;
      } else {
        const audio = now();
        frozen = !!lastClock && wall - lastClock.wall > 400 && audio - lastClock.audio < 0.02;
        lastClock = { wall, audio };
      }
      set({});
    },

    /** The restore control. */
    restore() {
      frozen = false;
      lastClock = null;
      const p = ctx.state === "running" ? ctx.suspend().then(() => ctx.resume()) : ctx.resume();
      void p.then(() => set({}), () => set({}));
    },

    get state() {
      return state;
    },
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => void listeners.delete(fn);
    },

    /**
     * A one-shot: a scene change, an emote or a UI sound, at `at` (now), `level`, from `from` seconds into it. Nothing
     * plays while the sound is off: in Chrome, a source started after a gesture resumes a suspended context.
     */
    play(name: string, at = now() + 0.01, level = 1, from = 0) {
      if (!state.on) return undefined;
      const playing = shots.get(name)?.(ctx, fx, at, level * shotTrim(name), from);
      return playing ? { stop: () => playing.stop(now()) } : undefined;
    },
    /** The mixer's trims: read them, or change some; the score follows at once. */
    levels: {
      get: (): Levels => structuredClone(lv),
      set(next: Partial<Levels>) {
        if (next.layers) Object.assign(lv.layers, next.layers);
        if (next.parts) Object.assign(lv.parts, next.parts);
        if (next.shots) Object.assign(lv.shots, next.shots);
        if (next.duck) Object.assign(lv.duck, next.duck);
        if (next.voice !== undefined) voiceBus.gain.setTargetAtTime((lv.voice = next.voice), now(), 0.05);
        if (next.instrument !== undefined) instrumentBus.gain.setTargetAtTime((lv.instrument = next.instrument), now(), 0.05);
        push(0.1);
      },
    },
    /** Loads recorded sounds the page asks for by name (the instrument's notes); resolves once they're in. While the
     * sound is off it waits for it to come on: a muted visitor downloads nothing. */
    prepare(names: string[]) {
      const whenOn = state.on
        ? Promise.resolve()
        : new Promise<void>((ok) => {
            const check = () => state.on && (listeners.delete(check), ok());
            listeners.add(check);
          });
      return whenOn.then(() => Promise.all(names.map(loadShot))).then(() => {});
    },
    define(name: string, shot: OneShot) {
      shots.set(name, shot);
    },

    /** The instrument: `note` in MIDI, `intensity` 0–1. */
    instrument: {
      play(note: number, intensity: number, strong = false) {
        if (!state.on) return false;
        pending = { intensity, strong };
        return pool.play(note, now());
      },
      /** a synthesised voice or a recorded sample */
      use(maker: VoiceMaker) {
        voiceMaker = maker;
      },
      get sounding() {
        return pool.sounding;
      },
    },

    /** Where Tycho's chirps go: his suit radio, the master for the Quindar tones, and the designed chirp grains. */
    voice: { ctx, radio: radio as AudioNode, master: voiceBus as AudioNode, grain: (name: string) => shotBuffers.get(name) },

    /** The output's waveform right now, written into `out` (for the sound toggle's trace). */
    trace(out: Float32Array<ArrayBuffer>) {
      meter.getFloatTimeDomainData(out);
    },
    stats() {
      const bytes = (b: AudioBuffer) => b.length * b.numberOfChannels * 4;
      let resident = 0;
      for (const b of buffers.values()) resident += bytes(b);
      for (const b of shotBuffers.values()) resident += bytes(b);
      return {
        ...stats, format: `${fmt} ${ch}`, fallback, loaded: [...buffers.keys()], shots: [...shotBuffers.keys()], playing: [...playing.keys()], grid,
        sent: { ...sent }, resident,
      };
    },
    /** for tests and development */
    nodes: { score, bright, duck, dip, post, hide, toggle, fx, voice: voiceBus, instrument: instrumentBus, limiter, out: ceiling } as Record<string, AudioNode>,
  };
}

export type Sound = ReturnType<typeof createSound>;
