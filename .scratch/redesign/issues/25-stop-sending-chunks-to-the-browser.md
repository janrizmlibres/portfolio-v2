# Stop sending chunks to the browser

Type: task
Labels: wayfinder:task
Status: resolved
Blocked by: 12

## Question

AFK and test-first. The browser must never receive retrieved wiki chunks: no text, titles, source paths or chunk ids. What the model sees stays unchanged, so confidentiality stays enforced in the prompt and retrieved chunks are not redacted for the model.

**Today** (found in *Pick the creative concept*):
- `search_wiki` returns `{ id, title, type, text, similarity, portfolioRoute }` (`lib/ai/tools.ts`).
- `app/api/chat/route.ts` calls plain `toUIMessageStreamResponse()`. AI SDK 6 streams each tool's full output to the client as a `tool-output-available` part, so anyone reading devtools or the network tab sees the chunks, including ones that name the employers the prompt keeps confidential.
- The client reads only tool inputs: `onToolCall` in `app/page.tsx` feeds the tool-call line, and `onFinish` keeps text parts and args. Nothing on the client reads tool outputs.
- `portfolioRoute` is always null, because the publisher never wrote `metadata.routes`.

**Do:**
1. **Red.** Write a test that drives the chat route's UI stream with a stubbed `search_wiki` result and asserts that none of the chunk's text, title, source path or id reaches the stream. Confirm it fails for that reason.
2. **Green.** Make it pass with the smallest change: filter or reshape the retrieval tool's output in the UI stream only. Check the AI SDK 6 API in Context7. Also check whether later requests post tool outputs back from the client. If they do, keep the model's context as it is today.
3. **Refactor.** Name the candidates you considered and record a verdict, even if it's "keep".
4. **Docs drift.** `AGENTS.md` and the README still describe the wiki's publisher (`wiki_chunks` "shared with the adjacent llm-wiki repo's publisher", the `metadata.routes.<consumer>` convention), but the publisher was removed from llm-wiki on 2026-08-31. Say what's true now: the table is a snapshot of the last publish.

The sky's build later sends the browser **star ids** from retrieval (opaque ids from *Export the sky*). This ticket only stops the leak; it adds nothing to the stream.

Tests follow the standing runner caps (vitest `--pool-options.threads.maxThreads=2`). Commits state their rule inline and cite nothing outside the checkout. The change doesn't depend on the redesign. Whether it ships on its own or with the redesign branch is Janriz's call once it's done.

Resolved when the test passes, the route streams no chunk data, and the docs match. The answer records what the browser now receives.

## Answer

Resolved 2026-10-01 (AFK, test-first). Uncommitted on `main`'s working tree; whether it ships alone or with the redesign branch is Janriz's call.

**What the browser receives now.** For each `search_wiki` call it gets the call itself (`tool-input-start` / `-delta` / `-available` with `toolName` and the input `{ query, k }`, which the tool-call line shows) and then a `tool-output-available` chunk with `output: null`. It gets no chunk text, titles, source paths or ids. `scroll_to` and `highlight_project` outputs (`{ ok, section | slug }`) and the text, step and finish chunks are unchanged. Nothing was added to the stream.

**Tool outputs do come back.** `useChat` posts the whole in-session conversation on each send, and `convertToModelMessages` turns every `output-available` tool part into a tool result the model reads. So today a follow-up's model context held the earlier chunks, and nulling the output alone would have dropped them. To keep the model's context as it was, the server now re-runs every completed `search_wiki` call in the posted messages (input validated with the tool's own schema) and puts the result back before conversion. Whatever output the browser sends is ignored, so a forged search result can no longer be slipped into the model's context. After a reload nothing changes: the store rehydrates text only, as before.

- Cost: each follow-up re-runs every earlier search in the conversation (one embedding plus one pgvector query each, in parallel), which adds about one embedding round-trip of latency per request. The table is a fixed snapshot, so results repeat (embedding noise aside).
- Alternative not taken: seal the output (AES-GCM under a server secret) and unseal it on the way back. That gives exact replay and no re-embedding, but needs a new secret on Vercel, and the browser still holds the data, only encrypted.

**Code.**
- `lib/ai/withheld-retrieval.ts`: `withholdRetrievalOutputs(stream)` tracks `search_wiki` call ids from `tool-input-*` chunks and nulls their `tool-output-available`. `restoreRetrievalOutputs(messages)` re-runs the searches.
- `lib/ai/tools.ts`: `searchWiki` and `searchWikiInput` pulled out of the tool, so the re-run returns exactly what the model reads.
- `app/api/chat/route.ts`: `createUIMessageStreamResponse({ stream: withholdRetrievalOutputs(result.toUIMessageStream()) })`, and `convertToModelMessages(await restoreRetrievalOutputs(...))`. AI SDK 6 (checked in Context7 and `ai@6.0.168`'s source) has no per-tool output filter on `toUIMessageStreamResponse`, and the client's chunk schema takes `output: unknown`, so `null` is valid.

**Tests.** `app/api/chat/route.test.ts` drives `POST` with a `MockLanguageModelV3` and a stubbed `retrieveChunks`.
- Red: the stream contained the chunk text, and a follow-up never re-ran the search. Both failed for those reasons.
- Green: 2/2. Full suite 39/39 with `.scratch/**` excluded. `tsc --noEmit` exit 0. ESLint on the changed files exit 0.
- Not run live: the e2e test stubs `/api/chat`, and a live two-turn check would spend real OpenAI tokens and write production Upstash counters.

**Refactor candidates and verdicts.**
1. Withhold every tool's output rather than just `search_wiki`'s. *Keep targeted.* The other outputs echo their input, and a blanket filter would mean re-running every tool on the way back in.
2. Dedupe repeated `{ query, k }` searches inside `restoreRetrievalOutputs`. *Skip.* Repeats are rare and the gain is small.
3. Move `searchWiki` and its schema into the new module. *Keep them in `tools.ts`* next to the tool. The new module owns only the browser rule.
4. Add `@ai-sdk/provider` as a dev dependency for the mock's types. *Skip.* The test derives them from `MockLanguageModelV3` instead.

**Docs.** `AGENTS.md` and the README now say that `wiki_chunks` is a snapshot of the last publish, that the publisher was removed from llm-wiki on 2026-08-31 (llm-wiki `479bb5e`) so nothing writes to the table, and that `metadata.routes.<consumer>` was never written (`portfolioRoute` is always null). `AGENTS.md` gains a convention: *Retrieved chunks stay on the server.*

**Found along the way.**
- Vitest here is 4.1.5, which dropped `--pool-options`, so the runner cap is `--maxWorkers=2`.
- `pnpm test` fails today because Vitest collects `.scratch/redesign/research/capture/slots.test.js`, a `node:test` file ("No test suite found").
- `pnpm lint` reports 1,665 errors, all in `.scratch/` captures.
- Neither is from this change, and `vitest.config.ts` and the ESLint config don't exclude `.scratch/`.
