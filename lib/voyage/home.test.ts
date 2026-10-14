import { describe, expect, it, vi } from "vitest";
import { BoxGeometry, Color, Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Scene, Texture, Vector3, type WebGLRenderer } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createHome } from "./home";
import type { World } from "./world";

// the studio is prefiltered on the GPU; here it's a stand-in
vi.mock("./finish", async (orig) => ({ ...(await orig<typeof import("./finish")>()), studio: () => ({ texture: new Texture(), dispose() {} }) }));

describe("createHome", () => {
  it("dresses the station in the cloth finish, settled (Janriz, 2026-10-11: \"finalize the cloth finish for the ring\"): its blankets beta cloth, its fittings metal", () => {
    const blanket = new Mesh(new BoxGeometry(), new MeshStandardMaterial({ name: "mmod blanket", normalMap: new Texture() }));
    const fitting = new Mesh(new BoxGeometry(), new MeshStandardMaterial({ name: "aluminium plain" }));
    const model = new Group();
    model.add(blanket, fitting);
    vi.spyOn(GLTFLoader.prototype, "load").mockImplementationOnce((_url, onLoad) => onLoad({ scene: model } as never));
    const W = { HOME: { P: new Vector3(10, 0, 0), r: 1 }, SUN: new Vector3(0, 0, 0) } as unknown as World;
    createHome({ W, fill: new Color(), owned: [], renderer: { shadowMap: {} } as unknown as WebGLRenderer, scene: new Scene() });
    const cloth = blanket.material as MeshPhysicalMaterial, metal = fitting.material as MeshPhysicalMaterial;
    expect(cloth.sheen).toBeGreaterThan(0);
    expect(cloth.metalness).toBe(0);
    expect(metal.metalness).toBe(1);
  });
});
