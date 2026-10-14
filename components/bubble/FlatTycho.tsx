import { GLYPHS, LINES, OUTLINE } from "@/lib/wake/drawing";

/** Tycho drawn flat, from the wake-up's drawing: his place without 3D, parked and still. */
export function FlatTycho() {
  return (
    <svg className="tycho-flat" viewBox="200 30 600 940" aria-hidden="true">
      <path className="tf-outline" d={OUTLINE} />
      <path className="tf-lines" d={LINES} />
      <path className="tf-glyph" d={GLYPHS.eyeL} />
      <path className="tf-glyph" d={GLYPHS.eyeR} />
      <path className="tf-glyph" d={GLYPHS.beacon} />
    </svg>
  );
}
