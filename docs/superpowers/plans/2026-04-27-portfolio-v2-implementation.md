# Portfolio v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build portfolio-v2 — a Next.js 16 chat-first AI engineer portfolio with two-state UX (chat-first landing → portfolio + side chat), GSAP-driven animation, OpenAI/Vercel AI SDK chat with agentic RAG over a shared Supabase pgvector index, hand-authored display content, localStorage-backed chat persistence, and Upstash rate limiting.

**Architecture:**
- App Router (Next.js 16, React 19) with Tailwind v4 design tokens.
- `/api/chat` Node-runtime route handler streams via Vercel AI SDK; agentic tools `search_wiki` (pgvector), `scroll_to`, `highlight_project`.
- Shared `wiki_chunks` table in Supabase populated by an external wiki publisher (out of scope here); portfolio reads via Drizzle through Supabase's transaction-pooler endpoint.
- All motion via GSAP (`gsap`, `@gsap/react`, ScrollTrigger, ScrollToPlugin, Draggable for the mobile bottom sheet). No framer-motion.
- Persistence: localStorage `jrz-chat-v1`. Rate limit: Upstash sliding-window 20/hr/IP. Cost cap: monthly Redis counter, default $50.

**Tech Stack:** Next.js 16.2.4, React 19.2.4, TypeScript 5, Tailwind CSS v4, Vercel AI SDK (`ai` + `@ai-sdk/openai`), Drizzle ORM + `postgres`, Supabase Postgres + pgvector, Upstash Redis + `@upstash/ratelimit`, GSAP 3.12+ with `@gsap/react`, Vitest + React Testing Library, Playwright.

**Reference inputs (read these in order before starting any task):**
1. Spec: `docs/superpowers/specs/2026-04-27-portfolio-v2-design.md`
2. Design tokens: `docs/superpowers/design/2026-04-27-design-tokens.md`
3. Visual prototype: `docs/superpowers/design/2026-04-27-visual-prototype.html` — high-fidelity HTML/CSS/JS reference. Translate to React/Tailwind. When a task says "translate prototype lines X–Y," open the prototype to those lines.

**Hard preferences (memory-backed):**
- GSAP for ALL animation (never framer-motion / motion). Fetch GSAP API docs via context7 when in doubt — APIs evolve.
- DB host is **Supabase** (not Neon). Use the transaction-pooler endpoint (`port 6543`) for the portfolio's serverless connections.
- LLM is **OpenAI** GPT-4o; embeddings `text-embedding-3-small` (1536d).
- ORM is **Drizzle**. Driver is `postgres` (postgres.js).
- Rate limiting via **Upstash Redis** + `@upstash/ratelimit`.

**Pre-flight reading (BEFORE Task 1):** Next.js 16 has breaking changes vs. older Next docs you may have seen. Read these *before* writing any routing or server-component code:

```
node_modules/next/dist/docs/01-app/index.md
node_modules/next/dist/docs/03-architecture/index.md
```

Skim the App Router fundamentals + Server vs Client Components + Route Handlers. If you're unsure about an API at any point during execution, read the matching doc page in `node_modules/next/dist/docs/` rather than guessing.

---

## File Structure

Files created or modified, by responsibility:

**Configuration**
- `package.json` — dependencies
- `tsconfig.json` — path aliases (`@/*`)
- `next.config.ts` — minimal (defaults)
- `app/globals.css` — Tailwind v4 `@theme` block with all design tokens (replaces existing)
- `app/layout.tsx` — fonts, metadata, html shell (replaces existing)
- `drizzle.config.ts` — Drizzle Kit config
- `.env.example` — committed env var template
- `.gitignore` — already includes `.superpowers/`; add `.env.local`

**Display content (hand-authored)**
- `lib/content/profile.ts` — name, bio, currently strip
- `lib/content/work-timeline.ts` — chronological roles
- `lib/content/professional-projects.ts` — Athena, Counselor Dashboard, etc.
- `lib/content/personal-projects.ts` — FlowStack, PulseVR, Mercado
- `lib/content/contact.ts`

**Database**
- `db/schema.ts` — Drizzle schema for `wiki_chunks`
- `db/client.ts` — postgres + drizzle wrapper
- `db/migrations/0000_initial.sql` — schema migration

**RAG / AI**
- `lib/rag/retrieve.ts` — pgvector cosine similarity query
- `lib/ai/system-prompt.ts` — agent's system prompt
- `lib/ai/tools.ts` — Vercel AI SDK tool definitions
- `app/api/chat/route.ts` — streaming chat endpoint

**Rate limiting & cost cap**
- `lib/limits/rate-limit.ts` — Upstash sliding window per IP
- `lib/limits/cost-cap.ts` — monthly cost counter

**Chat state (client)**
- `lib/chat/types.ts` — TypeScript types for messages and state
- `lib/chat/store.ts` — localStorage-backed store (zustand-like, vanilla)
- `lib/chat/hook.ts` — `useChatState` React hook
- `components/chat/ChatStateProvider.tsx` — context provider

**GSAP utilities**
- `lib/gsap/register.ts` — plugin registration (one-shot)
- `lib/gsap/use-typewriter.ts` — cycling typewriter hook
- `lib/gsap/use-state-transition.ts` — State 1 ↔ State 2 timeline

**Tool effects (chat → UI)**
- `lib/tool-effects/event-bus.ts` — typed pub/sub
- `components/effects/ScrollEffectHandler.tsx` — listens for `scroll_to`, runs ScrollToPlugin
- `components/effects/HighlightEffectHandler.tsx` — listens for `highlight_project`, pulses card

**UI primitives**
- `components/ui/AmbientBackdrop.tsx` — grain + bloom + drift (fixed)
- `components/ui/Eyebrow.tsx` — `/01 ── about` pattern
- `components/ui/SectionHead.tsx` — title + lede pair

**State 1 (landing)**
- `components/state1/StateOneLanding.tsx` — full landing view (avatar, headline, prompt, chips, foot)
- `components/state1/PromptInput.tsx`
- `components/state1/ChipRow.tsx`

**State 2 (portfolio)**
- `components/state2/StateTwoView.tsx` — composes everything
- `components/state2/CompactHero.tsx` — hero with typewriter + tagline
- `components/state2/CurrentlyStrip.tsx`
- `components/state2/AboutSection.tsx`
- `components/state2/WorkSection.tsx` — timeline + project tabs
- `components/state2/PersonalProjectsSection.tsx`
- `components/state2/ContactSection.tsx`

**Chat UI**
- `components/chat/ChatPanel.tsx` — desktop right rail
- `components/chat/MessageList.tsx`
- `components/chat/ToolCallLine.tsx`
- `components/chat/ChatInput.tsx`
- `components/chat/MobileBottomSheet.tsx` — Draggable wrapper for mobile

**Composition**
- `app/page.tsx` — top-level state machine: render State 1 OR State 2; orchestrate transition

**Tests**
- `lib/chat/store.test.ts`
- `lib/limits/rate-limit.test.ts`
- `lib/limits/cost-cap.test.ts`
- `lib/rag/retrieve.test.ts`
- `tests/e2e/landing.spec.ts` — Playwright

**Tooling**
- `vitest.config.ts`
- `playwright.config.ts`

**Docs**
- `AGENTS.md` — updated
- `README.md` — replaced

---

## Phase 0 — Foundation

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime dependencies**

```bash
pnpm add gsap @gsap/react ai @ai-sdk/openai drizzle-orm postgres @upstash/redis @upstash/ratelimit zod
```

Expected: pnpm-lock.yaml updates; no errors.

- [ ] **Step 2: Install dev dependencies**

```bash
pnpm add -D drizzle-kit vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom @playwright/test tsx
```

- [ ] **Step 3: Verify package.json**

Run: `cat package.json | grep -E '"(gsap|ai|drizzle|@upstash)"'`
Expected: lines for each top-level dep present.

- [ ] **Step 4: Add scripts to package.json**

Replace the `scripts` block in `package.json`:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate"
}
```

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: install v2 dependencies (gsap, vercel ai sdk, drizzle, upstash, vitest, playwright)"
```

---

### Task 2: TypeScript path aliases

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 1: Read current tsconfig**

```bash
cat tsconfig.json
```

- [ ] **Step 2: Update tsconfig with `@/*` alias and stricter checks**

Replace `compilerOptions` entirely with:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Verify no type errors on the empty project**

```bash
pnpm exec tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add tsconfig.json
git commit -m "chore: add @/* path alias and noUncheckedIndexedAccess"
```

---

### Task 3: Tailwind v4 design tokens (globals.css)

**Files:**
- Modify (replace contents): `app/globals.css`

- [ ] **Step 1: Replace `app/globals.css` with the v2 token system**

```css
@import "tailwindcss";

@theme {
  /* Surface — warm dark */
  --color-ink-bg:        #0e0d10;
  --color-ink-surface-1: #161518;
  --color-ink-surface-2: #1f1d22;
  --color-ink-line:      #2a2730;
  --color-ink-line-soft: #1c1a20;

  /* Text — warm off-white */
  --color-ink-fg:        #f4f1eb;
  --color-ink-fg-muted:  #a8a4a0;
  --color-ink-fg-dim:    #6b6760;
  --color-ink-fg-fade:   #4a4742;

  /* Saffron */
  --color-saffron-300: #f0c878;
  --color-saffron-500: #e8b75a;
  --color-saffron-700: #b78a3d;

  /* Phosphor cyan */
  --color-phosphor-300: #8df5ec;
  --color-phosphor-500: #5ee5d9;
  --color-phosphor-700: #3aa89f;

  /* Fonts (CSS variables come from next/font in layout.tsx) */
  --font-display: var(--font-jetbrains-mono), ui-monospace, monospace;
  --font-body:    var(--font-general-sans), ui-sans-serif, system-ui, sans-serif;
  --font-italic:  var(--font-fraunces), ui-serif, Georgia, serif;
  --font-mono:    var(--font-jetbrains-mono), ui-monospace, monospace;

  /* Animations */
  --animate-blink: blink 1.05s steps(2) infinite;
  --animate-pulse-soft: pulse-soft 1.6s ease-in-out infinite;

  @keyframes blink { 50% { opacity: 0; } }
  @keyframes pulse-soft {
    0%, 100% { opacity: 0.5; }
    50%      { opacity: 1; }
  }
}

@layer base {
  html { background: var(--color-ink-bg); color-scheme: dark; }
  body {
    font-family: var(--font-body);
    background: var(--color-ink-bg);
    color: var(--color-ink-fg);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
    min-height: 100dvh;
    font-feature-settings: 'ss01';
  }
  :focus-visible {
    outline: 2px solid var(--color-saffron-500);
    outline-offset: 4px;
    border-radius: 4px;
  }
}

@utility container-prose {
  max-width: 78rem;
  margin-inline: auto;
  padding-inline: clamp(1rem, 4vw, 3rem);
}

@utility text-display {
  font-family: var(--font-display);
  font-feature-settings: 'ss03', 'ss05', 'cv02';
  letter-spacing: -0.03em;
}

@utility text-italic-accent {
  font-family: var(--font-italic);
  font-style: italic;
  font-weight: 600;
  color: var(--color-saffron-500);
  font-feature-settings: 'ss01';
}
```

- [ ] **Step 2: Verify Tailwind picks up custom colors**

Create a throwaway test file `app/_token-check.tsx`:

```tsx
export default function Check() {
  return <div className="bg-ink-bg text-saffron-500">tokens load</div>;
}
```

- [ ] **Step 3: Run dev server briefly and request the page**

```bash
pnpm dev &
sleep 4
curl -sI http://localhost:3000/_token-check | head -1
kill %1
rm app/_token-check.tsx
```

