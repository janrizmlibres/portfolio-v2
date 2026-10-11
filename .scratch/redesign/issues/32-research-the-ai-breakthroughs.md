# Research the AI breakthroughs on the Work route

Type: research
Labels: wayfinder:research
Status: resolved
Blocked by:

## Question

Which frontier AI breakthroughs belong on the Work route, from the start of Janriz's career (2023) up to 2026-09-29, and what are their exact names and dates?

**Why now.** *Make every scroll a scene* (Q24) widened the route from model releases to **AI breakthroughs of any kind**: models, protocols such as the Model Context Protocol, and shifts in what could be built. Janriz's idea is that Work becomes its own experience, where each breakthrough can unfold as a scene. *Storyboard the voyage* weighs how many earn a scene, so it needs a verified list first.

**What the list must hold:**
- **The latest marker is Claude Sonnet 5.5,** which Janriz says was released on 2026-09-29, just after Claude Opus 5.5. Verify both.
- **The ones he named:** Project Glasswing, and Fable ("felt like AGI at the time").
- **Round 4's markers** (`prototypes/deep-field-sky/content.js`, `MODELS`), checked: they run from GPT-4 Turbo (Nov 2023) to Claude Opus 4.5 (Nov 2025). 2026 is missing.
- **The test for inclusion** (from *Pick the creative concept*): only breakthroughs that changed what he could build, about one a quarter, plain text, no vendor logos. The ones he built with are marked, from the stacks in `lib/content/`.

**The answer gives:**
- a table, newest first: the date (to the day where the source gives it), the name, what it is in one line, why it changed what could be built in one line, the primary source with its URL, and the confidence;
- a proposed shortlist at about one a quarter;
- any conflicts or unverifiable claims, stated plainly.

Findings go to `research/work-route-ai-breakthroughs.md`.

## Answer

Findings: [`research/work-route-ai-breakthroughs.md`](../research/work-route-ai-breakthroughs.md). It has the full table of 52 rows, newest first, with sources and confidence, plus the conflicts and method.

**Short answer:**
- **Claude Sonnet 5.5 checks out as the head marker.** Anthropic dates it 2026-09-28, released at 11:00 PDT. That was 2026-09-29 in Cebu, so Janriz's date is his local date. A "Sept 2026" label avoids the difference.
- **Claude Opus 5.5 came six days earlier, on 2026-09-22.**
- **Project Glasswing was announced on 2026-04-07.** It is an initiative, not a model. It runs on the invitation-only Claude Mythos Preview.
- **Fable is two releases:**
  - **Claude Fable 5, on 2026-06-09.** It was pulled for all customers on 06-12 under a US export-control directive, and restored on 07-01.
  - **Claude Fable 5.1, on 2026-09-01.**
  - Anthropic never calls it AGI. "Felt like AGI" stays Janriz's own line.
- **All 13 of round 4's markers are right to the month.** "Claude 4" should read Claude Opus 4 and Claude Sonnet 4. "OpenAI o1" was o1-preview and o1-mini.
- **The 2025-11 → 2026-09 gap is filled.** It holds about 30 candidates.

**Proposed shortlist,** 14 markers over 13 quarters, newest first (✓ = built with):

| Quarter | Date | Marker |
|---|---|---|
| 2026-Q3 | 2026-09-28 | Claude Sonnet 5.5 |
| 2026-Q3 | 2026-09-22 | Claude Opus 5.5 (could share one marker with Sonnet 5.5) |
| 2026-Q2 | 2026-06-09 | Claude Fable 5 |
| 2026-Q2 | 2026-04-07 | Project Glasswing |
| 2026-Q1 | 2026-02-05 | Claude Opus 4.6 |
| 2025-Q4 | 2025-11-24 | Claude Opus 4.5 |
| 2025-Q3 | 2025-08-07 | GPT-5 ✓ (at Tolstoy) |
| 2025-Q2 | 2025-04-14 | GPT-4.1 ✓ (at Tolstoy) |
| 2025-Q1 | 2025-02-24 | Claude 3.7 Sonnet and Claude Code |
| 2024-Q4 | 2024-11-25 | Model Context Protocol ✓ |
| 2024-Q3 | 2024-09-12 | OpenAI o1 |
| 2024-Q2 | 2024-05-13 | GPT-4o ✓ |
| 2024-Q1 | 2024-03-04 | Claude 3 |
| 2023-Q4 | 2023-11-06 | GPT-4 Turbo |

2023-Q3 has no marker. The findings file lists the runners-up for each quarter.

**Open points:**
- **The GPT-4.1 and GPT-5 "built with" marks come only from round 4's `content.js`.** `lib/content` says just "OpenAI". Confirm them with Janriz.
- **openai.com was unreachable (403),** so OpenAI's dates are API dates from its developer changelog.
- **Cowork's 2026-01-12 launch date rests on secondary sources.**

