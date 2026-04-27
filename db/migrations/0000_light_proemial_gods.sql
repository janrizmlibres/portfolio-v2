CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "wiki_chunks" (
	"id" text PRIMARY KEY NOT NULL,
	"source_path" text NOT NULL,
	"title" text,
	"type" text NOT NULL,
	"tags" text[],
	"text" text NOT NULL,
	"text_hash" text NOT NULL,
	"embedding" vector(1536),
	"embedding_model" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_commit" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS wiki_chunks_embedding_idx
  ON wiki_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS wiki_chunks_type_idx
  ON wiki_chunks (type);

CREATE INDEX IF NOT EXISTS wiki_chunks_tags_idx
  ON wiki_chunks USING gin (tags);

CREATE INDEX IF NOT EXISTS wiki_chunks_metadata_idx
  ON wiki_chunks USING gin (metadata);
