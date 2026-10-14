/**
 * How a block's words arrive and leave: each scene's text moves the way its scene does. All of it is real HTML,
 * moved by transforms. A word's style is a function of how far it has written in (`ein`) and dissolved (`eout`).
 *   rise     — fades and rises in: the default
 *   lift     — rises out of the database below (the crawler's start)
 *   scatter  — flies in from all round, like the pages a search brings back
 *   square   — arrives tilted and skewed and squares up, like a page becoming a record (Extract)
 *   twin     — arrives with a duplicate that slides into it and is gone (each Dedup)
 *   thicken  — fills out from thin to heavier type (Enrich)
 *   sink     — drops into place, and sinks out as it leaves (Save)
 *   bars     — grows up from its baseline like the report's bars
 */
export const WORD_MODES = ["rise", "lift", "scatter", "square", "twin", "thicken", "sink", "bars"] as const;
export type WordMode = (typeof WORD_MODES)[number];

export type WordMotion = {
  ein: number;
  eout: number;
  /** 0..1, a stable per-word random: which way it scatters, tilts or slides */
  seed: number;
  /** small print (data rows) sits heavier */
  heavy: boolean;
};

export type WordStyle = {
  opacity: number;
  transform: string;
  fontWeight?: number;
  /** twin's duplicate: its offset in em, and its opacity */
  ghost?: { x: number; opacity: number };
};

const easeOut = (x: number) => 1 - (1 - x) ** 2;
const f3 = (x: number) => x.toFixed(3);

export function wordStyle(mode: WordMode, { ein, eout, seed, heavy }: WordMotion): WordStyle {
  const o = ein * (1 - eout), a = 1 - easeOut(ein), z = eout * eout, sg = seed < 0.5 ? -1 : 1;
  const rise = o < 1 ? `translateY(${f3(a * 0.45 - z * 0.3)}em)` : "";
  switch (mode) {
    case "lift":
      return { opacity: o, transform: `translateY(${f3(a * 1.1 - z * 0.6)}em)` };
    case "scatter": {
      const ang = seed * Math.PI * 2, r = a * a;
      let transform = r > 0.001 ? `translate(${(Math.cos(ang) * r * 42).toFixed(2)}vw, ${(Math.sin(ang) * r * 30).toFixed(2)}vh) rotate(${(sg * r * 40).toFixed(1)}deg)` : "";
      if (z > 0) transform += `${transform ? " " : ""}translateY(${f3(z * 0.5)}em)`;
      return { opacity: o, transform };
    }
    case "square":
      return {
        opacity: o,
        transform:
          a > 0.001
            ? `translate(${f3(sg * a * 0.4)}em, ${f3(a * 0.3)}em) rotate(${(sg * a * 22).toFixed(1)}deg) skewX(${(-sg * a * 16).toFixed(1)}deg) scale(${f3(1 - 0.25 * a)})`
            : z > 0 ? `translateY(${f3(-z * 0.3)}em)` : "",
      };
    case "twin":
      return { opacity: o, transform: z > 0 ? `translateY(${f3(-z * 0.3)}em)` : "", ghost: { x: sg * a * 0.95 + 0, opacity: a * 0.75 * (ein > 0 ? 1 : 0) } };
    case "thicken":
      return {
        opacity: o,
        transform: a > 0.001 ? `translateY(${f3(a * 0.3)}em)` : "",
        fontWeight: Math.round(heavy ? 400 + 200 * easeOut(ein) * (1 - z) : 300 + 230 * easeOut(ein) * (1 - z)),
      };
    case "sink":
      return { opacity: o, transform: `translateY(${f3(-a * 0.9 + z * 0.9)}em)` };
    case "bars":
      return { opacity: ein > 0 ? 1 - z * 0.5 : 0, transform: `scaleY(${f3(ein * (1 - z))})` };
    default:
      return { opacity: o, transform: rise };
  }
}

