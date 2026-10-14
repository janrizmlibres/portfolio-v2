/**
 * The live sounds, as stand-ins until the real score's timbres are made: the wake's chirp, a chime, the instrument's
 * plucked voice (or any recorded sample) and Tycho's suit radio. Each is a few nodes on the engine's one context.
 */
import { rampTo } from "./ramp";

/** A sound playing that can be cut short: `stop` fades it out from `at`. */
export type Playing = { stop: (at: number) => void };
/** A one-shot played at `at`, at `level`, from `from` seconds into it (a recorded one; a synthesised one ignores it). */
export type OneShot = (ctx: BaseAudioContext, dest: AudioNode, at: number, level?: number, from?: number) => Playing | void;
/** One sounding note of the instrument: its envelope (for the cut) and how to stop it. */
export type Voice = { env: GainNode; stop: (at: number) => void; onEnded: (fn: () => void) => void };
export type VoiceMaker = (ctx: BaseAudioContext, dest: AudioNode, note: number, intensity: number, strong: boolean, at: number) => Voice;

export const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12);

const gainOf = (ctx: BaseAudioContext, v: number, dest?: AudioNode) => {
  const g = ctx.createGain();
  g.gain.value = v;
  if (dest) g.connect(dest);
  return g;
};
const filterOf = (ctx: BaseAudioContext, type: BiquadFilterType, f: number, q: number, dest?: AudioNode) => {
  const n = ctx.createBiquadFilter();
  n.type = type;
  n.frequency.value = f;
  n.Q.value = q;
  if (dest) n.connect(dest);
  return n;
};
/** Lets a finished node go, so a long visit doesn't pile them up. */
const release = (src: AudioScheduledSourceNode, ...nodes: AudioNode[]) => {
  src.onended = () => {
    src.disconnect();
    for (const n of nodes) n.disconnect();
  };
};

/** Tycho's waking chirp: two quick rising glides. */
export const wakeChirp: OneShot = (ctx, dest, t) => {
  for (const [at, f0, f1, d] of [
    [0, 600, 1500, 0.11],
    [0.15, 900, 2000, 0.09],
  ] as const) {
    const g = gainOf(ctx, 0, dest);
    g.gain.setValueAtTime(0, t + at);
    g.gain.linearRampToValueAtTime(0.22, t + at + 0.01);
    g.gain.setTargetAtTime(0, t + at + d * 0.6, 0.04);
    for (const type of ["sine", "triangle"] as const) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f0, t + at);
      o.frequency.exponentialRampToValueAtTime(f1, t + at + d);
      const level = gainOf(ctx, type === "sine" ? 1 : 0.3, g);
      o.connect(level);
      o.start(t + at);
      o.stop(t + at + 0.5);
      // the glide's envelope goes with its last partial
      release(o, level, ...(type === "triangle" ? [g] : []));
    }
  }
};

/** A soft two-note chime. */
export const chime: OneShot = (ctx, dest, t) => {
  [86, 91].forEach((m, k) => {
    const at = t + k * 0.11;
    const g = gainOf(ctx, 0, dest);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(0.09, at + 0.006);
    g.gain.setTargetAtTime(0, at + 0.006, 0.35);
    const o = ctx.createOscillator();
    o.frequency.value = mtof(m);
    o.connect(g);
    o.start(at);
    o.stop(at + 2);
    release(o, g);
  });
};

/** A recorded one-shot. */
export const sampleShot =
  (buffer: AudioBuffer, level = 1): OneShot =>
  (ctx, dest, at, scale = 1, from = 0) => {
    const g = gainOf(ctx, level * scale, dest);
    const s = ctx.createBufferSource();
    s.buffer = buffer;
    s.connect(g);
    s.start(at, from);
    release(s, g);
    return {
      // cut short when the film leaves the moment it belongs to
      stop(when) {
        rampTo(g.gain, 0, CUT, when);
        try {
          s.stop(when + CUT);
        } catch {}
      },
    };
  };
/** How fast a one-shot cut short fades out. */
const CUT = 0.25;

/**
 * The instrument's stand-in voice, a plucked string (after Trionn's footer): three sine partials and a noise click,
 * through a band-limited body and a short echo. The chain the voices share is built once, here.
 */
