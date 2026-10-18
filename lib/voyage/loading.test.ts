import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DirectionalLight, Mesh, MeshStandardMaterial, PlaneGeometry, Scene, Texture, type WebGLRenderer } from "three";
import { uploadTextures, voyageLoader, warmInTurn } from "./loading";

const html = document.documentElement;
const fetched = vi.fn();

describe("every scene loads under the wake-up's loader, before the wake", () => {
  beforeEach(() => {
    fetched.mockReset();
    vi.stubGlobal("fetch", (url: string) => { fetched(url); return Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) }); });
  });
  afterEach(() => {
    html.classList.remove("wake", "wake-lock");
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fetches and builds while the wake-up is still up and locked, never waiting for the wake", async () => {
    vi.spyOn(GLTFLoader.prototype, "parse").mockImplementation((_d, _p, onLoad) => onLoad({} as never));
    html.classList.add("wake", "wake-lock");
    const onLoad = vi.fn();
    voyageLoader().load("/voyage/relay/relay.glb", onLoad);
    await vi.waitFor(() => expect(fetched).toHaveBeenCalledWith("/voyage/relay/relay.glb"));
    await vi.waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1));
    expect(html.classList.contains("wake-lock")).toBe(true);
  });

  it("builds one model a turn: the second's parse waits for the first's build", async () => {
    const order: string[] = [];
    let finish: () => void = () => {};
    vi.spyOn(GLTFLoader.prototype, "parse").mockImplementation((_d, path, onLoad) => {
      order.push(`parse ${path}`);
      if (path === "/a/") finish = () => onLoad({} as never);
      else onLoad({} as never);
    });
    voyageLoader().load("/a/a.glb", () => order.push("built a"));
    voyageLoader().load("/b/b.glb", () => order.push("built b"));
    await vi.waitFor(() => expect(order).toEqual(["parse /a/"]));
    await new Promise((r) => setTimeout(r, 50));
    expect(order).toEqual(["parse /a/"]);
    finish();
    await vi.waitFor(() => expect(order).toEqual(["parse /a/", "built a", "parse /b/", "built b"]));
  });

  it("decodes meshopt-compressed models", () => {
    expect((voyageLoader() as unknown as { meshoptDecoder: unknown }).meshoptDecoder).toBeTruthy();
  });

  it("sends each texture up in a turn of its own, each once", async () => {
    const map = new Texture(), rough = new Texture();
    const root = new Scene();
    root.add(new Mesh(new PlaneGeometry(), new MeshStandardMaterial({ map, roughnessMap: rough })), new Mesh(new PlaneGeometry(), new MeshStandardMaterial({ map })));
    const sent: Texture[] = [];
    await uploadTextures({ initTexture: (t: Texture) => sent.push(t) } as unknown as WebGLRenderer, root);
    expect(sent).toEqual([map, rough]);
  });

  it("warms up without holding a frame for the compile: its draws are compiled in parallel first, then drawn once", async () => {
    const calls: string[] = [];
    const compiled: Array<() => void> = [];
    const renderer = {
      compileAsync: vi.fn(() => { calls.push("compile"); return new Promise<void>((r) => compiled.push(r)); }),
      render: vi.fn(() => calls.push("render")),
      getRenderTarget: () => null,
      setRenderTarget: () => {},
    } as unknown as WebGLRenderer;
    const done = warmInTurn(renderer, (r) => { r.setRenderTarget(null); r.render({} as never, {} as never); r.render({} as never, {} as never); });
    await vi.waitFor(() => expect(calls).toEqual(["compile", "compile"]));
    compiled.forEach((r) => r());
    await done;
    expect(calls).toEqual(["compile", "compile", "render", "render"]);
  });

  it("draws its draws one a turn, so no turn holds more than one of them", async () => {
    const calls: string[] = [];
    vi.stubGlobal("requestIdleCallback", (cb: () => void) => { calls.push("idle"); setTimeout(cb, 0); return 0; });
    const renderer = {
      compileAsync: () => { calls.push("compile"); return Promise.resolve(); },
      render: () => calls.push("render"),
      getRenderTarget: () => null,
      setRenderTarget: () => {},
    } as unknown as WebGLRenderer;
    await warmInTurn(renderer, (r) => { r.render({} as never, {} as never); r.render({} as never, {} as never); });
    expect(calls).toEqual(["idle", "compile", "compile", "idle", "render", "idle", "render"]);
  });

  it("links every program before the film, those the warm-up compiled but never drew too (without parallel compile, three links one the frame it's first drawn)", async () => {
    const linked: number[] = [];
    const programs = [0, 1, 2].map((i) => ({ getUniforms: () => { linked.push(i); return {}; } }));
    const renderer = {
      compileAsync: () => Promise.resolve(),
      render: () => {},
      getRenderTarget: () => null,
      setRenderTarget: () => {},
      info: { programs },
    } as unknown as WebGLRenderer;
    await warmInTurn(renderer, (r) => r.render({} as never, {} as never));
    expect(linked).toEqual([0, 1, 2]);
  });

  it("draws every shadow map in its warm-up, the dark keys' too (their depth passes compile then, not when a key lights mid-film)", async () => {
    const scene = new Scene(), key = new DirectionalLight();
    key.castShadow = true;
    key.shadow.autoUpdate = false;
    scene.add(key);
    const seen: boolean[] = [];
    const renderer = {
      compileAsync: () => Promise.resolve(),
      render: () => seen.push(key.shadow.needsUpdate),
      getRenderTarget: () => null,
      setRenderTarget: () => {},
    } as unknown as WebGLRenderer;
    await warmInTurn(renderer, (r) => r.render(scene, {} as never));
    expect(seen).toEqual([true]);
  });

  it("draws the shadow maps once a warm-up, on its first draw, not again on each draw after it", async () => {
    const scene = new Scene(), key = new DirectionalLight();
    key.castShadow = true;
    key.shadow.autoUpdate = false;
    scene.add(key);
    const seen: boolean[] = [];
    const renderer = {
      compileAsync: () => Promise.resolve(),
      // as three does: a forced shadow map is drawn, then left until it's forced again
      render: () => { seen.push(key.shadow.needsUpdate); key.shadow.needsUpdate = false; },
      getRenderTarget: () => null,
      setRenderTarget: () => {},
    } as unknown as WebGLRenderer;
    await warmInTurn(renderer, (r) => { r.render(scene, {} as never); r.render(scene, {} as never); r.render(scene, {} as never); });
    expect(seen).toEqual([true, false, false]);
  });
});
