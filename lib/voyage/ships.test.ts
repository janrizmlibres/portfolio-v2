import { describe, expect, it, vi } from "vitest";
import { BoxGeometry, Color, DoubleSide, Group, Matrix4, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Scene, Texture, Vector3, type Material, type WebGLRenderer } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { dirAt, ringFrame } from "./about";
import { matchLights } from "./lit";
import { createShip, RIM } from "./ships";
import type { World } from "./world";

// the station made real as scripts/models/station.py builds it: twelve modules on the chords between twelve nodes a
// radius out, the modules 0.078 thick and 0.05 at their narrowest (their docking rings); the site's model is that scaled
// to a bounding radius of 1, `RB` of its own units
const RB = (Math.cos(Math.PI / 12) + 0.078) / RIM;
const deg = Math.PI / 180;
/** how far a point (in bounding radii, the ring's axis +y) is from the line the modules sit on */
const offCore = (p: Vector3) => {
  const a = Math.atan2(p.z, p.x), off = a - (Math.PI / 6) * Math.round(a / (Math.PI / 6));
  return Math.hypot(Math.hypot(p.x, p.z) * Math.cos(off) - Math.cos(Math.PI / 12) / RB, p.y);
};
/** the ring posed for About, its hold's camera low over its plane (about.ts), and a point of it in the model's frame */
const atTheHold = (th: number) => {
  const ship = createShip(ctx()), up = new Vector3(0, 1, 0);
  ship.face(new Vector3(0.3, 0.2, 1).normalize(), up);
  const toCam = dirAt(ringFrame(ship.axis(), new Vector3(0, 0, 1)), -55 * deg, th * deg);
  const camR = new Vector3().crossVectors(up, toCam).normalize(), camU = new Vector3().crossVectors(toCam, camR);
  const local = (P: Vector3) => P.clone().sub(ship.obj.position).applyQuaternion(ship.obj.quaternion.clone().invert()).multiplyScalar(1 / ship.r);
  return { ship, camR, camU, local };
};
/** a point of the model's, wherever the ring has turned it */
const turned = (p: Vector3) => Array.from({ length: 72 }, (_, k) => p.clone().applyAxisAngle(new Vector3(0, 1, 0), k * 5 * deg));

const ctx = () => ({
  W: { HOME: { P: new Vector3(10, 0, 0), r: 1 }, SUN: new Vector3(0, 0, 0) } as unknown as World,
  sunCol: new Color(1, 1, 1),
  fill: new Color(0.1, 0.1, 0.1),
  renderer: { shadowMap: {} } as unknown as WebGLRenderer,
  scene: new Scene(),
  owned: [],
});

