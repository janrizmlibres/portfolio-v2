# Testing
_Generated: 2026-05-01_

## Test Runner

**Unit / Integration:** Vitest 3.x
- Config: `vitest.config.ts`
- Environment: `jsdom`
- Globals: disabled (explicit `import { describe, it, expect, ... } from "vitest"` in every file)
- Setup file: `vitest.setup.ts` — imports `@testing-library/jest-dom/vitest` for DOM matchers
- Path alias: `@` → repo root (mirrors Next.js alias)
- E2E excluded from Vitest via `exclude: ["tests/e2e/**"]`

**E2E:** Playwright
- Config: `playwright.config.ts`
- Test directory: `tests/e2e/`
- Browser: Chromium only (`Desktop Chrome` device preset)
- Base URL: `http://localhost:3099`
- Dev server: `pnpm dev --port 3099` (reused if already running outside CI)
- Tracing: `on-first-retry`
- Viewport: 1280x800

## Unit / Integration Tests

All unit test files are co-located with their implementation:

| Test File | Implementation | What's Tested |
|---|---|---|
| `lib/chat/store.test.ts` | `lib/chat/store.ts` | Initial state, `appendMessage` (activate + persist), `clear` (reset + persist), rehydration from localStorage, subscriber notification, corrupt localStorage recovery |
| `lib/limits/rate-limit.test.ts` | `lib/limits/rate-limit.ts` | Allowed response under quota, denied response with `retryAfterMs`, fail-open (`degraded: true`) on Upstash error |
| `lib/limits/cost-cap.test.ts` | `lib/limits/cost-cap.ts` | `hasBudget` under cap, `hasBudget` over cap, `recordUsage` increments and sets TTL, fail-open on Upstash error |
| `lib/rag/retrieve.test.ts` | `lib/rag/retrieve.ts` | Embedding + top-K DB query, empty array on DB error, `type` filter applied to SQL |
| `lib/gsap/use-typewriter.test.ts` | `lib/gsap/use-typewriter.ts` | Initial word displayed, char-by-char erase then type, `prefers-reduced-motion` hold behavior |

## E2E Tests

**File:** `tests/e2e/landing.spec.ts`

**Coverage:** Single happy-path scenario.
1. Stubs `/api/chat` with a deterministic SSE response (AI SDK v6 stream format).
2. Asserts State 1 is visible and the "Show me your projects" chip button is present.
3. Clicks the chip button.
4. Asserts State 2 becomes visible within 5 seconds.
5. Asserts the submitted message appears in the State 2 chat history.
6. Clicks the "clear" button.
7. Asserts State 1 returns within 5 seconds.

## Test Utilities

**`@testing-library/react`** — used in `use-typewriter.test.ts` for `renderHook` and `act`.

**`vi.hoisted()`** — used to hoist mock factory functions before module evaluation. Required when mocking modules that the tested module imports at the top level (e.g., `@upstash/ratelimit`, `@upstash/redis`, `@/db/client`, `@/lib/ai/embed`).

**`vi.mock()`** — module mocking pattern used in all lib tests:
```typescript
// Hoist mock functions before imports
const mockFn = vi.hoisted(() => vi.fn());

vi.mock("some-module", () => ({
  SomeClass: class {
    method(...args: unknown[]) { return mockFn(...args); }
    static factoryMethod() { return {}; }
  },
}));

// Import the module under test AFTER vi.mock() calls
import { functionUnderTest } from "./module";

beforeEach(() => { mockFn.mockReset(); });
```

**`vi.useFakeTimers()` / `vi.useRealTimers()`** — used in `use-typewriter.test.ts` with `beforeEach`/`afterEach` to control the typewriter's `setTimeout` calls. Paired with `vi.advanceTimersByTimeAsync()` inside `act()`.

**`vi.stubGlobal()` / `vi.unstubAllGlobals()`** — used to stub `window.matchMedia` for `prefers-reduced-motion` testing in `use-typewriter.test.ts`.

**Playwright route stubbing** — `page.route("**/api/chat", ...)` stubs the streaming chat API to return a deterministic SSE body, preventing real OpenAI calls during E2E.

## Coverage Gaps

The following areas have no automated test coverage:

- **`app/page.tsx` (HomeInner)** — the root orchestrator component is not unit or integration tested. State transition wiring, `handleSubmit`, `handleClear`, AI SDK `onToolCall`/`onFinish` handlers are all untested at the unit level.
- **`components/`** — no component render tests exist. No tests for `ChatPanel`, `MessageList`, `ChatInput`, `StateOneLanding`, `StateTwoView`, or any section component.
- **`lib/ai/tools.ts`** — tool definitions and `execute` functions are untested.
- **`lib/ai/system-prompt.ts`** — untested.
- **`lib/ai/embed.ts`** — the `embedQuery` function is mocked in retrieve tests but never tested directly.
- **`lib/tool-effects/event-bus.ts`** — `on`/`emit` are untested.
- **`lib/gsap/`** — `use-state-transition.ts` and `register.ts` are untested.
- **`app/api/chat/`** — the API route handler is not integration tested (relies on E2E stub only).
- **`lib/chat/hook.ts`** — untested.
- **E2E: only one scenario covered.** No tests for mobile bottom sheet, collapsed chat panel, tool call side effects (scroll, highlight), or error states.

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm test` | Run all Vitest unit/integration tests once |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm test:e2e` | Run Playwright E2E tests (starts dev server on port 3099 if not running) |
