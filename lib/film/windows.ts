/**
 * Text tied to the scroll. A block writes in over its in-window and dissolves over its out-window, both in screens
 * of scroll. The rows (the title is row 0, then each line) share the in-window evenly, and each row's words write in
 * along it, left to right, over 80% of the row's share. On the way out each row leaves over half the out-window,
 * the rows staggered across its first half. Everything is a function of the scroll time alone, so it runs backwards
 * just as well.
 */
import { clamp01 } from "./smooth";

export type Span = readonly [number, number];

export type RowTime = { in: number; inSpan: number; out: number; outSpan: number };

/** A word's window: it fades in from `in` over `inD`, and out from `out` over `outD`. */
export type WordWindow = { in: number; inD: number; out: number; outD: number };

export type WordPhase = {
  /** 0..1, how far it has written in */
  ein: number;
  /** 0..1, how far it has dissolved */
  eout: number;
  opacity: number;
  /** 0..1, from the scene's tint to white */
  settle: number;
};

const fade = (span: number) => Math.max(0.05, Math.min(0.14, span));

export function rowTimes(rows: number, [a, z]: Span, [c, d]: Span): RowTime[] {
  return Array.from({ length: rows }, (_, j) => ({
    in: a + ((z - a) * j) / rows,
    inSpan: (z - a) / rows,
    out: c + ((d - c) * 0.5 * j) / rows,
    outSpan: (d - c) * 0.5,
  }));
}

/** Each word's window, row by row, from how many words each row has. */
export function wordWindows(wordsPerRow: readonly number[], tIn: Span, tOut: Span): WordWindow[][] {
  const rows = rowTimes(wordsPerRow.length, tIn, tOut);
  return wordsPerRow.map((n, j) => {
    const r = rows[j]!;
    return Array.from({ length: n }, (_, k) => {
      const f = n > 1 ? k / (n - 1) : 0;
      return { in: r.in + r.inSpan * 0.8 * f, inD: fade(r.inSpan * 0.5), out: r.out + r.outSpan * f, outD: fade(r.outSpan * 0.6) };
    });
  });
}

/** The window of a block's extras (a caption, a list, links, a portrait): in after its last row, out with its first. */
export function extraWindow(rows: number, tIn: Span, tOut: Span): WordWindow {
  const last = rows > 0 ? rowTimes(rows, tIn, tOut)[rows - 1]! : { in: tIn[0], inSpan: 0.2 };
  return { in: last.in + last.inSpan * 0.8, inD: 0.12, out: tOut[0], outD: 0.15 };
}

export function phase(w: WordWindow, t: number): WordPhase {
  const ein = clamp01((t - w.in) / w.inD), eout = clamp01((t - w.out) / w.outD);
  return { ein, eout, opacity: ein * (1 - eout), settle: clamp01((t - w.in) / (w.inD * 2.6)) };
}
