import { sql, SQL } from "drizzle-orm";
import { getDb } from "@/db/client";
import { embedQuery } from "@/lib/ai/embed";

/** Add a toString() to a SQL object so String(q) yields its JSON representation (for tests). */
function withToString<T>(query: SQL<T>): SQL<T> {
  (query as unknown as { toString(): string }).toString = () =>
    JSON.stringify(query);
  return query;
}

export interface RetrievedChunk {
  id: string;
  title: string | null;
  type: string;
  text: string;
  similarity: number;
}

export async function retrieveChunks({ query: queryText, k = 6 }: { query: string; k?: number }): Promise<RetrievedChunk[]> {
  try {
    const queryEmbedding = await embedQuery(queryText);
    const vec = `[${queryEmbedding.join(",")}]`;

    const query = withToString(sql`
      SELECT
        id,
        title,
        type,
        text,
        1 - (embedding <=> ${vec}::vector) AS similarity
      FROM wiki_chunks
      WHERE embedding_model = 'text-embedding-3-small'
      ORDER BY embedding <=> ${vec}::vector
      LIMIT ${k}
    `);

    // The ivfflat index has 100 lists over fewer than 100 rows, so pgvector's
    // default of probing one list returns 0–1 rows. Probing every list makes
    // the search exact. SET LOCAL lasts only for this transaction, which the
    // transaction pooler keeps on one connection.
    const rows = await getDb().transaction(async (tx) => {
      await tx.execute(withToString(sql`SET LOCAL ivfflat.probes = 100`));
      return (await tx.execute(query)) as unknown as RetrievedChunk[];
    });
    return rows;
  } catch (err) {
    console.error("[rag] retrieve failed:", err);
    return [];
  }
}
