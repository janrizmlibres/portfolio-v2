/**
 * The voyage's bodies on screen, for the shared footprint registry (lib/film/footprints.ts): the stage adds each
 * scene's bodies here, and anything that keeps clear of them (Tycho) reads their footprints from the registry, never
 * from the scenes.
 * - A body's footprint is one box per drawn part: each mesh's bounding box, as it's posed, projected through the
 *   camera. Parts keep their own boxes, so a sprawling body (a spiral of frames) isn't one big square.
 * - A sprawling part (over FINE px across on screen, or reaching past the camera: a ring of modules merged into one
 *   mesh) is worked out finer: up to SAMPLES of its vertices, projected, cover the grid cells they fall in. A plain
 *   part (a slab, a card: PLAIN vertices or fewer) keeps its box, which its few corners would leave open.
 * - Only what's drawn counts: hidden parts (a culled body, a faded one its scene hides), lines and points (the route,
 *   the stars), anything behind the camera or reaching past it, and a body the scene says isn't shown.
 * - A point's footprint (a star's disc) comes from a function answering where it is and how big, in px.
 * The boxes are worked out only when read, at most once a frame, for the bodies in view.
 */
import { Box3, InstancedMesh, Matrix4, Vector3, type Mesh, type Object3D, type PerspectiveCamera } from "three";
import { keepFootprint, pointsFootprint, registerFootprints, type Rect } from "@/lib/film/footprints";

/** a part bigger than this on screen (px) is worked out from its vertices, not its box */
const FINE = 160;
/** at most this many of a sprawling part's vertices are projected */
const SAMPLES = 1500;
/** a part this plain (vertices) is a slab or a card: its box is its footprint, however big */
const PLAIN = 200;

type Body = { obj: Object3D; shown?: () => boolean; skip?: readonly Object3D[] };
type Spot = () => { x: number; y: number; r: number } | null;

/** `frame`: the frame's size in CSS px, as the camera draws it */
export function createBodyFootprints(camera: PerspectiveCamera, frame: () => { w: number; h: number }) {
  const bodies: Body[] = [], spots: Spot[] = [];
  const m = new Matrix4(), v = new Vector3(), box = new Box3();
  const meshes: Mesh[] = [];

  /** a part's footprint on screen, added to `out` */
  function project(mesh: Mesh, size: { w: number; h: number }, out: Rect[]) {
    let b: Box3 | null;
    if (mesh instanceof InstancedMesh) {
      // its instances move: their box is worked out afresh
      mesh.computeBoundingBox();
      b = mesh.boundingBox;
    } else {
      const g = mesh.geometry;
      if (!g.boundingBox) g.computeBoundingBox();
      b = g.boundingBox;
    }
    if (!b || b.isEmpty()) return;
    box.copy(b);
    // the part's corners into the camera's space, then onto the screen
    m.multiplyMatrices(camera.matrixWorldInverse, mesh.matrixWorld);
    let l = Infinity, t = Infinity, r = -Infinity, bt = -Infinity, past = false;
    for (let i = 0; i < 8; i++) {
      v.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).applyMatrix4(m);
      if (v.z > -camera.near) { past = true; break; }
      v.applyMatrix4(camera.projectionMatrix);
      const x = (v.x * 0.5 + 0.5) * size.w, y = (-v.y * 0.5 + 0.5) * size.h;
      if (x < l) l = x;
      if (x > r) r = x;
      if (y < t) t = y;
      if (y > bt) bt = y;
    }
    const plain = (mesh.geometry.attributes.position?.count ?? 0) <= PLAIN;
    if (!past && (plain || (r - l <= FINE && bt - t <= FINE))) {
      const k = keepFootprint({ l, t, r, b: bt }, size);
      if (k) out.push(k);
      return;
    }
    // sprawling, or reaching past the camera: from its vertices in front of the camera (an instanced part keeps its box)
    if (mesh instanceof InstancedMesh) {
      const k = !past && keepFootprint({ l, t, r, b: bt }, size);
      if (k) out.push(k);
      return;
    }
    const pos = mesh.geometry.attributes.position;
    if (!pos) return;
    const step = Math.max(1, Math.ceil(pos.count / SAMPLES));
    pts.length = 0;
    for (let i = 0; i < pos.count; i += step) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m);
      if (v.z > -camera.near) continue;
      v.applyMatrix4(camera.projectionMatrix);
      pts.push({ x: (v.x * 0.5 + 0.5) * size.w, y: (-v.y * 0.5 + 0.5) * size.h });
    }
    for (const k of pointsFootprint(pts, size)) out.push(k);
  }
  const pts: Array<{ x: number; y: number }> = [];

  function rects(): Rect[] {
    const out: Rect[] = [], size = frame();
    for (const body of bodies) {
      if (!body.obj.visible || (body.shown && !body.shown())) continue;
      meshes.length = 0;
      body.obj.traverseVisible((o) => {
        if ((o as Mesh).isMesh && !body.skip?.includes(o)) meshes.push(o as Mesh);
      });
      for (const mesh of meshes) project(mesh, size, out);
    }
    for (const s of spots) {
      const p = s();
      const k = p && keepFootprint({ l: p.x - p.r, t: p.y - p.r, r: p.x + p.r, b: p.y + p.r }, size);
      if (k) out.push(k);
    }
    return out;
  }

  const stop = registerFootprints(rects);
  if (process.env.NODE_ENV !== "production") Object.assign(window, { __bodies: { bodies, camera } });
  return {
    /**
     * a scene's body: its drawn parts count while it's visible (and `shown`, if given), all but those in `skip` (what's
     * drawn with it but isn't a subject: a line laid as a mesh, the setting)
     */
    add(obj: Object3D, o: { shown?: () => boolean; skip?: readonly Object3D[] } = {}) {
      bodies.push({ obj, shown: o.shown, skip: o.skip });
    },
    /** a point's footprint, in px: where it is and how far round it to keep clear, or null while it isn't up */
    addSpot(fn: Spot) {
      spots.push(fn);
    },
    rects,
    dispose: stop,
  };
}
