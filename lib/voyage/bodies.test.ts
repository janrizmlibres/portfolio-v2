import { describe, expect, it } from "vitest";
import { BoxGeometry, Line, BufferGeometry, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, TorusGeometry, Vector3 } from "three";
import { createBodyFootprints } from "./bodies";
import { footprints } from "@/lib/film/footprints";

const size = { w: 1440, h: 900 };
function setup() {
  const camera = new PerspectiveCamera(32, size.w / size.h, 0.01, 100);
  camera.position.set(0, 0, 0);
  camera.lookAt(new Vector3(0, 0, -1));
  camera.updateMatrixWorld();
  const root = new Object3D();
  const box = (at: Vector3, s = 0.2) => {
    const m = new Mesh(new BoxGeometry(s, s, s), new MeshBasicMaterial());
    m.position.copy(at);
    root.add(m);
    return m;
  };
  const prints = createBodyFootprints(camera, () => size);
  return { camera, root, box, prints, update: () => root.updateMatrixWorld(true) };
}
let frame = 100;

describe("createBodyFootprints", () => {
  it("projects a body in view to its box on screen", () => {
    const { root, box, prints, update } = setup();
    box(new Vector3(0, 0, -5));
    update();
    prints.add(root);
    const r = prints.rects();
    expect(r).toHaveLength(1);
    const cx = (r[0]!.l + r[0]!.r) / 2, cy = (r[0]!.t + r[0]!.b) / 2;
    expect(cx).toBeCloseTo(720, 0);
    expect(cy).toBeCloseTo(450, 0);
    expect(r[0]!.r - r[0]!.l).toBeGreaterThan(20);
    prints.dispose();
  });
  it("gives each part its own footprint, so a sprawling body isn't one big box", () => {
    const { root, box, prints, update } = setup();
    box(new Vector3(-0.6, 0, -5));
    box(new Vector3(0.6, 0, -5));
    update();
    prints.add(root);
    const r = prints.rects();
    expect(r).toHaveLength(2);
    expect(r[0]!.r).toBeLessThan(r[1]!.l);
    prints.dispose();
  });
  it("gives a sprawling part (a ring merged into one mesh) the cells it covers, not one box over its middle", () => {
    const { root, prints, update } = setup();
    const ring = new Mesh(new TorusGeometry(1, 0.06, 8, 96), new MeshBasicMaterial());
    ring.position.set(0, 0, -4);
    root.add(ring);
    update();
    prints.add(root);
    const r = prints.rects(), at = (x: number, y: number) => r.some((b) => x >= b.l && x <= b.r && y >= b.t && y <= b.b);
    expect(at(720, 450)).toBe(false);
    // its rim, on the right: 1 / (4 tan 16°) of the half-height out from the middle
    expect(at(720 + 450 / (4 * Math.tan((16 * Math.PI) / 180)), 450)).toBe(true);
    prints.dispose();
  });
  it("keeps a big plain part (a monolith's slab, a card) as its whole box: its few corners would leave its face open", () => {
    const { root, box, prints, update } = setup();
    box(new Vector3(0, 0, -3), 1.2);
    update();
    prints.add(root);
    expect(prints.rects().some((b) => 720 >= b.l && 720 <= b.r && 450 >= b.t && 450 <= b.b)).toBe(true);
    prints.dispose();
  });
  it("skips what isn't drawn: hidden, behind the camera, off screen, or not shown", () => {
    const { root, box, prints, update } = setup();
    box(new Vector3(0, 0, -5)).visible = false;
    box(new Vector3(0, 0, 5));
    box(new Vector3(40, 0, -5));
    const held = new Object3D();
    const m = new Mesh(new BoxGeometry(0.2, 0.2, 0.2), new MeshBasicMaterial());
    m.position.set(0, 0, -5);
    held.add(m);
    update();
    held.updateMatrixWorld(true);
    prints.add(root);
    prints.add(held, { shown: () => false });
    expect(prints.rects()).toEqual([]);
    prints.dispose();
  });
  it("skips one the camera is inside, and lines, which are drawn, not bodies", () => {
    const { root, box, prints, update } = setup();
    box(new Vector3(0, 0, 0), 4);
    root.add(new Line(new BufferGeometry().setFromPoints([new Vector3(-1, 0, -5), new Vector3(1, 0, -5)])));
    update();
    prints.add(root);
    expect(prints.rects()).toEqual([]);
    prints.dispose();
  });
  it("leaves out what's drawn with a body but isn't a subject (a line laid as a mesh)", () => {
    const { root, box, prints, update } = setup();
    box(new Vector3(-0.6, 0, -5));
    const line = box(new Vector3(0.6, 0, -5));
    update();
    prints.add(root, { skip: [line] });
    expect(prints.rects()).toHaveLength(1);
    prints.dispose();
  });
  it("adds a point's footprint: a star's disc", () => {
    const { prints } = setup();
    prints.addSpot(() => ({ x: 300, y: 200, r: 30 }));
    prints.addSpot(() => null);
    expect(prints.rects()).toEqual([{ l: 270, t: 170, r: 330, b: 230 }]);
    prints.dispose();
  });
  it("is what Tycho reads from the shared registry, and leaves it when the stage goes", () => {
    const { prints } = setup();
    prints.addSpot(() => ({ x: 300, y: 200, r: 30 }));
    expect(footprints(++frame)).toHaveLength(1);
    prints.dispose();
    expect(footprints(++frame)).toHaveLength(0);
  });
});
