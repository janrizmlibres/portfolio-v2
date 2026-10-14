/**
 * Reading spots and the runway. A block's reading stretch is where its text is fully in, from the end of its
 * in-window to the start of its out-window (or the end of the film), and its reading spot is the middle of that:
 * deep links, warps and reduced-motion stills land there.
 *
 * The runway is the page's real HTML, one block after another in the film's order, each as tall as the scroll from
 * its reading spot to the next one's. So a block's top is at its reading spot, and landing on any block (or on the
 * section it opens) lands on its reading spot. The first block opens the film at its first frame, and the runway is
 * one screen taller than the film, so the last scroll position is the film's last frame.
 * A section can open on an intro, its words read on the way in by the scroll: a link, a jump or a deep link to the
 * section lands past it, on the section's first entry (its `land`), while the section still starts at the intro.
 */
import type { Span } from "./windows";

export type Timed = { id: string; sec: string; tIn: Span; tOut: Span; intro?: boolean };

/** A block on the runway: its top is at its reading spot, and it runs `height` screens to the next one. */
export type Laid<B extends Timed> = B & { spot: number; height: number };

export function readingStretch(b: Timed, total: number): [number, number] {
  return [b.tIn[1], Math.min(b.tOut[0], total)];
}

export function readingSpot(b: Timed, total: number) {
  const [a, z] = readingStretch(b, total);
  return Math.min(total, Math.max(0, (a + z) / 2));
}

/** Heights and tops are in screens. */
export function layRunway<B extends Timed>(blocks: readonly B[], total: number) {
  const spotted = blocks.map((b) => ({ b, spot: readingSpot(b, total) })).sort((x, y) => x.spot - y.spot);
  if (spotted[0]) spotted[0].spot = 0;
  const laid: Laid<B>[] = spotted.map(({ b, spot }, i) => {
    const next = spotted[i + 1];
    return { ...b, spot, height: (next ? next.spot : total + 1) - spot };
  });

  const sections: Array<{ id: string; top: number; land: number; blocks: Laid<B>[] }> = [];
  for (const b of laid) {
    const last = sections.at(-1);
    if (last?.id === b.sec) last.blocks.push(b);
    else if (sections.some((s) => s.id === b.sec)) throw new Error(`${b.sec}'s blocks aren't together in the film: "${b.id}" comes after another section`);
    else sections.push({ id: b.sec, top: b.spot, land: b.spot, blocks: [b] });
  }
  for (const s of sections) s.land = (s.blocks.find((b) => !b.intro) ?? s.blocks[0]!).spot;
  return { blocks: laid, sections, height: total + 1 };
}

export type Runway<B extends Timed> = ReturnType<typeof layRunway<B>>;
