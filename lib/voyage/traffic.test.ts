import { describe, expect, it, vi } from "vitest";
import { BoxGeometry, Group, InstancedMesh, Mesh, MeshStandardMaterial, Object3D, Vector3 } from "three";
import { voyageScript } from "./script";
import { createTraffic } from "./traffic";

/** the traffic's model as its build names it: each part a node `<name> root` (three writes the space as `_`) */
function model() {
  const scene = new Group();
  for (const name of ["drone", "worker", "craft", "hauler", "crane", "pod", "shuttle"]) {
    const root = new Group();
    root.name = `${name}_root`;
    root.add(new Mesh(new BoxGeometry(), new MeshStandardMaterial()));
    scene.add(root);
  }
  return scene;
}

vi.mock("./loading", () => ({
  voyageLoader: () => ({ load: (_url: string, onLoad: (g: { scene: Group }) => void) => onLoad({ scene: model() }) }),
  uploadTextures: () => Promise.resolve(),
  warmInTurn: () => Promise.resolve(),
}));

describe("the traffic round home", () => {
  const { plan } = voyageScript();
  const view = { pos: new Vector3(0, 0, 5), target: new Vector3(), tanH: 0.3, aspect: 1.6 };

  it("hides a docked craft once the film has left Work, though it rides the station, not the traffic", () => {
    const station = new Object3D();
    const traffic = createTraffic({ owned: [], renderer: {} as never, plan, turnAt: () => 0, stationAt: (_a, out) => out.identity(), station: () => station });
    const docked = () => station.children.filter((o) => o.visible).map((o) => o.name);
    // GPT-4o's craft, held docked at the hub
    traffic.update(10.65, view, 1);
    expect(docked()).toEqual(["craft_root"]);
    // a jump back to About
    traffic.update(3, view, 1);
    expect(docked()).toEqual([]);
  });

  it("draws a drone's or a worker's parts only while there are any: an instanced part with none isn't drawn at all", () => {
    const traffic = createTraffic({ owned: [], renderer: {} as never, plan, turnAt: () => 0, stationAt: (_a, out) => out.identity(), station: () => new Object3D() });
    const parts = () => traffic.root.children.filter((o): o is InstancedMesh => (o as InstancedMesh).isInstancedMesh);
    const seen = new Set<string>();
    for (let t = 6; t <= 19; t += 0.25) {
      traffic.update(t, view, 1);
      for (const p of parts()) {
        seen.add(p.count > 0 ? "some" : "none");
        expect([t, p.count > 0, p.visible]).toEqual([t, p.count > 0, p.count > 0]);
      }
    }
    expect([...seen].sort()).toEqual(["none", "some"]);
  });
});
