// Exports the sky: one star per published wiki chunk, placed by its embedding.
//
//   pnpm sky:export [--wiki ../llm-wiki] [--rows rows.json] [--out .]
//
// Reads wiki_chunks (id, source_path, embedding) in a read-only transaction,
// or a JSON array of those rows with --rows. Needs a checkout of the wiki repo
// to tell which pages are about a confidential employer. Writes:
//   public/sky/stars-pca.json, public/sky/stars-umap.json  star data, safe to ship
//   lib/sky/chunk-stars.json                               chunk id → star id, server only
// and prints the row counts, the excluded pages and the topic legend. The
// legend names pages, so it is printed and never written into the repo.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import postgres from "postgres";
import { CONFIDENTIAL_EMPLOYERS } from "@/lib/ai/system-prompt";
import { buildSky, type ChunkRow } from "./sky/build";

/** Changing the seed moves every star in the UMAP layout and reshuffles the ids. */
const SEED = 20260928;
const EMBEDDING_MODEL = "text-embedding-3-small";

const { values: args } = parseArgs({
  options: {
    wiki: { type: "string", default: "../llm-wiki" },
    rows: { type: "string" },
    out: { type: "string", default: "." },
  },
});

async function readRows(): Promise<{ rows: ChunkRow[]; total: number }> {
  if (args.rows) {
    const rows = JSON.parse(readFileSync(args.rows, "utf8")) as ChunkRow[];
    return { rows, total: rows.length };
  }
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL is not set.");
  const sql = postgres(url, { prepare: false, max: 1 });
  try {
    return await sql.begin("read only", async (tx) => {
      const [count] = await tx<{ total: number }[]>`SELECT count(*)::int AS total FROM wiki_chunks`;
      const raw = await tx<{ id: string; source_path: string; embedding: string }[]>`
        SELECT id, source_path, embedding::text AS embedding
        FROM wiki_chunks
        WHERE embedding_model = ${EMBEDDING_MODEL} AND embedding IS NOT NULL
        ORDER BY id`;
      const rows = raw.map((r) => ({ ...r, embedding: JSON.parse(r.embedding) as number[] }));
      return { rows, total: count?.total ?? 0 };
    });
  } finally {
    await sql.end({ timeout: 5 });
  }
}

function writeJson(path: string, data: unknown) {
  const full = resolve(args.out!, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, `${JSON.stringify(data)}\n`);
  console.log(`wrote ${path}`);
}

async function main() {
  const { rows, total } = await readRows();
  const wikiDir = resolve(args.wiki!);
  const pages = readdirSync(join(wikiDir, "wiki"), { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(".md"))
    .map((file) => join("wiki", file))
    .map((path) => ({ path, markdown: readFileSync(join(wikiDir, path), "utf8") }));

  const sky = buildSky({ rows, pages, employers: CONFIDENTIAL_EMPLOYERS, seed: SEED });

  writeJson("public/sky/stars-pca.json", sky.layouts.pca);
  writeJson("public/sky/stars-umap.json", sky.layouts.umap);
  writeJson("lib/sky/chunk-stars.json", sky.chunkStars);

  console.log(`\nrows in wiki_chunks: ${total}; with ${EMBEDDING_MODEL} embeddings: ${rows.length}`);
  console.log(`stars: ${sky.report.kept}; excluded chunks: ${sky.report.rows - sky.report.kept}`);
  for (const e of sky.report.excluded) console.log(`  - ${e.source_path} (${e.chunks}) — ${e.reason}`);
  console.log(`\ntopics (${sky.topics.length}):`);
  for (const t of sky.topics) console.log(`  ${t.key}  ${t.path} (${t.chunks})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