Expected: `HTTP/1.1 200 OK` (or similar). If 404, Tailwind config is fine; we just need a route — skip the curl, proceed.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat(theme): tailwind v4 design tokens (saffron + phosphor + warm-dark surface)"
```

---

### Task 4: Fonts + layout.tsx

**Files:**
- Modify (replace contents): `app/layout.tsx`

- [ ] **Step 1: Add a metadata constant**

(Skip — done in Step 2 below.)

- [ ] **Step 2: Replace `app/layout.tsx` with v2 layout**

`next/font/google` ships JetBrains Mono and Fraunces; General Sans is loaded from Fontshare via a `<link>` in `<head>` since it's not in Google Fonts.

```tsx
import type { Metadata } from "next";
import { JetBrains_Mono, Fraunces } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
  style: ["italic"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Janriz Libres — AI engineer",
  description:
    "Full-stack and AI engineer based in Cebu. The chat below has read everything I've written — instead of scrolling, just ask.",
  metadataBase: new URL("https://janrizlibres.vercel.app"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} ${fraunces.variable}`}
      style={{ ['--font-general-sans' as string]: "'General Sans', ui-sans-serif, system-ui" }}
    >
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600&display=swap"
        />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Verify fonts load in dev**

```bash
pnpm dev &
sleep 4
curl -s http://localhost:3000 | grep -E '(jetbrains|fraunces|fontshare)' | head -3
kill %1
```

Expected: at least one match for `fontshare` (link tag) and the Next/font CSS reference.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(layout): load JetBrains Mono + Fraunces (next/font) and General Sans (fontshare)"
```

---

### Task 5: Reset app/page.tsx to a deferred shell

**Files:**
- Modify (replace contents): `app/page.tsx`

- [ ] **Step 1: Replace with a placeholder that we'll iterate on**

```tsx
export default function HomePage() {
  return (
    <main className="container-prose py-24">
      <p className="font-mono text-ink-fg-dim text-sm">jrz·dev — under construction</p>
    </main>
  );
}
```

- [ ] **Step 2: Run dev, sanity-check render**

```bash
pnpm dev &
sleep 4
curl -s http://localhost:3000 | grep -F 'jrz·dev'
kill %1
```

Expected: the placeholder text appears.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "chore: replace CRA scaffold with placeholder shell"
```

---

## Phase 1 — Display content data

### Task 6: Hand-authored content modules

**Files:**
- Create: `lib/content/profile.ts`
- Create: `lib/content/work-timeline.ts`
- Create: `lib/content/professional-projects.ts`
- Create: `lib/content/personal-projects.ts`
- Create: `lib/content/contact.ts`

- [ ] **Step 1: Create `lib/content/profile.ts`**

```ts
export const profile = {
  name: "Janriz Libres",
  cityShort: "Cebu, PH",
  greetingName: "Janriz",
  taglineState1:
    "I build production systems — full-stack platforms, AI agents, and RAG pipelines. Instead of scrolling, just ask — the chat has read everything I've written.",
  taglineState2:
    "Building production systems across full-stack and AI. Based in Cebu, working remotely.",
  aboutLede:
    "A Filipino full-stack & AI developer. Summa Cum Laude Bachelor of Science in Computer Science from Xavier University.",
  aboutBody: [
    "I'm Janriz. Full-stack and AI developer based in Cebu, Philippines.",
    "Most recently at LogoLife as a Full-Stack / AI Engineer — where I shipped Athena, a context-aware admissions assistant with Mem0-backed memory and a scoped MCP server, alongside production crawlers, dashboards, and load-testing harnesses.",
    "Game dev hobbyist on the side. Believer in YAGNI and shipping the boring parts first.",
  ],
  currentlyStack: [
    "Next.js",
    "Vercel AI SDK",
    "OpenAI",
    "pgvector",
    "MCP",
  ],
  currentlyOpenTo: ["AI eng roles", "remote"],
  portraitSrc: "/profile.jpg",
  portraitAlt: "Janriz Libres",
  /** Words that the State 1 / State 2 headlines cycle through. */
  headlineTypewriter: ["AI", "Full-stack"] as const,
  /** Italic accent that follows the typewriter. */
  headlineSuffix: "engineer",
  /** Italic accents inside the about body — case-sensitive substring match. */
  aboutItalicWords: ["Cebu", "LogoLife", "YAGNI"] as const,
};
```

- [ ] **Step 2: Create `lib/content/work-timeline.ts`**

```ts
export interface TimelineEntry {
  years: string;
  durationLabel: string;
  company: string;
  role: string;
  techLabel: string;
}

export const workTimeline: TimelineEntry[] = [
  {
    years: "2025–26",
    durationLabel: "5 mo",
    company: "LogoLife",
    role: "Full-stack / AI Engineer",
    techLabel: "TypeScript · MCP · Mem0",
  },
  {
    years: "2025",
    durationLabel: "3 mo",
    company: "Tolstoy",
    role: "Full-stack / AI Engineer",
    techLabel: "TanStack · AWS",
  },
  {
    years: "2024",
    durationLabel: "4 mo",
    company: "Elinnov Technologies",
    role: "Software Engineer Intern",
    techLabel: "ASP.NET · React",
  },
  {
    years: "2023–24",
    durationLabel: "10 mo",
    company: "The Crusader Yearbook",
    role: "Software Developer",
    techLabel: "Laravel · WordPress · Python",
  },
];

export const workTotalLabel = "~22 months across 4 roles";
```

- [ ] **Step 3: Create `lib/content/professional-projects.ts`**

```ts
export interface ProfessionalProject {
  slug: string;
  title: string;
  stack: string;
  description: string;
  bullets: string[];
}

export const professionalProjects: ProfessionalProject[] = [
  {
    slug: "athena",
    title: "Athena — AI Chat Assistant",
    stack: "React · Express · Vercel AI SDK · Mem0 · MCP",
    description:
      "A context-aware AI assistant embedded in the admissions platform — proactive coach + reactive knowledge base for students.",
    bullets: [
      "Implemented Mem0 for cross-session long-term memory.",
      "Built a secure MCP server for controlled access to live student data.",
      'Designed a "Nudge" system to proactively re-engage users.',
    ],
  },
  {
    slug: "counselor-dashboard",
    title: "Counselor Dashboard",
    stack: "React · Node.js · MongoDB · OpenAI (GPT-4o) · Tailwind",
    description:
      "Unified dashboard streamlining pre-session workflows for counselors with embedded AI assistant.",
    bullets: [
      "Created snapshot of student metrics for instant context.",
      "LLM-powered summarization of past sessions.",
      "Embedded Athena AI directly into the workflow.",
    ],
  },
  {
    slug: "crawler-dashboard",
    title: "Crawler Dashboard",
    stack: "React · TypeScript · MongoDB · Recharts · Tailwind",
    description:
      "Comprehensive dashboard for managing multi-stage web crawling operations with real-time visibility.",
    bullets: [
      "Real-time pipeline KPIs, success rates, error counts.",
      "Interactive controls for crawls across data categories.",
      "Saturation monitoring to detect duplicate spikes.",
    ],
  },
  {
    slug: "ai-crawler",
    title: "AI-Assisted Crawler",
    stack: "TypeScript · Firecrawl · OpenAI · Grok · Google Places",
    description:
      "Configurable, multi-stage crawling pipeline for opportunities data extraction and enrichment.",
    bullets: [
      "5-stage fault-tolerant pipeline.",
      "Two-layer vector dedup — 70% cost reduction.",
      "Token-budget aware orchestration with Slack alerts.",
    ],
  },
  {
    slug: "data-maintenance-pipeline",
    title: "Data Maintenance Pipeline",
    stack: "LLMs (Grok, OpenAI) · Mapbox · Slack",
    description:
      "Autonomous background system validating, standardizing, and enriching dataset records.",
    bullets: [
      "AI-driven structured-output updates.",
      "Automated link validation and geocoding.",
      "Lifecycle management for obsolete records.",
    ],
  },
  {
    slug: "e2e-testing-suite",
    title: "E2E Testing Suite",
    stack: "Playwright · TypeScript · Node.js · Allure",
    description:
      "Comprehensive automated E2E suite ensuring platform reliability across user roles and workflows.",
    bullets: [
      "Role-based test architecture for 8 personas.",
      "Optimized auth via session reuse.",
      "Stealth mode to bypass bot detection.",
    ],
  },
];
```

- [ ] **Step 4: Create `lib/content/personal-projects.ts`**

Confirm screenshot assets exist in v1 first. Then copy them:

```bash
mkdir -p public/projects
cp -r /Users/janlibs/dev/dev-portfolio/src/assets/flow-stack public/projects/flowstack
cp -r /Users/janlibs/dev/dev-portfolio/src/assets/pulsevr   public/projects/pulsevr
cp -r /Users/janlibs/dev/dev-portfolio/src/assets/mercado   public/projects/mercado
ls public/projects/flowstack public/projects/pulsevr public/projects/mercado | head -20
```

Expected: image files listed for each project (ignore `.DS_Store`).

Then create `lib/content/personal-projects.ts`:

```ts
export interface PersonalProject {
  slug: string;
  title: string;
  stack: string;
  description: string;
  /** First image becomes the primary thumbnail. Paths are relative to /public. */
  images: string[];
  repoUrl: string;
  demoUrl: string;
}

export const personalProjects: PersonalProject[] = [
  {
    slug: "flowstack",
    title: "FlowStack",
    stack: "TypeScript · Next.js · MongoDB · Tailwind",
    description: "StackOverflow clone with NextAuth — posting, search, comments, and analytics.",
    images: [
      "/projects/flowstack/one.jpg",
      "/projects/flowstack/two.jpg",
      "/projects/flowstack/three.jpg",
    ],
    repoUrl: "https://github.com/janrizmlibres/devflow-clone-app",
    demoUrl: "https://devflow-clone-app.vercel.app/",
  },
  {
    slug: "pulsevr",
    title: "PulseVR",
    stack: "TypeScript · React · Tailwind",
    description:
      "Responsive landing page for a fictional VR startup — mobile-first, motion-rich.",
    images: [
      "/projects/pulsevr/one.jpg",
      "/projects/pulsevr/two.jpg",
      "/projects/pulsevr/three.jpg",
    ],
    repoUrl: "https://github.com/janrizmlibres/pulse-vr",
    demoUrl: "https://pulse-vr.vercel.app/",
  },
  {
    slug: "mercado",
    title: "Mercado",
    stack: "TS · TanStack · Nest.js · Postgres · Docker",
    description:
      "Type-safe e-commerce frontend with GraphQL, cart, checkout, and admin dashboard.",
    images: [
      "/projects/mercado/one.jpg",
      "/projects/mercado/two.jpg",
      "/projects/mercado/three.jpg",
    ],
    repoUrl: "https://github.com/janrizmlibres/mercado-front/",
    demoUrl: "https://mercado-front-production.up.railway.app/",
  },
];
```

> **Note:** verify the actual file extensions in `public/projects/<slug>/` after the copy and update the paths if they're `.avif` or different filenames.

- [ ] **Step 5: Create `lib/content/contact.ts`**

```ts
export interface ContactLink {
  slug: string;
  label: string;
  value: string;
  href: string;
}

export const contactLinks: ContactLink[] = [
  {
    slug: "email",
    label: "email",
    value: "libres.janriz@gmail.com",
    href: "mailto:libres.janriz@gmail.com",
  },
  {
    slug: "github",
    label: "github",
    value: "@janrizmlibres",
    href: "https://github.com/janrizmlibres",
  },
  {
    slug: "linkedin",
    label: "linkedin",
    value: "in/janrizlibres",
    href: "https://linkedin.com/in/janrizlibres",
  },
];
```

- [ ] **Step 6: Verify type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add lib/content public/projects
git commit -m "feat(content): hand-authored display content (profile, timeline, projects, contact)"
```

---

## Phase 2 — Design system primitives

### Task 7: AmbientBackdrop (grain + bloom)

**Files:**
- Create: `components/ui/AmbientBackdrop.tsx`

- [ ] **Step 1: Translate prototype lines 92–113 (the `body::before` grain + `body::after` bloom)**

Open `docs/superpowers/design/2026-04-27-visual-prototype.html` lines 92–113 for reference.

```tsx
"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import gsap from "gsap";

/**
 * Fixed full-viewport overlays:
 *   - SVG grain at ~6% opacity (mix-blend overlay)
 *   - Soft saffron + phosphor radial gradient that drifts in a slow loop
 *
 * Sits behind all content (z-0). `<main>` and friends should be z-2.
 */
export function AmbientBackdrop() {
  const bloomRef = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!bloomRef.current) return;
    gsap.to(bloomRef.current, {
      backgroundPositionX: "+=80px",
      backgroundPositionY: "-=60px",
      duration: 60,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  });

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 mix-blend-overlay opacity-60"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.95  0 0 0 0 0.94  0 0 0 0 0.92  0 0 0 0.04 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div
        aria-hidden
        ref={bloomRef}
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 55% at 25% 18%, rgba(232,183,90,0.10), transparent 60%), radial-gradient(ellipse 45% 35% at 75% 75%, rgba(94,229,217,0.06), transparent 60%)",
          backgroundRepeat: "no-repeat",
          willChange: "background-position",
        }}
      />
    </>
  );
}
```

- [ ] **Step 2: Verify type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add components/ui/AmbientBackdrop.tsx
git commit -m "feat(ui): AmbientBackdrop — grain overlay + drifting bloom (GSAP)"
```

---

### Task 8: Eyebrow + SectionHead

**Files:**
- Create: `components/ui/Eyebrow.tsx`
- Create: `components/ui/SectionHead.tsx`

- [ ] **Step 1: Create `components/ui/Eyebrow.tsx`**

```tsx
import { cn } from "@/lib/utils/cn";

interface EyebrowProps {
  num: string;
  children: React.ReactNode;
  className?: string;
}

export function Eyebrow({ num, children, className }: EyebrowProps) {
  return (
    <p
      className={cn(
        "mb-5 flex items-baseline gap-3 font-mono text-xs tracking-[0.06em] text-ink-fg-dim lowercase",
        className
      )}
    >
      <span className="text-saffron-500">{num}</span>
      <span>{children}</span>
      <span aria-hidden className="ml-2 inline-block h-px w-14 self-center bg-ink-line" />
    </p>
  );
}
```

- [ ] **Step 2: Create `lib/utils/cn.ts`** (a tiny class-name joiner)

```ts
type ClassValue = string | number | false | null | undefined;

export function cn(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(" ");
}
```

- [ ] **Step 3: Create `components/ui/SectionHead.tsx`**

```tsx
import { Eyebrow } from "./Eyebrow";
import { renderItalicAccents } from "@/lib/utils/render-italic";

interface SectionHeadProps {
  num: string;
  eyebrow: string;
  /** Section title with one or more italic accent words wrapped in `*word*`. */
  title: string;
  /** Lede with optional italic words wrapped in `*word*`. */
  lede: string;
}

export function SectionHead({ num, eyebrow, title, lede }: SectionHeadProps) {
  return (
    <div className="mb-10 grid items-start gap-8 md:grid-cols-[1fr_2fr]">
      <div>
        <Eyebrow num={num}>{eyebrow}</Eyebrow>
        <h2 className="text-display text-[clamp(2rem,4.5vw,3.5rem)] leading-none m-0 font-medium text-ink-fg">
          {renderItalicAccents(title, "text-italic-accent")}
        </h2>
      </div>
      <p className="m-0 text-[1.0625rem] leading-relaxed text-ink-fg-muted">
        {renderItalicAccents(lede, "text-italic-accent text-ink-fg")}
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Create the italic-accent renderer `lib/utils/render-italic.tsx`**

```tsx
import { Fragment } from "react";

/**
 * Splits a string by `*word*` markers and returns React fragments where the
 * starred words are rendered with the given className (an italic accent).
 *
 * Ex:  renderItalicAccents("About *me*") → [About , <span class>me</span>]
 */
export function renderItalicAccents(input: string, accentClass: string): React.ReactNode {
  const parts = input.split(/\*([^*]+)\*/g);
  return parts.map((segment, i) => {
    if (i % 2 === 1) {
      // odd indices are between asterisks
      return (
        <span key={i} className={accentClass}>
          {segment}
        </span>
      );
    }
    return <Fragment key={i}>{segment}</Fragment>;
  });
}
```

- [ ] **Step 5: Type-check**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add components/ui lib/utils
git commit -m "feat(ui): Eyebrow, SectionHead, italic-accent renderer"
```

---

### Task 9: GSAP plugin registration + typewriter hook (TDD)

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `lib/gsap/register.ts`
- Create: `lib/gsap/use-typewriter.ts`
- Create: `lib/gsap/use-typewriter.test.ts`

> **Order matters:** install the React Vitest plugin and create the Vitest config FIRST, then write code + tests. Test runs in Step 7 will fail otherwise.

- [ ] **Step 0a: Install `@vitejs/plugin-react`**

```bash
pnpm add -D @vitejs/plugin-react
```

- [ ] **Step 0b: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

- [ ] **Step 0c: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 1: Create `lib/gsap/register.ts`**

```ts
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { Draggable } from "gsap/Draggable";

let registered = false;

/**
 * Idempotent. Call once at app boot (e.g. in app/page.tsx via a client child).
 */
export function registerGsapPlugins() {
  if (registered) return;
  if (typeof window === "undefined") return; // never on server
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Draggable);
  registered = true;
}
```

- [ ] **Step 2: Write failing test for `useTypewriter`**

Tests run under jsdom; we use fake timers to drive the typewriter deterministically.

`lib/gsap/use-typewriter.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTypewriter } from "./use-typewriter";

describe("useTypewriter", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("starts with the first word fully typed", () => {
    const { result } = renderHook(() => useTypewriter(["AI", "Full-stack"]));
    expect(result.current).toBe("AI");
  });

  it("erases char-by-char then types the next word", async () => {
    const { result } = renderHook(() =>
      useTypewriter(["AI", "Full-stack"], { holdMs: 100, eraseMs: 10, typeMs: 10, gapMs: 10 })
    );

    expect(result.current).toBe("AI");

    // Hold + erase 'I' + erase 'A'
    await act(async () => { await vi.advanceTimersByTimeAsync(100); }); // hold
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });  // erase I -> "A"
    expect(result.current).toBe("A");
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });  // erase A -> ""
    expect(result.current).toBe("");

    // Gap then type "F"
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });  // gap
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });  // type F
    expect(result.current).toBe("F");
  });

  it("respects prefers-reduced-motion by holding the first word", async () => {
    vi.stubGlobal("matchMedia", (q: string) => ({
      matches: q.includes("reduce"),
      media: q,
      addListener() {}, removeListener() {},
      addEventListener() {}, removeEventListener() {},
      dispatchEvent: () => false,
    }));
    const { result } = renderHook(() => useTypewriter(["AI", "Full-stack"]));
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(result.current).toBe("AI");
    vi.unstubAllGlobals();
  });
});
```

- [ ] **Step 3: Run test, expect failure**

```bash
pnpm test lib/gsap/use-typewriter.test.ts
```

Expected: FAIL with "Cannot find module './use-typewriter'" or similar.

- [ ] **Step 4: Implement `lib/gsap/use-typewriter.ts`**

```ts
import { useEffect, useRef, useState } from "react";

