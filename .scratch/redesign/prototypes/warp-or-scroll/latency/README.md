Throwaway measurement for the "Warp or scroll" prototype. It is not product code and will not be maintained.

# Chat → jump-tool latency

**Question:** how long after a visitor sends a message does the chat stream show the model calling `scroll_to` or `highlight_project`?

**Headline metric:** time from just before `fetch()` to the first `tool-input-start` chunk whose `toolName` is `scroll_to` or `highlight_project`. "Input available" is the matching `tool-input-available` chunk, which carries the section or slug. That second number is the one the UI acts on: `app/page.tsx` `onToolCall` fires on it and emits `scrollTo` or `highlightProject`.

## Rerun

```bash
cd /Users/janlibs/dev/portfolio-v2 && pnpm exec next dev -p 3100   # terminal 1, wait for "Ready"
cd .scratch/redesign/prototypes/warp-or-scroll/latency && node measure.mjs   # terminal 2
```

`measure.mjs` has no dependencies (Node 18+). It sends 1 warm-up request, which is discarded, then 7 questions × 2 rounds = 15 requests. The route is rate-limited to 20 requests per hour per IP. The script stops on a 429 or 503. Raw timings and a per-chunk event timeline for each run are written to `results.json`.

## Conditions

- Date: 2026-09-28. Measured from this Mac through `next dev` (Turbopack, Next 16.2.4) to OpenAI. The requests did **not** go through a Vercel function, so the numbers include local dev-mode overhead and home-network latency.
- Model: `gpt-5.4` (from `OPENAI_CHAT_MODEL`). This is **not** GPT-4o. The route's fallback is `gpt-4o`, but `.env` overrides it. No reasoning chunks appeared in the stream.
- AI SDK `ai@6.0.168`, `stopWhen: stepCountIs(4)`, Node v24.15.0, requests sent one at a time.
- **Confound: RAG was broken during the run.** Every `search_wiki` call (24 of 24) hit `[rag] retrieve failed` because the Supabase pooler rejected the DB user with "tenant/user … not found". The tool caught the error and returned `[]`. The system prompt tells the model to retry an empty search, so most "search first" runs made a **second `search_wiki` call in step 2**, and Tolstoy R1 made a third in step 3. `search_wiki` still did the OpenAI embedding call before failing, and it took about 1.05 s per call (p50, range 0.94–1.31 s). Answers came from the page-context block in the system prompt. With a working DB, the step-2 retries probably go away, but the jump still waits one round trip (see pattern below).
- LangSmith tracing is on in `.env`, so these 15 runs were traced under thread IDs `proto-warp-latency-0` … `-14`.
- The route sends response headers at about 270 ms (p50; range 256–438 ms). That time is spent on Upstash rate-limit and cost-cap checks before streaming starts. Step 1 starts at about 790 ms (p50).

## Per-question results (ms from send)

`sN` = the model step (LLM round trip) in which the tool call was streamed.

| Run | Question | Tool order | Jump call | → jump-tool start | → jump input available | → first text | Total |
|---|---|---|---|--:|--:|--:|--:|
| warm-up (discarded) | Tell me about FlowStack | search_wiki s1 → scroll_to s1 → highlight_project s1 | scroll_to {section:projects} | 6,315 | 6,387 | 13,188 | 14,635 |
| R1 | Tell me about Athena | search_wiki s1 → scroll_to s1 → highlight_project s1 → search_wiki s2 | scroll_to {section:work} | 1,594 | 1,598 | 6,308 | 7,583 |
| R1 | Show me his projects | search_wiki s1 → search_wiki s2 → scroll_to s2 | scroll_to {section:projects} | 4,023 | 4,027 | 7,281 | 8,345 |
| R1 | What's his stack? | search_wiki s1 → search_wiki s2 → scroll_to s2 | scroll_to {section:about} | 3,653 | 3,656 | 5,351 | 6,373 |
| R1 | Is he available? | (no tools) | none | — | — | 1,554 | 2,231 |
| R1 | Where has he worked? | search_wiki s1 → search_wiki s2 → scroll_to s2 | scroll_to {section:experience} | 4,033 | 4,038 | 5,862 | 7,247 |
| R1 | Tell me about Mercado | highlight_project s1 → scroll_to s1 → search_wiki s1 | highlight_project {slug:mercado} | 1,691 | 1,698 | 3,909 | 5,356 |
| R1 | What did he do at Tolstoy? | search_wiki s1 → search_wiki s2 → search_wiki s3 → scroll_to s3 | scroll_to {section:experience} | 6,173 | 6,176 | 8,699 | 10,484 |
| R2 | Tell me about Athena | highlight_project s1 → scroll_to s1 → search_wiki s1 → search_wiki s2 | highlight_project {slug:athena} | 1,601 | 1,607 | 5,796 | 7,010 |
| R2 | Show me his projects | search_wiki s1 → search_wiki s2 → scroll_to s2 | scroll_to {section:projects} | 3,717 | 3,726 | 6,340 | 7,351 |
| R2 | What's his stack? | search_wiki s1 → search_wiki s2 → scroll_to s2 | scroll_to {section:about} | 3,749 | 3,753 | 5,461 | 7,174 |
| R2 | Is he available? | (no tools) | none | — | — | 1,142 | 2,118 |
| R2 | Where has he worked? | search_wiki s1 → search_wiki s2 → scroll_to s2 | scroll_to {section:experience} | 3,783 | 3,787 | 5,663 | 6,627 |
| R2 | Tell me about Mercado | highlight_project s1 → scroll_to s1 → search_wiki s1 | highlight_project {slug:mercado} | 1,716 | 1,758 | 3,600 | 5,223 |
| R2 | What did he do at Tolstoy? | search_wiki s1 → search_wiki s2 → scroll_to s2 | scroll_to {section:experience} | 3,692 | 3,696 | 5,425 | 7,063 |

