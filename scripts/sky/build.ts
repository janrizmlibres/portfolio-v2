// Turns wiki_chunks rows into the sky: one star per chunk, placed by its
// embedding, in two layouts (PCA and seeded UMAP).
//
// The star data ships in the bundle and lives in the public repo, so a star
// holds an opaque id, a position and an opaque topic key, and nothing that
// names a page. The chunk-id → star-id mapping is for the server only and is
// kept apart. Chunks of confidential employers' pages appear in neither.
import { splitConfidential, type WikiPage } from "./confidential";
import { projectPCA, projectUMAP, seededRandom, type Point } from "./project";

export interface ChunkRow {
  id: string;
  source_path: string;
  embedding: number[];
}

export interface Star {
  id: string;
  x: number;
  y: number;
  z: number;
  topic: string;
}

export interface SkyLayout {
  version: 1;
  layout: "pca" | "umap";
  stars: Star[];
}

export interface Sky {
  layouts: { pca: SkyLayout; umap: SkyLayout };
  /** Server-only: which star each retrieved chunk lights up. */
  chunkStars: Record<string, string>;
  /** Local-only legend for writing topic labels. Names pages, so never written to the repo. */
  topics: { key: string; path: string; chunks: number }[];
  report: {
    rows: number;
    kept: number;
    excluded: { source_path: string; chunks: number; reason: string }[];
  };
}

/** Fisher–Yates with a seeded generator, so ids carry no alphabetical order. */
function shuffled<T>(items: T[], seed: number): T[] {
  const out = [...items];
  const random = seededRandom(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

const pad = (n: number, width: number) => String(n).padStart(width, "0");
const round = (v: number) => Math.round(v * 1e4) / 1e4;
const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
/** Code-point order; `localeCompare` depends on the ICU build and could reorder ids between machines. */
const byCodePoint = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export function buildSky({
  rows,
  pages,
  employers,
  seed,
}: {
  rows: ChunkRow[];
  pages: WikiPage[];
  employers: readonly string[];
  seed: number;
}): Sky {
  const { kept, excluded, employerNames } = splitConfidential(rows, pages, employers);
  const sortedKept = [...kept].sort((a, b) => byCodePoint(a.id, b.id));

  const starOf = new Map(shuffled(sortedKept, seed).map((row, i) => [row.id, `s${pad(i + 1, 3)}`]));
  const paths = [...new Set(sortedKept.map((r) => r.source_path))].sort();
  const topicOf = new Map(shuffled(paths, seed + 1).map((path, i) => [path, `t${pad(i + 1, 2)}`]));

  const vectors = sortedKept.map((r) => r.embedding);
  const layout = (name: "pca" | "umap", points: Point[]): SkyLayout => ({
    version: 1,
    layout: name,
    stars: sortedKept
      .map((row, i) => {
        const [x, y, z] = points[i]!;
        return { id: starOf.get(row.id)!, x: round(x), y: round(y), z: round(z), topic: topicOf.get(row.source_path)! };
      })
      .sort((a, b) => byCodePoint(a.id, b.id)),
  });

  const chunkStars = Object.fromEntries(sortedKept.map((r) => [r.id, starOf.get(r.id)!]));

  const words = employerNames.map(squash).filter((w) => w.length >= 3);
  const leaks = Object.keys(chunkStars).filter((id) => words.some((w) => squash(id).includes(w)));
  if (leaks.length > 0) {
    throw new Error(`The chunk mapping would name a confidential employer: ${leaks.join(", ")}`);
  }

  const countBy = <T>(items: T[], key: (t: T) => string) =>
    items.reduce((m, t) => m.set(key(t), (m.get(key(t)) ?? 0) + 1), new Map<string, number>());
  const chunksPerPath = countBy(sortedKept, (r) => r.source_path);
  const excludedPerPath = countBy(excluded, (e) => e.row.source_path);

  return {
    layouts: { pca: layout("pca", projectPCA(vectors)), umap: layout("umap", projectUMAP(vectors, seed)) },
    chunkStars,
    topics: [...topicOf]
      .map(([path, key]) => ({ key, path, chunks: chunksPerPath.get(path)! }))
      .sort((a, b) => byCodePoint(a.key, b.key)),
    report: {
      rows: rows.length,
      kept: kept.length,
      excluded: [...excludedPerPath].map(([source_path, chunks]) => ({
        source_path,
        chunks,
        reason: excluded.find((e) => e.row.source_path === source_path)!.reason,
      })),
    },
  };
}
