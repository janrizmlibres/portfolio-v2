/**
 * What the sound holds decoded, kept small: decoded audio is 32-bit floats at the context's rate, so a stereo second
 * is about 0.37 MB at 48 kHz, whatever the file's size.
 * - The instrument's notes are mono recordings, and the small sounds (Tycho's chirp grains and emotes, the UI ticks,
 *   the wake's relay, the toggle) are narrow, so they decode from their mono files on every tier.
 * - The scene changes keep their stereo on a desktop, but each is held only near its moment in the film: loaded a few
 *   screens before it and let go once the film is past (`heldScenes`).
 * Phones decode everything mono.
 */
import type { Channels } from "./format";

const SMALL = /^(inst-|chirp|emote-|ui-)|^(relay|toggle)$/;

/** Which file a one-shot decodes from. */
export const shotChannels = (name: string, phone: boolean): Channels => (phone || SMALL.test(name) ? "mono" : "stereo");

/** How far ahead of a scene change (in screens) its sound loads, and how long after its stretch it's kept. */
export const AHEAD = 3;
export const BEHIND = 0.5;

/** The scene changes' sounds to hold with the film at `t`: those whose moment is near, ahead or just behind. */
export function heldScenes(cues: Array<{ at: number; span: number; shot: string }>, t: number): string[] {
  const out = new Set<string>();
  for (const c of cues) if (t >= c.at - AHEAD && t <= c.at + c.span + BEHIND) out.add(c.shot);
  return [...out].sort();
}

type Seconds = Record<string, { seconds: number }>;

/**
 * The most the sound holds decoded at once, in bytes, at `rate` (48 kHz unless told): every stem of the score (the
 * thinking layer among them, as if Tycho were thinking), the one-shots held all along, the instrument's notes of both
 * voices, and the busiest stretch of scene changes. What ADR 0006's budget is checked against.
 */
export function peakDecoded({ stems, shots, cues, phone, rate = 48000 }: { stems: { stems: Seconds }; shots: Seconds; cues: Array<{ at: number; span: number; shot: string }>; phone: boolean; rate?: number }) {
  const bytes = (seconds: number, ch: number) => Math.round(seconds * rate) * ch * 4;
  const shot = (n: string) => bytes(shots[n]?.seconds ?? 0, shotChannels(n, phone) === "stereo" ? 2 : 1);
  const scened = new Set(cues.map((c) => c.shot));
  const sum = (names: string[], f: (n: string) => number) => names.reduce((a, n) => a + f(n), 0);
  const all = Object.keys(shots);
  const stemBytes = sum(Object.keys(stems.stems), (n) => bytes(stems.stems[n]!.seconds, phone ? 1 : 2));
  const thinking = stems.stems.thinking ? bytes(stems.stems.thinking.seconds, phone ? 1 : 2) : 0;
  const always = sum(all.filter((n) => !n.startsWith("inst-") && !scened.has(n)), shot);
  const notes = sum(all.filter((n) => n.startsWith("inst-")), shot);
  // the held set only grows where a sound's window opens, so the busiest stretch starts at one of those
  const scenes = Math.max(0, ...cues.map((c) => sum(heldScenes(cues, c.at - AHEAD), shot)));
  return { stems: stemBytes, thinking, always, notes, scenes, total: stemBytes + always + notes + scenes };
}
