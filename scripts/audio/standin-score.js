// The stand-in score, written as code: a 24 s phrase at 80 BPM in six layers (pad, bass, melody, pulse, a drone and
// a thinking layer), through one generated room. It's only a stand-in until the real score is made, and it sounds
// like one: raw oscillators and filtered noise.
//
// A score written as code is a browser module the stem pipeline renders offline (`pnpm audio:export`). It exports
// LOOP (seconds), LAYERS, and renderStem(name, sampleRate), which returns one stem's [left, right] channels, exactly
// one loop long. Sustained oscillators complete whole cycles per loop, so every stem wraps without a click.

export const BEAT = 60 / 80; // 80 BPM
export const CHORD = 8 * BEAT; // 6 s
export const LOOP = 4 * CHORD; // the whole score is one 24 s phrase
export const LAYERS = ["pad", "bass", "melody", "pulse", "drone", "thinking"];

// each layer's level, and its send to the room
const LEVEL = { pad: 0.055, bass: 0.2, melody: 0.15, pulse: 0.13, drone: 0.07, thinking: 0.1 };
const SEND = { pad: 0.45, bass: 0.05, melody: 0.5, pulse: 0.3, drone: 0.15, thinking: 0.6 };

const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
// a sustained oscillator completes whole cycles per loop
const snap = (f) => Math.round(f * LOOP) / LOOP;

const CHORDS = [
  { root: 40, pad: [52, 55, 59, 62, 66], arp: [64, 67, 71, 74] }, // Em9
  { root: 36, pad: [52, 55, 59, 62], arp: [60, 64, 67, 71] }, // Cmaj9
  { root: 43, pad: [50, 59, 62, 64, 69], arp: [62, 67, 71, 74] }, // G6/9
  { root: 38, pad: [57, 62, 64, 66], arp: [62, 66, 69, 74] }, // Dadd9
];
const ARP = [0, 1, 2, 3, 2, 1, 0, 2];
// [beat in the phrase, midi note], G major pentatonic, with a breath at the end of the phrase
const MELODY = [[2, 71], [4, 74], [6, 76], [10, 74], [12, 71], [13, 69], [18, 67], [20, 69], [22, 71], [26, 74], [28, 69]];
const SPARKS = [79, 81, 83, 86, 88, 91];

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function noiseBuffer(ctx, seconds, seed) {
  const len = Math.round(seconds * ctx.sampleRate);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  const r = rng(seed);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = r() * 2 - 1;
  }
  return buf;
}

// a generated room: 20 ms pre-delay, then noise that darkens as it decays (−60 dB at about 2.6 s)
function impulse(ctx, seconds = 2.6, seed = 7) {
  const sr = ctx.sampleRate, len = Math.round(seconds * sr), pre = Math.round(0.02 * sr);
  const buf = ctx.createBuffer(2, len, sr);
  const r = rng(seed);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let y = 0;
    for (let i = pre; i < len; i++) {
      const t = (i - pre) / sr;
      y += (0.85 * Math.exp(-t / 0.5) + 0.08) * (r() * 2 - 1 - y);
      d[i] = y * Math.exp(-t / 0.38);
    }
  }
  return buf;
}

const gainNode = (ctx, v, dest) => {
  const g = ctx.createGain();
  g.gain.value = v;
  if (dest) g.connect(dest);
  return g;
};
const filterNode = (ctx, type, f, q, dest) => {
  const n = ctx.createBiquadFilter();
  n.type = type;
  n.frequency.value = f;
  n.Q.value = q;
  if (dest) n.connect(dest);
  return n;
};

