import { BackSide, Mesh, PMREMGenerator, Scene, ShaderMaterial, SphereGeometry, Vector3, type BufferGeometry, type Material, type Texture, type WebGLRenderer } from "three";
import { oklabToSrgb, oklchToOklab, REGION_LIGHT } from "@/lib/universe/light";

type Owned = Array<BufferGeometry | Material | Texture | { dispose(): void }>;

/**
 * The space the metal out past home reflects (Athena's, the crawler's, the pipeline's, the ribbon's), as an environment
 * map: black, a faint glow of Work's light (brighter overhead), and his star, small and very bright, the way `toSun`
 * looks from out there.
 */
export function spaceEnv(renderer: WebGLRenderer, toSun: Vector3, owned: Owned) {
  const [r, g, b] = oklabToSrgb(oklchToOklab(REGION_LIGHT.work.tint)).map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  const sc = new Scene();
  const mat = new ShaderMaterial({
    side: BackSide,
    uniforms: { uSun: { value: toSun }, uFill: { value: new Vector3(r, g, b) } },
    vertexShader: /* glsl */ `varying vec3 vD; void main() { vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uSun, uFill; varying vec3 vD;
      void main() {
        vec3 d = normalize(vD); float s = dot(d, uSun);
        vec3 c = uFill * (0.05 + 0.12 * (d.y * 0.5 + 0.5)) + vec3(1.0, 0.94, 0.86) * (smoothstep(0.988, 0.998, s) * 40.0 + pow(max(s, 0.0), 30.0) * 0.5);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const geo = new SphereGeometry(1, 48, 24);
  sc.add(new Mesh(geo, mat));
  const pm = new PMREMGenerator(renderer);
  const rt = pm.fromScene(sc, 0, 0.1, 10);
  pm.dispose();
  geo.dispose();
  mat.dispose();
  owned.push(rt);
  return rt.texture;
}
