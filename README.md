# portfolio-v2

A chat-first AI engineer portfolio. The landing page IS a chat with an agent that has read everything I've written.

[Live](https://janrizlibres.vercel.app) · [Redesign prototype](docs/design/2026-09-27-redesign-prototype.html)

## What this is

One page: a voyage through a sky of everything I've written, played by the scroll like a film.

1. **The wake-up.** Every load opens on Tycho, the site's guide, charging up while the first scene loads. A click wakes him and turns the sound on. The page's HTML is complete underneath from first paint.
2. **The voyage.** Hero, About, Work, Projects and Contact are scenes the camera flies through: his ship, the road of his roles, the projects' worlds, the ribbon of personal work, then out to the whole sky. The text is real HTML placed over the picture. Everything past the first scene loads after the wake.
3. **Tycho's bubble.** Ask Tycho anything: he answers in his bubble, the log keeps the conversation, the stars his answer read from light up, and he can take you to a section or point at a project.

Under reduced motion the film plays as stills; without WebGL it's a plain reading page.

The chat is powered by OpenAI GPT-4o via the Vercel AI SDK v6, retrieving from a **Supabase + pgvector** index of the [personal wiki](https://github.com/janrizmlibres/llm-wiki). The index is a snapshot of the wiki's last publish; nothing refreshes it now.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript 5
- Tailwind CSS v4
- GSAP 3.15+ (all motion: the film's clock, ScrollSmoother on the plain page)
- three.js (the sky and the voyage's 3D, loaded after first paint)
- Web Audio (the score and sound effects, one AudioContext)
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

The `wiki_chunks` table is a snapshot of the last publish from the [personal wiki](https://github.com/janrizmlibres/llm-wiki). The wiki's publisher was removed on 2026-08-31, so nothing writes to the table now; this repo's Drizzle schema and migrations describe it.

```bash
# Generate migration (only when schema changes)
pnpm db:generate
# Apply migration to your Supabase project
pnpm db:migrate
```

The chat won't return useful answers against an empty table, and neither repo can repopulate it today.

## Scripts

| Script | What |
|---|---|
| `pnpm dev` | Run Next.js dev server |
| `pnpm build` | Production build |
| `pnpm test` | Vitest unit/integration tests |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm test:e2e` | Playwright: the wake-up, the voyage, the warp, the bubble |
| `pnpm audio:export` | Render the score's stems and write `lib/audio/stems.json` |
| `pnpm db:generate` | Drizzle Kit — generate a migration from schema |
| `pnpm db:migrate` | Drizzle Kit — apply migrations |
| `pnpm lint` | ESLint |

## Architecture in 60 seconds

```
 first paint: complete HTML (the voyage's text) under the wake-up's loader
        │
        ▼  after first paint, lazily
 ┌──────────────────────┐      wake (click)      ┌──────────────────────────────┐
 │ the sky + the first  │ ─────────────────────► │ the voyage: the film played  │
 │ scene (three.js)     │                        │ by native scroll; later      │
 └──────────────────────┘                        │ scenes load after the wake   │
                                                 └──────────────┬───────────────┘
                     display content (lib/content/*,            │ Tycho's bubble
                     hand-authored) is the film's text          ▼ POST /api/chat
                                                         ┌──────────────┐
                                                         │ Vercel AI SDK│
                                                         │   GPT-4o     │
                                                         └──┬───────────┘
                                                            │ tool calls
                              ┌─────────────────────────────┼──────────────────────────┐
                              ▼                             ▼                          ▼
                     ┌─────────────────┐         ┌───────────────────┐      ┌───────────────────┐
                     │  search_wiki    │         │   scroll_to       │      │ highlight_project │
                     │  pgvector       │         │   the warp to a   │      │ Tycho points at   │
                     │  (lights stars) │         │   section         │      │ the project       │
                     └─────────────────┘         └───────────────────┘      └───────────────────┘
```

- Display content (Hero / About / Work / Projects / Contact) is hand-authored. The agent doesn't render these.
- RAG content is sourced separately from the wiki. The agent can answer deeper questions than what's on the page — that's a feature.
- localStorage `jrz-chat-v1` keeps the conversation per browser. No accounts.

## Adjacent wiki

- Repo: <https://github.com/janrizmlibres/llm-wiki>
- The wiki is where the chat's knowledge comes from, but it no longer publishes: its publisher (chunking, embedding and the DB upsert behind `pnpm publish`) was removed on 2026-08-31. `wiki_chunks` keeps the last publish.

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
