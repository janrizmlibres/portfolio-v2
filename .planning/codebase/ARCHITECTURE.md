# Architecture
_Generated: 2026-05-01_

## System Overview

A single-page Next.js (App Router) portfolio with an embedded AI chat agent. Visitors interact with a GPT-4o agent backed by a pgvector RAG knowledge base; the agent can answer questions about the owner, scroll the page, and highlight project cards. The site has two visually distinct states — a chat-first landing (State 1) and an activated portfolio with persistent chat panel (State 2) — persisted per-browser in `localStorage`.

## Core Patterns

**Rendering strategy:** The root page (`app/page.tsx`) is a client component (`"use client"`). Layout (`app/layout.tsx`) is a server component. All portfolio sections in `components/state2/` are server components; interactive pieces (`components/chat/`, `components/state1/`, `components/effects/`) are client components.

**Data fetching:** No server-side data fetching for display content. Display content is statically authored in `lib/content/*.ts`. RAG retrieval happens server-side inside the `/api/chat` route handler on every chat turn.

**State approach:** Chat state lives in a hand-rolled observable store (`lib/chat/store.ts`) backed by `localStorage` (key: `jrz-chat-v1`). React subscribes via `useSyncExternalStore` (`lib/chat/hook.ts`). The Vercel AI SDK `useChat` hook manages the in-flight streaming session; it is seeded from the persistent store on mount for conversation continuity.

**Animation:** GSAP exclusively. Plugins (`ScrollTrigger`, `ScrollToPlugin`, `Draggable`) registered once via `lib/gsap/register.ts` at app boot. `useGSAP` from `@gsap/react` is used in all client animation components.

## Key Modules

| Module | Path | Responsibility |
|--------|------|----------------|
| Page root | `app/page.tsx` | Orchestrates both states, `useChat` SDK, GSAP boot, submit/clear handlers |
| Chat store | `lib/chat/store.ts` | Observable `localStorage`-backed state; single source of truth for messages and `activated` flag |
| Chat hook | `lib/chat/hook.ts` | `useSyncExternalStore` adapter for React binding |
| Chat types | `lib/chat/types.ts` | `ChatMessage`, `ChatState`, `ToolCall`, `STORAGE_KEY` |
| Chat provider | `components/chat/ChatStateProvider.tsx` | React context wrapping `createChatStore()` |
| AI route | `app/api/chat/route.ts` | POST handler: rate-limit → cost-cap → `streamText` → `toUIMessageStreamResponse()` |
| System prompt | `lib/ai/system-prompt.ts` | Identity + operating rules injected on every request |
| Tool definitions | `lib/ai/tools.ts` | `search_wiki`, `scroll_to`, `highlight_project` (Vercel AI SDK v6 `tool()`) |
| RAG retrieval | `lib/rag/retrieve.ts` | Embeds query → pgvector cosine similarity search on `wiki_chunks` |
| Embed helper | `lib/ai/embed.ts` | Lazy OpenAI client, `text-embedding-3-small` (1536d) |
| DB client | `db/client.ts` | Drizzle + `postgres-js`, `prepare: false`, max 5 connections |
| DB schema | `db/schema.ts` | `wiki_chunks` table with custom `vector(1536)` type |
| Rate limiter | `lib/limits/rate-limit.ts` | Upstash Redis sliding-window: 20 req / 1 h per IP; fails open |
| Cost cap | `lib/limits/cost-cap.ts` | Monthly token spend tracked in Redis in micro-cents; fails open |
| Event bus | `lib/tool-effects/event-bus.ts` | Typed in-process pub/sub (`scrollTo`, `highlightProject`) bridging server tool results to client GSAP effects |
| State transition | `lib/gsap/use-state-transition.ts` | GSAP timeline for State 1 ↔ State 2 swap; respects `prefers-reduced-motion` |
| Typewriter | `lib/gsap/use-typewriter.ts` | GSAP-driven cycling headline animation |
| GSAP register | `lib/gsap/register.ts` | Idempotent plugin registration (client-only) |
| Display content | `lib/content/*.ts` | Hand-authored profile, work timeline, projects, contact — never auto-generated |
| Scroll effect | `components/effects/ScrollEffectHandler.tsx` | Listens to `scrollTo` bus event, runs GSAP `scrollTo` |
| Highlight effect | `components/effects/HighlightEffectHandler.tsx` | Listens to `highlightProject` bus event, runs GSAP pulse animation on project card |
| State 1 | `components/state1/StateOneLanding.tsx` | Chat-first landing: portrait, typewriter headline, prompt input, suggestion chips |
| State 2 | `components/state2/StateTwoView.tsx` | Two-column grid: portfolio sections + chat panel slot |
| Chat panel | `components/chat/ChatPanel.tsx` | Sticky side rail (desktop) with message list + input; collapsible |
| Mobile sheet | `components/chat/MobileBottomSheet.tsx` | Bottom-anchored drawer for chat on mobile |

## Data Models

**`ChatMessage`** (`lib/chat/types.ts`):
```ts
interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;           // prose text
  toolCalls?: ToolCall[];    // attached tool calls for the breadcrumb UI
  createdAt: string;         // ISO timestamp
}

interface ToolCall {
  name: "search_wiki" | "scroll_to" | "highlight_project";
  args: Record<string, unknown>;
  resultPreview?: string;
}
```

**`ChatState`** (`lib/chat/types.ts`) — serialized to `localStorage["jrz-chat-v1"]`:
```ts
interface ChatState {
  activated: boolean;    // whether State 2 has been entered
  messages: ChatMessage[];
  updatedAt: string;     // ISO timestamp
}
```

