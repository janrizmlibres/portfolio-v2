# Tech Stack
_Generated: 2026-05-01_

## Runtime & Framework

- **Next.js 16.2.4** — App Router mode, `nodejs` runtime for API routes, `force-dynamic` on the chat route
- Deployed as a standard Node.js server (no edge runtime)
- Config: `next.config.ts` (minimal — no custom webpack or rewrites)

## Languages & Typing

- **TypeScript 5** — strict mode enabled (`strict: true`, `noUncheckedIndexedAccess: true`)
- Target: ES2022, module resolution: `bundler`
- Path alias: `@/*` → repo root (configured in `tsconfig.json` and mirrored in `vitest.config.ts`)
- No JavaScript files (`allowJs: false`)

## Styling

- **Tailwind CSS v4** (`tailwindcss ^4`, `@tailwindcss/postcss ^4`)
- Design tokens defined via `@theme` block in `app/globals.css` — no separate config file
- Custom color palette: `ink-*` (dark surfaces), `saffron-*` (accent), `phosphor-*` (cyan highlight)
- Custom font variables: `--font-display` (JetBrains Mono), `--font-body` (General Sans), `--font-italic` (Fraunces), `--font-mono` (JetBrains Mono)
- PostCSS config: `postcss.config.mjs`

## Animation

- **GSAP 3.15.0** + `@gsap/react ^2.1.2`
- Plugins registered once via `lib/gsap/register.ts`: `ScrollTrigger`, `ScrollToPlugin`, `Draggable`
- Client components use `useGSAP` hook from `@gsap/react`
- Custom hooks: `lib/gsap/use-typewriter.ts`, `lib/gsap/use-state-transition.ts`
- **No framer-motion, motion, or react-spring** — GSAP is the sole animation library

## State Management

- **Chat state** — localStorage-backed custom store in `lib/chat/store.ts`
  - Key: `jrz-chat-v1` (defined in `lib/chat/types.ts`)
  - Shape: `{ activated: boolean, messages: ChatMessage[], updatedAt: string }`
  - Mutations only via `lib/chat/store.ts` — never mutate localStorage directly
- **React Context** — chat provider in `lib/chat/hook.ts` wraps the store for component access
- **No Redux, Zustand, or Jotai** — custom pub/sub store pattern

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.2.4 | App Router framework |
| `react` / `react-dom` | 19.2.4 | UI library |
| `typescript` | ^5 | Type system |
| `ai` | ^6.0.168 | Vercel AI SDK v6 — streaming, tool calls, message types |
| `@ai-sdk/openai` | ^3.0.53 | OpenAI provider for Vercel AI SDK |
| `@ai-sdk/react` | ^3.0.170 | React hooks for AI SDK (`useChat`, transports) |
| `openai` | ^6.34.0 | Direct OpenAI client (embeddings only) |
| `gsap` | ^3.15.0 | Animation engine |
| `@gsap/react` | ^2.1.2 | GSAP React integration (`useGSAP`) |
| `drizzle-orm` | ^0.45.2 | ORM for Postgres/pgvector queries |
| `postgres` | ^3.4.9 | `postgres-js` driver for Supabase |
| `@upstash/redis` | ^1.37.0 | Redis REST client (rate limit + cost cap) |
| `@upstash/ratelimit` | ^2.0.8 | Sliding window rate limiter |
| `zod` | ^4.3.6 | Schema validation for tool `inputSchema` definitions |
| `tailwindcss` | ^4 | Utility-first CSS |

## Build & Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| `eslint` | ^9 | Linting — config in `eslint.config.mjs` |
| `eslint-config-next` | 16.2.4 | Next.js ESLint ruleset |
| `vitest` | ^4.1.5 | Unit/integration test runner |
| `@vitejs/plugin-react` | ^6.0.1 | React transform for Vitest |
| `@testing-library/react` | ^16.3.2 | Component testing utilities |
| `@testing-library/jest-dom` | ^6.9.1 | DOM assertion matchers |
| `jsdom` | ^29.1.0 | Browser environment for Vitest |
| `@playwright/test` | ^1.59.1 | E2E test runner |
| `drizzle-kit` | ^0.31.10 | Schema migrations (`db:generate`, `db:migrate`) |
| `tsx` | ^4.21.0 | TypeScript execution for scripts |

**Vitest config** (`vitest.config.ts`): `environment: jsdom`, excludes `tests/e2e/**`, alias `@` → repo root

**Test commands:**
```bash
pnpm test          # vitest run (unit + integration, one-shot)
pnpm test:watch    # vitest (watch mode)
pnpm test:e2e      # playwright test (Chromium, separate from vitest)
```

## Package Manager

- **pnpm** (lockfile: `pnpm-lock.yaml`)
- Node.js version: not pinned (no `.nvmrc` or `.node-version`)