interface Options {
  /** Time fully-typed word stays visible. Default 2400ms. */
  holdMs?: number;
  /** Per-character erase delay. Default 60ms. */
  eraseMs?: number;
  /** Per-character type delay. Default 90ms. */
  typeMs?: number;
  /** Pause between erase-complete and type-start. Default 220ms. */
  gapMs?: number;
}

/**
 * Cycles through the given words using a typewriter erase/type effect.
 * Returns the currently-displayed substring. Honors `prefers-reduced-motion`
 * by sticking on the first word.
 */
export function useTypewriter(
  words: readonly string[],
  options: Options = {}
): string {
  const { holdMs = 2400, eraseMs = 60, typeMs = 90, gapMs = 220 } = options;
  const [text, setText] = useState<string>(words[0] ?? "");
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    if (typeof window !== "undefined") {
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        setText(words[0] ?? "");
        return;
      }
    }

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        setTimeout(() => {
          if (!cancelledRef.current) resolve();
        }, ms);
      });

    let idx = 0;
    setText(words[idx] ?? "");

    (async () => {
      while (!cancelledRef.current) {
        await sleep(holdMs);
        const current = words[idx] ?? "";
        for (let i = current.length - 1; i >= 0; i--) {
          await sleep(eraseMs);
          if (cancelledRef.current) return;
          setText(current.slice(0, i));
        }
        await sleep(gapMs);
        idx = (idx + 1) % words.length;
        const next = words[idx] ?? "";
        for (let i = 1; i <= next.length; i++) {
          await sleep(typeMs);
          if (cancelledRef.current) return;
          setText(next.slice(0, i));
        }
      }
    })();

    return () => {
      cancelledRef.current = true;
    };
  }, [words, holdMs, eraseMs, typeMs, gapMs]);

  return text;
}
```

- [ ] **Step 5: Run test, expect pass**

```bash
pnpm test lib/gsap/use-typewriter.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/gsap vitest.config.ts vitest.setup.ts package.json pnpm-lock.yaml
git commit -m "feat(gsap): plugin registry + useTypewriter hook (TDD, prefers-reduced-motion aware)"
```

---

## Phase 3 — Chat state persistence

### Task 10: Chat types + localStorage store (TDD)

**Files:**
- Create: `lib/chat/types.ts`
- Create: `lib/chat/store.ts`
- Create: `lib/chat/store.test.ts`

- [ ] **Step 1: Create `lib/chat/types.ts`**

```ts
export type ChatRole = "user" | "assistant" | "tool";

export interface ToolCall {
  name: "search_wiki" | "scroll_to" | "highlight_project";
  args: Record<string, unknown>;
  resultPreview?: string; // for the tool-call display line
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  /** For text messages. Tool calls live in `toolCalls`. */
  content: string;
  toolCalls?: ToolCall[];
  createdAt: string; // ISO
}

export interface ChatState {
  activated: boolean;
  messages: ChatMessage[];
  updatedAt: string;
}

export const STORAGE_KEY = "jrz-chat-v1";
```

- [ ] **Step 2: Write failing tests for the store**

`lib/chat/store.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { createChatStore } from "./store";
import { STORAGE_KEY } from "./types";

beforeEach(() => {
  localStorage.clear();
});

describe("chat store", () => {
  it("starts deactivated with no messages", () => {
    const s = createChatStore();
    expect(s.getState().activated).toBe(false);
    expect(s.getState().messages).toEqual([]);
  });

  it("appendMessage activates and persists", () => {
    const s = createChatStore();
    s.appendMessage({ id: "m1", role: "user", content: "hi", createdAt: "2026-01-01T00:00:00Z" });
    expect(s.getState().activated).toBe(true);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.messages).toHaveLength(1);
    expect(stored.activated).toBe(true);
  });

  it("clear resets to deactivated", () => {
    const s = createChatStore();
    s.appendMessage({ id: "m1", role: "user", content: "hi", createdAt: "2026-01-01T00:00:00Z" });
    s.clear();
    expect(s.getState().activated).toBe(false);
    expect(s.getState().messages).toEqual([]);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.activated).toBe(false);
  });

  it("rehydrates from existing storage", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activated: true,
        messages: [{ id: "x", role: "user", content: "hi", createdAt: "2026-01-01T00:00:00Z" }],
        updatedAt: "2026-01-01T00:00:00Z",
      })
    );
    const s = createChatStore();
    expect(s.getState().activated).toBe(true);
    expect(s.getState().messages).toHaveLength(1);
  });

  it("subscribers are notified on changes", () => {
    const s = createChatStore();
    const calls: number[] = [];
    s.subscribe(() => calls.push(s.getState().messages.length));
    s.appendMessage({ id: "1", role: "user", content: "a", createdAt: "" });
    s.appendMessage({ id: "2", role: "assistant", content: "b", createdAt: "" });
    expect(calls).toEqual([1, 2]);
  });

  it("survives an unparseable localStorage payload", () => {
    localStorage.setItem(STORAGE_KEY, "not-json");
    const s = createChatStore();
    expect(s.getState().activated).toBe(false);
    expect(s.getState().messages).toEqual([]);
  });
});
```

- [ ] **Step 3: Run test, expect failure**

```bash
pnpm test lib/chat/store.test.ts
```

Expected: FAIL — "createChatStore not defined".

- [ ] **Step 4: Implement `lib/chat/store.ts`**

```ts
import { ChatMessage, ChatState, STORAGE_KEY } from "./types";

type Listener = () => void;

export interface ChatStore {
  getState: () => ChatState;
  appendMessage: (msg: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clear: () => void;
  subscribe: (listener: Listener) => () => void;
}

function emptyState(): ChatState {
  return { activated: false, messages: [], updatedAt: new Date(0).toISOString() };
}

function readFromStorage(): ChatState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<ChatState>;
    return {
      activated: Boolean(parsed.activated),
      messages: Array.isArray(parsed.messages) ? parsed.messages as ChatMessage[] : [],
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date(0).toISOString(),
    };
  } catch {
    return emptyState();
  }
}

function writeToStorage(state: ChatState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be full or disabled (incognito). Swallow — store is in-memory.
  }
}

