/**
 * Hairlines in the universe: segments drawn as quads a set width in screen pixels, whatever their distance, so a line
 * stays fine close up and far off. They fade with distance from the camera, and pass behind solid bodies (depth-tested,
 * adding light, writing no depth). Where one passes in front of `occ` (a box on screen, in NDC, with the view depth of
 * what's in it) it all but goes, so it never crosses text being read.
 */
import {
  AdditiveBlending, BufferAttribute, DynamicDrawUsage, InstancedBufferAttribute, InstancedBufferGeometry, Mesh, ShaderMaterial, Vector4,
  type Color, type IUniform, type Vector2, type Vector3,
} from "three";

const VS = /* glsl */ `
  uniform vec2 uRes; uniform float uDpr, uFar, uOccW; uniform vec4 uOcc;
  attribute vec3 aA, aB; attribute vec2 aE;   // alpha, width px
  varying float vA, vY;
  void main() {
    vec4 ca = projectionMatrix * viewMatrix * vec4(aA, 1.0), cb = projectionMatrix * viewMatrix * vec4(aB, 1.0);
    if (aE.x <= 0.0 || ca.w <= 0.00005 || cb.w <= 0.00005) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    vec2 sa = ca.xy / ca.w * 0.5 * uRes, sb = cb.xy / cb.w * 0.5 * uRes;
    vec2 d = sb - sa; float len = max(length(d), 0.001); d /= len;
    vec2 n = vec2(-d.y, d.x);
    float t = position.x * 0.5 + 0.5;
    vec4 c = mix(ca, cb, t);
    vec2 s = mix(sa, sb, t) + n * position.y * (aE.y + 1.0) * uDpr;
    gl_Position = vec4(s / (0.5 * uRes) * c.w, c.z, c.w);
    vA = aE.x * smoothstep(uFar, uFar * 0.35, distance(cameraPosition, mix(aA, aB, t)));
    vec2 nd = c.xy / c.w;
    if (nd.x > uOcc.x && nd.x < uOcc.z && nd.y > uOcc.y && nd.y < uOcc.w && c.w < uOccW) vA *= 0.08;
    vY = position.y;
  }`;
const FS = /* glsl */ `
  uniform vec3 uCol; uniform float uVis;
  varying float vA, vY;
  void main() {
    gl_FragColor = vec4(uCol * vA * uVis * (1.0 - smoothstep(0.3, 1.0, abs(vY))), 1.0);
  }`;

export type Hairlines = ReturnType<typeof hairlines>;

/** `n` segments in one draw. `res` and `dpr` are the sky's, so widths are in its pixels. */
export function hairlines(n: number, { res, dpr, colour, far = 1.3 }: { res: IUniform<Vector2>; dpr: IUniform<number>; colour: Color; far?: number }) {
  const g = new InstancedBufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const A = new InstancedBufferAttribute(new Float32Array(n * 3), 3).setUsage(DynamicDrawUsage);
  const B = new InstancedBufferAttribute(new Float32Array(n * 3), 3).setUsage(DynamicDrawUsage);
  const E = new InstancedBufferAttribute(new Float32Array(n * 2), 2).setUsage(DynamicDrawUsage);
  g.setAttribute("aA", A);
  g.setAttribute("aB", B);
  g.setAttribute("aE", E);
  g.instanceCount = n;
  const u = { uRes: res, uDpr: dpr, uFar: { value: far }, uOcc: { value: new Vector4(2, 2, -2, -2) }, uOccW: { value: 0 }, uCol: { value: colour }, uVis: { value: 1 } };
  const material = new ShaderMaterial({ uniforms: u, vertexShader: VS, fragmentShader: FS, transparent: true, depthTest: true, depthWrite: false, blending: AdditiveBlending });
  const mesh = new Mesh(g, material);
  mesh.frustumCulled = false;
  return {
    mesh, geometry: g, material, u, n,
    /** segment `i` from `a` to `b`, at `alpha`, `width` px wide */
    set(i: number, a: Vector3, b: Vector3, alpha: number, width: number) {
      A.setXYZ(i, a.x, a.y, a.z);
      B.setXYZ(i, b.x, b.y, b.z);
      E.setXY(i, alpha, width);
    },
    commit() {
      A.needsUpdate = B.needsUpdate = E.needsUpdate = true;
    },
  };
}