**`wiki_chunks`** DB table (`db/schema.ts`):
- `id` text PK
- `source_path` text — path in the llm-wiki repo
- `title` text nullable
- `type` text — e.g. `"project"`, `"org"`, `"profile"`
- `tags` text[] — facet filters
- `text` text — chunk body
- `text_hash` text
- `embedding` vector(1536) — `text-embedding-3-small`
- `embedding_model` text
- `metadata` jsonb — includes `routes.portfolio` for consumer routing
- `source_commit` text nullable
- `updated_at` timestamptz

**`RetrievedChunk`** (`lib/rag/retrieve.ts`):
```ts
interface RetrievedChunk {
  id: string;
  source_path: string;
  title: string | null;
  type: string;
  tags: string[];
  text: string;
  metadata: Record<string, unknown>;
  similarity: number;   // 1 - cosine distance
}
```

## Request Flow

### Chat turn (happy path)

1. User types in `ChatInput` → `handleSubmit()` in `app/page.tsx`
2. `appendMessage(userMsg)` written to `localStorage` store; UI updates immediately
3. If first submit and State 1 active: `runStateTransition("1to2")` GSAP timeline fires; page transitions to State 2
4. `sendMessage({ text })` dispatched to Vercel AI SDK `useChat` hook
5. SDK POSTs `{ messages: UIMessage[] }` to `POST /api/chat`
6. Route handler: `checkRateLimit(ip)` → `hasBudget()` → `convertToModelMessages(body.messages)`
7. `streamText({ model: openai("gpt-4o"), system, messages, tools, stopWhen: stepCountIs(4) })`
8. GPT-4o may call `search_wiki` tool: `retrieveChunks()` embeds query via `text-embedding-3-small`, runs pgvector cosine search on Supabase, returns top-k chunks
9. Tool results injected back; model continues up to 4 steps
10. Streamed response sent via `toUIMessageStreamResponse()`
11. Client `onToolCall` fires for side-effect tools: `emit("scrollTo", …)` or `emit("highlightProject", …)`
12. `ScrollEffectHandler` / `HighlightEffectHandler` pick up events and run GSAP animations
13. `onFinish` extracts prose content + collected `pendingToolCallsRef` → `appendMessage(assistantMsg)` to `localStorage` store

### Cost tracking (after each turn)

`onFinish` in the route handler calls `recordUsage({ totalTokens, promptTokens, completionTokens, model })` → Redis `INCRBY` on a monthly key `jrz:cost:YYYY-MM` (micro-cents, 40-day TTL).

## Two-State UX Model

The site renders both State 1 and State 2 DOM subtrees simultaneously. Visibility is toggled via `style.display`:
- **State 1** (`components/state1/StateOneLanding.tsx`): `display: grid` when `!state.activated`
- **State 2** (`components/state2/StateTwoView.tsx`): `display: block` when `state.activated`

`state.activated` is derived from `ChatState.activated` in the `localStorage` store. Returning visitors whose store already has `activated: true` land directly in State 2 without a transition.

**Transition flow (1 → 2):**
1. User submits first message
2. `runStateTransition({ direction: "1to2", state1, state2, chatPanel })` called
3. GSAP timeline: fade+scale State 1 out → show State 2 → stagger-in portfolio sections (`#sec-about`, `#sec-work`, `#sec-projects`, `#sec-contact`) → slide-in chat panel
4. If `prefers-reduced-motion`: display swap only, no animation

**Transition flow (2 → 1):**
1. User clicks "clear" in chat panel
2. `clear()` resets store (`activated: false`, empty messages)
3. `runStateTransition({ direction: "2to1" })` GSAP timeline: fade State 2 out → show State 1

**State persistence:** `jrz-chat-v1` in `localStorage`. Store is re-seeded into the AI SDK's `useChat` on mount so the server receives full conversation history on the next request.

## AI / Chat Architecture

```
Client (browser)                          Server (Node.js edge)
─────────────────────────────────         ──────────────────────────────────
useChat (Vercel AI SDK v6)
  DefaultChatTransport
    POST /api/chat ──────────────────────→ route.ts
                                              checkRateLimit (Upstash Redis)
                                              hasBudget (Upstash Redis)
                                              convertToModelMessages
                                              streamText (Vercel AI SDK)
                                                GPT-4o (OpenAI)
                                                  ↓ tool call: search_wiki
                                                  retrieveChunks()
                                                    embedQuery() → OpenAI
                                                      text-embedding-3-small
                                                    pgvector cosine search
                                                      Supabase Postgres
                                                  ↑ chunks returned
                                                  ↓ tool call: scroll_to
                                                  execute() → { ok, section }
                                                  ↓ tool call: highlight_project
                                                  execute() → { ok, slug }
                                              toUIMessageStreamResponse()
  ←──────────────────────── streaming response
onToolCall:
  emit("scrollTo" | "highlightProject")
    ↓
ScrollEffectHandler / HighlightEffectHandler
  (GSAP animations)
onFinish:
  appendMessage → localStorage store
```

**Tools:**
- `search_wiki` — RAG retrieval. Called before any factual claim. Returns up to 12 chunks with `similarity`, `type`, `portfolioRoute`.
- `scroll_to` — side-effect only. Server executes (returns `{ ok, section }`); client `onToolCall` emits bus event.
- `highlight_project` — side-effect only. Same pattern as `scroll_to`.

**Limits:**
- Rate: 20 requests / 1 h per IP (sliding window, Upstash). Returns 429 with `retryAfterMs`.
- Cost: monthly micro-cent budget tracked in Redis. Returns 503 when exhausted. Both limits fail-open (`degraded: true`) on Redis error.
- Steps: `stopWhen: stepCountIs(4)` caps multi-turn tool calls per request.
