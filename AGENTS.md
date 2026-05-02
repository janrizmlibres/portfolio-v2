# AGENTS.md

> **For agentic workers (Claude Code, Codex, etc.) opening this repo.**

## Stack overview

- **Next.js 16.2.4** (App Router). This is NOT the Next.js you may have seen before — APIs and conventions differ from older versions. Read `node_modules/next/dist/docs/` before writing routing or server-component code; heed deprecation notices.
- React 19.2.4 + TypeScript 5
- Tailwind CSS v4 (`@theme` block in `app/globals.css`)
- **Animation: GSAP only.** Never reach for framer-motion, motion, react-spring, or CSS-only motion when GSAP is the right tool. Use `@gsap/react`'s `useGSAP` hook in client components. Plugins are registered once via `lib/gsap/register.ts`. Fetch GSAP API docs via context7 when in doubt — APIs evolve.
- **Vercel AI SDK v6** (`ai`, `@ai-sdk/openai`, `@ai-sdk/react`) for chat streaming. Note v6 API differs from older docs: `inputSchema` (not `parameters`), `stopWhen: stepCountIs(N)` (not `maxSteps`), `toUIMessageStreamResponse()` (not `toDataStreamResponse()`), `sendMessage({ text })` (not `append`), `chat.status` (not `isLoading`), `toolCall.input` (not `toolCall.args`). Use `DefaultChatTransport({ api: '/api/chat' })` to wire the client to the route handler.
- **OpenAI** GPT-4o for chat, `text-embedding-3-small` (1536d) for embeddings.
- **Drizzle ORM** + `postgres-js` driver against **Supabase Postgres + pgvector**. Use the **transaction-pooler endpoint (port 6543)** for serverless connections — and `prepare: false` on the postgres client. The `wiki_chunks` table is shared with the adjacent `llm-wiki` repo's publisher.
- **Upstash Redis** + `@upstash/ratelimit` for per-IP rate limiting and a monthly cost cap. Both modules fail-open with `degraded: true` on Upstash error.

## Project structure

| Path | What lives here |
|---|---|
| `app/` | Next.js App Router routes (`page.tsx`, `layout.tsx`, `globals.css`, `api/chat/`) |
| `components/state1/` | Chat-first landing UI (the State 1 screen visitors see first) |
| `components/state2/` | Activated portfolio + sections (Hero, About, Work, Projects, Contact) |
| `components/chat/` | Chat panel (desktop sticky rail + mobile bottom sheet), MessageList, ChatInput, provider |
| `components/ui/` | Design primitives (Eyebrow, SectionHead, AmbientBackdrop) |
| `components/effects/` | Tool-effect handlers (`scroll_to`, `highlight_project` listeners running GSAP) |
| `lib/content/` | Hand-authored display content (profile, work timeline, projects, contact). NOT sourced from the wiki — display vs RAG is split. |
| `lib/chat/` | Client chat state (localStorage-backed), types, provider |
| `lib/ai/` | System prompt, tool definitions, OpenAI embed helper |
| `lib/rag/` | pgvector retrieval module |
| `lib/limits/` | Rate limit + cost cap modules |
| `lib/gsap/` | Plugin registration, `useTypewriter`, state transition helpers |
| `lib/tool-effects/` | Typed event bus for chat → UI side effects |
| `db/` | Drizzle schema (`wiki_chunks`), migrations, client |
| `docs/superpowers/specs/` | Approved design spec |
| `docs/superpowers/design/` | Design tokens doc + visual prototype HTML |
| `docs/superpowers/plans/` | Implementation plan |
| `tests/e2e/` | Playwright tests |

## Two-state UX

The site has two visually distinct states. Visitor state is per-browser, persisted in `localStorage` under `jrz-chat-v1`.

- **State 1** — first visit. Chat-first landing: centered prompt, suggested chips, no portfolio sections visible.
- **State 2** — activated. Portfolio sections + persistent chat panel. Returning visitors land directly here.

Transitions are GSAP timelines in `lib/gsap/use-state-transition.ts`.

## Display vs RAG content

