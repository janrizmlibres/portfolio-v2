/**
 * The warp's colours in the destination's light, so the warp never looks out of place on the page. The warp was built in orange: its fire, the hole's gas, Tycho's flames, the
 * light they throw. The whole palette turns round the hue circle until its accent has the destination region's hue
 * (lib/universe/light.ts), each colour keeping its lightness and as much of its chroma as the screen can show, so the
 * fire still reads as hot gas, bright at the nozzle and dark as it cools (its ember a little redder than its accent and
 * its glow a little yellower, as in the orange), only in another colour. The white-hot cores and the flash stay white.
 * Colours are display values (0..1, written as they are: the sky's renderer converts nothing), worked in OKLCH.
 */
import type { Rgb } from "@/lib/universe/light";

const hexRgb = (h: string): Rgb => { const n = parseInt(h.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };

/** The warp's colours as built, in orange. */
export const WARP_BASE = {
  /** the fire's and the hole's gas's bright colour (the trail's and the hole's accent) */
  accent: hexRgb("#ff7a3a"),
  /** the fire as it cools (the trail's ember) */
  ember: hexRgb("#7a1a08"),
  /** the hole's disk where its gas is thin (the accent × (0.6, 0.25, 0.4), as the disk mixed it) */
  dim: [1 * 0.6, (0x7a / 255) * 0.25, (0x3a / 255) * 0.4] as Rgb,
  /** Tycho's flames between their white-hot core and their tips, and at their tips */
  flameMid: hexRgb("#ff8a3a"),
  flameEmber: hexRgb("#c2280a"),
  /** the glow at each nozzle, round its white core and at its edge */
  glowMid: hexRgb("#ffc58a"),
  glowEmber: hexRgb("#b8360e"),
  /** the light his jets throw on him, and the hole's glow on him */
  light: hexRgb("#ff7a3d"),
  /** what the throat lights the pieces of the section left behind with, and the gas they fade into */
  tint: hexRgb("#ffc49a"),
  fog: hexRgb("#2a0f07"),
};
export type WarpPalette = Record<keyof typeof WARP_BASE, Rgb>;

const decode = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const encode = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

/** A display colour's OKLCH: [L, C, hue in degrees]. */
export function oklchOf(rgb: readonly number[]): [number, number, number] {
  const [r, g, b] = rgb.map(decode) as Rgb;
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360];
}

/** OKLCH to linear sRGB, unclamped (out of the gamut where any channel leaves 0..1). */
function linearOf(L: number, C: number, hue: number): Rgb {
  const a = C * Math.cos((hue * Math.PI) / 180), b = C * Math.sin((hue * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}
const inGamut = (c: Rgb) => c.every((x) => x >= -1e-6 && x <= 1 + 1e-6);

/** `rgb` at `hue`: its own lightness, and its chroma (× `chroma`), or as much of it as the screen can show there. */
function atHue(rgb: readonly number[], hue: number, chroma = 1): Rgb {
  const [L, C0] = oklchOf(rgb), C = C0 * chroma;
  let lo = 0, hi = C;
  if (!inGamut(linearOf(L, hi, hue))) {
    for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (inGamut(linearOf(L, mid, hue))) lo = mid; else hi = mid; }
    hi = lo;
  }
  return linearOf(L, hi, hue).map((x) => Math.min(1, Math.max(0, encode(Math.max(0, x))))) as Rgb;
}

const ACCENT_HUE = oklchOf(WARP_BASE.accent)[2];

/** The warp's colours with their accent at `hue` (degrees, OKLCH): the destination region's; `chroma` scales it. */
export function warpPalette(hue: number, chroma = 1): WarpPalette {
  const turn = hue - ACCENT_HUE;
  return Object.fromEntries(Object.entries(WARP_BASE).map(([k, c]) => [k, atHue(c, oklchOf(c)[2] + turn, chroma)])) as WarpPalette;
}