export function pluckVoice(ctx: BaseAudioContext, dest: AudioNode): VoiceMaker {
  const input = gainOf(ctx, 1);
  const hp = filterOf(ctx, "highpass", 120, 0.7);
  const lp = filterOf(ctx, "lowpass", 2400, 0.7);
  const bell = filterOf(ctx, "peaking", 700, 1);
  bell.gain.value = 1.2;
  input.connect(hp).connect(lp).connect(bell).connect(dest);
  const d = ctx.createDelay(1);
  d.delayTime.value = 0.14;
  const dlp = filterOf(ctx, "lowpass", 1600, 0.5);
  const fb = gainOf(ctx, 0.38);
  bell.connect(d).connect(dlp).connect(fb).connect(d);
  dlp.connect(gainOf(ctx, 0.5, dest));
  const click = ctx.createBuffer(1, Math.round(0.1 * ctx.sampleRate), ctx.sampleRate);
  const c = click.getChannelData(0);
  let seed = 5;
  for (let i = 0; i < c.length; i++) c[i] = (((seed = (Math.imul(seed, 1103515245) + 12345) | 0) >>> 0) / 2 ** 32) * 2 - 1;

  return (ctx, _dest, note, intensity, strong, now) => {
    const f = mtof(note) * (strong ? 1.01 : 1);
    const peak = (0.015 + 0.07 * intensity + (strong ? 0.12 : 0)) * 2.5;
    const env = gainOf(ctx, 0, input);
    env.gain.setValueAtTime(0, now);
    env.gain.setTargetAtTime(peak, now, 0.04);
    env.gain.setTargetAtTime(peak * 0.82, now + 0.12, 0.08);
    env.gain.setTargetAtTime(0, now + 0.34, 0.7);
    const srcs: AudioScheduledSourceNode[] = [];
    const parts: AudioNode[] = [env];
    for (const [h, v] of [
      [1, 1],
      [2, 0.1],
      [3, 0.03],
    ] as const) {
      const o = ctx.createOscillator();
      o.frequency.value = f * h;
      const hg = gainOf(ctx, v, env);
      o.connect(hg);
      o.start(now);
      o.stop(now + 3.4);
      srcs.push(o);
      parts.push(hg);
    }
    const n = ctx.createBufferSource();
    n.buffer = click;
    const nl = gainOf(ctx, peak * 0.6, env);
    const nlp = filterOf(ctx, "lowpass", 1800, 0.7, nl);
    n.connect(nlp);
    n.start(now);
    srcs.push(n);
    parts.push(nl, nlp);
    const ended: Array<() => void> = [];
    srcs[0]!.onended = () => {
      for (const s of srcs) s.disconnect();
      for (const p of parts) p.disconnect();
      ended.forEach((fn) => fn());
    };
    return {
      env,
      stop: (at) => srcs.forEach((s) => s.stop(at)),
      onEnded: (fn) => void ended.push(fn),
    };
  };
}

/** A recorded note played as the instrument's voice: pitched from `root` (the note it was recorded at). */
export function sampleVoice(buffer: AudioBuffer, root: number): VoiceMaker {
  return (ctx, dest, note, intensity, strong, now) => {
    const env = gainOf(ctx, 0.4 + 0.6 * intensity + (strong ? 0.2 : 0), dest);
    const s = ctx.createBufferSource();
    s.buffer = buffer;
    s.playbackRate.value = 2 ** ((note - root) / 12);
    s.connect(env);
    s.start(now);
    const ended: Array<() => void> = [];
    s.onended = () => {
      s.disconnect();
      env.disconnect();
      ended.forEach((fn) => fn());
    };
    return { env, stop: (at) => s.stop(at), onEnded: (fn) => void ended.push(fn) };
  };
}

/**
 * Tycho's suit radio, which his chirps go through: a comm band (highpass 340 Hz, lowpass 3400 Hz), a tanh drive, a
 * +3 dB presence lift at 1.9 kHz and a small room. Returns its input.
 */
export function suitRadio(ctx: BaseAudioContext, dest: AudioNode) {
  const input = filterOf(ctx, "highpass", 340, 0.7);
  const lp = filterOf(ctx, "lowpass", 3400, 0.7);
  const drive = ctx.createWaveShaper();
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) curve[i] = Math.tanh(2 * ((i / 1023) * 2 - 1)) / Math.tanh(2);
  drive.curve = curve;
  const presence = filterOf(ctx, "peaking", 1900, 1);
  presence.gain.value = 3;
  const out = gainOf(ctx, 0.5, dest);
  input.connect(lp).connect(drive).connect(presence).connect(out);
  // a small room, so he isn't bone dry
  const ir = ctx.createBuffer(2, Math.floor(ctx.sampleRate * 0.4), ctx.sampleRate);
  let seed = 9;
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < d.length; i++) d[i] = ((((seed = (Math.imul(seed, 1103515245) + 12345) | 0) >>> 0) / 2 ** 32) * 2 - 1) * Math.pow(1 - i / d.length, 3.5);
  }
  const room = ctx.createConvolver();
  room.buffer = ir;
  out.connect(room).connect(gainOf(ctx, 0.14, dest));
  return input;
}

/**
 * The instrument's recorded voice: a sample per note of its scale (`bank`, by MIDI note), each played at its own
 * speed; a note without one is the nearest, repitched.
 */
export function noteBankVoice(bank: Map<number, AudioBuffer>): VoiceMaker {
  const notes = [...bank.keys()];
  return (ctx, dest, note, intensity, strong, now) => {
    const root = notes.reduce((a, b) => (Math.abs(b - note) < Math.abs(a - note) ? b : a));
    return sampleVoice(bank.get(root)!, root)(ctx, dest, note, intensity, strong, now);
  };
}