- **Display** (Hero / About / Work / Projects / Contact) — hand-authored in `lib/content/*.ts`. Never auto-generated. The agent does NOT render these sections.
- **RAG** (chat agent's knowledge) — sourced from the canonical wiki at `/Users/janlibs/dev/llm-wiki/`. The wiki publishes embedded chunks to `wiki_chunks`; portfolio reads them via `lib/rag/retrieve.ts`. The agent answers deeper questions than what's visible on the page — this is intentional.

## Decoupling principle

The wiki is unaware of consumers. Consumer-specific routing lives in `metadata.routes.<consumer>` — opaque JSONB on the chunk, populated by wiki frontmatter. If you add features that require new metadata, document the convention here, never hardcode portfolio-specific fields into the wiki publisher.

## Conventions

- **Path alias:** `@/*` → repo root. Use it; relative `../../../` paths invite mistakes.
- **Server vs client components:** default server. Mark `"use client"` only when needed (state, refs, browser APIs, GSAP).
- **No framer-motion / motion.** All animation is GSAP. If you reach for one of those packages, stop and rewrite with GSAP.
- **Don't bypass the chat-store.** The localStorage shape (`jrz-chat-v1`) is contract; mutate via `lib/chat/store.ts` only.
- **Italic accents** in copy use `*word*` markers; renderers in `components/ui` and `components/state2/AboutSection` parse them. Do not hand-roll `<em>` tags inside content data.
- **Don't add CAPTCHA, accounts, or server-side chat persistence** without checking the spec — those were explicitly deferred.
- **NDA work** in `lib/content/professional-projects.ts` stays at implementation-pattern level. No screenshots, no proprietary specifics. The "⊘ NDA" footer is intentional and must remain.

## SEO / GEO sync

The site's discoverability surface (search engines + LLM ingesters like GPTBot, ClaudeBot, PerplexityBot) is driven by a small set of files. **When site content changes, keep these in sync** — drift here is silent and only surfaces weeks later in stale LLM citations or missing rich results.

| If you change… | Also update |
|---|---|
| `lib/content/profile.ts` (bio, stack, location) | `public/llms.txt` — mirror new bio/stack lines. JSON-LD auto-syncs via `lib/seo/structured-data.ts`. |
| `lib/content/personal-projects.ts` (add/remove/rename) | `public/llms.txt` — add/remove the project entry. JSON-LD `ItemList` auto-syncs. **Slug change?** Anchor URL `#project-{slug}` changes too — check inbound links. |
| `lib/content/work-timeline.ts` (new role) | `public/llms.txt` — add the role. `personSchema.worksFor` reads `workTimeline[0]`, so most-recent role auto-syncs. |
| `lib/content/contact.ts` (new link) | `public/llms.txt`. JSON-LD `sameAs` auto-syncs. New external link? It needs `rel="me"` (already wired in `ContactSection.tsx`). |
| Site copy in `app/layout.tsx` `metadata.title`/`description` | `app/opengraph-image.tsx` (the rendered headline), `public/llms.txt` lede. |
| Add a new section to State 2 | Give it `id="sec-{name}"` (matches the `scroll_to` tool convention). Consider whether it deserves a `Person.knowsAbout` entry or a JSON-LD type. |
| Production domain change | `lib/seo/site.ts` default OR set `NEXT_PUBLIC_SITE_URL` env var on Vercel. Also update the wordmark in `app/opengraph-image.tsx`. Resubmit sitemap to Search Console. |

**Files that should never need manual edits if the above is followed:**
- `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts` — derive from `siteUrl`
- `lib/seo/structured-data.ts` — derives from `lib/content/*`

**Verification after a sync:**
```bash
curl -s http://localhost:3000/robots.txt
curl -s http://localhost:3000/sitemap.xml
curl -s http://localhost:3000/llms.txt
curl -s http://localhost:3000 | grep 'application/ld+json'
```
Then paste the deployed URL into [Rich Results Test](https://search.google.com/test/rich-results) — should pick up `Person`, `WebSite`, `ItemList`.

**When NOT to expand SEO surface:**
- Don't add `WebSite.potentialAction` SearchAction — there's no `/search` route.
- Don't add per-project routes just for SEO; the chat-first single-page UX is the product. Anchors (`#project-{slug}`) are sufficient for LLM citation.
- Don't auto-generate `llms.txt` from `lib/content/*` — the curated voice and section ordering is intentional and matters for LLM extraction quality.

## Testing

- `pnpm test` — Vitest unit + integration. Cover retrieval ranking, chat-store, rate-limit, cost-cap, typewriter.
- `pnpm test:e2e` — Playwright happy path. State 1 → State 2 → tool call → clear.
- `prefers-reduced-motion` is honored globally (CSS in `app/globals.css`) and per-component (typewriter, ambient bloom, autoscroll). When adding animation, also add the reduced-motion branch.

## When in doubt

- Spec: `docs/superpowers/specs/2026-04-27-portfolio-v2-design.md`
- Design tokens: `docs/superpowers/design/2026-04-27-design-tokens.md`
- Visual prototype: `docs/superpowers/design/2026-04-27-visual-prototype.html` (open in a browser to see the high-fidelity reference).
- Plan: `docs/superpowers/plans/2026-04-27-portfolio-v2-implementation.md`
