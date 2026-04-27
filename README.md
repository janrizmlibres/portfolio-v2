# portfolio-v2

A chat-first AI engineer portfolio. The landing page IS a chat with an agent that has read everything I've written.

[Live](https://janrizlibres.vercel.app) · [Spec](docs/superpowers/specs/2026-04-27-portfolio-v2-design.md) · [Visual prototype](docs/superpowers/design/2026-04-27-visual-prototype.html)

## What this is

This site has two states:

1. **State 1 — chat-first landing.** A centered prompt, suggested chips, no traditional portfolio sections.
2. **State 2 — activated.** After the visitor's first message, a GSAP timeline reveals the portfolio (Hero, About, Work, Personal Projects, Contact) alongside a persistent chat panel. Returning visitors land here directly.

The chat is powered by OpenAI GPT-4o via the Vercel AI SDK v6, retrieving from a shared **Supabase + pgvector** index that's populated by the [adjacent personal wiki](https://github.com/janrizmlibres/llm-wiki). The portfolio is one consumer of that index.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript 5
- Tailwind CSS v4
- GSAP 3.15+ (motion), `@gsap/react` (`useGSAP`), ScrollTrigger, ScrollToPlugin, Draggable
- Vercel AI SDK v6 (`ai` + `@ai-sdk/openai` + `@ai-sdk/react`)
- Drizzle ORM + `postgres-js` driver against Supabase Postgres + pgvector
- Upstash Redis + `@upstash/ratelimit`
- Vitest + React Testing Library, Playwright

## Local development

```bash
pnpm install
cp .env.example .env.local   # then fill in real values
pnpm dev
```

Open <http://localhost:3000>.

### Environment variables

| Var | Purpose |
|---|---|
| `OPENAI_API_KEY` | Chat completion + embeddings (`text-embedding-3-small`) |
| `SUPABASE_DB_URL` | Postgres connection. Use the **transaction-pooler** endpoint (`port 6543`) with a read-only role. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limiting + monthly cost-cap counter |
| `MONTHLY_COST_CAP_USD` | Soft cap on monthly OpenAI spend. Default `50`. |

### Database setup

The `wiki_chunks` table is shared with the [adjacent wiki publisher](https://github.com/janrizmlibres/llm-wiki). One repo owns the migration; both consume the same Supabase project.

```bash
# Generate migration (only when schema changes)
pnpm db:generate
# Apply migration to your Supabase project
pnpm db:migrate
```

The chat won't return useful answers until the wiki has run its `pnpm publish` script and populated the table.

## Scripts

| Script | What |
|---|---|
| `pnpm dev` | Run Next.js dev server |
| `pnpm build` | Production build |
| `pnpm test` | Vitest unit/integration tests |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm test:e2e` | Playwright happy path |
| `pnpm db:generate` | Drizzle Kit — generate a migration from schema |
| `pnpm db:migrate` | Drizzle Kit — apply migrations |
| `pnpm lint` | ESLint |

## Architecture in 60 seconds

```
┌─────────────┐    state transition (GSAP)
│  State 1    │ ─────────────────────────────► ┌─────────────┐
│  landing    │                                 │  State 2    │
└─────────────┘                                 │  portfolio  │
                                                └──────┬──────┘
                                                       │
                                       ┌───────────────┴───────────────┐
                                       │                               │
                              ┌────────▼─────────┐          ┌──────────▼──────────┐
                              │  display content │          │     chat panel       │
                              │  (lib/content/*) │          │  (components/chat)   │
                              │  hand-authored   │          │                      │
                              └──────────────────┘          └──────────┬───────────┘
                                                                       │ POST /api/chat
                                                                       ▼
                                                               ┌──────────────┐
                                                               │ Vercel AI SDK│
                                                               │   GPT-4o     │
                                                               └──┬───────────┘
                                                                  │ tool calls
                                       ┌──────────────────────────┼────────────────────────┐
                                       ▼                          ▼                        ▼
                              ┌─────────────────┐       ┌──────────────────┐    ┌──────────────────┐
                              │  search_wiki    │       │   scroll_to      │    │ highlight_project│
                              │  pgvector       │       │   GSAP scroll    │    │  GSAP pulse      │
                              │  (Supabase)     │       │   to section     │    │  on card         │
                              └─────────────────┘       └──────────────────┘    └──────────────────┘
```

- Display content (Hero / About / Work / Projects / Contact) is hand-authored. The agent doesn't render these.
- RAG content is sourced separately from the wiki. The agent can answer deeper questions than what's on the page — that's a feature.
- localStorage `jrz-chat-v1` persists chat history per-browser. No accounts.

## Adjacent wiki

- Repo: <https://github.com/janrizmlibres/llm-wiki>
- The wiki owns chunking + embedding + DB upsert via `pnpm publish`. It's a hard prerequisite for the chat to work.

## Deferred / out of scope

The spec captures these as future v2.x work, deliberately not built:

- Writing / Notes section
- Live AI demos ("show me how RAG works" with citation visualization)
- `send_contact_message` tool, Cal.com booking, GitHub activity tool
- CAPTCHA / Turnstile
- Server-side chat history persistence
- Multi-provider model picker

## License

[MIT](LICENSE) (when added).
