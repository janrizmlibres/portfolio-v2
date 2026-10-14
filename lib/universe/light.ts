/**
 * Colour as light: each region of the universe has a tint of deep space and a darker space colour beneath it.
 * The tints keep about the same lightness and chroma while the hue walks, until Contact falls towards black.
 * Values are OKLCH [L, C, h] and blend in OKLab as the visitor travels (lib/film/path.ts), so a blend never dips grey or
 * swings through an unrelated hue the way an sRGB or HSL blend would.
 */

export type Oklch = readonly [number, number, number];
export type Oklab = [number, number, number];
export type Rgb = [number, number, number];

export type Region = "hero" | "about" | "work" | "projects" | "crawler" | "own" | "contact";

export const REGION_LIGHT: Record<Region, { tint: Oklch; space: Oklch }> = {
  hero: { tint: [0.195, 0.061, 274], space: [0.105, 0.016, 274] }, // blue-violet
  about: { tint: [0.2, 0.055, 320], space: [0.105, 0.014, 320] }, // plum
  work: { tint: [0.2, 0.04, 210], space: [0.1, 0.012, 210] }, // teal
  projects: { tint: [0.195, 0.055, 256], space: [0.1, 0.016, 256] }, // deep blue
  crawler: { tint: [0.19, 0.045, 64], space: [0.095, 0.012, 64] }, // amber
  own: { tint: [0.2, 0.05, 160], space: [0.1, 0.013, 160] }, // green
  contact: { tint: [0.135, 0.03, 248], space: [0.075, 0.01, 248] }, // near-black
};

export function oklchToOklab([L, C, h]: Oklch): Oklab {
  const r = (h * Math.PI) / 180;
  return [L, C * Math.cos(r), C * Math.sin(r)];
}

const encode = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const unit = (c: number) => Math.min(1, Math.max(0, c));

/** OKLab to gamma-encoded sRGB display values in 0..1, clamped into the gamut. */
export function oklabToSrgb([L, a, b]: Oklab): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return linear.map((c) => unit(encode(Math.max(0, c)))) as Rgb;
}

/** The light round the camera: the region's tint, and the darker space colour beneath it. */
export type Light = { tint: Oklab; space: Oklab };

/** The region's light, bright enough to write in, as a CSS colour: a scene's words arrive in it and settle to white. */
export function textTint(region: Region) {
  const rgb = oklabToSrgb(oklchToOklab([0.84, 0.12, REGION_LIGHT[region].tint[2]]));
  return `rgb(${rgb.map((c) => Math.round(c * 255)).join(", ")})`;
}
