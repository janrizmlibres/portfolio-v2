# Conventions
_Generated: 2026-05-01_

## File & Directory Naming

- **Components:** PascalCase filenames matching the exported component name. Example: `ChatPanel.tsx`, `StateOneLanding.tsx`, `AmbientBackdrop.tsx`.
- **Hooks/utilities:** camelCase filenames. Example: `use-typewriter.ts`, `use-state-transition.ts`, `event-bus.ts`.
- **Content modules:** kebab-case filenames. Example: `work-timeline.ts`, `professional-projects.ts`, `personal-projects.ts`.
- **Directories:** lowercase, domain-grouped. Example: `components/chat/`, `components/state1/`, `components/state2/`, `components/ui/`, `components/effects/`, `lib/ai/`, `lib/chat/`, `lib/gsap/`, `lib/rag/`, `lib/limits/`, `lib/tool-effects/`.
- **Test files:** co-located with the implementation file, same stem with `.test.ts` suffix. Example: `lib/chat/store.test.ts`, `lib/limits/rate-limit.test.ts`.
- **E2E tests:** under `tests/e2e/` with `.spec.ts` suffix.

## Component Conventions

- **Named exports only.** Every component is exported by name, not as default (e.g., `export function ChatPanel(...)`). The root page (`app/page.tsx`) uses `export default` only for the Next.js page entry.
- **Props interface named `Props`.** Local interface at the top of the file, not exported. Example: `interface Props { onSubmit: (text: string) => void; }`.
- **Discriminated boolean props** for variant rendering (`flat`, `collapsed`). Used in `ChatPanel`.
- **`forwardRef` with named inner function.** When a ref handle is needed: `export const StateOneLanding = forwardRef<Handle, Props>(function StateOneLanding(...))`. The handle interface is exported and named `<ComponentName>Handle`.
- **Effect-only components return `null`.** Handler components like `ScrollEffectHandler` and `HighlightEffectHandler` render nothing and return `null`.
- **Slot pattern for composition.** Parent passes a fully-constructed React element as a prop (`chatPanelSlot`) rather than injecting render props or context.
- **`aria-label` and `aria-hidden`** used consistently on interactive and decorative elements.
- **`type="button"`** always set on `<button>` elements to prevent accidental form submission.

## TypeScript Conventions

- **Strict mode assumed** — no explicit `any`; unknown external shapes are cast with inline `as` and documented. Example in `app/page.tsx`: `(toolCall as { input?: Record<string, unknown> }).input`.
- **`interface` for object shapes**, `type` for unions and aliases. Example: `interface ChatMessage`, `type ChatRole = "user" | "assistant" | "tool"`.
- **`readonly` arrays** on content literals. Example: `headlineTypewriter: ["AI", "Full-stack"] as const`.
- **Zod schemas** used for AI tool input validation in `lib/ai/tools.ts` via `inputSchema: z.object(...)` (AI SDK v6 — not `parameters`).
- **Return types omitted** where inference is clear; explicit where function is a public API (e.g., `ChatStore` interface in `lib/chat/store.ts`).
- **ISO string for timestamps.** `createdAt: string // ISO` — no `Date` objects in persisted data structures.

## Import Conventions

- **`@/*` path alias** maps to repo root. Always use it; never use relative `../../../` paths.
- **Import order (observed):** third-party libraries first, then `@/` alias imports, then relative imports from the same directory.
- **No barrel `index.ts` files.** Each module is imported directly by file path.
- **Type-only imports** use `import type` where the imported value is only used as a type. Example: `import type { ToolCall } from "@/lib/chat/types"`.

## Styling Conventions

- **Tailwind CSS v4.** Theme tokens are declared in `app/globals.css` inside the `@theme` block — not in `tailwind.config.*`. Color tokens follow the `ink-*`, `saffron-*`, and `phosphor-*` palette.
- **Custom utilities** are declared with `@utility` in `globals.css`. Current utilities: `container-prose`, `text-display`, `text-italic-accent`.
- **`cn()` helper** (`lib/utils/cn.ts`) for conditional class merging. Lightweight custom implementation — not `clsx` or `tailwind-merge`.
- **String concatenation** used for conditional classes when conditions are simple: `"base-classes" + (condition ? " variant" : "")`. `cn()` is preferred when multiple conditionals are involved.
- **Design system colors referenced by token name**, never by raw hex value. Example: `text-phosphor-500`, `bg-ink-surface-2`, `border-ink-line`.
- **`prefers-reduced-motion` honored globally** in `globals.css` (`animation-duration: 0.01ms !important`) and per-component in GSAP and typewriter logic.
- **`clamp()` for fluid type sizes.** Example: `text-[clamp(2rem,4.5vw,3.5rem)]`.

