# Directory Structure
_Generated: 2026-05-01_

## Top-Level Layout

```
portfolio-v2/
├── app/                    # Next.js App Router routes, global CSS
├── components/             # React components (state1, state2, chat, ui, effects)
├── lib/                    # Business logic, helpers, and hooks
├── db/                     # Drizzle schema, migrations, and DB client
├── docs/                   # Design specs, tokens, and implementation plans
├── public/                 # Static assets (images, project screenshots)
├── tests/                  # Playwright e2e tests
├── .planning/              # GSD planning documents (codebase maps, phase plans)
├── .agents/                # Agent skill packs (GSAP, Supabase)
├── .claude/                # Claude-specific skill overrides
├── AGENTS.md               # Primary agent instructions (conventions, stack, structure)
├── CLAUDE.md               # References AGENTS.md
├── drizzle.config.ts       # Drizzle ORM config
├── next.config.ts          # Next.js config (minimal, no overrides)
├── tsconfig.json           # TypeScript: strict, noUncheckedIndexedAccess, @/* alias
├── vitest.config.ts        # Vitest unit test config
├── vitest.setup.ts         # Vitest global setup
├── playwright.config.ts    # Playwright e2e config
├── eslint.config.mjs       # ESLint flat config
├── postcss.config.mjs      # PostCSS (Tailwind v4)
└── pnpm-workspace.yaml     # pnpm workspace root
```

## App Router Structure

```
app/
├── layout.tsx              # Root layout: fonts (JetBrains Mono, Fraunces, General Sans),
│                           #   <html> with CSS var injection, metadata
├── page.tsx                # Root page ("use client"): HomeInner + ChatStateProvider,
│                           #   useChat SDK, state machine, submit/clear handlers
├── globals.css             # Tailwind v4 @theme block, CSS custom properties,
│                           #   prefers-reduced-motion global rules
├── favicon.ico
└── api/
    └── chat/
        └── route.ts        # POST /api/chat — rate-limit → cost-cap → streamText → stream
```

**Route handler notes:**
- `export const runtime = "nodejs"` — uses Node.js runtime (not Edge), needed for `postgres-js`
- `export const dynamic = "force-dynamic"` — never cached
- Only one API route exists; the entire chat pipeline runs through it

## Component Organization

Components are organized by which site state they belong to, with shared UI primitives separated out.

```
components/
├── state1/                 # State 1 (chat-first landing)
│   ├── StateOneLanding.tsx # Root of State 1: portrait, typewriter headline, prompt, chips
│   ├── PromptInput.tsx     # Controlled text input for initial query
│   └── ChipRow.tsx         # Suggestion chip row (animated type-in on pick)
│
├── state2/                 # State 2 (activated portfolio)
│   ├── StateTwoView.tsx    # Two-column grid: content + chatPanelSlot prop
│   ├── CompactHero.tsx     # Compact name + role header
│   ├── CurrentlyStrip.tsx  # "Currently" tech stack + availability strip
│   ├── AboutSection.tsx    # About prose with *italic* accent rendering
│   ├── WorkSection.tsx     # Work timeline (sourced from lib/content/work-timeline.ts)
│   ├── PersonalProjectsSection.tsx  # Project cards with data-project-slug attr
│   └── ContactSection.tsx  # Contact links
│
├── chat/                   # Chat panel and message rendering
│   ├── ChatStateProvider.tsx  # React context: createChatStore() + useChatStore()
│   ├── ChatPanel.tsx          # Side rail (desktop sticky) or flat (mobile); collapsible
│   ├── MobileBottomSheet.tsx  # Bottom-anchored drawer for mobile chat
│   ├── MessageList.tsx        # Scrollable message list with inline markdown rendering
│   ├── ChatInput.tsx          # Chat text input + send button
│   └── ToolCallLine.tsx       # Breadcrumb line: "↻ search_wiki(...)"
│
├── effects/                # Invisible client components that execute GSAP side-effects
│   ├── ScrollEffectHandler.tsx     # Listens to "scrollTo" event bus, runs gsap.to(window)
│   └── HighlightEffectHandler.tsx  # Listens to "highlightProject", pulses project card
│
└── ui/                     # Design primitives
    ├── AmbientBackdrop.tsx  # Full-page ambient glow / bloom canvas effect
    ├── Eyebrow.tsx          # Small uppercase label component
    └── SectionHead.tsx      # Section heading with optional eyebrow
```

**Naming conventions:**
- PascalCase files for all React components
- Files named after their default export (`StateTwoView.tsx` exports `StateTwoView`)
- No barrel `index.ts` files — import directly from the component file

