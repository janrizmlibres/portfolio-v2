/**
 * The light of the relay's throw (work-camera.ts): the stars stretching into streaks as you're thrown, and a flash at the
 * throw's height that cuts to home in August 2023. The streaks are the throw's alone: the film says when one is on
 * (`streaksAt`), and the camera's speed only stretches them, so the hero's dive and the film's zooms never streak. Deliberately not the warp's light
 * (warp-hole.ts: a wormhole, "no particles and no streaks"): no tunnel, no lensing, nothing but streaks and a flash.
 * The streaks are stars at infinity riding with the camera, each drawn back along the way you're going; the flash is
 * a full-frame wash drawn over the picture, white at its middle and pale blue at its edges.
 */
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, LineBasicMaterial, LineSegments, Mesh, NormalBlending, Object3D, PlaneGeometry, ShaderMaterial,
  Vector3, type Material,
} from "three";

const N = 2400, R = 60;

export function createJump(owned: Array<BufferGeometry | Material | { dispose(): void }>) {
  const root = new Object3D();
  root.name = "jump";
  const dirs = new Float32Array(N * 3), pos = new Float32Array(N * 6), col = new Float32Array(N * 6);
  // a fixed sky of them, the same every load; each streak bright at its star and dark at its tail, scaled by the
  // material's opacity as the throw comes on
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < N; i++) {
    const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = Math.sqrt(1 - u * u);
    dirs[i * 3] = r * Math.cos(a); dirs[i * 3 + 1] = u; dirs[i * 3 + 2] = r * Math.sin(a);
    const b = 0.25 + 0.75 * rnd() ** 3;
    col[i * 6] = 0.75 * b; col[i * 6 + 1] = 0.85 * b; col[i * 6 + 2] = b;
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(pos, 3));
  geo.setAttribute("color", new BufferAttribute(col, 3));
  const mat = new LineBasicMaterial({ vertexColors: true, blending: AdditiveBlending, transparent: true, depthWrite: false, depthTest: false });
  const streaks = new LineSegments(geo, mat);
  streaks.name = "streaks";
  streaks.frustumCulled = false;
  streaks.renderOrder = 5;
  streaks.visible = false;
  root.add(streaks);

  const flashMat = new ShaderMaterial({
    uniforms: { uK: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vP; void main() { vP = position.xy; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uK; varying vec2 vP;
      void main() {
        float r = length(vP);
        vec3 c = mix(vec3(1.0), vec3(0.72, 0.85, 1.0), smoothstep(0.0, 1.4, r));
        gl_FragColor = vec4(c, uK);
      }`,
    transparent: true, depthTest: false, depthWrite: false, blending: NormalBlending,
  });
  const flashGeo = new PlaneGeometry(2, 2);
  const flash = new Mesh(flashGeo, flashMat);
  flash.frustumCulled = false;
  flash.renderOrder = 999;
  flash.visible = false;
  root.add(flash);
  owned.push(geo, mat, flashMat, flashGeo);

  const v = new Vector3();
  return {
    root,
    /**
     * The streaks for the camera at `cam` moving at `vel` (sky units a screen of scroll), as much as a throw is `on`
     * (0..1), and the flash at `k` (0..1). Below `slow` there are no streaks; they grow with the speed past it.
     */
    update(cam: Vector3, vel: Vector3, k: number, throwing: number, slow = 0.06) {
      const speed = vel.length(), on = throwing * Math.min(1, Math.max(0, (speed - slow) / (slow * 2)));
      streaks.visible = on > 0.002;
      if (streaks.visible) {
        root.position.copy(cam);
        v.copy(vel).normalize();
        const len = Math.min(R * 1.5, (speed - slow) * 110);
        const dx = v.x * len, dy = v.y * len, dz = v.z * len;
        for (let i = 0; i < N; i++) {
          const x = dirs[i * 3]! * R, y = dirs[i * 3 + 1]! * R, z = dirs[i * 3 + 2]! * R, o = i * 6;
          pos[o] = x; pos[o + 1] = y; pos[o + 2] = z;
          pos[o + 3] = x + dx; pos[o + 4] = y + dy; pos[o + 5] = z + dz;
        }
        geo.attributes.position!.needsUpdate = true;
        mat.opacity = on;
      }
      flashMat.uniforms.uK!.value = k;
      flash.visible = k > 0.002;
    },
  };
}

export type Jump = ReturnType<typeof createJump>;