export function createChatStore(): ChatStore {
  let state = readFromStorage();
  const listeners = new Set<Listener>();

  function notify() {
    for (const l of listeners) l();
  }

  return {
    getState: () => state,
    appendMessage(msg) {
      state = {
        activated: true,
        messages: [...state.messages, msg],
        updatedAt: new Date().toISOString(),
      };
      writeToStorage(state);
      notify();
    },
    setMessages(messages) {
      state = {
        activated: messages.length > 0,
        messages,
        updatedAt: new Date().toISOString(),
      };
      writeToStorage(state);
      notify();
    },
    clear() {
      state = { activated: false, messages: [], updatedAt: new Date().toISOString() };
      writeToStorage(state);
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
```

- [ ] **Step 5: Run test, expect pass**

```bash
pnpm test lib/chat/store.test.ts
```

Expected: 6 tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/chat
git commit -m "feat(chat): localStorage-backed store + types (TDD)"
```

---

### Task 11: useChatState hook + Provider

**Files:**
- Create: `lib/chat/hook.ts`
- Create: `components/chat/ChatStateProvider.tsx`

- [ ] **Step 1: Create the hook (uses `useSyncExternalStore`)**

`lib/chat/hook.ts`:

```ts
import { useSyncExternalStore } from "react";
import { ChatStore } from "./store";

export function useChatState(store: ChatStore) {
  const state = useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getState // SSR snapshot — same as client; we render State 1 on server
  );
  return {
    state,
    appendMessage: store.appendMessage,
    setMessages: store.setMessages,
    clear: store.clear,
  };
}
```

- [ ] **Step 2: Create `components/chat/ChatStateProvider.tsx`**

```tsx
"use client";

import { createContext, useContext, useMemo } from "react";
import { ChatStore, createChatStore } from "@/lib/chat/store";

const ChatStoreContext = createContext<ChatStore | null>(null);

export function ChatStateProvider({ children }: { children: React.ReactNode }) {
  const store = useMemo(() => createChatStore(), []);
  return <ChatStoreContext.Provider value={store}>{children}</ChatStoreContext.Provider>;
}

export function useChatStore(): ChatStore {
  const store = useContext(ChatStoreContext);
  if (!store) throw new Error("useChatStore must be used within ChatStateProvider");
  return store;
}
```

- [ ] **Step 3: Type-check**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add lib/chat/hook.ts components/chat/ChatStateProvider.tsx
git commit -m "feat(chat): React provider + useChatState hook"
```

---

## Phase 4 — Database

### Task 12: Drizzle schema for `wiki_chunks`

**Files:**
- Create: `db/schema.ts`
- Create: `drizzle.config.ts`

- [ ] **Step 1: Create `db/schema.ts`**

```ts
import { pgTable, text, jsonb, timestamp, customType } from "drizzle-orm/pg-core";

/** pgvector type — Drizzle doesn't ship a built-in for it. */
export const vector = customType<{ data: number[]; driverData: string }>({
  dataType() { return "vector(1536)"; },
  toDriver(value) { return `[${value.join(",")}]`; },
  fromDriver(value) {
    if (typeof value === "string") {
      return value.replace(/^\[/, "").replace(/\]$/, "").split(",").map(Number);
    }
    return value as unknown as number[];
  },
});

export const wikiChunks = pgTable("wiki_chunks", {
  id:             text("id").primaryKey(),
  sourcePath:     text("source_path").notNull(),
  title:          text("title"),
  type:           text("type").notNull(),
  tags:           text("tags").array(),
  textContent:    text("text").notNull(),
  textHash:       text("text_hash").notNull(),
  embedding:      vector("embedding"),
  embeddingModel: text("embedding_model").notNull(),
  metadata:       jsonb("metadata").notNull().default({}),
  sourceCommit:   text("source_commit"),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type WikiChunk = typeof wikiChunks.$inferSelect;
```

- [ ] **Step 2: Create `drizzle.config.ts`**

```ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.SUPABASE_DB_URL ?? "" },
  strict: true,
  verbose: true,
} satisfies Config;
```

- [ ] **Step 3: Generate the initial migration**

```bash
pnpm db:generate
```

Expected: a file `db/migrations/0000_<auto>.sql` is created. **Open it.**

- [ ] **Step 4: Hand-edit the generated migration**

Drizzle Kit can't infer the `vector` extension or pgvector indexes. Edit the generated SQL file so it begins with:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

…and append, after the `CREATE TABLE wiki_chunks` block:

```sql
CREATE INDEX IF NOT EXISTS wiki_chunks_embedding_idx
  ON wiki_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS wiki_chunks_type_idx
  ON wiki_chunks (type);

CREATE INDEX IF NOT EXISTS wiki_chunks_tags_idx
  ON wiki_chunks USING gin (tags);

CREATE INDEX IF NOT EXISTS wiki_chunks_metadata_idx
  ON wiki_chunks USING gin (metadata);
```

- [ ] **Step 5: Commit (do NOT run migrate yet — that needs a real DB)**

```bash
git add db drizzle.config.ts
git commit -m "feat(db): drizzle schema + initial migration for wiki_chunks (pgvector)"
```

---

### Task 13: DB client

**Files:**
- Create: `db/client.ts`
- Create: `.env.example`

- [ ] **Step 1: Create `db/client.ts`**

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  // Fail loudly only in route-handler context. At import time we may be in
  // a build step; let consumers throw if they actually try to use the client.
  console.warn("[db] SUPABASE_DB_URL not set — DB calls will fail.");
}

const queryClient = postgres(url ?? "", {
  prepare: false, // Supabase transaction-pooler (port 6543) requires this
  max: 5,
});

export const db = drizzle(queryClient);
```

- [ ] **Step 2: Create `.env.example`**

```
# OpenAI (chat + embeddings)
OPENAI_API_KEY=sk-...

# Supabase Postgres (read-only role for the portfolio).
# Use the "transaction pooler" connection string (port 6543) for serverless.
SUPABASE_DB_URL=postgres://reader:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Upstash Redis (rate limiting + cost cap)
UPSTASH_REDIS_REST_URL=https://....upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Soft monthly cap on OpenAI spend (USD). Default $50.
MONTHLY_COST_CAP_USD=50
```

- [ ] **Step 3: Confirm `.gitignore` ignores `.env.local`**

```bash
grep -E '\.env(\*|\.local)' .gitignore || echo ".env*" >> .gitignore
```

- [ ] **Step 4: Commit**

```bash
git add db/client.ts .env.example .gitignore
git commit -m "feat(db): postgres-js + drizzle client; .env.example"
```

---

## Phase 5 — RAG retrieval (TDD)

### Task 14: Retrieve module

**Files:**
- Create: `lib/rag/retrieve.ts`
- Create: `lib/rag/retrieve.test.ts`

- [ ] **Step 1: Write failing tests with a mocked DB**

`lib/rag/retrieve.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExecute = vi.fn();
vi.mock("@/db/client", () => ({
  db: { execute: (...args: unknown[]) => mockExecute(...args) },
}));

const mockEmbed = vi.fn();
vi.mock("@/lib/ai/embed", () => ({
  embedQuery: (...args: unknown[]) => mockEmbed(...args),
}));

import { retrieveChunks } from "./retrieve";

beforeEach(() => {
  mockExecute.mockReset();
  mockEmbed.mockReset();
});

describe("retrieveChunks", () => {
  it("embeds the query and returns top-K rows", async () => {
    mockEmbed.mockResolvedValue(new Array(1536).fill(0.01));
    mockExecute.mockResolvedValue([
      { id: "projects/athena#0", source_path: "projects/athena.md", title: "Athena", type: "project",
        tags: ["ai"], text: "Athena is...", metadata: { routes: { portfolio: "projects/athena" } },
        similarity: 0.91 },
    ]);

    const rows = await retrieveChunks({ query: "athena memory", k: 5 });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: "projects/athena#0", similarity: 0.91 });
    expect(mockEmbed).toHaveBeenCalledWith("athena memory");
  });

  it("returns empty array when DB throws", async () => {
    mockEmbed.mockResolvedValue(new Array(1536).fill(0.01));
    mockExecute.mockRejectedValue(new Error("connection refused"));
    const rows = await retrieveChunks({ query: "anything" });
    expect(rows).toEqual([]);
  });

  it("applies type filter when provided", async () => {
    mockEmbed.mockResolvedValue(new Array(1536).fill(0));
    mockExecute.mockResolvedValue([]);
    await retrieveChunks({ query: "x", type: "project" });
    const sqlArg = mockExecute.mock.calls[0][0];
    expect(String(sqlArg)).toContain("type");
  });
});
```

- [ ] **Step 2: Run test, expect failure**

```bash
pnpm test lib/rag/retrieve.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/ai/embed.ts`**

```ts
import OpenAI from "openai";

const openai = new OpenAI();

export async function embedQuery(text: string): Promise<number[]> {
  const r = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return r.data[0]!.embedding;
}
```

> The Vercel AI SDK has its own embedding helper, but we use the bare OpenAI client here for clarity. `pnpm add openai` is implied by `@ai-sdk/openai` deps; if not, install: `pnpm add openai`.

- [ ] **Step 4: Implement `lib/rag/retrieve.ts`**

```ts
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { embedQuery } from "@/lib/ai/embed";

export interface RetrievedChunk {
  id: string;
  source_path: string;
  title: string | null;
  type: string;
  tags: string[];
  text: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export interface RetrieveOptions {
  query: string;
  type?: string;
  tags?: string[];
  k?: number;
}

export async function retrieveChunks(opts: RetrieveOptions): Promise<RetrievedChunk[]> {
  const { query, type, tags, k = 6 } = opts;
  try {
    const queryEmbedding = await embedQuery(query);
    const vec = `[${queryEmbedding.join(",")}]`;

    const rows = await db.execute<RetrievedChunk>(sql`
      SELECT
        id,
        source_path,
        title,
        type,
        coalesce(tags, '{}') AS tags,
        text,
        metadata,
        1 - (embedding <=> ${vec}::vector) AS similarity
      FROM wiki_chunks
      WHERE embedding_model = 'text-embedding-3-small'
        ${type ? sql`AND type = ${type}` : sql``}
        ${tags && tags.length > 0 ? sql`AND tags && ${tags}` : sql``}
      ORDER BY embedding <=> ${vec}::vector
      LIMIT ${k}
    `);

    return rows as unknown as RetrievedChunk[];
  } catch (err) {
    console.error("[rag] retrieve failed:", err);
    return [];
  }
}
```

- [ ] **Step 5: Install OpenAI client if not yet**

```bash
pnpm add openai
```

- [ ] **Step 6: Run test, expect pass**

```bash
pnpm test lib/rag/retrieve.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 7: Commit**

```bash
git add lib/rag lib/ai/embed.ts package.json pnpm-lock.yaml
git commit -m "feat(rag): retrieveChunks with pgvector cosine similarity (TDD)"
```

---

## Phase 6 — Rate limiting & cost cap (TDD)

### Task 15: Rate limit module

**Files:**
- Create: `lib/limits/rate-limit.ts`
- Create: `lib/limits/rate-limit.test.ts`

- [ ] **Step 1: Tests**

`lib/limits/rate-limit.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const limitFn = vi.fn();

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class { limit = limitFn; static slidingWindow() { return {}; } },
}));
vi.mock("@upstash/redis", () => ({ Redis: { fromEnv: () => ({}) } }));

import { checkRateLimit } from "./rate-limit";

beforeEach(() => limitFn.mockReset());

describe("checkRateLimit", () => {
  it("returns allowed=true when under quota", async () => {
    limitFn.mockResolvedValue({ success: true, limit: 20, remaining: 19, reset: Date.now() + 3600_000 });
    const r = await checkRateLimit("1.2.3.4");
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(19);
  });

  it("returns allowed=false with retryAfterMs when over quota", async () => {
    const reset = Date.now() + 60_000;
    limitFn.mockResolvedValue({ success: false, limit: 20, remaining: 0, reset });
    const r = await checkRateLimit("1.2.3.4");
    expect(r.allowed).toBe(false);
    expect(r.retryAfterMs).toBeGreaterThan(0);
  });

  it("falls back to allow on Upstash failure (open-fail)", async () => {
    limitFn.mockRejectedValue(new Error("upstash down"));
    const r = await checkRateLimit("1.2.3.4");
    expect(r.allowed).toBe(true);
    expect(r.degraded).toBe(true);
  });
});
```

- [ ] **Step 2: Run, expect failure**

```bash
pnpm test lib/limits/rate-limit.test.ts
```

- [ ] **Step 3: Implement `lib/limits/rate-limit.ts`**

```ts
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = Redis.fromEnv();

const ratelimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 h"),
  prefix: "jrz:chat",
  analytics: false,
});

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  degraded?: boolean;
}

export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  try {
    const r = await ratelimiter.limit(identifier);
    return {
      allowed: r.success,
      remaining: r.remaining,
      retryAfterMs: Math.max(0, r.reset - Date.now()),
    };
  } catch (err) {
    console.error("[rate-limit] upstash failure — failing open:", err);
    return { allowed: true, remaining: -1, retryAfterMs: 0, degraded: true };
  }
}
```

- [ ] **Step 4: Run, expect pass**

```bash
pnpm test lib/limits/rate-limit.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/limits/rate-limit.ts lib/limits/rate-limit.test.ts
git commit -m "feat(limits): per-IP rate limit (Upstash sliding window 20/hr) — TDD"
```

---

### Task 16: Cost cap module

**Files:**
- Create: `lib/limits/cost-cap.ts`
- Create: `lib/limits/cost-cap.test.ts`

- [ ] **Step 1: Tests**

`lib/limits/cost-cap.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const incrby = vi.fn();
const get = vi.fn();
const expire = vi.fn();
vi.mock("@upstash/redis", () => ({
  Redis: { fromEnv: () => ({ get, incrby, expire }) },
}));

import { hasBudget, recordUsage } from "./cost-cap";

beforeEach(() => {
  incrby.mockReset();
  get.mockReset();
  expire.mockReset();
  process.env.MONTHLY_COST_CAP_USD = "50";
});

describe("cost cap", () => {
  it("hasBudget returns true when under cap", async () => {
    get.mockResolvedValue(1234); // micro-cents — well under cap
    const r = await hasBudget();
    expect(r.ok).toBe(true);
  });

  it("hasBudget returns false when over cap", async () => {
    // Cap = $50 = 50 * 100 * 1000 = 5_000_000 micro-cents
    get.mockResolvedValue(6_000_000);
    const r = await hasBudget();
    expect(r.ok).toBe(false);
  });

  it("recordUsage increments and sets monthly TTL", async () => {
    await recordUsage({ totalTokens: 1000, model: "gpt-4o" });
    expect(incrby).toHaveBeenCalled();
    expect(expire).toHaveBeenCalled();
  });

  it("hasBudget fails open on Upstash error", async () => {
    get.mockRejectedValue(new Error("down"));
    const r = await hasBudget();
    expect(r.ok).toBe(true);
    expect(r.degraded).toBe(true);
  });
});
```

- [ ] **Step 2: Run, expect failure**

- [ ] **Step 3: Implement `lib/limits/cost-cap.ts`**

```ts
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

/**
 * GPT-4o pricing per 1M tokens (April 2026 reference; bump if it changes).
 * Stored in micro-cents (1 cent = 1000 micro-cents) so we don't need floats.
 */
const PRICE_USD_PER_1M = { input: 2.5, output: 10 };

function monthKey(d = new Date()) {
  const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return `jrz:cost:${ym}`;
}

function capMicroCents(): number {
  const usd = Number(process.env.MONTHLY_COST_CAP_USD ?? "50");
  return usd * 100 * 1000;
}

export async function hasBudget(): Promise<{ ok: boolean; degraded?: boolean }> {
  try {
    const used = (await redis.get<number>(monthKey())) ?? 0;
    return { ok: used < capMicroCents() };
  } catch (err) {
    console.error("[cost-cap] redis read failed — failing open:", err);
    return { ok: true, degraded: true };
  }
}

export interface UsageRecord {
  totalTokens: number;
  promptTokens?: number;
  completionTokens?: number;
  model?: string;
}