**Server vs client split:**
- All `components/state2/` sections are server components (no `"use client"`)
- All `components/chat/`, `components/effects/`, `components/state1/` are client components
- `app/page.tsx` is a client component (state machine lives here)

## Library Organization

```
lib/
├── ai/
│   ├── system-prompt.ts    # SYSTEM_PROMPT string — agent identity and operating rules
│   ├── tools.ts            # Vercel AI SDK v6 tool definitions: search_wiki, scroll_to, highlight_project
│   └── embed.ts            # Lazy OpenAI client, embedQuery() → text-embedding-3-small (1536d)
│
├── chat/
│   ├── types.ts            # ChatMessage, ChatState, ToolCall, STORAGE_KEY ("jrz-chat-v1")
│   ├── store.ts            # createChatStore(): observable localStorage store (no React)
│   ├── hook.ts             # useChatState(): useSyncExternalStore adapter
│   └── store.test.ts       # Unit tests for store
│
├── content/                # Hand-authored display data (NOT from wiki / RAG)
│   ├── profile.ts          # Name, taglines, typewriter words, about body, currently stack
│   ├── work-timeline.ts    # Work history entries for WorkSection
│   ├── personal-projects.ts  # FlowStack, PulseVR, Mercado (public projects)
│   ├── professional-projects.ts  # NDA-protected work (implementation patterns only)
│   └── contact.ts          # Contact links
│
├── gsap/
│   ├── register.ts         # registerGsapPlugins(): idempotent, client-only; ScrollTrigger + ScrollToPlugin + Draggable
│   ├── use-state-transition.ts  # runStateTransition(): GSAP timeline for State 1 ↔ State 2
│   ├── use-typewriter.ts   # useTypewriter(): GSAP-driven cycling headline text
│   └── use-typewriter.test.ts
│
├── limits/
│   ├── rate-limit.ts       # checkRateLimit(ip): Upstash sliding-window 20 req/h; fails open
│   ├── rate-limit.test.ts
│   ├── cost-cap.ts         # hasBudget() + recordUsage(): monthly micro-cent tracking in Redis; fails open
│   └── cost-cap.test.ts
│
├── rag/
│   ├── retrieve.ts         # retrieveChunks(): embed → pgvector cosine search → RetrievedChunk[]
│   └── retrieve.test.ts
│
├── tool-effects/
│   └── event-bus.ts        # Typed in-process pub/sub: on()/emit() for scrollTo + highlightProject
│
└── utils/
    ├── cn.ts               # clsx/tailwind-merge utility
    └── render-italic.tsx   # Parses *word* markers into <em> nodes (used in content renderers)
```

## Config Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | Strict TypeScript; `@/*` → repo root alias; `noUncheckedIndexedAccess: true` |
| `next.config.ts` | Next.js config (minimal — no custom settings at present) |
| `drizzle.config.ts` | Drizzle ORM: schema path, migrations directory, Supabase connection |
| `eslint.config.mjs` | ESLint flat config |
| `postcss.config.mjs` | PostCSS with Tailwind CSS v4 |
| `vitest.config.ts` | Vitest for unit tests; excludes `tests/e2e/` |
| `vitest.setup.ts` | Vitest global setup |
| `playwright.config.ts` | Playwright e2e; targets `tests/e2e/` |
| `pnpm-workspace.yaml` | pnpm workspace root |
| `skills-lock.json` | Agent skill version lock |

## Where to Add New Code

**New portfolio section (display):**
- Content data: `lib/content/<section>.ts`
- React component: `components/state2/<SectionName>Section.tsx` (server component, no `"use client"`)
- Mount in: `components/state2/StateTwoView.tsx`
- Add section ID (`id="sec-<name>"`) if the agent should be able to `scroll_to` it
- Update `scroll_to` enum in `lib/ai/tools.ts` and `lib/tool-effects/event-bus.ts`

**New AI tool:**
- Add to `lib/ai/tools.ts` using `tool({ inputSchema: z.object(…), execute: async () => … })`
- If it has a client-side effect: add event type to `lib/tool-effects/event-bus.ts`, create an effect handler in `components/effects/`, mount it in `app/page.tsx`, handle in `onToolCall` in `app/page.tsx`
- Update `ToolCall.name` union in `lib/chat/types.ts`

**New utility:**
- Shared pure helpers: `lib/utils/<name>.ts`
- React hooks without a specific domain: `lib/utils/<name>.ts` or create a new `lib/<domain>/` subdirectory

**New test:**
- Unit: co-locate as `<file>.test.ts` alongside the module
- E2E: `tests/e2e/<scenario>.spec.ts`

**New API route:**
- `app/api/<route>/route.ts` — follow the rate-limit + cost-cap guard pattern from `app/api/chat/route.ts`
