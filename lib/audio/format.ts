/**
 * Which files the stems come from: Opus/WebM where the browser says it can play it, MP3 otherwise, and MP3 again
 * when Opus/WebM won't decode after all. Phones get mono stems, at half the bytes and memory.
 */
export type Fmt = "webm" | "mp3";
export type Channels = "stereo" | "mono";

export function pickFormat(canPlay: (mime: string) => string, phone: boolean): { fmt: Fmt; ch: Channels } {
  return { fmt: canPlay('audio/webm; codecs="opus"') ? "webm" : "mp3", ch: phone ? "mono" : "stereo" };
}

/** Loads in `fmt`, and in MP3 if that fails to decode. */
export async function withFallback<T>(fmt: Fmt, load: (fmt: Fmt) => Promise<T>): Promise<{ value: T; fmt: Fmt }> {
  try {
    return { value: await load(fmt), fmt };
  } catch (e) {
    if (fmt === "mp3") throw e;
    return { value: await load("mp3"), fmt: "mp3" };
  }
}
