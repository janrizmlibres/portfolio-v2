import { describe, expect, it, vi } from "vitest";
import { pickFormat, withFallback } from "./format";

describe("pickFormat: Opus/WebM where the browser says it can play it, MP3 elsewhere; mono on phones", () => {
  it("takes Opus/WebM when canPlayType answers maybe or probably", () => {
    expect(pickFormat(() => "maybe", false)).toEqual({ fmt: "webm", ch: "stereo" });
    expect(pickFormat(() => "probably", false)).toEqual({ fmt: "webm", ch: "stereo" });
  });

  it("asks about Opus in WebM specifically", () => {
    const canPlay = vi.fn(() => "");
    pickFormat(canPlay, false);
    expect(canPlay).toHaveBeenCalledWith('audio/webm; codecs="opus"');
  });

  it("takes MP3 when canPlayType answers no", () => {
    expect(pickFormat(() => "", false)).toEqual({ fmt: "mp3", ch: "stereo" });
  });

  it("takes mono stems on a phone", () => {
    expect(pickFormat(() => "maybe", true)).toEqual({ fmt: "webm", ch: "mono" });
    expect(pickFormat(() => "", true)).toEqual({ fmt: "mp3", ch: "mono" });
  });
});

describe("withFallback: when Opus won't decode, MP3", () => {
  it("returns the first format's result when it decodes", async () => {
    const load = vi.fn(async (fmt: string) => `${fmt} buffer`);
    await expect(withFallback("webm", load)).resolves.toEqual({ value: "webm buffer", fmt: "webm" });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("falls back to MP3 when Opus/WebM fails to decode", async () => {
    const load = vi.fn(async (fmt: string) => {
      if (fmt === "webm") throw new DOMException("bad data", "EncodingError");
      return "mp3 buffer";
    });
    await expect(withFallback("webm", load)).resolves.toEqual({ value: "mp3 buffer", fmt: "mp3" });
    expect(load.mock.calls.map((c) => c[0])).toEqual(["webm", "mp3"]);
  });

  it("gives up when MP3 fails too, and doesn't retry MP3 with itself", async () => {
    const load = vi.fn(async () => {
      throw new DOMException("bad data", "EncodingError");
    });
    await expect(withFallback("mp3", load)).rejects.toThrow("bad data");
    expect(load).toHaveBeenCalledTimes(1);
  });
});