export async function recordUsage(usage: UsageRecord): Promise<void> {
  try {
    const prompt = usage.promptTokens ?? Math.floor(usage.totalTokens * 0.6);
    const completion = usage.completionTokens ?? usage.totalTokens - prompt;
    const usdCost =
      (prompt / 1_000_000) * PRICE_USD_PER_1M.input +
      (completion / 1_000_000) * PRICE_USD_PER_1M.output;
    const microCents = Math.round(usdCost * 100 * 1000);
    if (microCents <= 0) return;
    const key = monthKey();
    await redis.incrby(key, microCents);
    // 40 days TTL ensures rollover into the next month before the key expires.
    await redis.expire(key, 60 * 60 * 24 * 40);
  } catch (err) {
    console.error("[cost-cap] failed to record usage:", err);
  }
}
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add lib/limits/cost-cap.ts lib/limits/cost-cap.test.ts
git commit -m "feat(limits): monthly OpenAI cost cap with Redis counter (TDD)"
```

---

## Phase 7 — AI / chat API

### Task 17: System prompt + tool definitions

**Files:**
- Create: `lib/ai/system-prompt.ts`
- Create: `lib/ai/tools.ts`

- [ ] **Step 1: Create `lib/ai/system-prompt.ts`**

```ts
export const SYSTEM_PROMPT = `You are the embedded agent on Janriz Libres' personal portfolio at jrz.dev. You speak as the site itself — succinct, professional, in Janriz's voice.

# Identity
- Janriz Libres is a Filipino full-stack & AI developer based in Cebu.
- Most recent role: Full-Stack / AI Engineer at LogoLife (Oct 2025 – Feb 2026).
- Educated: Summa Cum Laude BS Computer Science from Xavier University (2025).

# Operating rules
- Before making any factual claim about Janriz's projects, work, or background, call the \`search_wiki\` tool to retrieve grounded content. Do not invent dates, project names, employers, or technical details.
- When your answer is about a section the visitor can read on the page, call \`scroll_to({ section })\` so the main column scrolls there. Section slugs: about, work, projects, contact.
- When the visitor asks about a specific personal project (FlowStack, PulseVR, Mercado), call \`highlight_project({ slug })\` to pulse the matching card.
- Keep replies brief — chat-style, 1–4 sentences. The visitor is reading a chat, not an essay.
- If retrieval returns no useful chunks, say so directly: "I don't have details on that — happy to chat by email if you'd like."
- Never break character. You're the site. Don't mention OpenAI, models, prompts, or that you're an LLM.
- External links (GitHub repos, demos, email) are fine to include as plain markdown links. Don't auto-redirect.
- Avoid headers and lists unless the visitor explicitly asks for a list.
`;
```

- [ ] **Step 2: Create `lib/ai/tools.ts`**

```ts
import { tool } from "ai";
import { z } from "zod";
import { retrieveChunks } from "@/lib/rag/retrieve";

export const tools = {
  search_wiki: tool({
    description:
      "Retrieve grounded chunks from Janriz's personal wiki via vector similarity. Call this BEFORE making factual claims about projects, work, or background.",
    parameters: z.object({
      query: z.string().describe("Natural-language query to embed and search."),
      type: z.string().optional().describe("Filter by entity type, e.g. 'project', 'org', 'profile'."),
      tags: z.array(z.string()).optional(),
      k: z.number().int().min(1).max(12).optional().default(6),
    }),
    execute: async ({ query, type, tags, k }) => {
      const rows = await retrieveChunks({ query, type, tags, k });
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        text: r.text,
        similarity: r.similarity,
        portfolioRoute:
          (r.metadata as { routes?: { portfolio?: string } })?.routes?.portfolio ?? null,
      }));
    },
  }),

  scroll_to: tool({
    description:
      "Smoothly scroll the portfolio main column to a section. Call this when your answer is about content visible on the page.",
    parameters: z.object({
      section: z.enum(["about", "work", "projects", "contact"]),
    }),
    execute: async ({ section }) => ({ ok: true, section }),
  }),

  highlight_project: tool({
    description:
      "Pulse-highlight a personal project card. Call when the visitor asks about a specific project.",
    parameters: z.object({
      slug: z.enum(["flowstack", "pulsevr", "mercado"]),
    }),
    execute: async ({ slug }) => ({ ok: true, slug }),
  }),
};
```

- [ ] **Step 3: Type-check**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add lib/ai/system-prompt.ts lib/ai/tools.ts
git commit -m "feat(ai): system prompt + tool definitions (search_wiki, scroll_to, highlight_project)"
```

---

### Task 18: /api/chat route handler

**Files:**
- Create: `app/api/chat/route.ts`

- [ ] **Step 1: Implement the route**

