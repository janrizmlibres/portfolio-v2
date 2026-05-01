# External Integrations
_Generated: 2026-05-01_

## AI / LLM

**Provider:** OpenAI via Vercel AI SDK v6

- **Chat model:** `gpt-4o` — invoked in `app/api/chat/route.ts` via `openai("gpt-4o")` from `@ai-sdk/openai`
- **Embedding model:** `text-embedding-3-small` (1536-dimensional) — invoked in `lib/ai/embed.ts` via direct `openai` SDK client
- **SDK:** Vercel AI SDK v6 (`ai ^6.0.168`, `@ai-sdk/openai ^3.0.53`, `@ai-sdk/react ^3.0.170`)
- **Streaming:** `streamText()` → `result.toUIMessageStreamResponse()` in the route handler
- **Tool calling:** `stopWhen: stepCountIs(4)` — max 4 agentic steps per request
- **Client wiring:** `DefaultChatTransport({ api: '/api/chat' })` connects the React client to the route
- **AI SDK v6 API surface in use:** `inputSchema` (not `parameters`), `stopWhen`, `toUIMessageStreamResponse()`, `sendMessage({ text })`, `chat.status`, `toolCall.input`, `convertToModelMessages()`

**Tools defined in `lib/ai/tools.ts`:**
| Tool | Purpose |
|------|---------|
| `search_wiki` | Vector similarity retrieval from `wiki_chunks` via pgvector |
| `scroll_to` | Emits event to scroll portfolio to a section (`about`, `work`, `projects`, `contact`) |
| `highlight_project` | Emits event to pulse-highlight a project card (`flowstack`, `pulsevr`, `mercado`) |

**System prompt:** `lib/ai/system-prompt.ts`

---

## Database

**Provider:** Supabase (managed PostgreSQL + pgvector extension)

- **ORM:** Drizzle ORM (`drizzle-orm ^0.45.2`)
- **Driver:** `postgres-js` (`postgres ^3.4.9`)
- **Connection:** Transaction-pooler endpoint, port 6543 — required for serverless; `prepare: false` set on the client
- **Client:** `db/client.ts` — singleton `drizzle(queryClient)` exported as `db`
- **Schema:** `db/schema.ts` — single table `wiki_chunks`
- **Migrations:** `db/migrations/` — managed by `drizzle-kit`
- **Role:** Read-only role for the portfolio consumer
- **Connection env var:** `SUPABASE_DB_URL`

**`wiki_chunks` table schema:**

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | |
| `source_path` | text | Path in the wiki repo |
| `title` | text | Nullable |
| `type` | text | e.g. `project`, `org`, `profile` |
| `tags` | text[] | Array |
| `text` | text | Chunk content |
| `text_hash` | text | Dedup key |
| `embedding` | vector(1536) | pgvector custom type |
| `embedding_model` | text | e.g. `text-embedding-3-small` |
| `metadata` | jsonb | Includes `routes.portfolio` routing hint |
| `source_commit` | text | Nullable |
| `updated_at` | timestamptz | |

---

## Vector / RAG

**Embedding model:** `text-embedding-3-small` (OpenAI, 1536 dimensions)

**Vector store:** pgvector extension on Supabase Postgres — cosine distance operator `<=>`

**Retrieval flow** (`lib/rag/retrieve.ts`):
1. Embed the user query via `embedQuery()` → `lib/ai/embed.ts` → OpenAI `embeddings.create`
2. Execute raw SQL via Drizzle: `1 - (embedding <=> $vec::vector) AS similarity`
3. Filter by `embedding_model = 'text-embedding-3-small'`, optional `type` and `tags` filters
4. Return top-k chunks (default k=6, max k=12)

**Content source:** The `wiki_chunks` table is populated by a separate repo (`llm-wiki`) — the portfolio is a read-only consumer. Consumer routing uses `metadata.routes.portfolio` (opaque JSONB), never hardcoded portfolio fields in the wiki publisher.

---

## Caching / Rate Limiting

**Provider:** Upstash Redis (REST API — `@upstash/redis ^1.37.0`)

**Rate limiting** (`lib/limits/rate-limit.ts`):
- Library: `@upstash/ratelimit ^2.0.8`
- Algorithm: Sliding window — 20 requests per IP per hour
- Redis key prefix: `jrz:chat`
- Fail-open: on Upstash error, returns `{ allowed: true, degraded: true }`

**Cost cap** (`lib/limits/cost-cap.ts`):
- Tracks monthly OpenAI spend in micro-cents via Redis `INCRBY`
- Redis key pattern: `jrz:cost:YYYY-MM` (40-day TTL for month rollover)
- Pricing reference: GPT-4o at $2.50/1M input tokens, $10.00/1M output tokens
- Cap configured via `MONTHLY_COST_CAP_USD` env var (default $10)
- Fail-open: on Redis error, returns `{ ok: true, degraded: true }`

**Both modules fail-open** — Upstash outage does not block the chat endpoint.

---

## Hosting / Deployment

**Platform:** Vercel (inferred from project structure, Next.js App Router, and `nodejs` route runtime)

**CI/CD:** Not configured — no GitHub Actions, CircleCI, or similar detected in repo

---

## Environment Variables

| Var | Purpose |
|-----|---------|
| `OPENAI_API_KEY` | Authenticates both chat (`gpt-4o`) and embedding (`text-embedding-3-small`) calls |
| `SUPABASE_DB_URL` | Postgres connection string — transaction-pooler, port 6543, read-only role |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint for rate limiting and cost cap |
| `UPSTASH_REDIS_REST_TOKEN` | Auth token for Upstash Redis REST API |
| `MONTHLY_COST_CAP_USD` | Soft monthly OpenAI spend cap in USD (default: 10) |

Reference: `.env.example` at repo root.

---

## Data Flow (text diagram)

```
Browser
  │
  │  POST /api/chat  (UIMessage[])
  ▼
app/api/chat/route.ts
  ├── checkRateLimit(ip)  ──────────────────► Upstash Redis
  │       sliding window 20 req/hr            (rate key: jrz:chat:{ip})
  │
  ├── hasBudget()  ────────────────────────► Upstash Redis
  │       monthly micro-cent counter          (cost key: jrz:cost:YYYY-MM)
  │
  ├── convertToModelMessages(messages)
  │
  └── streamText({ model: gpt-4o, tools, stopWhen: stepCountIs(4) })
            │                                     ▲
            │  tool call: search_wiki             │ embed query
            ▼                                     │
        lib/rag/retrieve.ts                lib/ai/embed.ts
            │                                     │
            │  embedQuery()  ──────────────────────┘
            │                          OpenAI text-embedding-3-small
            │
            │  SELECT ... FROM wiki_chunks
            │  ORDER BY embedding <=> $vec::vector
            ▼
        Supabase Postgres + pgvector
        (wiki_chunks table, populated by llm-wiki repo)
            │
            └── chunks returned to streamText → included in LLM context
                        │
                        │  tool call: scroll_to / highlight_project
                        ▼
                lib/tool-effects/ (event bus)
                → components/effects/ (GSAP handlers in browser)

  streamText response ──► toUIMessageStreamResponse()
        │
        ▼
  Browser (useChat / DefaultChatTransport)
        │
        ▼
  lib/chat/store.ts (localStorage: jrz-chat-v1)
```

---

## Webhooks & Callbacks

**Incoming:** None — no webhook endpoints defined.

**Outgoing:** None — all integrations are request/response (OpenAI, Supabase, Upstash).
