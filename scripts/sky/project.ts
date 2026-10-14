// Squeezes 1536-d chunk embeddings into 3D star positions. Both layouts are
// deterministic: PCA has no randomness, and UMAP draws only from a seeded
// generator. The library versions are pinned exactly because a different UMAP
// release can move every star even with the same seed.
import { PCA } from "ml-pca";
import { UMAP } from "umap-js";

export type Point = [number, number, number];

/** mulberry32: a small, fast PRNG that repeats exactly for a given seed. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Centres the cloud on the origin and scales it so the farthest star sits at
 * radius 1. Each axis is flipped, if needed, so its most extreme point is
 * positive; otherwise an SVD sign flip could mirror the sky between runs.
 */
function normalise(points: number[][]): Point[] {
  const means = [0, 1, 2].map((axis) => points.reduce((s, p) => s + p[axis]!, 0) / points.length);
  const centred = points.map((p) => means.map((mean, axis) => p[axis]! - mean));
  for (const axis of [0, 1, 2]) {
    const extreme = centred.reduce((best, p) =>
      Math.abs(p[axis]!) > Math.abs(best[axis]!) ? p : best,
    );
    if (extreme[axis]! < 0) for (const p of centred) p[axis] = -p[axis]!;
  }
  const maxRadius = Math.max(...centred.map((p) => Math.hypot(p[0]!, p[1]!, p[2]!)));
  return centred.map((p) => p.map((v) => v / maxRadius) as Point);
}

export function projectPCA(vectors: number[][]): Point[] {
  const pca = new PCA(vectors, { method: "SVD", center: true, scale: false });
  return normalise(pca.predict(vectors, { nComponents: 3 }).to2DArray());
}

const cosineDistance = (a: number[], b: number[]) => {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  return 1 - dot / Math.sqrt(na * nb);
};

export function projectUMAP(vectors: number[][], seed: number): Point[] {
  const umap = new UMAP({
    nComponents: 3,
    nNeighbors: Math.min(15, vectors.length - 1),
    minDist: 0.1,
    distanceFn: cosineDistance,
    random: seededRandom(seed),
  });
  return normalise(umap.fit(vectors));
}