**Coordinator's check** (2026-09-29): the Claude Platform release notes carry these exact date headings:
- Sonnet 5.5, September 28, 2026;
- Opus 5.5, September 22, 2026;
- Fable 5, June 9, 2026;
- Fable 5.1, September 1, 2026;
- Opus 4.6, February 5, 2026.

The OpenAI rows rest on its API changelog, because openai.com returned 403. Janriz should confirm the "built with" marks on GPT-4.1 and GPT-5, which come from round 4's `content.js`, not from `lib/content`.

## Comments

- 2026-09-29 — **Janriz on "built with":** "I've never built anything with GPT / OpenAI models except during my time at LogoLife".
  - `lib/content` names only GPT-4o, on the Counselor Dashboard. The crawler and the data pipeline say "OpenAI" without a model.
  - So GPT-4.1 and GPT-5 keep their marks only if he used them at LogoLife. That was asked.
  - If either mark falls, its quarter's tie-break moves to the runner-up:
    - 2025-Q3: Claude Sonnet 4.5 and the Claude Agent SDK;
    - 2025-Q2: Claude Opus 4 and Sonnet 4, with Claude Code GA.
- 2026-09-29 — **Janriz: "actually at Tolstoy as well. They always use the latest models."** He added that both are models the apps they built ran on, not coding tools. So **"built with" means a model that powered an app he shipped.** A coding assistant doesn't earn the mark.
  - His Tolstoy role ran Aug – Oct 2025. The OpenAI API changelog, read raw from developers.openai.com/api/docs/changelog, shows these releases around it:
    - **the GPT-5 family** (`gpt-5`, `gpt-5-mini`, `gpt-5-nano`) on Aug 7, 2025;
    - `gpt-5-codex`, for the Codex CLI only, on Sep 23;
    - GPT-5 Pro, `gpt-realtime-mini`, `gpt-audio-mini`, `gpt-image-1-mini` and Sora 2 at DevDay, Oct 6;
    - GPT-5.1 on Nov 13, 2025, after he had left.
  - So the latest general-purpose models throughout his time there were the GPT-5 family, and **GPT-5's ✓ is confirmed.**
  - **GPT-4.1's ✓ is still unconfirmed.** It came out in Apr 2025, before Tolstoy, and LogoLife's named model is GPT-4o. It stands only if something at LogoLife ran on it. Asked.
  - GPT-4o's ✓ stands on LogoLife's Counselor Dashboard, and this portfolio's own chat runs on GPT-4o too.
- 2026-09-29 — **LogoLife's model:** Janriz doesn't remember the exact one, only that it was OpenAI.
  - Nothing records GPT-4.1, so **its mark is dropped.** 2025-Q2 goes to its runner-up, Claude Opus 4 and Claude Sonnet 4 with Claude Code GA (2025-05-22), under the shortlist's own tie-break.
  - **GPT-4o keeps its mark,** because `lib/content` names it for the Counselor Dashboard.
  - "Built with" now stands on **GPT-4o, MCP and GPT-5.**
- 2026-09-29 — **The LogoLife crawler's models,** from Janriz's pipeline diagram:
  - OpenAI **`gpt-5-mini`** with **Structured Outputs** for extraction;
  - OpenAI **`text-embedding-3-large`** for both dedup passes;
  - xAI's **Grok 4 Fast** for enrichment. It was released Sep 19, 2025, per x.ai/news/grok-4-fast.

  "Built with" now stands on GPT-4o, MCP, GPT-5, Structured Outputs, embedding v3 and Grok 4 Fast; GPT-4.1 stays dropped. Under the shortlist's tie-break, 2024-Q1 (embedding v3 over Claude 3) and 2024-Q3 (Structured Outputs over o1) would flip to features. That's *Storyboard the voyage*'s call ([findings §7](../research/work-route-ai-breakthroughs.md)).
- 2026-09-29 — **Correction: GPT-4.1's mark is restored.** Janriz's resume (v7), as filed on his personal wiki's Tolstoy page, lists "GPT-5, GPT-4.1 Nano/Mini, GPT-5 Nano" for chat, question generation and content analysis at Tolstoy. 2025-Q2 goes back to GPT-4.1 under the tie-break, and Claude Opus 4 and Sonnet 4 with Claude Code GA is the runner-up again. "Built with" now stands on:
  - GPT-4o;
  - MCP;
  - Structured Outputs;
  - embedding v3;
  - GPT-4.1;
  - GPT-5;
  - Grok 4 Fast.
- 2026-09-29 — **Janriz: "only at LogoLife" was a mistake.** This site's GPT-4o chat and his Upwork automations (Nov 2025: GPT, and **Sora 2** via Kie.ai for UGC ads) count too.
  - Sora 2 now has a row: API launch Oct 6, 2025, at DevDay, per the OpenAI API changelog.
  - Under the tie-break, 2025-Q4 would go to Sora 2 over Claude Opus 4.5. That joins the two feature flips as *Storyboard the voyage*'s call.

