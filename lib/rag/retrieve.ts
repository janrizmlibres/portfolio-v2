import { sql, SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { embedQuery } from "@/lib/ai/embed";

/** Add a toString() to a SQL object so String(q) yields its JSON representation (for tests). */
function withToString<T>(query: SQL<T>): SQL<T> {
  (query as unknown as { toString(): string }).toString = () =>
    JSON.stringify(query);
  return query;
}

export interface RetrievedChunk {
  id: string;
  source_path: string;
  title: string | null;
  type: string;
  tags: string[];
  text: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export interface RetrieveOptions {
  query: string;
  type?: string;
  tags?: string[];
  k?: number;
}

export async function retrieveChunks(opts: RetrieveOptions): Promise<RetrievedChunk[]> {
  const { query: queryText, type, tags, k = 6 } = opts;
  try {
    const queryEmbedding = await embedQuery(queryText);
    const vec = `[${queryEmbedding.join(",")}]`;

    const query = withToString(sql`
      SELECT
        id,
        source_path,
        title,
        type,
        coalesce(tags, '{}') AS tags,
        text,
        metadata,
        1 - (embedding <=> ${vec}::vector) AS similarity
      FROM wiki_chunks
      WHERE embedding_model = 'text-embedding-3-small'
        ${type ? sql`AND type = ${type}` : sql``}
        ${tags && tags.length > 0 ? sql`AND tags && ${tags}` : sql``}
      ORDER BY embedding <=> ${vec}::vector
      LIMIT ${k}
    `);

    const rows = (await db.execute(query)) as unknown as RetrievedChunk[];
    return rows;
  } catch (err) {
    console.error("[rag] retrieve failed:", err);
    return [];
  }
}