## Animation Conventions

- **GSAP only.** Never use framer-motion, motion, react-spring, or CSS transitions for non-trivial motion. CSS keyframes (`animate-blink`, `animate-pulse-soft`) are permitted for simple looping effects declared in `globals.css`.
- **Plugin registration is idempotent and client-only.** `lib/gsap/register.ts` exports `registerGsapPlugins()`, which guards with a `registered` flag and `typeof window` check. Called once in `app/page.tsx`'s `useEffect`.
- **Plugins registered:** `ScrollTrigger`, `ScrollToPlugin`, `Draggable`.
- **`useGSAP` from `@gsap/react`** is the hook for GSAP animations inside client components. Used in `ScrollEffectHandler.tsx` — the returned cleanup value from the event bus subscription is returned directly from `useGSAP`.
- **Plain `gsap.timeline()`** for multi-step transitions not tied to a component (e.g., `lib/gsap/use-state-transition.ts`). Wrap in a `Promise` with `onComplete: resolve` for awaitable transitions.
- **Reduced-motion branches are mandatory.** Every GSAP animation must have a `reduced` path: either a no-op display toggle (see `runStateTransition`) or `scrollIntoView` (see `ScrollEffectHandler`).
- **GSAP context for scrollTo:** `gsap.to(window, { scrollTo: { y: target, offsetY: 24 } })` — requires `ScrollToPlugin`.

## Server vs Client Components

- **Default to server components.** Only add `"use client"` when the component requires state, refs, browser APIs, or GSAP.
- **`"use client"` components:** `app/page.tsx`, all files under `components/chat/`, `components/state1/`, `components/effects/`, and GSAP-using components.
- **Server components (no directive):** `components/ui/Eyebrow.tsx`, `components/ui/SectionHead.tsx`, `components/state2/AboutSection.tsx`, `components/state2/WorkSection.tsx`, and other display-only sections. These receive no props from client state.
- **API route** (`app/api/chat/route.ts`) is server-only — never marked `"use client"`.

## Content / Copy Conventions

- **Hand-authored in `lib/content/*.ts`**, never auto-generated. Modules: `profile.ts`, `work-timeline.ts`, `professional-projects.ts`, `personal-projects.ts`, `contact.ts`.
- **Italic accents** are marked with `*word*` in string values (e.g., `"About *me*"`, `"*Summa Cum Laude*"`). The `SectionHead` component and `AboutSection` parse these markers — do not hand-write `<em>` tags inside content data.
- **`aboutItalicWords`** array in `profile.ts` lists words to accent in the about body copy. The `applyItalicAccents()` function in `AboutSection.tsx` applies them via regex split.
- **NDA work** in `lib/content/professional-projects.ts` stays at implementation-pattern level. The "⊘ NDA" footer must remain. No screenshots or proprietary specifics.
- **Content is display-only.** The AI agent's knowledge comes from the wiki via RAG (`lib/rag/retrieve.ts`), not from these files. Do not read `lib/content/` in server actions or API routes.

## Key Rules (from AGENTS.md / CLAUDE.md)

- **Path alias `@/*`** → repo root. Always use it.
- **No framer-motion / motion.** All animation is GSAP.
- **Chat store is a contract.** Mutate via `lib/chat/store.ts` only. The localStorage shape `jrz-chat-v1` must not be changed without updating `STORAGE_KEY` in `lib/chat/types.ts`.
- **Vercel AI SDK v6 API names differ from older docs:** use `inputSchema` (not `parameters`), `stopWhen: stepCountIs(N)` (not `maxSteps`), `toUIMessageStreamResponse()` (not `toDataStreamResponse()`), `sendMessage({ text })` (not `append`), `chat.status` (not `isLoading`), `toolCall.input` (not `toolCall.args`).
- **Supabase connection:** transaction-pooler endpoint port 6543, `prepare: false` on postgres client.
- **Rate limiting and cost cap fail-open** with `degraded: true` on Upstash error — this is intentional.
- **No CAPTCHA, accounts, or server-side chat persistence** without spec approval.
- **`prefers-reduced-motion`** must be respected in every new animation: CSS global rule in `globals.css` + per-component GSAP/typewriter branch.
