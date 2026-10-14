/**
 * Lights a three material by its own star, and skips dark lights.
 *
 * Every star's key light stays in the scene all film long (a light that came and went made three recompile every lit
 * material), dark while its body is away, and each, being directional, reaches every surface in the sky. Three
 * shades every surface for every light, reading its shadow map too, lit or not. A material patched here skips any
 * light whose colour is zero, shadow map and all, and with `own` (its star's direction in the world, from the body
 * towards the star) takes only that star's key, compared in view space as three holds it. The hemisphere's fill
 * still reaches it.
 */
import { ShaderChunk, type Material, type Vector3 } from "three";

const CHUNK = ShaderChunk.lights_fragment_begin;
const DIR_INFO = "getDirectionalLightInfo( directionalLight, directLight );";
const DIR_SHADOW = "directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap";
const DIRECT = "RE_Direct( directLight, ";
const LIT = "any( greaterThan( directLight.color, vec3( 0.0 ) ) )";
/** whether this three's lights chunk is the one the patch was written against; if not, materials are left as they are */
export const PATCHABLE = CHUNK.includes(DIR_INFO) && CHUNK.includes(DIR_SHADOW) && CHUNK.includes(DIRECT);

/** three's lights chunk, skipping dark lights, and with `own` every directional light but the one along `uOwnKey` */
export function lightsChunk(own: boolean) {
  return (own ? "vec3 ownKeyV = normalize( ( viewMatrix * vec4( uOwnKey, 0.0 ) ).xyz );\n" : "") +
    CHUNK.replace(DIR_INFO, own ? `${DIR_INFO}\n\t\tif ( dot( directionalLight.direction, ownKeyV ) < 0.999 ) directLight.color = vec3( 0.0 );` : DIR_INFO)
      .replace(DIR_SHADOW, `directLight.color *= ( directLight.visible && receiveShadow && ${LIT} ) ? getShadow( directionalShadowMap`)
      .replaceAll(DIRECT, `if ( ${LIT} ) ${DIRECT}`);
}

/**
 * Patches `m` (chaining whatever `onBeforeCompile` it has) to skip dark lights, and with `own` (a uniform holding its
 * star's direction in the world) to take only that star's key. Its program cache key gains a suffix, so it never
 * shares a program with an unpatched material.
 */
export function lightBy(m: Material, own: { value: Vector3 } | null) {
  if (!PATCHABLE) return m;
  const before = m.onBeforeCompile, key = m.customProgramCacheKey(), chunk = lightsChunk(!!own);
  m.onBeforeCompile = (sh, r) => {
    before.call(m, sh, r);
    if (own) {
      sh.uniforms.uOwnKey = own;
      sh.fragmentShader = sh.fragmentShader.replace("void main() {", "uniform vec3 uOwnKey;\nvoid main() {");
    }
    sh.fragmentShader = sh.fragmentShader.replace("#include <lights_fragment_begin>", chunk);
  };
  m.customProgramCacheKey = () => `${key}+lights-${own ? "own" : "lit"}`;
  return m;
}
