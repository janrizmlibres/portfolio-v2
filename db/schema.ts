import { pgTable, text, jsonb, timestamp, customType } from "drizzle-orm/pg-core";

/** pgvector type — Drizzle doesn't ship a built-in for it. */
export const vector = customType<{ data: number[]; driverData: string }>({
  dataType() { return "vector(1536)"; },
  toDriver(value) { return `[${value.join(",")}]`; },
  fromDriver(value) {
    if (typeof value === "string") {
      return value.replace(/^\[/, "").replace(/\]$/, "").split(",").map(Number);
    }
    return value as unknown as number[];
  },
});

export const wikiChunks = pgTable("wiki_chunks", {
  id:             text("id").primaryKey(),
  sourcePath:     text("source_path").notNull(),
  title:          text("title"),
  type:           text("type").notNull(),
  tags:           text("tags").array(),
  textContent:    text("text").notNull(),
  textHash:       text("text_hash").notNull(),
  embedding:      vector("embedding"),
  embeddingModel: text("embedding_model").notNull(),
  metadata:       jsonb("metadata").notNull().default({}),
  sourceCommit:   text("source_commit"),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type WikiChunk = typeof wikiChunks.$inferSelect;
