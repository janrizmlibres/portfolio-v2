import { describe, expect, it } from "vitest";
import { MeshStandardMaterial, Vector3 } from "three";
import { lightBy, lightsChunk, PATCHABLE } from "./dark-lights";

type Sh = Parameters<MeshStandardMaterial["onBeforeCompile"]>[0];
const compile = (m: MeshStandardMaterial) => {
  const sh = { uniforms: {}, vertexShader: "void main() {}", fragmentShader: "void main() {\n#include <lights_fragment_begin>\n}" } as unknown as Sh;
  m.onBeforeCompile(sh, undefined as never);
  return sh;
};

describe("lighting a material by its own star, skipping dark lights", () => {
  it("is written against this three's lights chunk", () => {
    expect(PATCHABLE).toBe(true);
  });

  it("skips a dark light's shading and its shadow map", () => {
    const c = lightsChunk(false);
    expect(c).toContain("if ( any( greaterThan( directLight.color, vec3( 0.0 ) ) ) ) RE_Direct(");
    expect(c).toContain("receiveShadow && any( greaterThan( directLight.color");
    expect(c).not.toContain("ownKeyV");
  });

  it("with its own star, darkens every directional light but the one along it", () => {
    const c = lightsChunk(true);
    expect(c).toContain("vec3 ownKeyV = normalize( ( viewMatrix * vec4( uOwnKey, 0.0 ) ).xyz );");
    expect(c).toContain("if ( dot( directionalLight.direction, ownKeyV ) < 0.999 ) directLight.color = vec3( 0.0 );");
  });

  it("chains what the material already did before compiling, and puts the chunk in", () => {
    const m = new MeshStandardMaterial();
    m.onBeforeCompile = (sh) => { sh.fragmentShader = "// before\n" + sh.fragmentShader; };
    const own = { value: new Vector3(0, 1, 0) };
    lightBy(m, own);
    const sh = compile(m);
    expect(sh.fragmentShader.startsWith("// before")).toBe(true);
    expect(sh.fragmentShader).toContain("uniform vec3 uOwnKey;");
    expect(sh.fragmentShader).not.toContain("#include <lights_fragment_begin>");
    expect((sh.uniforms as Record<string, unknown>).uOwnKey).toBe(own);
  });

  it("never shares a program with an unpatched material, nor own with dark-only", () => {
    const a = new MeshStandardMaterial(), b = new MeshStandardMaterial();
    a.customProgramCacheKey = b.customProgramCacheKey = () => "neutral-out";
    lightBy(a, null);
    lightBy(b, { value: new Vector3(1, 0, 0) });
    expect(a.customProgramCacheKey()).toBe("neutral-out+lights-lit");
    expect(b.customProgramCacheKey()).toBe("neutral-out+lights-own");
  });
});
