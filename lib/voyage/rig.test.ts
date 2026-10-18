import { describe, expect, it } from "vitest";
import { DirectionalLight, Light, Object3D, Scene, Vector3 } from "three";
import { createLightRig, resizeShadow } from "./rig";

/** the lights three would light a frame with: the visible ones, as its render list gathers them */
const litBy = (scene: Scene) => {
  const ls: Light[] = [];
  scene.traverseVisible((o) => { if ((o as Light).isLight) ls.push(o as Light); });
  return ls.length;
};

function body(scene: Scene, at: Vector3) {
  const root = new Object3D(), key = new DirectionalLight(0xffffff, 1);
  root.position.copy(at);
  key.position.set(1, 2, 3);
  key.castShadow = true;
  root.add(key);
  scene.add(root);
  return { root, key };
}

describe("createLightRig", () => {
  it("keeps every light lit by the frame when a body's root is hidden, so three never recompiles", () => {
    const scene = new Scene(), a = body(scene, new Vector3(5, 0, 0)), b = body(scene, new Vector3(0, 0, 9));
    createLightRig(scene, [a.root, b.root]);
    expect(litBy(scene)).toBe(2);
    a.root.visible = false;
    b.root.visible = false;
    expect(litBy(scene)).toBe(2);
  });

  it("keeps each light where it was in the world", () => {
    const scene = new Scene(), a = body(scene, new Vector3(5, 0, 0));
    scene.updateMatrixWorld(true);
    const before = a.key.getWorldPosition(new Vector3());
    createLightRig(scene, [a.root]);
    scene.updateMatrixWorld(true);
    expect(a.key.getWorldPosition(new Vector3()).distanceTo(before)).toBeLessThan(1e-9);
  });

  it("redraws a light's shadow only while it lights anything", () => {
    const scene = new Scene(), a = body(scene, new Vector3()), b = body(scene, new Vector3());
    const rig = createLightRig(scene, [a.root, b.root]);
    a.key.intensity = 0;
    rig.cull();
    expect(a.key.shadow.autoUpdate).toBe(false);
    expect(b.key.shadow.autoUpdate).toBe(true);
    a.key.intensity = 0.4;
    rig.cull();
    expect(a.key.shadow.autoUpdate).toBe(true);
  });

  it("skips a lit light's shadow when its body says it needn't be drawn (`userData.shadowOff`)", () => {
    const scene = new Scene(), a = body(scene, new Vector3());
    const rig = createLightRig(scene, [a.root]);
    a.key.userData.shadowOff = true;
    rig.cull();
    expect(a.key.shadow.autoUpdate).toBe(false);
    a.key.userData.shadowOff = false;
    rig.cull();
    expect(a.key.shadow.autoUpdate).toBe(true);
  });

  it("gives the lights back to their bodies when it's taken down", () => {
    const scene = new Scene(), a = body(scene, new Vector3(2, 0, 0));
    const rig = createLightRig(scene, [a.root]);
    rig.dispose();
    expect(a.key.parent).toBe(a.root);
    expect(scene.children.length).toBe(1);
  });
});

describe("resizeShadow", () => {
  // three binds a stand-in for a missing map that a shadow sampler refuses (GL_INVALID_OPERATION), and every lit
  // material samples every key's map: a dark key left without one stopped Athena drawing after a quality step
  it("has a resized map drawn again on the next frame, a dark key's too", () => {
    const key = new DirectionalLight(0xffffff, 0);
    key.castShadow = true;
    key.shadow.autoUpdate = false;
    key.shadow.mapSize.set(2048, 2048);
    resizeShadow(key, 1024);
    expect([key.shadow.mapSize.x, key.shadow.map, key.shadow.needsUpdate]).toEqual([1024, null, true]);
  });

  it("leaves a map already at its size alone", () => {
    const key = new DirectionalLight(0xffffff, 0);
    key.shadow.mapSize.set(512, 512);
    key.shadow.needsUpdate = false;
    resizeShadow(key, 512);
    expect(key.shadow.needsUpdate).toBe(false);
  });
});
