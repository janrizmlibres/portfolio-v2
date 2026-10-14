/**
 * The stem pipeline's checks and names: every pulsed stem is exactly the loop's length, every stem wraps without a click, and
 * every file it writes is named by its content's hash, so `/audio/` can be cached for a year.
 */
import { createHash } from "node:crypto";

/** The largest jump allowed at the wrap, against the stem's average step between samples. */
export const MAX_SEAM = 4;

/** Checks one stem's channels: their length, and the jump from the last sample back to the first. */
export function checkLoop(channels: Float32Array[], frames: number): { ok: boolean; seam: number; why?: string } {
  let seam = 0;
  for (const x of channels) {
    if (x.length !== frames) return { ok: false, seam: NaN, why: `${x.length} frames, not the loop's ${frames}` };
    let step = 0;
    for (let i = 1; i < x.length; i++) step += Math.abs(x[i]! - x[i - 1]!);
    const jump = Math.abs(x[0]! - x[x.length - 1]!);
    const avg = step / (x.length - 1);
    seam = Math.max(seam, jump === 0 ? 0 : jump / (avg || 1e-12));
  }
  return seam <= MAX_SEAM ? { ok: true, seam } : { ok: false, seam, why: `the seam jumps ${seam.toFixed(1)}× an average step` };
}

/**
 * How long each stem's loop must be. The pulsed stems share one loop, the first pulsed stem's length, so one exported
 * a bar short fails `checkLoop`. An unpulsed stem named in `ownLength` loops at its own length, so the bed never lines
 * up with the pulse the same way twice. With no pulsed stem, the loop is the longest.
 */
export function loopFrames(stems: { name: string; channels: Float32Array[] }[], ownLength: readonly string[]) {
  const own = new Set(ownLength);
  const len = (s: (typeof stems)[number]) => s.channels[0]!.length;
  const pulsed = stems.find((s) => !own.has(s.name));
  const loop = pulsed ? len(pulsed) : Math.max(...stems.map(len));
  return { loop, frames: Object.fromEntries(stems.map((s) => [s.name, own.has(s.name) ? len(s) : loop])) as Record<string, number> };
}

/** `pad.3f2a1b9c0d.webm`, `pad.mono.3f2a1b9c0d.mp3`. */
export function hashedName(stem: string, ch: "stereo" | "mono", ext: string, bytes: Buffer) {
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 10);
  return `${stem}${ch === "mono" ? ".mono" : ""}.${hash}.${ext}`;
}

/**
 * The audio files in the folder that the new manifest no longer names. Names compare without case: on a disk that
 * doesn't tell case apart, a file rewritten under a new case keeps its old spelling, and must not be swept away.
 */
export function stale(files: string[], keep: string[]) {
  const k = new Set(keep.map((f) => f.toLowerCase()));
  return files.filter((f) => /\.[0-9a-f]{10}\.(webm|mp3)$/.test(f) && !k.has(f.toLowerCase()));
}

type ShotEntry = { files: Record<string, Record<string, { file: string }>> };

/**
 * A one-shot manifest with `added`'s shots put in (each replacing any of its name, in its place) and the rest kept as
 * they were, and the files the result names, so the export keeps exactly those: how one shot is added or redone
 * without rendering the others again.
 */
export function mergeShots<S extends ShotEntry>(before: Record<string, S>, added: Record<string, S>) {
  const shots: Record<string, S> = { ...before, ...added };
  const keep = Object.values(shots).flatMap((s) => Object.values(s.files).flatMap((f) => Object.values(f).map((x) => x.file)));
  return { shots, keep };
}

const BLOCKS = 64;

/**
 * A coarse picture of a stem's audio: per block of each channel, its RMS and its average step between samples (which
 * follows pitch and brightness). A score written as code doesn't render bit for bit the same twice in Chromium, so
 * the export compares these instead of the bytes, and keeps the files (and their names) when nothing audible changed.
 */
export function fingerprint(channels: Float32Array[]): number[] {
  const out: number[] = [];
  for (const x of channels) {
    const size = Math.floor(x.length / BLOCKS);
    for (let b = 0; b < BLOCKS; b++) {
      let sum = 0, step = 0;
      for (let i = b * size; i < (b + 1) * size; i++) {
        sum += x[i]! * x[i]!;
        if (i > 0) step += Math.abs(x[i]! - x[i - 1]!);
      }
      out.push(+Math.sqrt(sum / size).toPrecision(6), +(step / size).toPrecision(6));
    }
  }
  return out;
}

/** Whether two fingerprints are the same audio, to within a thousandth of each value. */
export function sameAudio(a: number[] | undefined, b: number[]) {
  return !!a && a.length === b.length && a.every((v, i) => Math.abs(v - b[i]!) <= 1e-3 * Math.max(Math.abs(v), Math.abs(b[i]!)) + 1e-7);
}

/** Below this a one-shot's tail is silence. */
const FLOOR_DB = -60;
/** The fade a trimmed one-shot ends on, in seconds, so it never ends on a cut. */
const TRIM_FADE = 0.02;

/**
 * A one-shot cut after the last sample (of either channel) above −60 dBFS, plus a short fade: decoded audio costs the
 * same for silence as for sound, so a rendered tail of near-silence is memory held for nothing.
 */
export function trimTail(channels: Float32Array[], sampleRate: number): Float32Array[] {
  const floor = 10 ** (FLOOR_DB / 20), n = channels[0]!.length;
  let last = 0;
  for (const c of channels) for (let i = n - 1; i > last; i--) if (Math.abs(c[i]!) > floor) { last = i; break; }
  const fade = Math.round(TRIM_FADE * sampleRate);
  const end = Math.min(n, last + 1 + fade);
  if (end >= n) return channels;
  return channels.map((c) => {
    const out = c.slice(0, end);
    for (let i = 0; i < fade && end - 1 - i >= 0; i++) out[end - 1 - i]! *= i / fade;
    return out;
  });
}
