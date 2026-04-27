# Portfolio v2 — Design Tokens

**Aesthetic direction:** Computational Editorial — programmer monospace headlines + selective serif italic emphasis + warm-cold accent duality on dark.

## Type system

| Role | Font | Source | Weights used |
|---|---|---|---|
| **Display + tech labels + chat tool calls** | JetBrains Mono Variable | Google Fonts | 300, 500, 700 |
| **Body + UI + chat messages** | General Sans Variable | Fontshare (free) | 400, 500, 600 |
| **Italic accent (single-word emphasis)** | Fraunces (italic only, opsz/wght variable) | Google Fonts | italic 600 |

**Type scale (rem, base 1rem = 16px):**

```
display-xl   : 8rem   (128px)  — hero "AI engineer" (desktop)
display-lg   : 5.5rem (88px)   — hero (mobile / compact state 2)
display-md   : 3.5rem (56px)   — section headers
display-sm   : 2.25rem (36px)  — sub-display
title-lg     : 1.5rem  (24px)  — card titles
title-md     : 1.25rem (20px)  — chat header, dense headings
body-lg      : 1.125rem (18px) — about copy, chat assistant text
body         : 1rem     (16px) — UI default
body-sm      : 0.9375rem (15px) — chat user text, button copy
mono-md      : 0.875rem (14px) — code-like inline, eyebrow numerals
mono-sm      : 0.75rem  (12px) — tags, meta, tool-call lines
mono-xs      : 0.6875rem (11px) — micro-labels (UPPERCASE, tracked)
```

**Typographic rules:**

- Display headings always use JetBrains Mono with `font-feature-settings: "ss03","ss05","cv02"` to enable the alternates that look more "display" (cleaner zero, single-storey g).
- Italic emphasis is **Fraunces only** and reserved for one or two words per page section. Never an entire sentence in serif italic. The contrast against the mono is the point.
- Body in General Sans uses `font-feature-settings: "ss01"` for tighter spacing. Letter-spacing is 0 by default; `-0.01em` on display and `0.06em` on micro-labels.

## Color palette

```css
/* Surface (warm dark) */
--ink-bg        : #0e0d10;      /* page background */
--ink-surface-1 : #161518;      /* subtle elevation (cards) */
--ink-surface-2 : #1f1d22;      /* chat panel, modals */
--ink-line      : #2a2730;      /* hairlines */
--ink-line-soft : #1c1a20;      /* near-invisible separators */

/* Text (warm off-white system) */
--ink-fg        : #f4f1eb;      /* primary text */
--ink-fg-muted  : #a8a4a0;      /* secondary text */
--ink-fg-dim    : #6b6760;      /* tertiary, captions */
--ink-fg-fade   : #4a4742;      /* near-fade, decorative numerals */

/* Accents */
--saffron-300   : #f0c878;      /* hover, selection, italic accents */
--saffron-500   : #e8b75a;      /* primary accent — saffron */
--saffron-700   : #b78a3d;      /* press, deep accent */

--phosphor-300  : #8df5ec;      /* highlight cyan */
--phosphor-500  : #5ee5d9;      /* live indicator, agent pulse */
--phosphor-700  : #3aa89f;      /* deep cyan */

/* Atmosphere */
--bloom-warm    : radial-gradient(ellipse 80% 60% at 30% 20%, rgba(232,183,90,0.10), transparent 60%);
--bloom-cool    : radial-gradient(ellipse 50% 40% at 70% 70%, rgba(94,229,217,0.06), transparent 60%);
```

**Color usage rules:**

- **Saffron** — used on: italic accent words, hover-state underlines, focused chip border, decorative numerals (`/02`, `/03`), the "send" button arrow.
- **Phosphor cyan** — used on: chat panel left-border (faint glow), agent thinking pulse, tool-call line text, "live"/"now" indicators, the `▸ scrolled-to` section indicator.
- The two never collide on the same element. Saffron is editorial warmth; phosphor is computational signal. The duality reads as "the human and the agent."

## Spacing & rhythm

