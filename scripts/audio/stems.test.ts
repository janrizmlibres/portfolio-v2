import { describe, expect, it } from "vitest";
import { checkLoop, fingerprint, hashedName, loopFrames, mergeShots, sameAudio, stale, trimTail } from "./stems";

const sine = (n: number, cycles: number, phase = 0) => Float32Array.from({ length: n }, (_, i) => Math.sin(phase + (2 * Math.PI * cycles * i) / n));

describe("checkLoop: each stem must wrap without a click, and every stem must be the loop's length", () => {
  it("passes a loop whose wrap is no bigger than an ordinary step", () => {
    const l = sine(48000, 220);
    const r = checkLoop([l, l], 48000);
    expect(r.ok).toBe(true);
    expect(r.seam).toBeLessThan(2);
  });

  it("fails a loop that jumps at the wrap", () => {
    const l = sine(48000, 220.25); // ends a quarter cycle off: a jump from the peak to zero
    const r = checkLoop([l, l], 48000);
    expect(r.ok).toBe(false);
    expect(r.why).toMatch(/seam/);
  });

  it("fails a stem that isn't the loop's length", () => {
    const r = checkLoop([sine(47999, 220)], 48000);
    expect(r.ok).toBe(false);
    expect(r.why).toMatch(/47999/);
  });

  it("passes silence", () => {
    expect(checkLoop([new Float32Array(100)], 100).ok).toBe(true);
  });
});

describe("loopFrames: the pulsed stems share the loop's length, and an unpulsed stem may loop at its own", () => {
  const stem = (name: string, n: number) => ({ name, channels: [new Float32Array(n), new Float32Array(n)] });

  it("gives each pulsed stem the pulsed loop's length, and each own-length stem its own", () => {
    const got = loopFrames([stem("bed", 37), stem("pulse", 30), stem("keys", 30)], ["bed"]);
    expect(got).toEqual({ loop: 30, frames: { bed: 37, pulse: 30, keys: 30 } });
  });

  it("holds a pulsed stem of the wrong length to the loop, so checkLoop fails it", () => {
    const got = loopFrames([stem("pulse", 30), stem("keys", 29)], []);
    expect(got.frames.keys).toBe(30);
    expect(checkLoop(stem("keys", 29).channels, got.frames.keys!).ok).toBe(false);
  });

  it("takes the longest own-length stem as the loop when every stem runs at its own", () => {
    expect(loopFrames([stem("bed", 37), stem("drone", 12)], ["bed", "drone"]).loop).toBe(37);
  });
});

describe("hashedName: a file's name carries its content's hash, so it can be cached for a year", () => {
  it("names a file by stem, channels, hash and format", () => {
    const a = hashedName("pad", "stereo", "webm", Buffer.from("one"));
    expect(a).toMatch(/^pad\.[0-9a-f]{10}\.webm$/);
    expect(hashedName("pad", "mono", "mp3", Buffer.from("one"))).toMatch(/^pad\.mono\.[0-9a-f]{10}\.mp3$/);
  });

  it("changes the name when the content changes, and only then", () => {
    const a = hashedName("pad", "stereo", "webm", Buffer.from("one"));
    expect(hashedName("pad", "stereo", "webm", Buffer.from("one"))).toBe(a);
    expect(hashedName("pad", "stereo", "webm", Buffer.from("two"))).not.toBe(a);
  });
});

describe("stale: the old files an export leaves behind", () => {
  it("keeps a file named in the manifest under another case, since the disk may not tell case apart", () => {
    expect(stale(["emote-allgood.mono.a03b172bff.webm"], ["emote-allGood.mono.a03b172bff.webm"])).toEqual([]);
  });

  it("lists the audio files no longer in the manifest, and leaves anything else alone", () => {
    const keep = ["pad.0123456789.webm", "pad.mono.0123456789.mp3"];
    const on = ["pad.0123456789.webm", "pad.mono.0123456789.mp3", "pad.aaaaaaaaaa.webm", "bass.mono.bbbbbbbbbb.mp3", "README.md"];
    expect(stale(on, keep)).toEqual(["pad.aaaaaaaaaa.webm", "bass.mono.bbbbbbbbbb.mp3"]);
  });
});