// One layer: its voices and processing, into `out`. schedule(cycleStart) adds one cycle of notes; start(at) starts
// the parts that run continuously.
function makeLayer(ctx, name, out) {
  const layer = { schedule() {}, start() {} };
  const osc = (type, f, dest, at, end, detune = 0) => {
    const n = ctx.createOscillator();
    n.type = type;
    n.frequency.value = f;
    n.detune.value = detune;
    n.connect(dest);
    n.start(at);
    if (end !== undefined) n.stop(end);
    return n;
  };
  const bus = gainNode(ctx, LEVEL[name], out);

  switch (name) {
    case "pad": {
      const lp = filterNode(ctx, "lowpass", 1300, 0.7, bus);
      layer.start = (at) => osc("sine", 1 / 12, gainNode(ctx, 500, lp.frequency), at);
      layer.schedule = (cs) => {
        CHORDS.forEach((ch, k) => {
          const s = cs + k * CHORD, e = s + CHORD;
          for (const m of ch.pad) {
            const g = gainNode(ctx, 0, lp);
            g.gain.setValueAtTime(0, s);
            g.gain.linearRampToValueAtTime(1, s + 2);
            g.gain.setTargetAtTime(0, e, 1);
            for (const [cents, pan] of [[-7, -0.5], [7, 0.5]]) {
              const p = ctx.createStereoPanner();
              p.pan.value = pan;
              p.connect(g);
              osc("sawtooth", mtof(m), p, s, e + 5.5, cents);
            }
          }
        });
      };
      break;
    }
    case "bass": {
      const lp = filterNode(ctx, "lowpass", 300, 1, bus);
      layer.schedule = (cs) => {
        CHORDS.forEach((ch, k) => {
          for (let b = 0; b < 8; b++) {
            const t = cs + k * CHORD + b * BEAT;
            const acc = b % 4 === 0 ? 1 : 0.6;
            const g = gainNode(ctx, 0, lp);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(acc, t + 0.02);
            g.gain.setTargetAtTime(acc * 0.3, t + 0.02, 0.12);
            g.gain.setTargetAtTime(0, t + 0.45, 0.06);
            const f = mtof(ch.root);
            osc("sine", f, g, t, t + 0.9);
            osc("sawtooth", f, gainNode(ctx, 0.35, g), t, t + 0.9);
          }
        });
      };
      break;
    }
    case "melody": {
      const dry = gainNode(ctx, 1, bus);
      const d = ctx.createDelay(1);
      d.delayTime.value = BEAT * 0.75; // a dotted eighth
      const dlp = filterNode(ctx, "lowpass", 2800, 0.5);
      const fb = gainNode(ctx, 0.32);
      dry.connect(d);
      d.connect(dlp);
      dlp.connect(fb);
      fb.connect(d);
      dlp.connect(gainNode(ctx, 0.35, bus));
      layer.schedule = (cs) => {
        for (const [beat, m] of MELODY) {
          const t = cs + beat * BEAT;
          const g = gainNode(ctx, 0, dry);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(1, t + 0.008);
          g.gain.setTargetAtTime(0, t + 0.008, 0.7);
          const f = mtof(m);
          osc("sine", f, g, t, t + 4);
          for (const [h, v] of [[2, 0.18], [3, 0.05]]) osc("sine", f * h, gainNode(ctx, v, g), t, t + 4);
        }
      };
      break;
    }
    case "pulse": {
      const lp = filterNode(ctx, "lowpass", 2600, 0.7, bus);
      layer.schedule = (cs) => {
        CHORDS.forEach((ch, k) => {
          for (let i = 0; i < 16; i++) {
            const t = cs + k * CHORD + i * (BEAT / 2);
            const g = gainNode(ctx, 0, lp);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(i % 4 === 0 ? 1 : 0.7, t + 0.005);
            g.gain.setTargetAtTime(0, t + 0.005, 0.11);
            const f = mtof(ch.arp[ARP[i % 8]]);
            osc("triangle", f, g, t, t + 0.8);
            osc("square", f, gainNode(ctx, 0.15, g), t, t + 0.8);
          }
        });
      };
      break;
    }
    case "drone": {
      // its pitch follows scroll speed on the page, through its stem's playback rate
      const lp = filterNode(ctx, "lowpass", 260, 6, bus);
      layer.start = (at) => {
        for (const [type, m, v] of [["sawtooth", 28, 1], ["sine", 35, 0.8], ["sawtooth", 40, 0.4]]) osc(type, snap(mtof(m)), gainNode(ctx, v, lp), at);
        osc("sine", 1 / 6, gainNode(ctx, 80, lp.frequency), at);
        const src = ctx.createBufferSource();
        src.buffer = noiseBuffer(ctx, 4, 23);
        src.loop = true;
        src.connect(filterNode(ctx, "lowpass", 500, 0.7, gainNode(ctx, 0.5, bus)));
        src.start(at);
      };
      break;
    }
    case "thinking": {
      const pans = [-0.55, 0.55].map((v) => {
        const p = ctx.createStereoPanner();
        p.pan.value = v;
        p.connect(bus);
        return p;
      });
      layer.schedule = (cs) => {
        const r = rng(31); // the same sparks every cycle
        for (let i = 0; i < 128; i++) {
          const t = cs + i * (BEAT / 4);
          const on = r() < 0.5, m = SPARKS[Math.floor(r() * SPARKS.length)], v = 0.4 + 0.6 * r(), side = r() < 0.5 ? 0 : 1;
          if (!on) continue;
          const g = gainNode(ctx, 0, pans[side]);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(v, t + 0.004);
          g.gain.setTargetAtTime(0, t + 0.004, 0.09);
          osc("sine", mtof(m), g, t, t + 0.6);
        }
      };
      break;
    }
  }
  return layer;
}

// Renders one stem: two cycles from silence, keeping the second, which already holds the first cycle's tails, so
// looped it wraps as the score's steady state does.
export async function renderStem(name, sampleRate) {
  const ctx = new OfflineAudioContext(2, Math.round(2 * LOOP * sampleRate), sampleRate);
  const out = gainNode(ctx, 1, ctx.destination);
  const conv = ctx.createConvolver();
  conv.buffer = impulse(ctx);
  conv.connect(out);
  const mix = gainNode(ctx, 1, out);
  mix.connect(gainNode(ctx, SEND[name], conv));
  const layer = makeLayer(ctx, name, mix);
  layer.start(0);
  layer.schedule(0);
  layer.schedule(LOOP);
  const buf = await ctx.startRendering();
  const n = Math.round(LOOP * sampleRate);
  return [0, 1].map((c) => buf.getChannelData(c).slice(n, 2 * n));
}