```
space-1  : 0.25rem  (4px)
space-2  : 0.5rem   (8px)
space-3  : 0.75rem  (12px)
space-4  : 1rem     (16px)
space-6  : 1.5rem   (24px)
space-8  : 2rem     (32px)
space-12 : 3rem     (48px)
space-16 : 4rem     (64px)
space-24 : 6rem     (96px)
space-32 : 8rem     (128px)
```

- Section vertical rhythm: `space-32` between major sections, `space-16` between sub-blocks, `space-8` for content blocks.
- Container max-width: `78rem` (1248px). Reading max-width: `42rem` (672px).
- Chat panel: 380px on desktop, 100% on mobile.

## Decorative elements

**Numbered eyebrows** before each section heading:

```
/00 ── landing
/01 ── about
/02 ── work
/03 ── projects
/04 ── contact
```

Mono, dim color, the `──` is a visual rule. Aligns left, lives above the heading.

**Hero footer "currently strip":**

```
Stack ─── Next.js · Vercel AI SDK · OpenAI · pgvector · MCP
Open to ─── AI eng roles · agent eval consults
```

Mono, `mono-md`, with a horizontal rule between rows. Both rows align by their colon-equivalent dashes.

**Tool-call lines in chat:**

```
↻ search_wiki  query: "mem0 architecture"  ·  type: "project"
```

Phosphor cyan italic monospace, `mono-sm`. Renders as one line per tool call, sandwiched between assistant text blocks.

## Motion language (GSAP)

**Ease curves:**

- `power3.inOut` — for AI autoscroll, layout transitions
- `power2.out` — for entrance fades, hovers
- `expo.out` — for chip-to-input dispatch animation (zippy)

**Durations:**

- Micro-interaction (hover, focus): 180ms
- Section enter: 600ms
- Tool call line reveal: 300ms (typewriter-ish)
- AI autoscroll: 900ms
- State 1 → State 2 transition: ~1.4s timeline

**Scroll-triggered enters:** sections fade `opacity 0 → 1` and translate `y: 16px → 0` over 600ms when entering viewport, `power2.out`.

**State 1 → State 2 timeline (sketch):**

```
0.00 — chip click registers → chip glows saffron, then types itself into input over 240ms
0.30 — input "send" pulse → message bubble appears in chat (which doesn't exist yet visually)
0.50 — state-1 wrapper fades to 0 (300ms)
0.70 — state-2 wrapper fades from 0 (400ms), main column staggers in (each section delayed by 80ms)
1.00 — chat panel slides from right (x: 30px → 0, opacity 0 → 1, 500ms)
1.40 — first agent reply types into chat panel (typewriter, 1-2s, but transition is "complete" by 1.4s)
```

**Ambient motion (low FPS, low opacity):**

- Hero saffron-warm bloom drifts in a gentle infinite loop, ~60s period, ~10px translation.
- Phosphor pulse on the agent indicator: 0.4 → 1.0 opacity, 1.6s ease-in-out, infinite.
- Grain texture (1.5% opacity SVG noise) is static — stillness against the gentle drifts.

## Reduced-motion variant

When `prefers-reduced-motion: reduce`:

- All transitions become instant (no GSAP timelines play; state swap is direct).
- AI autoscroll uses native `scroll-behavior: auto` (no smooth scrolling).
- Ambient hero bloom is static (no drift).
- Phosphor pulse becomes a steady cyan glow (no animation).
- Tool call lines appear instantly (no typewriter).

## Accessibility checks

- All accent text has ≥4.5:1 contrast against the surface it sits on (saffron on `ink-bg` = ~7.8:1, phosphor on `ink-bg` = ~10.5:1).
- Focus rings use saffron `--saffron-500` with 2px outline + 4px offset; never removed.
- Italic Fraunces accents are decorative only — every italicized word is also conveyed by sentence context (no semantic-only italics).
- Tool call lines are visible to screen readers via `aria-live="polite"` on the chat scroll region.
- Keyboard shortcut: `/` to focus the chat input from anywhere. `Esc` to clear chat.
