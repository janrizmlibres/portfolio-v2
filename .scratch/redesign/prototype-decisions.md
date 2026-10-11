# Redesign — decisions settled before the wayfinder map

Prototype: `docs/design/2026-09-27-redesign-prototype.html` (approved 2026-09-27 as "good"). **It is a reference, not a locked base** — layout, visuals and even the chat bar/drawer may be thrown away depending on the concept the case studies lead to (Janriz, 2026-09-27). What carries forward regardless: the content answers below and the ban on generic template effects.

**Update (Janriz, 2026-09-27, later): nothing in the design is final, the prototype included.** The "Direction" section is reference only: theme, accent, type, hero and chat bar/drawer. So are the answers that follow from the prototype's layout: the "what I shipped" field, retired copy keys, title/subtitle split, Mercado screenshot and skip link. The facts still stand (resume dates and titles, LogoLife title, Elinnov and Yearbook kept, availability line), and so does the NDA line and the effects rule. The map's Notes hold the current split.

## Direction (2026-09-27)

- **Goal:** keep every behaviour (two states, chat, tool effects `scroll_to` / `highlight_project`, section ids, GSAP, `jrz-chat-v1` store); change only look and copy. "Deslop": remove the AI-template tells (numbered eyebrows, mono + italic-serif headings, three fonts, glows/bloom/cursor, tracked mono labels, uniform card grids, generic copy, loud tool-call lines).
- **Theme:** stay dark.
- **Tone:** personality through scale, contrast and real content — not effects. One loud accent as solid fill (`#FF5A1F`), one type family (Archivo + IBM Plex Mono for semantic mono only), huge name as hero, asymmetric per-section layouts, one game-dev detail used once, copy in Janriz's voice.
- **Effects rule (revised 2026-09-27):** effects made for this site and tied to its concept are welcome; generic template effects (glow, bloom, blinking cursor, pulsing dots, gradient blobs, parallax with no purpose) stay banned. No game-dev concept required — any strong concept is welcome.
- **Chat:** docked bar (bottom-centre) by default → pushes open a right-hand drawer on first send; stays open for the conversation; returning visitors with history land with it open; mobile keeps the bottom sheet. Tool calls collapse to one quiet line, expandable.

## Prototype review answers (2026-09-27)

1. **Availability** — keep "Open to full-stack and AI roles" and the "Are you available?" chip as they are.
2. **Work timeline** — no HealthcareGPS / Guestpulse / GetAIPP. LogoLife stays the most recent role. Source of truth for roles, dates and titles: the resume (`~/Downloads/Libres - Resume.pdf`).
3. **LogoLife title** — "Full-Stack / AI Engineer" (matches the resume; `lib/content` currently says "Data / AI Engineer").
4. **Mercado** as the featured project screenshot (Nike storefront) — fine.
5. **"Skip to the portfolio"** link on State 1 — keep (new affordance; today only the first send moves to State 2).
6. **NDA note** — the single quiet "⊘ NDA. Patterns only, no screenshots." line under the work list satisfies the AGENTS.md rule.

## Content implications (not yet applied)

- Each work-timeline entry needs a new "what I shipped" sentence field.
- Retired copy: `taglineState1`, `taglineState2`, `aboutLede`, `headlineTypewriter`, `headlineSuffix` (typewriter goes).
- Professional-project titles split into title + subtitle (no em-dash titles).
- Resume dates: LogoLife Oct 2025 – Sept 2026, Tolstoy Aug 2025 – Oct 2025. `lib/content` still says LogoLife "5 mo" / Tolstoy "3 mo".
- **Elinnov (2024) and The Crusader Yearbook (2023–24) stay** on the site even though the resume omits them (decided 2026-09-27). Resume wins on dates and titles where the two overlap; the "total" line becomes ~2 years 5 months.
