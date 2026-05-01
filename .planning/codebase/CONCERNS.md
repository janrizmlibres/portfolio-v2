# Concerns & Risks
_Generated: 2026-05-01_

## High Priority

**No request body validation on `/api/chat`:**
- File: `app/api/chat/route.ts:55`
- The route casts `req.json()` directly to `{ messages?: UIMessage[] }` with no schema validation. A malformed or malicious payload is passed straight into `convertToModelMessages`. This allows arbitrarily long conversation histories, malformed message shapes, and potentially oversized request bodies, none of which are checked before the OpenAI call is made. Fix: validate `body.messages` against a Zod schema (array length cap, per-message content length cap) before conversion.

**No conversation history length cap:**
- File: `app/api/chat/route.ts:56`
- All messages from `localStorage` are rehydrated and sent verbatim to the model on every turn (`app/page.tsx:102-113`). A user with a long session will send an ever-growing context window, driving up token costs and approaching model context limits silently. Fix: truncate to the last N turns (e.g. 20) before calling `convertToModelMessages`, or summarize older turns.

**IP spoofing risk in rate limiter:**
- File: `app/api/chat/route.ts:13-18`
- `getClientIp` trusts `x-forwarded-for` and `x-real-ip` headers directly. On Vercel these are set by the proxy and generally safe, but if the app were ever deployed behind a different reverse proxy or edge function that doesn't strip user-supplied headers, the rate limit could be bypassed by forging `X-Forwarded-For`. No documentation exists on trusted-proxy assumptions. Fix: document the Vercel deployment assumption, or use `req.ip` from Next.js edge context if available.

**Pricing constants hardcoded and undocumented update path:**
- File: `lib/limits/cost-cap.ts:9`
- `PRICE_USD_PER_1M` is hardcoded (`{ input: 2.5, output: 10 }`) with a comment noting "bump if it changes." If OpenAI pricing changes, cost-cap tracking silently becomes inaccurate, potentially allowing over-budget spending or over-blocking. Fix: move to an env var or at minimum add a date-tagged comment with a clear update procedure.

---

## Medium Priority

**Type unsafety in `onToolCall` handler:**
- File: `app/page.tsx:47-59`
- The Vercel AI SDK v6 `ToolCall` type is accessed via two manual casts (`toolCall as { input?: Record<string, unknown> }` and `as { toolName: string }`). The `emit` calls further use `as never` to paper over type mismatches with the event bus. This is a sign the SDK's types are not being used correctly. If the SDK updates its internal type shapes, these casts will break silently at runtime. Fix: import and use the correct AI SDK v6 `ToolCall` generic type; propagate proper types through the event bus.

**`onFinish` message shape fragility:**
- File: `app/page.tsx:66-73`
- Extracting text from `message.parts` uses a manual cast to `{ parts?: Array<{ type: string; text?: string }> }` with a fallback to `(message as { content?: string }).content`. This double-cast pattern is a compatibility shim against an internal SDK type that is not public API. Fix: use the official `UIMessage` type's `.parts` field and remove the fallback once the SDK's behavior is confirmed stable.

**No similarity threshold in RAG retrieval:**
- File: `lib/rag/retrieve.ts:36-52`
- `retrieveChunks` always returns the top-K results by cosine distance regardless of how poor the similarity score is. Low-relevance chunks (e.g., similarity 0.3) are sent to the model as if they were authoritative context, increasing hallucination risk. Fix: add a `minSimilarity` filter (e.g., `WHERE 1 - (embedding <=> ...) > 0.6`) as an optional parameter.

**`as unknown as RetrievedChunk[]` cast on raw DB result:**
- File: `lib/rag/retrieve.ts:54`
- The result of `db.execute(query)` is cast directly to `RetrievedChunk[]` without any runtime shape validation. A schema change in the `wiki_chunks` table would produce undefined fields that silently propagate to the model's context. Fix: add a lightweight Zod parse or at minimum an array check on the returned rows.

**`withToString` monkey-patch for testability:**
- File: `lib/rag/retrieve.ts:5-9`
- A production code path monkey-patches the `toString()` method on a Drizzle `SQL` object purely to make `String(sqlArg)` work in tests (`retrieve.test.ts:46-47`). This is production code written around a test limitation. Fix: expose a dedicated test helper that inspects the Drizzle query object using its proper API, and remove `withToString` from the production module.

