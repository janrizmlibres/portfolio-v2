/**
 * Surfaces lit by a star, under the colour rule: linear light in, Khronos PBR Neutral tone mapping, then encoded to
 * display values, since the sky's renderer writes what it's given. The key light is the star's colour, from its
 * position; the region's light fills the night side, so no body reads as a hole. Meaningful colours (a star, the sun)
 * are drawn unlit and never pass through here.
 */
import { Color, LinearSRGBColorSpace, type Material } from "three";

/** A colour written as display values, used as is: nothing converts it on the way in or out. */
export const raw = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return new Color().setRGB(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, LinearSRGBColorSpace);
};

/** How strongly his star lights a surface facing it, and how strongly the region's light fills a night side. */
export const KEY = { sun: 1.7, fill: 0.9 };

/**
 * The strengths for three's own lights (a directional light from his star, a hemisphere light for the region's
 * fill, both times the colour they carry), so a modelled body is lit at `KEY`'s strengths: three's diffuse is
 * albedo / π times the light reaching it, and its hemisphere light mixes ground into sky by how far a surface faces up.
 */
export function matchLights() {
  return { key: KEY.sun * Math.PI, sky: KEY.fill * Math.PI, ground: KEY.fill * 0.1 * Math.PI };
}

/** Khronos PBR Neutral, then the encode to display values: the end of every lit surface's shader. */
export const NEUTRAL_GLSL = /* glsl */ `
  vec3 neutral(vec3 c) {
    const float S = 0.76, D = 0.15;
    float x = min(c.r, min(c.g, c.b)); float off = x < 0.08 ? x - 6.25 * x * x : 0.04; c -= off;
    float peak = max(c.r, max(c.g, c.b)); if (peak < S) return c;
    float d = 1.0 - S, np = 1.0 - d * d / (peak + d - S); c *= np / peak;
    float g = 1.0 - 1.0 / (D * (peak - np) + 1.0); return mix(c, vec3(np), g);
  }
  vec3 encode(vec3 c) { c = max(c, 0.0); return mix(12.92 * c, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }`;

/**
 * A three material (one a `.glb` brings, say) ending as every lit surface here ends: through PBR Neutral, then
 * encoded, since the sky's renderer converts nothing on the way out.
 */
export function neutralOut<M extends Material>(m: M): M {
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader
      .replace("void main() {", `${NEUTRAL_GLSL}\nvoid main() {`)
      .replace("#include <colorspace_fragment>", "gl_FragColor.rgb = encode(neutral(gl_FragColor.rgb));");
  };
  m.customProgramCacheKey = () => "neutral-out";
  return m;
}

/**
 * The region's light as it fills a night side, in linear light: half the region's hue and half grey, so it reads as a
 * dark slate rather than the hue itself. `tint` is the region's tint as display values; `gain` brightens it where a
 * body sits in a bright cloud.
 */
export function nightFill(tint: readonly [number, number, number], gain = 1): [number, number, number] {
  const lin = tint.map((c) => c ** 2.2), grey = (lin[0]! + lin[1]! + lin[2]!) / 3, k = 3 * gain;
  return [(lin[0]! + grey) * k, (lin[1]! + grey) * k, (lin[2]! + grey) * k];
}
