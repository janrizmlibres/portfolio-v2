/**
 * A stand-in AudioContext for tests: it records the graph (who connects to whom) and every automation event, and
 * lets a test move the audio clock, make a context refuse to resume, or make a format fail to decode. Only what the
 * sound engine uses is here.
 */
export type Event = [string, ...number[]];

export class FakeParam {
  events: Event[] = [];
  constructor(public value = 0) {}
  setValueAtTime(v: number, t: number) {
    this.events.push(["set", v, t]);
    this.value = v;
  }
  linearRampToValueAtTime(v: number, t: number) {
    this.events.push(["ramp", v, t]);
  }
  exponentialRampToValueAtTime(v: number, t: number) {
    this.events.push(["exp", v, t]);
  }
  setTargetAtTime(v: number, t: number, tau: number) {
    this.events.push(["target", v, t, tau]);
  }
  cancelAndHoldAtTime(t: number) {
    this.events.push(["hold", t]);
  }
  cancelScheduledValues(t: number) {
    this.events.push(["cancel", t]);
  }
}

export class FakeNode {
  outs = new Set<FakeNode | FakeParam>();
  started: number[] | null = null;
  stopped: number | null = null;
  onended: (() => void) | null = null;
  [k: string]: unknown;
  constructor(
    public kind: string,
    params: string[] = [],
  ) {
    for (const p of params) this[p] = new FakeParam(p === "gain" || p === "playbackRate" ? 1 : 0);
  }
  connect<T extends FakeNode | FakeParam>(n: T): T {
    this.outs.add(n);
    return n;
  }
  disconnect(n?: FakeNode | FakeParam) {
    if (n) this.outs.delete(n);
    else this.outs.clear();
  }
  start(at = 0, offset = 0) {
    this.started = [at, offset];
  }
  stop(at = 0) {
    this.stopped = at;
  }
  getFloatTimeDomainData() {}
}

export type FakeBuffer = { url: string; duration: number; length: number; numberOfChannels: number; sampleRate: number; getChannelData: (c: number) => Float32Array };

export class FakeContext {
  currentTime = 0;
  sampleRate = 48000;
  state: "suspended" | "running" | "closed" = "suspended";
  destination = new FakeNode("destination");
  created: FakeNode[] = [];
  decoded: string[] = [];
  /** set to make resume() leave the context suspended */
  refuseResume = false;
  /** set to make a file fail to decode */
  failDecode: (url: string) => boolean = () => false;
  /** how long each decoded file is, in seconds */
  durationOf: (url: string) => number = () => 24;
  resumes = 0;
  suspends = 0;

  private make(kind: string, params: string[] = []) {
    const n = new FakeNode(kind, params);
    this.created.push(n);
    return n;
  }
  createGain() {
    return this.make("gain", ["gain"]);
  }
  createBiquadFilter() {
    const n = this.make("biquad", ["frequency", "Q", "gain", "detune"]);
    n.type = "lowpass";
    return n;
  }
  createDynamicsCompressor() {
    return this.make("compressor", ["threshold", "knee", "ratio", "attack", "release"]);
  }
  createOscillator() {
    return this.make("oscillator", ["frequency", "detune"]);
  }
  createBufferSource() {
    return this.make("source", ["playbackRate", "detune"]);
  }
  createConvolver() {
    return this.make("convolver");
  }
  createWaveShaper() {
    return this.make("shaper");
  }
  createAnalyser() {
    const n = this.make("analyser");
    n.fftSize = 2048;
    return n;
  }
  createDelay() {
    return this.make("delay", ["delayTime"]);
  }
  createStereoPanner() {
    return this.make("panner", ["pan"]);
  }
  createBuffer(channels: number, length: number, sampleRate: number) {
    const data = Array.from({ length: channels }, () => new Float32Array(length));
    return { numberOfChannels: channels, length, sampleRate, duration: length / sampleRate, getChannelData: (c: number) => data[c]! };
  }
  async decodeAudioData(bytes: ArrayBuffer): Promise<FakeBuffer> {
    const url = new TextDecoder().decode(bytes);
    if (this.failDecode(url)) throw new DOMException("Unable to decode audio data", "EncodingError");
    this.decoded.push(url);
    const channels = url.includes(".mono.") ? 1 : 2;
    const duration = this.durationOf(url);
    const length = Math.round(duration * this.sampleRate);
    return { url, duration, length, numberOfChannels: channels, sampleRate: this.sampleRate, getChannelData: () => new Float32Array(0) };
  }
  async resume() {
    this.resumes++;
    if (!this.refuseResume) this.state = "running";
  }
  async suspend() {
    this.suspends++;
    this.state = "suspended";
  }

  /** Every route from `from` to the destination, as the nodes along it. */
  routes(from: FakeNode): FakeNode[][] {
    const out: FakeNode[][] = [];
    const walk = (n: FakeNode, path: FakeNode[]) => {
      if (n === this.destination) return void out.push(path);
      for (const o of n.outs) if (o instanceof FakeNode && !path.includes(o)) walk(o, [...path, o]);
    };
    walk(from, [from]);
    return out;
  }
}

/** Fetches a URL as bytes holding the URL itself, so the fake context can tell which file it decodes. */
export function fakeFetch() {
  const urls: string[] = [];
  const fetchBytes = async (url: string) => {
    urls.push(url);
    return new TextEncoder().encode(url).buffer as ArrayBuffer;
  };
  return { urls, fetchBytes };
}