## Summary: send → first jump-tool start (headline)

Percentiles use linear interpolation between ranks. The warm-up and the two no-jump runs are excluded.

| Group | n | p50 | p90 | min | max |
|---|--:|--:|--:|--:|--:|
| All runs that called a jump tool | 12 | 3,704 | 4,032 | 1,594 | 6,173 |
| **Jump tool called directly first** | 3 | 1,691 | 1,711 | 1,601 | 1,716 |
| **search_wiki first** (all) | 9 | 3,749 | 4,461 | 1,594 | 6,173 |
| ↳ search_wiki first, jump in the same step (parallel call) | 1 | 1,594 | 1,594 | 1,594 | 1,594 |
| ↳ search_wiki first, jump only after a round trip | 8 | 3,766 | 4,675 | 3,653 | 6,173 |

Send → jump **input available**: the gap after start is 3–42 ms because the arguments are tiny.

| Group | n | p50 | p90 | min | max |
|---|--:|--:|--:|--:|--:|
| All runs that called a jump tool | 12 | 3,711 | 4,037 | 1,598 | 6,176 |
| Jump tool called directly first | 3 | 1,698 | 1,746 | 1,607 | 1,758 |
| search_wiki first (all) | 9 | 3,753 | 4,466 | 1,598 | 6,176 |
| ↳ same step (parallel) | 1 | 1,598 | 1,598 | 1,598 | 1,598 |
| ↳ after a round trip | 8 | 3,770 | 4,679 | 3,656 | 6,176 |

For context, send → first text: jump-first p50 3,909 ms. search_wiki-first p50 5,862 ms. The no-tool "Is he available?" runs took 1,142–1,554 ms.

## Pattern

What matters is **which model step the jump call lands in**, not only which tool comes first.

- **Step 1 (~1.6–1.7 s):** questions that name a project ("Tell me about Mercado", "Tell me about Athena") usually get `highlight_project` and `scroll_to` in the first model response, streamed before or alongside `search_wiki`. Athena R1 streamed `search_wiki` first but put `scroll_to` in the same step, so it matched that speed.
- **Step 2+ (~3.7–4.0 s, 6.2 s with a second retry):** section-level questions ("Show me his projects", "What's his stack?", "Where has he worked?", "What did he do at Tolstoy?") always ran `search_wiki` alone in step 1, then called `scroll_to` in a later step. Here is the round-trip cost for these runs (p50):
  - `search_wiki` input ready at ~1.37 s
  - tool executes for ~1.05 s
  - step 2 starts at ~3.02 s
  - `scroll_to` streams ~0.75 s into step 2

  That adds about 2 s over the step-1 case.
- **No jump:** "Is he available?" called no tools in either round.
- The only step-3 outlier (Tolstoy R1, 6.2 s) was an extra `search_wiki` retry after two empty results, which is an artifact of the broken RAG DB.
- The warm-up (dev-mode route compile plus cold embedding and DB clients) took 6.3 s to reach a jump tool and 14.6 s in total.
