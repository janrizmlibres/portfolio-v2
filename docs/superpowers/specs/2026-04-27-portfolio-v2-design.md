# Portfolio v2 — Design Spec

**Date:** 2026-04-27
**Author:** Janriz Libres (with Claude)
**Status:** Draft — pending user review before frontend-design phase

---

## 1. Context & goals

This is a redesign of [janrizlibres.vercel.app](https://janrizlibres.vercel.app) (v1 — Vite SPA, "Full-stack Developer" positioning). v2 has two strategic shifts:

1. **Reposition** as **AI Engineer**, not full-stack. The user's actual work for the past year (Athena context-aware assistant, MCP server, Mem0-backed memory, AI-assisted crawlers, LLM data pipelines) is AI engineering; v1's framing undersold it.
2. **The site IS the demo.** Audience is **peers / the AI engineering community**. The portfolio doesn't just describe AI work — it ships AI as a first-class interaction. Recruiters and clients are secondary; this is a credibility platform for peers.

A native AI chat interface, with retrieval over the user's personal LLM-friendly knowledge base, is the centerpiece. Visitors interact with the chat first; the traditional portfolio sections become a secondary surface that the chat can drive.

## 2. Tech stack

- **Framework:** Next.js 16.2.4 (App Router), React 19.2.4, TypeScript 5
- **Styling:** Tailwind CSS v4 (already scaffolded), small custom design system
- **Animation:** GSAP — `gsap`, `@gsap/react` (`useGSAP` hook), ScrollTrigger, ScrollToPlugin. Replaces v1's `motion`/framer-motion. (User preference, captured in memory.)
- **AI SDK:** Vercel AI SDK (`ai`, `@ai-sdk/openai`)
- **LLM:** OpenAI GPT-4o for chat completion; `text-embedding-3-small` (1536d) for embeddings
- **DB:** Supabase Postgres + pgvector (free tier: 500MB DB, pgvector built-in, dashboard, auto-pauses after 7 days inactivity)
- **ORM:** Drizzle (good pgvector support, type-safe)
- **Rate limiting:** Upstash Redis + `@upstash/ratelimit` (free tier)
- **Hosting:** Vercel. `/api/chat` runs Node runtime (not edge — Drizzle/pgvector compatibility).
- **Package manager:** pnpm (already configured)

## 3. Two-state UX flow

The site has two visually distinct states. State is per-browser, persisted in localStorage.

### State 1 — first-visit landing (chat-first)

A visitor with no prior chat history sees a near-empty hero centered on the screen:

- Greeting: `Hi, I'm Janriz. An AI Engineer.` Followed by a prompt invitation: `Instead of scrolling, just ask.`
- A single full-width input field
- 4 suggested-prompt chips below the input — clicking a chip *sends it as a message*, no extra step. Friction-free entry. Default chips: `Show me your projects` · `What's your stack?` · `Tell me about Athena` · `Are you available?`
- Quiet nav at top (logo + minimal links to About / Work / Projects / Contact, visually de-emphasized; the chat is the primary CTA)

This state is the "elevator pitch" — visitors are coerced gently into interacting with the chat instead of reading a static page.

### State 2 — activated layout (post-first-message)

The first message — typed or from a chip — flips state. A GSAP transition animates:

- Hero collapses to its compact form (top of the page)
- Portfolio sections fade in below
- Chat panel slides in from the right (desktop) or up from the bottom (mobile)

Layout (desktop):

- **Main column** (~70%, left): traditional scrollable portfolio with sections
- **Chat panel** (~30%, right): persistent vertical chat with input, history, and a "Clear chat" affordance in the header

Returning visitors with `localStorage` indicating prior activation land **directly in State 2** — no re-onboarding.

### AI-driven autoscroll

When the agent's response is about a topic that maps to a portfolio section, it emits a `scroll_to(section)` tool call. The main column smoothly scrolls to that section (GSAP ScrollToPlugin); the section pulses briefly to confirm the focus shift. If no section maps, the chat just answers in place.

## 4. Section design (display side, hand-authored)

Sections rendered as JSX in the portfolio repo. **Not** sourced from the wiki — see §6 for the display vs RAG split.

### 4.1 Hero

Carries v1's signature: dark theme, large display type with serif italic accents (Georgia), monospace for tech labels.

- Headline: `AI Engineer` rendered in v1's `large-text` style, italicized accent
- Tagline: 1–2 lines about what the user builds
- **Currently strip** at the bottom of the hero — single row, monospace, low chrome:
  - `Stack:` Next.js · Vercel AI SDK · OpenAI · pgvector · MCP
  - `Open to:` AI eng roles · agent eval consults
- The stack/open-to row is hand-authored in a small TS data file; updated when reality changes

### 4.2 About

Short bio. 2–3 paragraphs maximum. Carries the user's personal voice. Hand-authored copy, not synced from `wiki/me.md` (the wiki version may be richer; about-section is curated for the page).

### 4.3 Professional Work

Tabbed list (left column = project titles, right column = active project detail) — same pattern as v1's `ProfessionalWork.tsx`. Projects covered:

- Athena (AI Chat Assistant — MCP, Mem0)
- Counselor Dashboard
- Crawler Dashboard
- AI-Assisted Crawler
- Data Maintenance Pipeline
- E2E Testing Suite (Playwright)
- Performance Testing Suite (k6)

**NDA constraint:** No screenshots, no proprietary specifics. The tooltip from v1 (`Due to NDA…`) carries forward. Copy stays at the implementation-pattern level.

### 4.4 Personal Projects

Public projects with screenshots, demo links, and source code — the tangible "show, don't tell" complement to the NDA-blocked Professional Work section. Carries forward v1's three:

- **FlowStack** — TypeScript / Next.js / MongoDB / Tailwind. StackOverflow clone with NextAuth.
- **PulseVR** — TypeScript / React / Tailwind. Responsive landing page for a fictional VR startup.
- **Mercado** — TypeScript / TanStack / Nest.js / Postgres / Docker. Type-safe e-commerce frontend with GraphQL, cart, checkout, admin dashboard.

Layout pattern: card grid (or vertical stack) showing project name, tech stack chips, short description, screenshot, and demo + repo links. **Real screenshots are required here** — this section's job is to give a visitor something concrete to look at. Existing `src/assets/{flow-stack,mercado,pulsevr}/` images carry over from v1.

This section is positioned *after* Professional Work, so the narrative flows: "here's what I do at work (NDA-limited)" → "here's what I've shipped publicly that I can show you in detail."

### 4.5 Contact

Email + LinkedIn + GitHub. Lightweight. Optional Cal.com link if user wants to add it (decide during frontend-design).

### Removed from v1 / deferred

- **Socials marquee** — filler. Removed.
- **Writing / Notes** — strong signal for peer audience but adds CMS scope. **Deferred to future v2.x.**
- **Now / Currently** as a full section — NDA prevents disclosing what the user is currently building. The Hero strip captures the salvageable parts (stack, open-to). Full section deferred indefinitely.

## 5. Visual direction

**Direction B — evolve v1.** Carry forward the bones; layer AI-product motifs.

### Carried forward (v1 → v2)

- Dark theme (near-black background, near-white text, neutral grays)
- Display type: large headlines, serif italic accents (Georgia), monospace for technical labels
- Generous spacing
- Two-color emphasis (light + violet/indigo accent for AI-related elements)

### New motifs (added in v2)

- Subtle ambient gradient on the chat panel border (signals "live")
- Agent "thinking" pulse — small dot indicator when the LLM is generating
- Faint code-grain or scrolling-text texture in hero background (very low opacity — atmosphere, not focal)
- Tool-call surfacing in the chat — when the agent calls `search_wiki` or `scroll_to`, render a small italic line ("↻ search_wiki: …") so the visitor sees the agent reasoning. **This is the demo signal.**

The frontend-design skill (run after this spec is approved) will finalize the specific palette, type scale, motion curves, and section layouts.

## 6. RAG content pipeline

### Display vs RAG split

Two separate content tracks:

- **Display content** (Hero / About / Work / Contact) — hand-authored TS/TSX in the portfolio repo. Concise, design-tunable.
- **RAG content** (chat agent's knowledge base) — sourced from the user's personal wiki at `/Users/janlibs/dev/llm-wiki/`. Richer, longer, structured.

The agent can answer **deeper** questions than what's visible on the page (subtle but real "AI engineer" signal). Visitor reads the project card → asks the chat for implementation details → agent retrieves from the wiki.

### Wiki as publisher

The wiki owns chunking + embedding + DB upsert. Portfolio is one consumer; future consumers (CLI agents, MCP servers, Obsidian plugins) may share the same DB.

**Decoupling principle:** Wiki doesn't know about specific consumers. It knows about a shared embedding infra layer. Consumer-specific fields are passed through as opaque JSONB metadata.

### Wiki frontmatter convention

```yaml
---
type: project              # existing wiki convention
public: true               # NEW — opts a page into the published index. Default: false.
routes:                    # NEW — opaque to wiki, used by consumers
  portfolio: projects/athena
---
```

A separate pass after spec approval will identify which wiki pages should get `public: true` (Claude proposes a list; user reviews and applies).

### Wiki side: `pnpm publish` (in the wiki repo)

A new script `scripts/publish-embeddings.ts` in `llm-wiki/`:

1. Scans `wiki/` for pages with `public: true`
2. Strips wiki noise (wikilinks `[[orgs/foo|Foo]]` → `Foo`; per-claim footnotes `[^id]:`; section-level `## Sources` blocks)
3. Chunks paragraph-aware, ~300–500 tokens per chunk
4. Hashes each chunk's text (sha256)
5. For each chunk: if `(id, text_hash)` matches an existing row in `wiki_chunks`, skip embedding (cost saving on no-op edits)
6. Embeds new/changed chunks via OpenAI `text-embedding-3-small`
7. Upserts to `wiki_chunks`, sets `source_commit` to current wiki HEAD
8. Deletes rows whose `source_path` is no longer present or no longer `public: true`

### DB schema (Supabase Postgres + pgvector)

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE wiki_chunks (
  id              TEXT        PRIMARY KEY,         -- "projects/athena#0"
  source_path     TEXT        NOT NULL,            -- "projects/athena.md"
  title           TEXT,
  type            TEXT        NOT NULL,            -- mirrors wiki frontmatter `type`
  tags            TEXT[],                          -- from frontmatter
  text            TEXT        NOT NULL,
  text_hash       TEXT        NOT NULL,            -- sha256, used to skip re-embedding
  embedding       vector(1536),
  embedding_model TEXT        NOT NULL,            -- "text-embedding-3-small"
  metadata        JSONB       NOT NULL DEFAULT '{}',  -- frontmatter passthrough; consumer-specific routes
  source_commit   TEXT,                            -- wiki commit SHA at last embed
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX wiki_chunks_embedding_idx
  ON wiki_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX wiki_chunks_type_idx     ON wiki_chunks (type);
CREATE INDEX wiki_chunks_tags_idx     ON wiki_chunks USING gin (tags);
CREATE INDEX wiki_chunks_metadata_idx ON wiki_chunks USING gin (metadata);
```

**Auth model (Supabase):**
- Wiki side: Supabase service-role key (full DB write) in `llm-wiki/.env.local`
- Portfolio side: a dedicated read-only Postgres role (created via migration; no Supabase auth or RLS needed since this is server-side only). Connection string in Vercel env. Use Supabase's transaction-pooler endpoint (port 6543) for the portfolio's serverless connections; direct connection (port 5432) for the wiki publisher's batch upserts.

**Cost characteristics:** ~50 wiki pages × ~3 chunks/page × ~500 tokens × $0.02/1M tokens = ~$0.001 per full re-embed. Hash-skip means typical edits cost ~$0. Storage: ~150 chunks × ~6KB embedding + ~500B text = ~1MB total.

### Portfolio side: retrieval at request time

The `/api/chat` route handler:

1. Receives the user message + chat history
2. Calls the LLM with tool definitions (see §7)
3. When LLM calls `search_wiki(query, type?, tags?, k?)`:
   - Embed `query` via OpenAI
   - Run pgvector cosine similarity against `wiki_chunks`, filtered by `embedding_model = 'text-embedding-3-small'` and any provided `type`/`tags`
   - Return top-K rows
4. LLM composes the answer; may call `scroll_to` or `highlight_project` alongside the text response
5. Tool calls and assistant text are streamed to the client via Vercel AI SDK

## 7. Chat agent design

### Model

- **Chat:** OpenAI GPT-4o via `@ai-sdk/openai`. Streaming on.
- **Embeddings:** OpenAI `text-embedding-3-small` (1536d). Used both for index-time (wiki publisher) and query-time (chat handler).

### Capability scope

**Scope = B from brainstorming:** RAG + UI tools. Not C (full agent with side effects like `send_contact_message`, live AI demos). C is captured in §11 as deferred.

### Tool surface

```ts
type Tools = {
  search_wiki: (args: { query: string; type?: string; tags?: string[]; k?: number }) => Chunk[];
  scroll_to:   (args: { section: string }) => { ok: true };
  highlight_project: (args: { slug: string }) => { ok: true };
};
```

- **`search_wiki`** — agentic RAG. The LLM decides when to search and with what filters. Multi-step queries supported (e.g., search "memory" then search "MCP" to compose an answer about Athena's memory architecture). Visible to the user as a small italic tool-call line in the chat. **This visibility is the demo.**
- **`scroll_to`** — emits a section slug; client-side React hook listens for tool events and runs GSAP ScrollToPlugin to that section's anchor.
- **`highlight_project`** — pulse-highlights a project card. GSAP timeline.

External links (GitHub, demos) are emitted as markdown links in the assistant's response — no tool needed, no auto-redirect.

### System prompt (sketch)

The system prompt establishes:

- The agent is the user's portfolio's representative — speaks in the user's voice, knows about the user's work
- It must call `search_wiki` before making claims about the user's projects/work
- It should call `scroll_to` when its answer is about a section the visitor can read on the page
- It should never invent projects, dates, or facts not in retrieval results
- It should be brief — chat-style, not essay-style
- It shouldn't break character; the visitor is talking to "the site," not to ChatGPT

Final system prompt copy is iterated during implementation; spec just defines the contract.

## 8. Persistence & state

### localStorage shape

Single key, browser-scoped:

```ts
const KEY = 'jrz-chat-v1';

interface ChatState {
  activated: boolean;            // determines State 1 vs State 2 on landing
  messages: ChatMessage[];       // full conversation history
  updatedAt: string;             // ISO timestamp
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: { name: string; args: object }[];
  createdAt: string;
}
```

- Survives reloads, navigation, browser restarts.
- New device or incognito → fresh State 1.
- "Clear chat" affordance in the chat panel header → resets `messages` to `[]`, sets `activated = false`, returns to State 1 with a smooth GSAP reverse-transition.

### No accounts

Friction kills the chat-first promise. No sign-in, no email gate, no CAPTCHA in v2. If abuse becomes real later, Cloudflare Turnstile is a 2-hour add.

### Server-side persistence

None for chat history. Only:

- `wiki_chunks` table (RAG content, populated by the wiki publisher)
- Upstash Redis counters for rate-limiting (see §9)
- A small `usage_log` table or Redis counter for monthly cost tracking

## 9. Rate limiting & cost control

### Per-IP rate limit

- **Stack:** Upstash Redis + `@upstash/ratelimit`
- **Policy:** sliding window, 20 messages / hour / IP
- **On exceed:** server returns 429; UI displays a calm message in the chat panel: "you've hit the rate limit — try again in N minutes, or email me at <email>"
- **Identifier:** IP from `x-forwarded-for`. No fingerprinting.

### Global monthly cost cap

- Default cap: **$50/month** OpenAI usage (configurable via env var)
- Implementation: each `/api/chat` request adds the API response's `usage.total_tokens × token_price` to a Redis counter keyed by `usage:YYYY-MM`
- On request: if counter ≥ cap, server returns a graceful degradation message: "the agent's on a budget right now — happy to chat directly at <email>"
- Reset: counter rolls over on the 1st of each month

### Why this set fits

- Anonymous bots can't burn the budget — IP cap stops a single source from running rampant
- Coordinated bot networks could still chip away, but the global cap is a hard ceiling
- Worst case: degraded UX for ~hours until next month or until user lifts the cap. No surprise OpenAI bill.

## 10. Animation & visual motion (GSAP)

User strongly prefers GSAP for this project. Target the following effects (specifics finalized in frontend-design phase):

- **State 1 → State 2 transition:** orchestrated GSAP timeline (~600–900ms): hero collapses, portfolio sections stagger-fade in, chat panel slides into place.
- **Scroll-driven entrance animations** for portfolio sections (ScrollTrigger): subtle fade + translate as sections enter the viewport.
- **AI-driven autoscroll** (`scroll_to` tool call): ScrollToPlugin with a custom easing curve so it feels "intentional" — not the browser's default `scrollIntoView`.
- **Project card highlight pulse** (`highlight_project`): timeline that briefly enlarges + glows the targeted card.
- **Agent "thinking" pulse:** small dot that pulses while the LLM is streaming.
- **Hero ambient motion:** very subtle drifting gradient or grain texture, low FPS, low opacity. Atmosphere, not focal.

All animations respect `prefers-reduced-motion`. Reduced-motion variant: instant transitions, no autoscroll easing (uses native scroll instead), no ambient hero motion.

**Skill use during implementation:** invoke any GSAP-specific skills available via the `Skill` tool when implementing animations (the user has indicated GSAP skills are installed). At minimum, use `frontend-design` to lock the motion language (curves, durations, sequencing) before writing GSAP code, and fetch current GSAP API docs via context7 since APIs evolve. Do not implement motion ad-hoc — invoke the relevant skills before writing animation code.

## 11. Out of scope (deferred to future v2.x)

These were considered and explicitly deferred:

- **Writing / Notes section** — strong peer-audience signal but adds CMS scope. Defer.
- **Live AI demos** ("show me how RAG works" → live retrieval visualization with citation highlights) — high signal, high effort. Defer.
- **`send_contact_message` tool** — agent composes + sends a contact email. Trust-and-safety implications. Defer.
- **Cal.com booking integration** — `book_call` tool. Defer; static link in Contact section is enough.
- **Live GitHub activity tool** — agent fetches recent commits when asked. Defer.
- **Talking-to-Athena proxy** — visitor talks to the user's actual MCP server through this site. Defer.
- **Multi-provider model picker** — model selection pill. Defer.
- **CAPTCHA / Turnstile** — only adds when abuse becomes real.
- **Server-side chat history persistence** — no compelling reason yet. Defer until accounts are wanted.
- **Quantized embeddings or alternate vector stores** — unnecessary at current content scale.

## 12. Mobile pattern

The chat side panel doesn't fit on mobile. Mobile uses **bottom-sheet** pattern:

- State 1 on mobile: full-screen chat (no traditional sections visible).
- State 2 on mobile:
  - Portfolio sections fill the main area
  - Chat lives in a bottom sheet, partial-height (~35% of viewport) by default
  - Drag handle at the top of the sheet — drag up to expand to full screen, drag down to minimize
  - Sheet has the same content as the desktop panel: history, input, "Clear chat"
- Implementation: GSAP-driven sheet with momentum drag (Draggable plugin + a small physics curve). Avoid third-party sheet libraries unless GSAP genuinely can't deliver — keeping motion in one library matters for visual consistency.

## 13. Error handling

| Failure | Response |
|---|---|
| OpenAI API error / timeout | Stream a friendly error chunk: "Hmm, I lost the thread — try again." Log server-side. |
| pgvector / Supabase DB unreachable | Tool call `search_wiki` returns empty array. Agent responds with: "I can't reach my notes right now — happy to answer from general knowledge though." |
| Rate-limit hit | UI shows the rate-limit message in chat. Input disabled until next hour. |
| Cost cap hit | UI shows the cost-cap message. Input disabled until next month. |
| Invalid `scroll_to` section slug | Client ignores the tool call silently. Logged for telemetry. |
| `localStorage` unavailable (incognito with restrictions) | Chat works in-memory only; reload returns to State 1. Banner: "Chat memory disabled in this browser session." |
| Wiki publish fails partway | Idempotent — re-run completes the upsert. No half-state surfaces to the chat (rows are upserted atomically per chunk). |

## 14. Testing approach

This is a personal portfolio. Pragmatic testing only:

- **Unit:** retrieval ranking (given a fixture index, top-K results for known queries). Chunking and stripping logic (input markdown → expected chunks).
- **Integration:** `/api/chat` happy path — a recorded fixture conversation reproduces, tool calls fire as expected, streaming shape is valid.
- **E2E (Playwright, lightweight):** State 1 lands; clicking a chip transitions to State 2; sending a message scrolls to the right section; "Clear chat" returns to State 1. Run on CI.
- **No coverage targets.** Tests cover the things that would silently break (retrieval drift, transition state machine, persistence round-trip).
- **Accessibility:** axe-core run in CI. `prefers-reduced-motion` honored for all GSAP animations.

## 15. Implementation workflow

Per user preference, the path is **brainstorm → spec → frontend-design → writing-plans → execute** (not the default brainstorm → writing-plans).

1. **Spec written** (this document) → user review
2. **Frontend-design skill** — finalizes UI design: type scale, palette, exact section layouts, GSAP motion curves, mobile-specific sheet behavior. Output: a design artifact (visual + structural) that complements this spec.
3. **Writing-plans skill** — produces a step-by-step implementation plan based on the spec + frontend-design output.
4. **Implementation** — execute the plan.

Adjacent work that runs alongside the plan execution:

- **`public: true` flagging pass** on the wiki — Claude proposes pages; user reviews and applies. Independent of portfolio implementation; can happen any time before the first sync.
- **Wiki-side `pnpm publish` script** — implemented in the `llm-wiki` repo. Lives outside this repo's plan but is a hard prerequisite for the chat to work.

## 16. Repository changes summary (for the implementation plan)

A non-exhaustive list of what'll change in `portfolio-v2/`:

- **Add:** `gsap`, `@gsap/react`, `ai`, `@ai-sdk/openai`, `drizzle-orm`, `drizzle-kit`, `postgres` (or `@neondatabase/serverless`), `@upstash/redis`, `@upstash/ratelimit`
- **Drop / replace:** the default Create-Next-App scaffold in `app/`
- **New directories:** `components/` (sectioned), `app/api/chat/`, `lib/ai/`, `lib/db/`, `lib/state/` (localStorage helpers + chat state), `data/` (display content TS files)
- **Schema migration:** Drizzle migration files for the `wiki_chunks` table (the table is shared with the wiki publisher; portfolio holds the read-only consumer side, but the migration lives in this repo for ergonomics — wiki publisher imports the type).
- **Env vars:** `OPENAI_API_KEY`, `SUPABASE_DB_URL` (read-only role, transaction-pooler endpoint), `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `MONTHLY_COST_CAP_USD` (default 50)
- **Adjacent repo (`llm-wiki/`):** `scripts/publish-embeddings.ts` + its env vars (`SUPABASE_DB_URL` write role, `OPENAI_API_KEY`)

Wiki-side changes are tracked separately in the wiki repo; this spec mentions them only for context.

---

## Out-of-spec notes for the next phase

- The frontend-design phase will benefit from the visual mockups already produced during brainstorming (in `.superpowers/brainstorm/`). They establish the basic feel; frontend-design refines.
- Confirm `.superpowers/` is in `.gitignore` (it is, as of 2026-04-27).
- The decision to use OpenAI (over Claude) is locked. Revisit if model performance for tool-using on small RAG contexts disappoints.