```ts
import { NextRequest } from "next/server";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { tools } from "@/lib/ai/tools";
import { checkRateLimit } from "@/lib/limits/rate-limit";
import { hasBudget, recordUsage } from "@/lib/limits/cost-cap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit
  const rl = await checkRateLimit(ip);
  if (!rl.allowed) {
    const minutes = Math.ceil(rl.retryAfterMs / 60_000);
    return new Response(
      JSON.stringify({
        error: "rate_limited",
        message: `You've hit the rate limit. Try again in ~${minutes} min, or email me directly at libres.janriz@gmail.com.`,
        retryAfterMs: rl.retryAfterMs,
      }),
      { status: 429, headers: { "content-type": "application/json", "retry-after": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  // Cost cap
  const budget = await hasBudget();
  if (!budget.ok) {
    return new Response(
      JSON.stringify({
        error: "budget_exhausted",
        message:
          "The agent's on a budget right now — happy to chat directly at libres.janriz@gmail.com.",
      }),
      { status: 503, headers: { "content-type": "application/json" } }
    );
  }

  const body = (await req.json()) as { messages?: { role: "user" | "assistant"; content: string }[] };
  const messages = body.messages ?? [];

  const result = await streamText({
    model: openai("gpt-4o"),
    system: SYSTEM_PROMPT,
    messages,
    tools,
    maxSteps: 4,
    onFinish: async ({ usage }) => {
      await recordUsage({
        totalTokens: usage.totalTokens,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        model: "gpt-4o",
      });
    },
  });

  return result.toDataStreamResponse();
}
```

> **Next.js 16 note:** confirm route handler signatures and `NextRequest` import path against `node_modules/next/dist/docs/01-app/02-api-reference/04-functions/next-response.md` and the route handler doc. Adjust if 16 changed the API.

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 3: Smoke test the route shape (no real DB needed)**

Without env vars set, this will 500 on the first request. That's fine — we just want the build to succeed.

```bash
pnpm exec next build --no-lint
```

Expected: build completes without TS errors. (Runtime errors at request time are acceptable until env vars are wired in deployment.)

- [ ] **Step 4: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "feat(api): /api/chat — streaming agent with rate limit + cost cap"
```

---

## Phase 8 — Tool effects (chat → UI)

### Task 19: Event bus + handlers

**Files:**
- Create: `lib/tool-effects/event-bus.ts`
- Create: `components/effects/ScrollEffectHandler.tsx`
- Create: `components/effects/HighlightEffectHandler.tsx`

- [ ] **Step 1: Create the event bus**

```ts
// lib/tool-effects/event-bus.ts
type ScrollSection = "about" | "work" | "projects" | "contact";
type ProjectSlug = "flowstack" | "pulsevr" | "mercado";

interface Events {
  scrollTo: { section: ScrollSection };
  highlightProject: { slug: ProjectSlug };
}

type Listener<K extends keyof Events> = (data: Events[K]) => void;

const listeners = new Map<keyof Events, Set<Listener<keyof Events>>>();

export function on<K extends keyof Events>(event: K, fn: Listener<K>) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  (listeners.get(event) as Set<Listener<K>>).add(fn);
  return () => listeners.get(event)?.delete(fn as Listener<keyof Events>);
}

export function emit<K extends keyof Events>(event: K, data: Events[K]) {
  listeners.get(event)?.forEach((fn) => (fn as Listener<K>)(data));
}
```

- [ ] **Step 2: Create the scroll handler**

```tsx
// components/effects/ScrollEffectHandler.tsx
"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { on } from "@/lib/tool-effects/event-bus";

const SECTION_IDS = {
  about: "#sec-about",
  work: "#sec-work",
  projects: "#sec-projects",
  contact: "#sec-contact",
} as const;

export function ScrollEffectHandler() {
  const lastSectionRef = useRef<string | null>(null);

  useGSAP(() => {
    const off = on("scrollTo", ({ section }) => {
      const target = SECTION_IDS[section];
      if (!target || !document.querySelector(target)) return;

      // Pulse marker
      document.querySelectorAll(".scrolled-to").forEach((el) => el.classList.remove("scrolled-to"));
      document.querySelector(target)!.classList.add("scrolled-to");
      lastSectionRef.current = target;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        document.querySelector(target)!.scrollIntoView({ block: "start" });
        return;
      }
      gsap.to(window, {
        duration: 0.9,
        scrollTo: { y: target, offsetY: 24 },
        ease: "power3.inOut",
      });
    });
    return off;
  });

  return null;
}
```

- [ ] **Step 3: Create the highlight handler**

```tsx
// components/effects/HighlightEffectHandler.tsx
"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { on } from "@/lib/tool-effects/event-bus";

export function HighlightEffectHandler() {
  useGSAP(() => {
    const off = on("highlightProject", ({ slug }) => {
      const card = document.querySelector(`[data-project-slug="${slug}"]`);
      if (!card) return;
      gsap.fromTo(
        card,
        { boxShadow: "0 0 0 0 rgba(232,183,90,0)", borderColor: "var(--color-ink-line)" },
        {
          boxShadow:
            "0 0 0 1px var(--color-saffron-500), 0 0 32px rgba(232,183,90,0.18)",
          borderColor: "var(--color-saffron-500)",
          duration: 0.6,
          yoyo: true,
          repeat: 1,
          ease: "power2.out",
        }
      );
    });
    return off;
  });

  return null;
}
```

- [ ] **Step 4: Type-check**

- [ ] **Step 5: Commit**

```bash
git add lib/tool-effects components/effects
git commit -m "feat(effects): event bus + GSAP handlers for scroll_to and highlight_project"
```

---

## Phase 9 — State 1 (chat-first landing)

### Task 20: PromptInput + ChipRow

**Files:**
- Create: `components/state1/PromptInput.tsx`
- Create: `components/state1/ChipRow.tsx`

- [ ] **Step 1: PromptInput**

```tsx
// components/state1/PromptInput.tsx
"use client";

import { forwardRef } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const PromptInput = forwardRef<HTMLInputElement, Props>(function PromptInput(
  { value, onChange, onSubmit, placeholder = "Ask anything…", disabled },
  ref
) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink-line bg-ink-surface-1 px-5 py-3.5 transition-[border-color,box-shadow] duration-200 focus-within:border-saffron-500 focus-within:shadow-[0_0_0_3px_rgba(232,183,90,0.12)]">
      <span className="font-mono text-base leading-none text-saffron-500">→</span>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && value.trim()) onSubmit(); }}
        placeholder={placeholder}
        aria-label="Ask the agent anything"
        disabled={disabled}
        className="flex-1 bg-transparent text-base text-ink-fg outline-none placeholder:italic placeholder:text-ink-fg-dim"
        style={{ fontFeatureSettings: '"ss01"' }}
      />
      <button
        type="button"
        onClick={() => value.trim() && onSubmit()}
        disabled={!value.trim() || disabled}
        aria-label="Send message"
        className="grid h-9 w-9 place-items-center rounded-full bg-saffron-500 font-mono text-base text-[#1a1408] transition-[background,transform] duration-200 hover:bg-saffron-300 hover:translate-x-[2px] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-x-0"
      >
        ↗
      </button>
    </div>
  );
});
```

- [ ] **Step 2: ChipRow**

```tsx
// components/state1/ChipRow.tsx
"use client";

const DEFAULT_CHIPS = [
  "Show me your projects",
  "What's your stack?",
  "Tell me about Athena",
  "Are you available?",
];

interface Props {
  onPick: (prompt: string) => void;
  chips?: string[];
}

export function ChipRow({ onPick, chips = DEFAULT_CHIPS }: Props) {
  return (
    <div className="mt-5 flex flex-wrap justify-center gap-2">
      {chips.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onPick(c)}
          className="cursor-pointer rounded-full border border-ink-line bg-transparent px-3.5 py-2 font-mono text-[13px] leading-none text-ink-fg-muted transition-[border-color,color,background,transform] duration-200 hover:-translate-y-px hover:border-saffron-500 hover:bg-[rgba(232,183,90,0.06)] hover:text-ink-fg active:translate-y-0"
        >
          {c}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/state1
git commit -m "feat(state1): PromptInput + ChipRow"
```

---

### Task 21: StateOneLanding

**Files:**
- Create: `components/state1/StateOneLanding.tsx`

- [ ] **Step 1: Reference prototype lines 583–630 for structure** (avatar, greet, headline, tagline, prompt, chips, foot)

- [ ] **Step 2: Implement**

```tsx
// components/state1/StateOneLanding.tsx
"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import Image from "next/image";
import { profile } from "@/lib/content/profile";
import { useTypewriter } from "@/lib/gsap/use-typewriter";
import { PromptInput } from "./PromptInput";
import { ChipRow } from "./ChipRow";

export interface StateOneLandingHandle {
  /** Animate the chip's text into the input then trigger submit. */
  dispatchChip: (text: string) => Promise<void>;
}

interface Props {
  onSubmit: (text: string) => void;
}

export const StateOneLanding = forwardRef<StateOneLandingHandle, Props>(function StateOneLanding(
  { onSubmit },
  ref
) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState("");
  const word = useTypewriter(profile.headlineTypewriter);

  useImperativeHandle(ref, () => ({
    async dispatchChip(text: string) {
      inputRef.current?.focus();
      setValue("");
      for (let i = 0; i < text.length; i++) {
        setValue(text.slice(0, i + 1));
        await new Promise((r) => setTimeout(r, 18));
      }
      await new Promise((r) => setTimeout(r, 150));
      onSubmit(text);
    },
  }));

  return (
    <section
      id="state-1"
      aria-label="State 1 landing"
      className="relative z-[2] grid min-h-dvh grid-rows-[auto_1fr_auto] px-4 pb-8 pt-6 sm:px-8 lg:px-12"
    >
      <nav className="flex items-center justify-between font-mono text-xs tracking-[0.06em] text-ink-fg-dim">
        <div className="font-medium text-ink-fg">
          <span className="mr-1.5 text-saffron-500">●</span>jrz·dev
        </div>
        <div className="inline-flex items-center gap-1.5 text-ink-fg-muted">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-phosphor-500 shadow-[0_0_10px_var(--color-phosphor-500)] animate-pulse-soft"
          />
          agent · live
        </div>
      </nav>

      <div className="grid place-items-center text-center">
        <div>
          <div className="mx-auto mb-5 h-[88px] w-[88px] overflow-hidden rounded-full border border-ink-line shadow-[0_0_0_4px_rgba(232,183,90,0.06),0_0_30px_rgba(232,183,90,0.10)] transition-[transform,box-shadow] duration-300 hover:scale-[1.04] hover:shadow-[0_0_0_4px_rgba(232,183,90,0.12),0_0_40px_rgba(232,183,90,0.18)]">
            <Image
              src={profile.portraitSrc}
              alt={profile.portraitAlt}
              width={176}
              height={176}
              priority
              className="h-full w-full object-cover [filter:contrast(1.02)_saturate(0.92)]"
            />
          </div>

          <p className="text-display mb-2 text-[clamp(2rem,4.5vw,3.5rem)] font-medium text-ink-fg-muted">
            Hi, I'm <span className="text-ink-fg">{profile.greetingName}.</span>
          </p>

          <h1 className="text-display mx-auto mb-6 mt-2 text-[clamp(4.5rem,10vw,8rem)] font-medium leading-[0.95] text-ink-fg">
            <span data-typewriter>{word}</span>
            <span
              aria-hidden
              className="inline-block h-[0.85em] w-[0.08em] mx-[0.05em] -translate-y-[0.06em] bg-saffron-500 shadow-[0_0_6px_rgba(232,183,90,0.5)] animate-blink"
            />
            {" "}
            <span className="text-italic-accent leading-[0.95]">
              {profile.headlineSuffix}
            </span>
          </h1>

          <p className="mx-auto mb-11 max-w-[38rem] text-[1.0625rem] leading-relaxed text-ink-fg-muted">
            I build production systems — full-stack platforms, AI agents, and RAG pipelines. Instead of scrolling, just{" "}
            <span className="text-italic-accent text-ink-fg">ask</span> — the chat has read everything I've written.
          </p>

          <div className="mx-auto w-full max-w-[640px]">
            <PromptInput
              ref={inputRef}
              value={value}
              onChange={setValue}
              onSubmit={() => onSubmit(value.trim())}
            />
            <ChipRow
              onPick={async (text) => {
                inputRef.current?.focus();
                setValue("");
                for (let i = 0; i < text.length; i++) {
                  setValue(text.slice(0, i + 1));
                  await new Promise((r) => setTimeout(r, 18));
                }
                await new Promise((r) => setTimeout(r, 150));
                onSubmit(text);
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between font-mono text-[11px] tracking-[0.06em] uppercase text-ink-fg-fade">
        <div>jrz·dev / 2026</div>
        <div className="flex gap-4">
          <span>{profile.cityShort.toLowerCase()}</span>
          <span>open to ai eng roles</span>
        </div>
      </div>
    </section>
  );
});
```

- [ ] **Step 3: Type-check**

- [ ] **Step 4: Commit**

```bash
git add components/state1/StateOneLanding.tsx
git commit -m "feat(state1): full chat-first landing (avatar, typewriter headline, prompt, chips)"
```

---

## Phase 10 — State 2 sections

> Each State 2 component below translates a chunk of the visual prototype to React + Tailwind. When in doubt about exact spacing or color, defer to the design tokens doc and the prototype's CSS.

### Task 22: CompactHero + CurrentlyStrip

**Files:**
- Create: `components/state2/CompactHero.tsx`
- Create: `components/state2/CurrentlyStrip.tsx`

- [ ] **Step 1: CurrentlyStrip**

```tsx
// components/state2/CurrentlyStrip.tsx
import { profile } from "@/lib/content/profile";

function Row({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="grid grid-cols-[80px_1fr] items-baseline gap-4">
      <span className="relative tracking-[0.04em] text-ink-fg-dim">
        {label}
        <span aria-hidden className="ml-2 text-ink-line">──</span>
      </span>
      <span>
        {items.map((item, i) => (
          <span key={item}>
            <span className="text-ink-fg">{item}</span>
            {i < items.length - 1 ? <span className="mx-[0.4em] text-ink-fg-dim">·</span> : null}
          </span>
        ))}
      </span>
    </div>
  );
}

export function CurrentlyStrip() {
  return (
    <div className="grid gap-2 pt-5 font-mono text-[13px] text-ink-fg-muted">
      <Row label="stack" items={profile.currentlyStack} />
      <Row label="open to" items={profile.currentlyOpenTo} />
    </div>
  );
}
```

- [ ] **Step 2: CompactHero**

```tsx
// components/state2/CompactHero.tsx
"use client";

import { Eyebrow } from "@/components/ui/Eyebrow";
import { profile } from "@/lib/content/profile";
import { useTypewriter } from "@/lib/gsap/use-typewriter";

export function CompactHero() {
  const word = useTypewriter(profile.headlineTypewriter);
  return (
    <div className="grid grid-cols-1 items-end gap-8 border-b border-ink-line pb-10 pt-16 md:grid-cols-[1fr_auto]">
      <div>
        <Eyebrow num="/00">landing</Eyebrow>
        <h1 className="text-display m-0 text-[clamp(3rem,7vw,5.5rem)] font-medium leading-[0.95] text-ink-fg">
          <span data-typewriter>{word}</span>
          <span
            aria-hidden
            className="inline-block h-[0.85em] w-[0.08em] mx-[0.05em] -translate-y-[0.06em] bg-saffron-500 shadow-[0_0_6px_rgba(232,183,90,0.5)] animate-blink"
          />
          {" "}
          <span className="text-italic-accent leading-[0.95]">
            {profile.headlineSuffix}
          </span>
        </h1>
      </div>
      <p className="m-0 max-w-[26rem] text-base leading-normal text-ink-fg-muted md:text-right">
        Building production systems across full-stack and AI. Based in{" "}
        <span className="text-italic-accent text-ink-fg">Cebu</span>, working remotely.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/state2/CompactHero.tsx components/state2/CurrentlyStrip.tsx
git commit -m "feat(state2): CompactHero (typewriter headline) + CurrentlyStrip"
```

---

### Task 23: AboutSection

**Files:**
- Create: `components/state2/AboutSection.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/state2/AboutSection.tsx
import Image from "next/image";
import { SectionHead } from "@/components/ui/SectionHead";
import { profile } from "@/lib/content/profile";

function applyItalicAccents(text: string, words: readonly string[]): React.ReactNode {
  if (words.length === 0) return text;
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  const parts = text.split(re);
  return parts.map((p, i) =>
    words.includes(p) ? (
      <span key={i} className="text-italic-accent">{p}</span>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

export function AboutSection() {
  return (
    <section id="sec-about" className="border-b border-ink-line py-16">
      <SectionHead
        num="/01"
        eyebrow="about"
        title="About *me*"
        lede={profile.aboutLede.replace("Summa Cum Laude", "*Summa Cum Laude*")}
      />
      <div className="grid items-start gap-12 md:grid-cols-[1fr_280px]">
        <div className="max-w-[42rem] text-[1.0625rem] leading-[1.7] text-ink-fg [&>p+p]:mt-5">
          {profile.aboutBody.map((p, i) => (
            <p key={i}>{applyItalicAccents(p, profile.aboutItalicWords)}</p>
          ))}
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-ink-line bg-ink-surface-1 max-md:max-w-[280px] group">
          <Image
            src={profile.portraitSrc}
            alt={profile.portraitAlt}
            fill
            sizes="(min-width: 768px) 280px, 100vw"
            className="object-cover transition-[transform,filter] duration-500 [filter:contrast(1.02)_saturate(0.9)] group-hover:scale-[1.04] group-hover:[filter:contrast(1.05)_saturate(1)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-60% to-[rgba(14,13,16,0.55)]"
          />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/state2/AboutSection.tsx
git commit -m "feat(state2): AboutSection with portrait + italic-accented paragraphs"
```

---

### Task 24: WorkSection (timeline + project tabs)

**Files:**
- Create: `components/state2/WorkSection.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/state2/WorkSection.tsx
"use client";

import { useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SectionHead } from "@/components/ui/SectionHead";
import { workTimeline, workTotalLabel } from "@/lib/content/work-timeline";
import { professionalProjects } from "@/lib/content/professional-projects";

function Timeline() {
  return (
    <div className="mb-10 border-y border-ink-line font-mono text-[13px]">
      {workTimeline.map((row) => (
        <div
          key={row.company}
          className="grid grid-cols-1 items-baseline gap-1 border-b border-ink-line-soft p-4 transition-[padding,background] duration-200 last:border-b-0 hover:bg-[rgba(232,183,90,0.025)] hover:px-2.5 md:grid-cols-[88px_60px_1.4fr_1.6fr_1.4fr] md:gap-5"
        >
          <span className="tracking-[0.02em] text-saffron-500 max-md:text-[11px] max-md:uppercase max-md:tracking-[0.06em]">
            {row.years}
          </span>
          <span className="text-ink-fg-dim max-md:before:content-['·_']">{row.durationLabel}</span>
          <span className="text-base font-medium text-ink-fg" style={{ fontFamily: "var(--font-body)" }}>
            {row.company}
          </span>
          <span className="text-base text-ink-fg-muted" style={{ fontFamily: "var(--font-body)" }}>
            {row.role}
          </span>
          <span className="text-ink-fg-dim md:text-right">{row.techLabel}</span>
        </div>
      ))}
      <div className="flex items-center justify-between border-t border-ink-line p-4 text-[11px] uppercase tracking-[0.08em] text-ink-fg-fade">
        <span>total</span>
        <span className="text-ink-fg-muted normal-case tracking-normal">{workTotalLabel}</span>
      </div>
    </div>
  );
}

export function WorkSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = professionalProjects[activeIdx]!;

  useGSAP(() => {
    gsap.from("#work-detail", { opacity: 0, y: 10, duration: 0.35, ease: "power2.out" });
  }, [activeIdx]);

  return (
    <section id="sec-work" className="border-b border-ink-line py-16">
      <SectionHead
        num="/02"
        eyebrow="work"
        title="Professional *work*"
        lede="Where I've worked, and what I shipped there. *Implementation patterns* only — proprietary specifics omitted under NDA."
      />

      <Timeline />

      <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-fg-dim">
        Selected projects
      </h3>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-2">
          {professionalProjects.map((p, i) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={
                "rounded-full border px-4 py-3.5 text-left text-[15px] transition-all duration-200 " +
                (i === activeIdx
                  ? "border-ink-fg bg-ink-fg text-ink-bg"
                  : "border-ink-line bg-transparent text-ink-fg-muted hover:border-ink-fg-dim hover:text-ink-fg")
              }
            >
              {p.title}
            </button>
          ))}
        </div>

        <div
          id="work-detail"
          className="rounded-2xl border border-ink-line bg-ink-surface-1 p-7 md:p-8"
        >
          <h3 className="text-display mb-2 text-2xl font-medium leading-tight text-ink-fg">
            {active.title}
          </h3>
          <div className="mb-5 font-mono text-[13px] text-ink-fg-muted">
            <span className="text-saffron-500">stack:</span> {active.stack}
          </div>
          <p className="mb-5 leading-relaxed text-ink-fg-muted">{active.description}</p>
          <ul className="m-0 list-none p-0">
            {active.bullets.map((b) => (
              <li key={b} className="relative mb-2.5 pl-5 leading-snug text-ink-fg">
                <span aria-hidden className="absolute left-0 top-0 text-saffron-500">›</span>
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-dashed border-ink-line pt-4 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-fg-fade">
            ⊘ NDA — screenshots &amp; specifics omitted
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/state2/WorkSection.tsx
git commit -m "feat(state2): WorkSection — timeline + project tabs (GSAP fade on tab change)"
```

---

### Task 25: PersonalProjectsSection

**Files:**
- Create: `components/state2/PersonalProjectsSection.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/state2/PersonalProjectsSection.tsx
import Image from "next/image";
import { SectionHead } from "@/components/ui/SectionHead";
import { personalProjects } from "@/lib/content/personal-projects";

export function PersonalProjectsSection() {
  return (
    <section id="sec-projects" className="border-b border-ink-line py-16">
      <SectionHead
        num="/03"
        eyebrow="projects"
        title="Personal *projects*"
        lede="Public projects — code, demos, and screenshots all open. The *tangible* complement to NDA-blocked work."
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
        {personalProjects.map((p) => (
          <article
            key={p.slug}
            data-project-slug={p.slug}
            className="rounded-2xl border border-ink-line bg-ink-surface-1 p-6 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-ink-fg-dim"
          >
            <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-xl bg-gradient-to-br from-ink-surface-2 to-ink-line">
              <Image
                src={p.images[0]!}
                alt={`${p.title} screenshot`}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover"
              />
            </div>
            <h3 className="text-display mb-2 text-xl font-medium text-ink-fg">{p.title}</h3>
            <div className="mb-3.5 font-mono text-xs text-ink-fg-dim">{p.stack}</div>
            <p className="mb-4 text-[15px] leading-snug text-ink-fg-muted">{p.description}</p>
            <div className="flex gap-4 font-mono text-[13px]">
              <a
                href={p.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border-b border-transparent text-saffron-500 transition-[border-color] duration-200 hover:border-saffron-500"
              >
                repo →
              </a>
              <a
                href={p.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border-b border-transparent text-saffron-500 transition-[border-color] duration-200 hover:border-saffron-500"
              >
                demo →
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/state2/PersonalProjectsSection.tsx
git commit -m "feat(state2): PersonalProjectsSection — card grid with repo/demo links"
```

---

### Task 26: ContactSection

**Files:**
- Create: `components/state2/ContactSection.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/state2/ContactSection.tsx
import { SectionHead } from "@/components/ui/SectionHead";
import { contactLinks } from "@/lib/content/contact";

export function ContactSection() {
  return (
    <section id="sec-contact" className="py-16">
      <SectionHead
        num="/04"
        eyebrow="contact"
        title="Get in *touch*"
        lede="Best ways to reach me. The agent above can also send you a thread of context if it'd help."
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        {contactLinks.map((c) => (
          <a
            key={c.slug}
            href={c.href}
            target={c.href.startsWith("http") ? "_blank" : undefined}
            rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="rounded-xl border border-ink-line p-5 text-ink-fg no-underline transition-[border-color,background] duration-200 hover:border-saffron-500 hover:bg-[rgba(232,183,90,0.04)]"
          >
            <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-fg-dim">
              {c.label}
            </div>
            <div className="text-base leading-tight">{c.value}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/state2/ContactSection.tsx
git commit -m "feat(state2): ContactSection — email/github/linkedin cards"
```

---

### Task 27: StateTwoView composition

**Files:**
- Create: `components/state2/StateTwoView.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/state2/StateTwoView.tsx
import { CompactHero } from "./CompactHero";
import { CurrentlyStrip } from "./CurrentlyStrip";
import { AboutSection } from "./AboutSection";
import { WorkSection } from "./WorkSection";
import { PersonalProjectsSection } from "./PersonalProjectsSection";
import { ContactSection } from "./ContactSection";

interface Props {
  chatPanelSlot: React.ReactNode;
}

export function StateTwoView({ chatPanelSlot }: Props) {
  return (
    <section id="state-2" aria-label="Portfolio with side chat" className="relative z-[2] min-h-dvh">
      <div className="grid items-start gap-4 px-4 pb-16 pt-6 sm:px-8 md:grid-cols-[minmax(0,1fr)_380px] md:gap-8 lg:px-12 max-md:pb-[35vh]">
        <div className="min-w-0 max-w-[78rem]">
          <CompactHero />
          <CurrentlyStrip />
          <AboutSection />
          <WorkSection />
          <PersonalProjectsSection />
          <ContactSection />
        </div>
        {chatPanelSlot}
      </div>

      <style jsx global>{`
        .scrolled-to {
          position: relative;
        }
        .scrolled-to::before {
          content: "";
          position: absolute;
          left: -16px;
          top: 4rem;
          bottom: 4rem;
          width: 2px;
          background: var(--color-phosphor-500);
          box-shadow: 0 0 12px var(--color-phosphor-500);
          animation: scrolled-fade 2.4s ease-out forwards;
        }
        @keyframes scrolled-fade {
          0%, 60% { opacity: 1; }
          100%    { opacity: 0; }
        }
      `}</style>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/state2/StateTwoView.tsx
git commit -m "feat(state2): StateTwoView composition with autoscroll marker styles"
```

---

## Phase 11 — Chat UI

### Task 28: ToolCallLine + MessageList

**Files:**
- Create: `components/chat/ToolCallLine.tsx`
- Create: `components/chat/MessageList.tsx`

- [ ] **Step 1: ToolCallLine**

```tsx
// components/chat/ToolCallLine.tsx
import type { ToolCall } from "@/lib/chat/types";

export function ToolCallLine({ call }: { call: ToolCall }) {
  const argEntries = Object.entries(call.args).slice(0, 3);
  return (
    <div className="self-start py-0.5 font-mono text-xs italic tracking-[0.02em] text-phosphor-500">
      <span aria-hidden className="mr-1 opacity-70">↻ </span>
      {call.name}
      {argEntries.map(([k, v]) => (
        <span key={k}>
          <span className="ml-2 mr-1 text-ink-fg-dim">{k}:</span>
          <span className="text-phosphor-300">"{String(v)}"</span>
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: MessageList**

```tsx
// components/chat/MessageList.tsx
"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/chat/types";
import { ToolCallLine } from "./ToolCallLine";

function MessageBubble({ msg }: { msg: ChatMessage }) {
  if (msg.role === "user") {
    return (
      <div className="max-w-[92%] self-end rounded-xl bg-ink-fg px-3.5 py-2.5 text-[15px] font-medium leading-snug text-ink-bg">
        {msg.content}
      </div>
    );
  }
  // assistant
  return (
    <div className="max-w-[92%] self-start py-2 text-[15px] leading-snug text-ink-fg [&_em]:text-italic-accent [&_a]:text-saffron-500 [&_a]:border-b [&_a]:border-saffron-700 [&_a]:transition-colors [&_a:hover]:border-saffron-500">
      {/* Plain text for safety; richer markdown can be a later upgrade. */}
      {msg.content.split(/(\*[^*]+\*)/g).map((seg, i) =>
        seg.startsWith("*") && seg.endsWith("*") ? (
          <em key={i}>{seg.slice(1, -1)}</em>
        ) : (
          <span key={i}>{seg}</span>
        )
      )}
    </div>
  );
}

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages]);

  return (
    <div ref={ref} aria-live="polite" className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {messages.map((m) => (
        <div key={m.id} className="flex flex-col gap-1.5">
          {m.toolCalls?.map((c, i) => <ToolCallLine key={i} call={c} />)}
          {m.content ? <MessageBubble msg={m} /> : null}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/chat/ToolCallLine.tsx components/chat/MessageList.tsx
git commit -m "feat(chat): MessageList + ToolCallLine"
```

---

### Task 29: ChatInput

**Files:**
- Create: `components/chat/ChatInput.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/chat/ChatInput.tsx
"use client";

import { forwardRef, useState } from "react";

interface Props {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput = forwardRef<HTMLInputElement, Props>(function ChatInput(
  { onSubmit, disabled, placeholder = "Ask anything…" },
  ref
) {
  const [v, setV] = useState("");
  return (
    <div className="border-t border-ink-line p-3 pt-3">
      <div className="flex items-center gap-2 rounded-xl border border-ink-line bg-ink-surface-1 px-3.5 py-2.5 transition-[border-color,box-shadow] duration-200 focus-within:border-phosphor-700 focus-within:shadow-[0_0_0_2px_rgba(94,229,217,0.12)]">
        <input
          ref={ref}
          type="text"
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && v.trim() && !disabled) {
              onSubmit(v.trim());
              setV("");
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          aria-label="Ask the agent anything"
          className="flex-1 bg-transparent text-[15px] text-ink-fg outline-none placeholder:text-ink-fg-dim"
        />
        <span className="rounded border border-ink-line px-1.5 py-0.5 font-mono text-[11px] text-ink-fg-fade">
          ⏎
        </span>
      </div>
    </div>
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add components/chat/ChatInput.tsx
git commit -m "feat(chat): ChatInput with phosphor focus ring"
```

---

### Task 30: ChatPanel (desktop + provider for both)

**Files:**
- Create: `components/chat/ChatPanel.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/chat/ChatPanel.tsx
"use client";

import { useChatState } from "@/lib/chat/hook";
import { useChatStore } from "./ChatStateProvider";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

interface Props {
  onSubmit: (text: string) => void;
  onClear: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  /** When true, renders without sticky-positioning (for the mobile bottom sheet). */
  flat?: boolean;
}

export function ChatPanel({ onSubmit, onClear, isStreaming, disabled, flat }: Props) {
  const store = useChatStore();
  const { state } = useChatState(store);

  return (
    <aside
      className={
        "flex flex-col overflow-hidden border border-ink-line border-l-2 border-l-phosphor-700 bg-ink-surface-2 shadow-[-8px_0_40px_rgba(94,229,217,0.05)]" +
        (flat
          ? " h-full rounded-none border-l-0 border-t-2 border-t-phosphor-700 max-md:rounded-t-2xl"
          : " sticky top-6 h-[calc(100vh-3rem)] rounded-2xl")
      }
    >
      <div className="flex items-center justify-between border-b border-ink-line px-4 py-3.5 font-mono text-xs tracking-[0.06em] text-ink-fg-dim">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-phosphor-500 shadow-[0_0_8px_var(--color-phosphor-500)] animate-pulse-soft"
          />
          <span>{isStreaming ? "agent · thinking" : "chat · agent"}</span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="bg-transparent font-mono text-[11px] uppercase tracking-[0.06em] text-ink-fg-fade transition-colors duration-200 hover:text-ink-fg"
        >
          clear
        </button>
      </div>

      <MessageList messages={state.messages} />

      <ChatInput onSubmit={onSubmit} disabled={disabled} />
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/chat/ChatPanel.tsx
git commit -m "feat(chat): ChatPanel with cyan border + thinking pulse"
```

---

### Task 31: MobileBottomSheet (Draggable)

**Files:**
- Create: `components/chat/MobileBottomSheet.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/chat/MobileBottomSheet.tsx
"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { useRef, useState } from "react";

interface Props {
  children: React.ReactNode;
  collapsedVh?: number; // default 32
  expandedVh?: number;  // default 92
}

export function MobileBottomSheet({ children, collapsedVh = 32, expandedVh = 92 }: Props) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);

  useGSAP(() => {
    if (!sheetRef.current || !handleRef.current) return;
    const sheet = sheetRef.current;

    // Initial size
    gsap.set(sheet, { height: `${collapsedVh}vh` });

    Draggable.create(handleRef.current, {
      type: "y",
      bounds: { minY: -window.innerHeight, maxY: 0 },
      inertia: false,
      onDrag() {
        const next = Math.max(
          collapsedVh,
          Math.min(expandedVh, collapsedVh + (-this.y / window.innerHeight) * 100)
        );
        gsap.set(sheet, { height: `${next}vh` });
      },
      onDragEnd() {
        const willExpand = -this.y > window.innerHeight * 0.15;
        setExpanded(willExpand);
        gsap.to(sheet, {
          height: `${willExpand ? expandedVh : collapsedVh}vh`,
          duration: 0.36,
          ease: "power3.inOut",
        });
        gsap.set(handleRef.current, { y: 0 });
      },
    });
  });

  return (
    <div
      ref={sheetRef}
      className="fixed inset-x-0 bottom-0 z-50 md:hidden"
      style={{ height: `${collapsedVh}vh` }}
    >
      <div className="flex h-full flex-col">
        <div ref={handleRef} className="flex cursor-grab justify-center pt-2 pb-1 active:cursor-grabbing">
          <span className="block h-1 w-9 rounded-full bg-ink-line" />
        </div>
        <div className="flex-1 min-h-0">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/chat/MobileBottomSheet.tsx
git commit -m "feat(chat): MobileBottomSheet with GSAP Draggable"
```

---

## Phase 12 — Page composition

### Task 32: app/page.tsx — top-level state machine + transition

**Files:**
- Modify (replace contents): `app/page.tsx`
- Create: `lib/gsap/use-state-transition.ts`

- [ ] **Step 1: Create the transition hook**

```ts
// lib/gsap/use-state-transition.ts
import gsap from "gsap";

interface Args {
  state1: HTMLElement;
  state2: HTMLElement;
  chatPanel: HTMLElement | null;
  direction: "1to2" | "2to1";
  reduced: boolean;
}

export function runStateTransition({ state1, state2, chatPanel, direction, reduced }: Args): Promise<void> {
  return new Promise((resolve) => {
    if (reduced) {
      if (direction === "1to2") {
        state1.style.display = "none";
        state2.style.display = "block";
      } else {
        state2.style.display = "none";
        state1.style.display = "grid";
      }
      resolve();
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power3.inOut" }, onComplete: resolve });

    if (direction === "1to2") {
      tl.to(state1, { opacity: 0, scale: 0.97, duration: 0.4 })
        .set(state1, { display: "none" })
        .set(state2, { display: "block", opacity: 0 })
        .to(state2, { opacity: 1, duration: 0.4 })
        .from("#sec-about, #sec-work, #sec-projects, #sec-contact", {
          opacity: 0, y: 16, duration: 0.6, stagger: 0.08,
        }, "-=0.1");
      if (chatPanel) tl.from(chatPanel, { opacity: 0, x: 32, duration: 0.5 }, "-=0.5");
    } else {
      tl.to(state2, { opacity: 0, duration: 0.3 })
        .set(state2, { display: "none" })
        .set(state1, { display: "grid", opacity: 0, scale: 1 })
        .to(state1, { opacity: 1, duration: 0.4 });
    }
  });
}
```

- [ ] **Step 2: Replace `app/page.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "ai/react";
import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { ChatStateProvider, useChatStore } from "@/components/chat/ChatStateProvider";
import { useChatState } from "@/lib/chat/hook";
import { StateOneLanding } from "@/components/state1/StateOneLanding";
import { StateTwoView } from "@/components/state2/StateTwoView";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { MobileBottomSheet } from "@/components/chat/MobileBottomSheet";
import { ScrollEffectHandler } from "@/components/effects/ScrollEffectHandler";
import { HighlightEffectHandler } from "@/components/effects/HighlightEffectHandler";
import { registerGsapPlugins } from "@/lib/gsap/register";
import { runStateTransition } from "@/lib/gsap/use-state-transition";
import { emit } from "@/lib/tool-effects/event-bus";

function HomeInner() {
  const store = useChatStore();
  const { state, appendMessage, clear, setMessages } = useChatState(store);

  const state1Ref = useRef<HTMLDivElement | null>(null);
  const state2Ref = useRef<HTMLDivElement | null>(null);
  const chatPanelRef = useRef<HTMLDivElement | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  // Vercel AI SDK chat — server endpoint /api/chat
  const { messages, append, isLoading, setMessages: setAiMessages } = useChat({
    api: "/api/chat",
    initialMessages: state.messages
      .filter((m) => m.role !== "tool")
      .map((m) => ({ id: m.id, role: m.role, content: m.content })),
    onToolCall({ toolCall }) {
      const args = toolCall.args as Record<string, unknown>;
      if (toolCall.toolName === "scroll_to") {
        emit("scrollTo", { section: args.section as never });
      } else if (toolCall.toolName === "highlight_project") {
        emit("highlightProject", { slug: args.slug as never });
      }
    },
    onFinish(message) {
      appendMessage({
        id: message.id,
        role: "assistant",
        content: message.content,
        createdAt: new Date().toISOString(),
      });
    },
  });

  // Register plugins once
  useEffect(() => {
    registerGsapPlugins();
  }, []);

  // Direct render based on activated flag — avoids flash on returning visit
  const showState2 = state.activated;

  async function handleSubmit(text: string) {
    if (!text.trim() || transitioning) return;
    const userMessage = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: text,
      createdAt: new Date().toISOString(),
    };
    appendMessage(userMessage);
    if (!showState2 && state1Ref.current && state2Ref.current) {
      setTransitioning(true);
      await runStateTransition({
        state1: state1Ref.current,
        state2: state2Ref.current,
        chatPanel: chatPanelRef.current,
        direction: "1to2",
        reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
      setTransitioning(false);
    }
    await append({ role: "user", content: text });
  }

  async function handleClear() {
    clear();
    setAiMessages([]);
    if (state1Ref.current && state2Ref.current) {
      await runStateTransition({
        state1: state1Ref.current,
        state2: state2Ref.current,
        chatPanel: chatPanelRef.current,
        direction: "2to1",
        reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
    }
  }

  const desktopChatPanel = (
    <div ref={chatPanelRef} className="max-md:hidden">
      <ChatPanel onSubmit={handleSubmit} onClear={handleClear} isStreaming={isLoading} />
    </div>
  );

  return (
    <>
      <AmbientBackdrop />
      <ScrollEffectHandler />
      <HighlightEffectHandler />

      <main className="relative">
        <div ref={state1Ref} style={{ display: showState2 ? "none" : "grid" }}>
          <StateOneLanding onSubmit={handleSubmit} />
        </div>

        <div ref={state2Ref} style={{ display: showState2 ? "block" : "none" }}>
          <StateTwoView chatPanelSlot={desktopChatPanel} />
        </div>

        {showState2 ? (
          <MobileBottomSheet>
            <ChatPanel flat onSubmit={handleSubmit} onClear={handleClear} isStreaming={isLoading} />
          </MobileBottomSheet>
        ) : null}
      </main>
    </>
  );
}

export default function HomePage() {
  return (
    <ChatStateProvider>
      <HomeInner />
    </ChatStateProvider>
  );
}
```

- [ ] **Step 3: Type-check + dev smoke test**

```bash
pnpm exec tsc --noEmit
pnpm dev &
sleep 5
curl -s http://localhost:3000 | grep -E '(jrz·dev|engineer)' | head -2
kill %1
```

Expected: HTML contains "jrz·dev" and "engineer". Without env vars, the chat won't actually call the LLM but the page renders.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx lib/gsap/use-state-transition.ts
git commit -m "feat(page): top-level state machine, GSAP transition, ai sdk wiring"
```

---

## Phase 13 — Accessibility polish

### Task 33: Reduced-motion + keyboard shortcut

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add a global reduced-motion guard to globals.css**

Append to `app/globals.css`:

```css
@layer base {
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}
```

- [ ] **Step 2: Add `/` keyboard shortcut to focus chat input**

In `app/page.tsx`, inside `HomeInner` add:

```tsx
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((document.activeElement as HTMLElement)?.tagName ?? "")) {
      e.preventDefault();
      const input = document.querySelector<HTMLInputElement>('input[aria-label="Ask the agent anything"]');
      input?.focus();
    }
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, []);
```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css app/page.tsx
git commit -m "feat(a11y): global reduced-motion guard + '/' shortcut to focus chat input"
```

---

## Phase 14 — Tests

### Task 34: Playwright E2E happy path

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/landing.spec.ts`

- [ ] **Step 1: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
```

- [ ] **Step 2: Install browsers**

```bash
pnpm exec playwright install chromium
```

- [ ] **Step 3: Write E2E test**

`tests/e2e/landing.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("State 1 → click chip → State 2 visible, clear returns to State 1", async ({ page }) => {
  // Stub /api/chat to return a deterministic streaming-shaped reply
  await page.route("**/api/chat", async (route) => {
    const sse = `data: {"type":"text-delta","textDelta":"Hi there!"}\n\n` +
                `data: {"type":"finish","finishReason":"stop"}\n\n` +
                `data: [DONE]\n\n`;
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: sse,
    });
  });

  await page.goto("/");

  // State 1 visible
  await expect(page.getByRole("button", { name: "Show me your projects" })).toBeVisible();
  await expect(page.locator("#state-1")).toBeVisible();
  await expect(page.locator("#state-2")).toBeHidden();

  // Click a chip
  await page.getByRole("button", { name: "Show me your projects" }).click();

  // After transition, State 2 visible and the chat shows the user message
  await expect(page.locator("#state-2")).toBeVisible({ timeout: 5000 });
  await expect(page.getByText("Show me your projects")).toBeVisible();

  // Clear returns to State 1
  await page.getByRole("button", { name: "clear" }).click();
  await expect(page.locator("#state-1")).toBeVisible({ timeout: 5000 });
});
```

- [ ] **Step 4: Run**

```bash
pnpm test:e2e
```

Expected: 1 test passes. (If Vercel AI SDK's data stream format differs from the stub, adjust the SSE shape — refer to `node_modules/ai/dist/` for the current format.)

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts tests
git commit -m "test(e2e): playwright happy path — chip click → State 2 → clear → State 1"
```

---

## Phase 15 — Docs

### Task 35: Update AGENTS.md

**Files:**
- Modify (replace contents): `AGENTS.md`

- [ ] **Step 1: Replace `AGENTS.md`**

```markdown
# AGENTS.md

> **For agentic workers (Claude Code, Codex, etc.) opening this repo.**

## Stack overview

- **Next.js 16.2.4** (App Router). This is NOT the Next.js you may have seen before — APIs and conventions differ from older versions. Read `node_modules/next/dist/docs/` before writing routing or server-component code; heed deprecation notices.
- React 19.2.4 + TypeScript 5
- Tailwind CSS v4 (`@theme` block in `app/globals.css`)
- **Animation: GSAP only.** Never reach for framer-motion, motion, react-spring, or CSS-only motion when GSAP is the right tool. Use `@gsap/react`'s `useGSAP` hook in client components. Plugins are registered once via `lib/gsap/register.ts`. Fetch GSAP API docs via context7 when in doubt — APIs evolve.
- **Vercel AI SDK** (`ai`, `@ai-sdk/openai`) for chat streaming.
- **OpenAI** GPT-4o for chat, `text-embedding-3-small` (1536d) for embeddings.
- **Drizzle ORM** + `postgres-js` driver against **Supabase Postgres + pgvector**. Use the **transaction-pooler endpoint (port 6543)** for serverless connections. The `wiki_chunks` table is shared with the adjacent `llm-wiki` repo's publisher.
- **Upstash Redis** + `@upstash/ratelimit` for per-IP rate limiting and a monthly cost cap.

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

## Env vars (see `.env.example`)

- `OPENAI_API_KEY`
- `SUPABASE_DB_URL` — read-only role, transaction-pooler endpoint (`:6543`)
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `MONTHLY_COST_CAP_USD` (default 50)

## Conventions

- **Path alias:** `@/*` → repo root. Use it; relative `../../../` paths invite mistakes.
- **Server vs client components:** default server. Mark `"use client"` only when needed (state, refs, browser APIs, GSAP).
- **No framer-motion / motion.** All animation is GSAP. If you reach for one of those packages, stop and rewrite with GSAP.
- **Don't bypass the chat-store.** The localStorage shape (`jrz-chat-v1`) is contract; mutate via `lib/chat/store.ts` only.
- **Italic accents** in copy use `*word*` markers; renderers in `components/ui` and `components/state2/AboutSection` parse them. Do not hand-roll `<em>` tags inside content data.
- **Don't add CAPTCHA, accounts, or server-side chat persistence** without checking the spec — those were explicitly deferred.
- **NDA work** in `lib/content/professional-projects.ts` stays at implementation-pattern level. No screenshots, no proprietary specifics. The "⊘ NDA" footer is intentional and must remain.

## Testing

- `pnpm test` — Vitest unit + integration. Cover retrieval ranking, chat-store, rate-limit, cost-cap.
- `pnpm test:e2e` — Playwright happy path. State 1 → State 2 → tool call → clear.
- `prefers-reduced-motion` is honored. When adding animation, also add the reduced-motion branch.

## When in doubt

- Spec: `docs/superpowers/specs/2026-04-27-portfolio-v2-design.md`
- Design tokens: `docs/superpowers/design/2026-04-27-design-tokens.md`
- Visual prototype: `docs/superpowers/design/2026-04-27-visual-prototype.html` (open in a browser to see the high-fidelity reference).
- Plan: `docs/superpowers/plans/2026-04-27-portfolio-v2-implementation.md`
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs(agents): rewrite AGENTS.md for v2 stack and conventions"
```

---

### Task 36: Replace README.md

**Files:**
- Modify (replace contents): `README.md`

- [ ] **Step 1: Replace README.md**

```markdown
# portfolio-v2

A chat-first AI engineer portfolio. The landing page IS a chat with an agent that has read everything I've written.

[Live](https://janrizlibres.vercel.app) · [Spec](docs/superpowers/specs/2026-04-27-portfolio-v2-design.md) · [Visual prototype](docs/superpowers/design/2026-04-27-visual-prototype.html)

## What this is

This site has two states:

1. **State 1 — chat-first landing.** A centered prompt, suggested chips, no traditional portfolio sections.
2. **State 2 — activated.** After the visitor's first message, a GSAP timeline reveals the portfolio (Hero, About, Work, Personal Projects, Contact) alongside a persistent chat panel. Returning visitors land here directly.

The chat is powered by OpenAI GPT-4o via the Vercel AI SDK, retrieving from a shared **Supabase + pgvector** index that's populated by the [adjacent personal wiki](https://github.com/janrizmlibres/llm-wiki). The portfolio is one consumer of that index.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript 5
- Tailwind CSS v4
- GSAP 3.12+ (motion), `@gsap/react` (`useGSAP`), ScrollTrigger, ScrollToPlugin, Draggable
- Vercel AI SDK (`ai` + `@ai-sdk/openai`)
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs(readme): replace CRA default with v2 architecture, scripts, and env vars"
```

---

## Self-review (run after Task 36)

- [ ] Re-read the spec section-by-section. For each requirement, point to the task that implements it. List any gaps below and add tasks to address them.
- [ ] Search the codebase for "TODO", "FIXME", "XXX". Either resolve or convert to issues.
- [ ] Run `pnpm test && pnpm test:e2e && pnpm exec tsc --noEmit && pnpm lint`. Everything green.
- [ ] Open the deployed Vercel preview, click each chip, send a typed message, verify autoscroll and highlight tools fire (network tab will show tool call frames in the SSE stream).
- [ ] Verify on a phone: bottom sheet drags, chat is usable, typewriter caret doesn't cause layout shift.
- [ ] axe-core run via `pnpm exec axe http://localhost:3000` (install `@axe-core/cli` if needed). Fix critical violations.

---

## Coverage map (spec § → task #)

| Spec § | Topic | Task(s) |
|---|---|---|
| §1 Context & goals | — | (informational) |
| §2 Tech stack | Deps + scaffolding | Tasks 1–5 |
| §3.State 1 | Landing UI | Tasks 20–21 |
| §3.State 2 | Activated layout | Tasks 22–27 |
| §3.AI autoscroll | scroll_to handler | Task 19 |
| §4.Hero | Hero + currently strip | Task 22 |
| §4.About | About section | Task 23 |
| §4.Work | Timeline + project tabs | Task 24 |
| §4.Personal projects | Card grid | Task 25 |
| §4.Contact | Contact cards | Task 26 |
| §5 Visual direction | Tokens + ambient | Tasks 3, 7 |
| §6 RAG pipeline | DB schema + retrieve | Tasks 12–14 |
| §7 Chat agent | Tools + system prompt + route | Tasks 17–18 |
| §8 Persistence | Chat store | Tasks 10–11 |
| §9 Rate limit + cost | Limits | Tasks 15–16 |
| §10 Animation | GSAP utilities + transition + handlers | Tasks 9, 19, 32 |
| §11 Out of scope | — | (deliberately not built) |
| §12 Mobile | Bottom sheet | Task 31 |
| §13 Error handling | Routes + handlers | Tasks 18 (rate/budget), 14 (db fail) |
| §14 Testing | Unit + e2e | Tasks 9, 10, 14, 15, 16, 34 |

---

Plan complete and saved to `docs/superpowers/plans/2026-04-27-portfolio-v2-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