describe("fingerprint: a re-export of the same audio keeps its files, so the cache isn't thrown away", () => {
  it("matches the same audio, and audio that differs only by render noise", () => {
    const l = sine(48000, 220);
    const noisy = l.map((x, i) => x + (i % 7 === 0 ? 1e-6 : -1e-6));
    expect(sameAudio(fingerprint([l, l]), fingerprint([l, l]))).toBe(true);
    expect(sameAudio(fingerprint([l, l]), fingerprint([noisy, noisy]))).toBe(true);
  });

  it("tells a real change apart: louder, or different notes", () => {
    const l = sine(48000, 220);
    expect(sameAudio(fingerprint([l, l]), fingerprint([l.map((x) => x * 1.1), l]))).toBe(false);
    const other = sine(48000, 330);
    const half = Float32Array.from(l, (x, i) => (i < 24000 ? x : other[i]!));
    expect(sameAudio(fingerprint([l, l]), fingerprint([half, l]))).toBe(false);
  });

  it("never matches a missing or differently sized fingerprint", () => {
    const l = sine(48000, 220);
    expect(sameAudio(undefined, fingerprint([l, l]))).toBe(false);
    expect(sameAudio(fingerprint([l, l]).slice(1), fingerprint([l, l]))).toBe(false);
  });
});

describe("trimTail: a one-shot ends where it falls silent, so its silence isn't held decoded", () => {
  const SR = 48000;
  /** a 1 s tone at full scale, then `rest` seconds of a tail at `db` dBFS */
  const shot = (rest: number, db: number) => {
    const n = SR * (1 + rest), x = new Float32Array(n);
    for (let i = 0; i < n; i++) x[i] = Math.sin((2 * Math.PI * 440 * i) / SR) * (i < SR ? 1 : 10 ** (db / 20));
    return x;
  };

  it("cuts after the last sample above −60 dBFS, keeping a short fade", () => {
    const l = shot(2, -70);
    const [a, b] = trimTail([l, l.slice()], SR);
    expect(a!.length).toBeGreaterThan(SR);
    expect(a!.length).toBeLessThan(SR + 0.05 * SR);
    expect(b!.length).toBe(a!.length);
    // it fades to nothing, never ends on a cut
    expect(Math.abs(a!.at(-1)!)).toBeLessThan(1e-3);
  });

  it("keeps a tail that's still audible", () => {
    const l = shot(2, -40);
    expect(trimTail([l, l], SR)[0]!.length).toBe(l.length);
  });

  it("listens to both channels", () => {
    const l = shot(2, -70), r = shot(2, -40);
    expect(trimTail([l, r], SR)[0]!.length).toBe(l.length);
  });
});

describe("mergeShots: one-shots added to the manifest, the rest kept as they were", () => {
  const entry = (name: string, hash: string) => ({ seconds: 1, files: { webm: { stereo: { file: `${name}.${hash}.webm`, bytes: 1 }, mono: { file: `${name}.mono.${hash}.webm`, bytes: 1 } } } });

  it("adds a new shot and keeps every other shot and its files", () => {
    const { shots, keep } = mergeShots({ dive: entry("dive", "aaaaaaaaaa") }, { blip: entry("blip", "bbbbbbbbbb") });
    expect(Object.keys(shots)).toEqual(["dive", "blip"]);
    expect(keep.sort()).toEqual(["blip.bbbbbbbbbb.webm", "blip.mono.bbbbbbbbbb.webm", "dive.aaaaaaaaaa.webm", "dive.mono.aaaaaaaaaa.webm"]);
  });

  it("replaces a shot of the same name, in its place, and lets its old files go", () => {
    const { shots, keep } = mergeShots({ dive: entry("dive", "aaaaaaaaaa"), dock: entry("dock", "cccccccccc") }, { dive: entry("dive", "dddddddddd") });
    expect(Object.keys(shots)).toEqual(["dive", "dock"]);
    expect(shots.dive!.files.webm.stereo.file).toBe("dive.dddddddddd.webm");
    expect(keep).not.toContain("dive.aaaaaaaaaa.webm");
  });
});