describe("createShip", () => {
  // the model never arrives: the ship's lights are made before it loads
  vi.spyOn(GLTFLoader.prototype, "load").mockImplementation(() => {});

  it("casts its shadows as sharp as his star's are, so a lattice's shadow stays a lattice, not speckle", () => {
    expect(createShip(ctx()).key.shadow.radius).toBe(1);
  });

  it("weaves the blankets in the cloth finish (each panel its own white), after the film's own patches", () => {
    const mesh = new Mesh(new BoxGeometry(), new MeshStandardMaterial({ name: "mmod blanket", normalMap: new Texture() }));
    const model = new Group();
    model.add(mesh);
    vi.mocked(GLTFLoader.prototype.load).mockImplementationOnce((_url, onLoad) => onLoad({ scene: model } as never));
    const owned: unknown[] = [];
    createShip({ ...ctx(), owned: owned as never, finish: "cloth", studio: () => new Texture() }).fade(1);
    const m = mesh.material as MeshPhysicalMaterial;
    expect(m.sheen).toBeGreaterThan(0);
    expect(m.customProgramCacheKey()).toContain("weave");
    // the tones' table is the ship's, and goes with it
    expect(owned.some((o) => (o as Texture).isTexture && (o as Texture).name === "panel tones")).toBe(true);
  });

  it("draws its surfaces in the finish asked for, reflecting the studio only then; with none, the model's own", () => {
    const loadWith = (name: string) => {
      const mesh = new Mesh(new BoxGeometry(), new MeshStandardMaterial({ name }));
      const model = new Group();
      model.add(mesh);
      vi.mocked(GLTFLoader.prototype.load).mockImplementationOnce((_url, onLoad) => onLoad({ scene: model } as never));
      return mesh;
    };
    const env = new Texture();
    let built = 0;
    const studio = () => { built++; return env; };
    const hull = loadWith("mmod blanket");
    createShip({ ...ctx(), finish: "metal", studio }).fade(1);
    expect(hull.material).toBeInstanceOf(MeshPhysicalMaterial);
    expect((hull.material as MeshPhysicalMaterial).envMap).toBe(env);
    // with no finish nothing changes, and the studio is never built
    const before = built;
    const kept = loadWith("aluminium plain");
    createShip({ ...ctx(), studio }).fade(1);
    expect(kept.material).not.toBeInstanceOf(MeshPhysicalMaterial);
    expect(built).toBe(before);
  });

  it("points his portrait's leader into the hull of a near module, however far the ring has turned", () => {
    for (const th of [5, 9, 15])
      for (const short of [false, true]) {
        const { ship, camR, camU, local } = atTheHold(th);
        for (const p of turned(local(ship.edge(camR, camU, short)))) expect(offCore(p)).toBeLessThan(0.05 / RB);
      }
  });

  it("on a phone held sideways, where no dark is free of About's words, hangs it nearer the camera, over the ship's foot", () => {
    const { ship, camR, camU, local } = atTheHold(9);
    const toCam = local(ship.obj.position.clone().add(new Vector3().crossVectors(camR, camU).multiplyScalar(ship.r))).setY(0);
    const flat = (p: Vector3) => p.setY(0);
    const wide = flat(local(ship.hang(camR, camU))), short = flat(local(ship.hang(camR, camU, true)));
    expect(short.angleTo(toCam)).toBeLessThan(wide.angleTo(toCam) - 10 * deg);
  });

  it("hangs his portrait just under that module, in the dark clear of its hull", () => {
    for (const th of [5, 9, 15])
      for (const short of [false, true]) {
        const { ship, camR, camU, local } = atTheHold(th);
        const edge = local(ship.edge(camR, camU, short)), hang = local(ship.hang(camR, camU, short));
        // under the module's belly, the leader running up from it into the hull
        expect(hang.y).toBeLessThan(-0.078 / RB);
        expect(hang.y).toBeGreaterThan(-0.16 / RB);
        expect(new Vector3(hang.x, 0, hang.z).angleTo(new Vector3(edge.x, 0, edge.z))).toBeLessThan(3 * deg);
        for (const p of turned(hang)) expect(offCore(p)).toBeGreaterThan(0.078 / RB);
      }
  });

  it("relights his star's key each frame, so a scene that dims it a while (the ribbon's own light) never leaves the ship dark", () => {
    const ship = createShip(ctx());
    // as the film does while 'Your own' is read: the ship's update, then the key dimmed by the ribbon's own light
    for (let f = 0; f < 120; f++) {
      ship.update();
      ship.key.intensity *= 1 - 0.9;
    }
    // back at About, where nothing dims it
    ship.update();
    expect(ship.key.intensity).toBe(matchLights().key);
  });

  it("draws its parts opaque once it's whole, and see-through only while it fades (a see-through ship filling the frame cost every pixel twice over)", () => {
    const mat = new MeshStandardMaterial({ side: DoubleSide });
    const a = new Mesh(new BoxGeometry(), mat), b = new Mesh(new BoxGeometry(), mat);
    const model = new Group();
    model.add(a, b);
    vi.mocked(GLTFLoader.prototype.load).mockImplementationOnce((_url, onLoad) => onLoad({ scene: model } as never));
    const ship = createShip(ctx());
    const drawn = () => [a, b].map((m) => m.material as Material);
    ship.fade(1);
    for (const m of drawn()) expect(m.transparent).toBe(false);
    ship.fade(0.5);
    for (const m of drawn()) {
      expect(m.transparent).toBe(true);
      expect(m.opacity).toBe(0.5);
    }
    // parts that shared a material still share one
    expect(drawn()[0]).toBe(drawn()[1]);
    ship.fade(1);
    for (const m of drawn()) expect(m.transparent).toBe(false);
  });

  it("maps the station's frame into the world as the ship stands and its ring turns, a new stance included", () => {
    const station = new Group();
    station.name = "real";
    station.position.set(0.1, -0.2, 0.05);
    station.rotation.set(0.3, -0.7, 0.2);
    station.scale.setScalar(0.9);
    const model = new Group();
    model.add(station);
    vi.mocked(GLTFLoader.prototype.load).mockImplementationOnce((_url, onLoad) => onLoad({ scene: model } as never));
    const ship = createShip(ctx()), world = new Group();
    world.position.set(-3, 1, 2);
    world.add(ship.obj);
    world.updateMatrixWorld(true);
    const out = new Matrix4();
    for (const [toCam, a] of [[new Vector3(0.3, 0.2, 1), 0], [new Vector3(-1, 0.5, 0.2), 1.3], [new Vector3(0.2, 1, -0.4), -2.1]] as const) {
      ship.face(toCam.clone().normalize(), new Vector3(0, 1, 0));
      ship.stationAt(a, out);
      // where three's own graph puts the station with the ring turned by `a`
      ship.turn(a);
      world.updateMatrixWorld(true);
      out.elements.forEach((e, i) => expect(e).toBeCloseTo(station.matrixWorld.elements[i]!, 12));
    }
  });
});