**Chip animation logic duplicated:**
- File: `components/state1/StateOneLanding.tsx:106-115` and the `dispatchChip` handler on line 35-41
- The character-by-character typing animation for chip dispatch is written twice (once in `forwardRef`'s `dispatchChip` and again inline in the `ChipRow.onPick` handler). They are identical loops. Fix: extract into a shared `typeIntoInput(text, setValue, delay)` utility.

**GSAP `Draggable` re-registered inside component:**
- File: `components/chat/MobileBottomSheet.tsx:22`
- `gsap.registerPlugin(Draggable)` is called inside `useGSAP`, which runs on every mount. GSAP is idempotent for registration, but the pattern is inconsistent with how other plugins are registered (via the centralized `lib/gsap/register.ts`). Fix: move Draggable registration into `lib/gsap/register.ts` alongside other plugins.

**`db/client.ts` creates a module-level postgres connection:**
- File: `db/client.ts:11-13`
- The postgres client is instantiated at module import time with `max: 5`. In a serverless environment, each cold-start creates a new pool, and the `max: 5` cap does not prevent connection exhaustion across concurrent Lambda invocations. The `prepare: false` note is correct for the transaction pooler, but the pool size interacts unexpectedly with Supabase's pooler limits. Fix: explicitly set `max: 1` for serverless (each invocation has its own connection), or document the verified safe limit.

---

## Low Priority

**`useTypewriter` uses `async/await` inside a `useEffect` without GSAP:**
- File: `lib/gsap/use-typewriter.ts:68-86`
- Despite being in `lib/gsap/`, this hook uses raw `setTimeout` and an async IIFE loop rather than a GSAP ticker or timeline. The `cancelledRef` cleanup is correct, but the approach is inconsistent with the project's GSAP-first animation philosophy. If the typewriter is ever extended (speed controls, cursor sync), GSAP's `gsap.delayedCall` or a `Timeline` would be easier to manage.

**`StateOneLanding` uses `forwardRef` but the ref is never consumed externally:**
- File: `components/state1/StateOneLanding.tsx:21`
- `StateOneLanding` exposes a `StateOneLandingHandle` ref with `dispatchChip`, but `app/page.tsx` passes no ref to it. The `forwardRef` wrapper and `useImperativeHandle` are dead code paths. Fix: remove the ref handle if it is unused, or wire it up from the parent.

**`clear` button lacks a confirmation step:**
- File: `components/chat/ChatPanel.tsx:81-87`
- Clicking "clear" immediately wipes the entire conversation from `localStorage` with no undo. This is a minor UX risk for users who accidentally click it. The spec deferred per-message deletion, but a simple `window.confirm` or a debounce would reduce accidental data loss.

**`next.config.ts` is empty:**
- File: `next.config.ts`
- No image domains, security headers, or CSP are configured. Notably, `next/image` remote patterns are absent (portrait is local, so this is fine today), but if an external image source is ever added, it will throw a runtime error without a config change.

**`public/projects/*/index.ts` files exist but are unclear:**
- Files: `public/projects/flowstack/index.ts`, `public/projects/mercado/index.ts`, `public/projects/pulsevr/index.ts`
- TypeScript files inside `public/` are not compiled by Next.js or served as modules; they are served as static files. This is either dead code or an accidental placement. Actual project image assets (`.png`) live alongside them, but the `.ts` files serve no clear purpose from the public directory.

---

## Security Observations

**No Content Security Policy:**
- No CSP headers are configured in `next.config.ts` or middleware. The chat renders agent-generated markdown links as `<a>` tags (`components/chat/MessageList.tsx:28-33`). The `isSafeHref` check restricts `href` to `https://`, `http://`, and `mailto:`, which is the primary mitigation. Adding a CSP would provide defense-in-depth against any future rendering paths that bypass this check.

**Agent system prompt reveals personal email:**
- File: `app/api/chat/route.ts:30` and `lib/ai/system-prompt.ts` (implicitly)
- The rate-limit and budget-exhausted error messages hardcode `libres.janriz@gmail.com`. This is intentional for contact purposes but worth noting: the email is exposed in API responses, not just UI copy.

**`x-forwarded-for` trust without documented proxy assumption:**
- See High Priority above. The fail-open design of the rate limiter (`rate-limit.ts:29`) means that if Upstash is unreachable AND IP spoofing occurs simultaneously, all requests are allowed through to OpenAI.

**No request size limit:**
- The API route does not set a body size cap. Next.js defaults (4 MB) apply, but with no explicit cap, a large message payload could be used to inflate token counts past the cost-cap threshold in a single request before `recordUsage` runs.

---

## Performance Observations

**Embedding call on every RAG query (no caching):**
- File: `lib/ai/embed.ts`, `lib/rag/retrieve.ts:33`
- Each `search_wiki` tool call makes a synchronous OpenAI embedding API call before the pgvector query. Repeated or near-identical queries generate new embed calls. An Upstash Redis cache keyed on the query string would eliminate most redundant embedding costs and reduce latency.

**Full conversation rehydration into AI SDK state on every mount:**
- File: `app/page.tsx:99-113`
- On every page load for a returning visitor, all stored messages are deserialized from `localStorage` and set into AI SDK state via `setMessages`. For a long session, this could be a non-trivial synchronous operation on the main thread before the first paint. Fix: cap rehydration to the last N turns.

**`AmbientBackdrop` always mounted regardless of state:**
- File: `app/page.tsx:189`
- `<AmbientBackdrop />` is rendered unconditionally. Its animation cost (canvas or CSS blur) is paid even on State 1 where it may not be visible. The component's own logic handles reduced-motion, but there is no lazy mounting.

**No `next/image` optimization for project screenshots:**
- Files: `lib/content/personal-projects.ts` — images are plain strings, not `StaticImageData`
- Project images are referenced as plain string paths without `next/image`, so they receive no automatic WebP conversion, lazy loading, or size optimization. They are likely served as raw PNGs.

---

## Maintainability

**`app/page.tsx` is the single large orchestrator (224 lines, 6 concerns):**
- File: `app/page.tsx`
- The root page component handles: AI SDK `useChat` setup, tool call buffering, state transition GSAP orchestration, chat store rehydration, keyboard shortcut registration, and rendering both states plus the mobile bottom sheet. This is difficult to test and fragile to change. A refactor extracting the tool-call handling and transition logic into custom hooks would improve isolation.

**No unit tests for:**
- `app/api/chat/route.ts` — the primary server surface (rate limit integration, budget check, message parsing)
- `components/chat/MessageList.tsx` — the `renderInline` markdown parser (link injection defense, italic rendering)
- `components/chat/ChatPanel.tsx`, `MobileBottomSheet.tsx`, `ScrollEffectHandler.tsx`, `HighlightEffectHandler.tsx` — all effect-heavy components

**`lib/chat/types.ts` `ToolCall.name` is a closed enum hardcoded to three values:**
- File: `lib/chat/types.ts:3`
- Adding a new tool requires updating this union type in addition to `lib/ai/tools.ts`, `app/page.tsx:50`, and the effect bus. There is no central registry; coordination is manual.

**Content and agent knowledge are entirely decoupled with no sync guard:**
- `lib/content/professional-projects.ts` is the display source; `llm-wiki` is the RAG source. If display content is updated (e.g., a new job or project) but the wiki is not republished, the agent will give answers inconsistent with what is visible on the page. There is no CI check or documentation alerting contributors to update both.

---

## Known TODOs / FIXMEs

No `TODO`, `FIXME`, `HACK`, or `XXX` comments were found in `app/`, `lib/`, or `components/`. The codebase is clean of in-code markers.

One forward-reference comment worth noting:

- `tests/e2e/landing.spec.ts:5-6`: The E2E stub format comment reads: "The SSE shape may need adapting to AI SDK v6's UIMessage stream format. Inspect `node_modules/ai/dist/` if the test fails on the stub format." This is a known fragility — the E2E test stubs the streaming response manually, which is tied to the SDK's internal wire format and may break silently on SDK upgrades.

---

## Dependency Risks

**Next.js 16.2.4 — very new, limited ecosystem precedent:**
- `package.json:25`
- Next.js 16 (App Router evolution) is a recent major version. Ecosystem tooling (testing libraries, documentation, third-party adapters) typically lags major releases. Verify `@testing-library/react` 16.x and `vitest` 4.x are fully compatible with React 19.2.4 server/client component semantics.

**`ai` and `@ai-sdk/*` at `^6.x` — rapidly evolving SDK:**
- `package.json`
- The Vercel AI SDK v6 is a major rewrite with breaking changes from v4/v5 (documented extensively in `AGENTS.md`). The `^` semver range allows automatic minor and patch upgrades. Given the number of internal type casts already in `app/page.tsx`, a minor SDK update could break the `toolCall.input`, `message.parts`, or `onFinish` contracts. Fix: pin to an exact version or use a tighter `~` range until the SDK stabilizes.

**`openai` SDK at `^6.34.0` — separate from `@ai-sdk/openai`:**
- `lib/ai/embed.ts` imports the raw `openai` package directly for embeddings, while the chat route uses `@ai-sdk/openai`. Two separate OpenAI client libraries are in use simultaneously. This is intentional (AI SDK doesn't expose raw embedding calls easily) but creates a maintenance surface where both clients must be kept version-compatible with the API.

**`gsap` at `^3.15.0` — no GSAP v4 migration path yet:**
- GSAP 4 (if/when released) will have breaking changes to plugin registration and the `useGSAP` hook API. The `^` range will not auto-upgrade to a new major, but monitoring is advisable.

**`zod` at `^4.3.6`:**
- Zod 4 is a breaking rewrite from Zod 3. Confirm all Zod usage (`lib/ai/tools.ts`) is written against the v4 API and that `@ai-sdk/*` is compatible with Zod 4 (some AI SDK versions pin to Zod 3 internally).

**`drizzle-orm` at `^0.45.x` — pre-1.0:**
- Still pre-1.0; patch releases can contain breaking schema/query changes. The raw SQL path via `db.execute` in `lib/rag/retrieve.ts` bypasses Drizzle's type system entirely, so drift between Drizzle internals and the query helper would not be caught by TypeScript.
