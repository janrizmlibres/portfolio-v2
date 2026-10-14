/**
 * Every scene past the first loads under the wake-up's loader, and the count waits on it (ADR 0018), so the wake and
 * the film build nothing. It's built without costing the loader a frame:
 * - a scene's models come through `voyageLoader()`, fetched as soon as the stage is made, their geometry decoded in
 *   workers, and each parsed and built in a turn of its own (lib/film/turns.ts);
 * - a warm-up's draws are first compiled in parallel (three's `compileAsync`, which doesn't block on the driver), and
 *   only then drawn off screen, one draw a turn, every shadow map with the first, for its depth passes, so no frame
 *   waits on a shader compile;
 * - textures go up to the GPU one a turn.
 */
import { LoaderUtils, type Material, type Mesh, type Object3D, type Texture, type WebGLRenderer } from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { inTurn } from "@/lib/film/turns";

class VoyageLoader extends GLTFLoader {
  override load(url: string, onLoad: (gltf: GLTF) => void, _onProgress?: (e: ProgressEvent) => void, onError?: (err: unknown) => void) {
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`${url}: ${r.status}`);
        return r.arrayBuffer();
      })
      .then((data) =>
        inTurn(() => new Promise<void>((done) => {
          this.parse(data, LoaderUtils.extractUrlBase(url), (g) => { onLoad(g); done(); }, (e) => { onError?.(e); done(); });
        })),
      )
      .catch((e) => onError?.(e));
  }
}

let workers = false;
export function voyageLoader(): GLTFLoader {
  // the scenes' geometry is decoded off the main thread, in two workers, so the loader's frames don't wait on it
  if (!workers && typeof Worker !== "undefined") {
    workers = true;
    // eslint-disable-next-line react-hooks/rules-of-hooks -- meshopt's worker switch, not a React hook
    MeshoptDecoder.useWorkers(2);
  }
  return new VoyageLoader().setMeshoptDecoder(MeshoptDecoder);
}

type Draw = (scene: Parameters<WebGLRenderer["render"]>[0], camera: Parameters<WebGLRenderer["render"]>[1]) => void;

/** the renderer as it is, but drawing through `draw` */
function drawingWith(renderer: WebGLRenderer, draw: Draw): WebGLRenderer {
  return new Proxy(renderer, {
    get(target, key) {
      if (key === "render") return draw;
      const v = Reflect.get(target, key, target) as unknown;
      return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(target) : v;
    },
  });
}

/**
 * Warms up what `warm` draws (its own off-screen draws, bodies shown as it needs them), in turns: once with each draw
 * compiled in parallel instead, then, when every program is ready, each draw for real, one a turn, which uploads what's
 * left. A turn runs the whole warm-up (it shows and hides its bodies round each draw) but draws only its own draw.
 */
export async function warmInTurn(renderer: WebGLRenderer, warm: (r: WebGLRenderer) => void): Promise<void> {
  let draws = 0;
  await inTurn(async () => {
    const pending: Array<Promise<unknown>> = [];
    warm(drawingWith(renderer, (scene, camera) => { pending.push(renderer.compileAsync(scene, camera)); }));
    draws = pending.length;
    await Promise.all(pending);
  });
  for (let k = 0; k < draws; k++)
    await inTurn(() => {
      let i = 0;
      warm(drawingWith(renderer, (scene, camera) => {
        if (i++ !== k) return;
        // the first draws every shadow map, the dark keys' included (the light rig leaves theirs off), so their depth
        // passes compile here rather than when a key lights mid-film; once is enough for that
        if (k === 0) scene.traverse?.((o) => {
          const shadow = (o as { shadow?: { needsUpdate: boolean } }).shadow;
          if (o.castShadow && shadow) shadow.needsUpdate = true;
        });
        renderer.render(scene, camera);
      }));
    });
}

/**
 * Sends every texture `root`'s materials hold up to the GPU, one a turn, so none uploads the frame it's first drawn
 * (their programs compile with the whole scene's, in the stage's warm-up).
 */
export function uploadTextures(renderer: WebGLRenderer, root: Object3D): Promise<void> {
  const all = new Set<Texture>();
  root.traverse((o) => {
    const m = (o as Mesh).material as Material | Material[] | undefined;
    for (const mat of m ? (Array.isArray(m) ? m : [m]) : [])
      for (const v of Object.values(mat)) {
        const t = v as Texture | null;
        if (t?.isTexture && !t.isRenderTargetTexture) all.add(t);
      }
  });
  return Promise.all([...all].map((t) => inTurn(() => renderer.initTexture(t)))).then(() => {});
}
