# Jev as the destination router: research findings

Ticket: [21 — Jev as the destination router](../issues/21-jev-as-the-destination-router.md) · researched 2026-09-27 · facts, not a verdict (the verdict is *Pick the destination router*, ticket 23).

**Method.** Every claim cites the source that owns it. Tags:

- **[V]** TypeSafe's own material: docs at `docs.typesafe.ai` (read in full through its `llms-full.txt`), the launch post, legal pages, status page, SDK source on npm, SDK repo issues.
- **[P]** Other first-party platforms: Vercel docs, changelog and AI Gateway catalog, the npm registry, the AI SDK package source, this repo.
- **[I]** Independent measurements by people who ran Jev themselves, with their method stated.
- **[S]** Secondary write-ups, used only to find leads, and cited only where no primary source exists.
- **(analysis)** marks anything I worked out myself. **(unverified)** marks anything I could not confirm at a primary source. Both are collected in the last section.

I did not sign up, and I made no call to the Jev API or to any paid API. The only network reads were public web pages, public package registries, the public status page, public model catalogs (Vercel AI Gateway `GET /v1/models`, OpenRouter `GET /api/v1/models`), GitHub, and a DNS lookup.

**Version snapshot (2026-09-27).**

| Thing | Version / date | Source |
|---|---|---|
| Jev model | `jev-1.13.0`. `jev-latest` and `jev-preview` both point to it. `jev-1.12` appears in cookbooks dated 2026-08. | [V] [Models](https://docs.typesafe.ai/models), [classification cookbook](https://docs.typesafe.ai/cookbooks/classification_using_confidence) |
| Launch | 2026-09-15, "available today in early access" | [V] [launch post](https://typesafe.ai/blog/introducing-system-one-models-and-jev) |
| `@typesafe-ai/sdk` (TS/JS) | 0.6.0 (2026-09-15). 0.5.7 (2026-09-12) was the first public release. MIT, zero dependencies, `engines.node >=20`. | [P] [npm registry](https://registry.npmjs.org/@typesafe-ai%2fsdk), [V] [JS changelog](https://docs.typesafe.ai/sdk/javascript/changelog) |
| `typesafe-sdk` (Python) | 0.7.1 (2026-09-21). Breaking changes shipped in 0.6.0 (09-15) and 0.7.0 (09-18). | [V] [Python changelog](https://docs.typesafe.ai/sdk/python/changelog) |
| `@ai-sdk/typesafe-ai` | 3.0.8 (2026-09-25). First published 2026-09-16. Apache-2.0, `engines.node >=22`, depends on `@ai-sdk/provider` 4.0.18. | [P] [npm registry](https://registry.npmjs.org/@ai-sdk%2ftypesafe-ai) |
| `ai` | `latest` = 7.0.118 (`engines.node >=22`). `ai-v6` = 6.0.293. `experimental_evaluate` exists in 7.x, not in 6.0.293. This repo pins `ai ^6.0.168` with `@ai-sdk/provider` 3.0.8. | [P] npm registry, package `dist/index.d.ts` of both, `node_modules` |
| This repo's route | `app/api/chat/route.ts`: `runtime = "nodejs"`, GPT-4o through `streamText` wrapped by LangSmith, `stopWhen: stepCountIs(4)`, returns `result.toUIMessageStreamResponse()`. No `vercel.json`. | [P] repo |

---

## 0. What the router would sit in (repo facts)

- **Destinations today.** `scroll_to` takes one of 5 sections: `about`, `experience`, `work`, `projects`, `contact`. `highlight_project` takes one of 9 slugs, built from the content files: `athena`, `counselor-dashboard`, `crawler-dashboard`, `ai-crawler`, `data-maintenance-pipeline`, `e2e-testing-suite`, `flowstack`, `pulsevr`, `mercado`. That makes 14 destinations, or 15 with a "none". [P] `lib/ai/tools.ts`, `lib/content/*`
- **Client side.** `app/page.tsx` handles `useChat`'s `onToolCall`. For `scroll_to` and `highlight_project` it calls `emit("scrollTo" | "highlightProject")` on the tool-effect bus, and keeps a `ToolCall` breadcrumb that is stored with the assistant message in the `jrz-chat-v1` store. `lib/chat/types.ts` types `ToolCall.name` as `"search_wiki" | "scroll_to" | "highlight_project"`. AGENTS.md calls the store's shape a contract. [P] repo
- **State already on hand.** Each request carries `messages` and a `viewContext` (`sectionId`, `domId`, `label` of the section in view). `PAGE_CONTEXT_BLOCK` (a text copy of what the page shows) is 4,717 characters, or 638 words. Measured with `npx tsx` on `lib/ai/page-context.ts`. [P] repo
- **Region.** There is no `vercel.json`, so the function runs in the Vercel default region, unless it was set in the dashboard (not visible from the repo). New projects default to `iad1` (Washington, D.C.). [P] [Vercel: configuring regions](https://vercel.com/docs/functions/configuring-functions/region)
- **No privacy notice.** The site has no privacy page: no match for "privacy" in `app/`, `components/`, `lib/` or `public/`. [P] repo. This matters for §7.

---

## 1. The API and sign-up

### 1.1 Endpoint, auth, shapes

- **One endpoint.** `POST https://api.typesafe.ai/v1/systemone` with `Authorization: Bearer <API_KEY>` and a JSON body. `GET /v1/models` lists the aliases. [V] [API reference](https://docs.typesafe.ai/api), [Models](https://docs.typesafe.ai/models)
- **Request body.** `{ state, model, questions }`.
  - `state` is a string, a JSON object or an array.
  - `model` is, for example, `"jev-latest"` or `"jev-1.13.0"`.
  - `questions` is a map from IDs you choose to questions. Each question has `type` (`choice`, `score` or `noul`), `instructions` (a string, object or array) and `criteria`.
  - **Question IDs are not sent to the model.** Option names and their descriptions are sent. [V] [API reference](https://docs.typesafe.ai/api), [Choice](https://docs.typesafe.ai/primitives/choice)
- **Choice.** `criteria` maps each option name to a description (a string, object, array or `null`). At most 255 options.
  - Answer: `{ type: "choice", choice, probabilities, confidence }`.
  - `choice` is "the highest-probability option". `probabilities` covers "every option mapped to its probability (floats that sum to 1)". [V] [API reference](https://docs.typesafe.ai/api)
- **Noul.** `criteria` is optional: `{ true, false }` descriptions. Answer: `{ type: "noul", noul }`, "on a scale from 0 (no) to 1 (yes)". It has no `confidence`. [V] [API reference](https://docs.typesafe.ai/api), [Noul](https://docs.typesafe.ai/primitives/noul)
- **Response.** `{ model: "jev-1.13.0", answers: {…}, usage: { input_tokens, output_tokens } }`. `model` reports the versioned ID that answered. [V] [API reference](https://docs.typesafe.ai/api)
- **Errors.**
  - Documented: `401` (missing or invalid key), `422` (validation, with the offending field), `429` (rate limit) and `529` (overloaded). The docs say to retry the last two with exponential backoff, and the SDKs do that by default. [V] [API reference](https://docs.typesafe.ai/api#errors)
  - `402` and `413` are not typed by the JS SDK (open issue #13). [V] [typesafe-sdk-js #13](https://github.com/typesafe-ai/typesafe-sdk-js/issues/13)
- **Cloudflare sits in front.** `api.typesafe.ai` resolves to Cloudflare anycast addresses (104.18.24.46, 104.18.25.46). [P] `dig`, 2026-09-27
  - An open issue (2026-09-23) reports Cloudflare's WAF answering with an **HTML `403`** when `state` contains a `curl` command with a URL. The request never reaches the API. [V] [typesafe-sdk-js #15](https://github.com/typesafe-ai/typesafe-sdk-js/issues/15)
  - Visitors can paste text like that into a chat.
- **The rounding.** "TypeSafe returns scores and probabilities rounded to two decimal places … rounding means probabilities may not add up to exactly one." [P] `@ai-sdk/typesafe-ai` 3.0.8 `docs/105-typesafe-ai.mdx`. The docs' examples all show two decimals. [V]

### 1.2 SDKs

- **TypeScript: `@typesafe-ai/sdk` 0.6.0.** [V] [JS SDK](https://docs.typesafe.ai/sdk/javascript), [TypeSafeClientConfig](https://docs.typesafe.ai/sdk/javascript/api/interfaces/TypeSafeClientConfig), [RetryPolicy](https://docs.typesafe.ai/sdk/javascript/api/interfaces/RetryPolicy), [ENV](https://docs.typesafe.ai/sdk/javascript/api/variables/ENV)
  - `new TypeSafeClient()`, then `client.systemOne({ state, questions, model? }, { timeout?, retry?, signal?, headers? })`.
  - It has `choice()`, `noul()` and `score()` helpers. Answer types are inferred from the questions, so `answers.x.choice` is typed as the union of the option keys.
  - It ships ESM, CJS and type declarations. It needs Node 20 or newer.
  - Defaults:
    - `timeout` is 10,000 ms **per attempt**, "there is no total retry budget";
    - `maxRetries` is 2;
    - backoff starts at 500 ms and doubles up to 5,000 ms, with 0.25 jitter;
    - it retries 408, 429 and 5xx, and honours `Retry-After`.
  - Environment variables: `TYPESAFE_API_KEY` (required), `TYPESAFE_BASE_URL`, `TYPESAFE_DEFAULT_MODEL` (default `jev-latest`) and `TYPESAFE_LOG_LEVEL`.
  - It refuses to run in a browser unless `dangerouslyAllowBrowser` is set. It detects Vercel Edge and Cloudflare Workers as runtimes. [P] package `dist/index.mjs`
  - `dist/index.mjs` is 28,819 B, or 8,973 B gzipped. It is server-only, so no client bundle cost. [P] measured
- **Python: `typesafe-sdk` 0.7.1.** `client.system_one(state=…, questions=…)`. Not relevant to this stack. [V]
- **AI SDK: `@ai-sdk/typesafe-ai` 3.0.8 with `experimental_evaluate` from `ai` 7.** [P] package README and docs, `ai@7.0.118` `dist/index.d.ts`; [Vercel changelog, 2026-09-16](https://vercel.com/changelog/typesafe-ai-jev-now-available-on-ai-gateway)
  - The key comes from **`TYPESAFE_AI_API_KEY`**, a different name from the TypeSafe SDK's. The default base URL is `https://api.typesafe.ai/v1`.
  - Noul is renamed `boolean`, and its answer field is `probability`.
  - Confidence is **not** in `result.answers`. It is at `result.providerMetadata.typesafe.confidence[questionId]`.
  - Core retries 429 and 529 with `maxRetries` (default 2).
  - Vercel's changelog says the AI SDK path needs **AI SDK 7.0.105 or later**. This repo is on `ai` 6.
- **Vercel AI Gateway, three paths.** [P] [Vercel docs: TypeSafe API with AI Gateway](https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe) (last updated 2026-09-21), [changelog 2026-09-21](https://vercel.com/changelog/ai-gateway-now-supports-typesafe-clients-and-http-api-for-jev)
  - The model is `typesafe-ai/jev`.
  - The **TypeSafe SDK works through the Gateway** with no AI SDK upgrade: `new TypeSafeClient({ apiKey: process.env.AI_GATEWAY_API_KEY, baseURL: 'https://ai-gateway.vercel.sh/typesafe' })`, with `model: 'typesafe-ai/jev'`.
  - Authentication is an AI Gateway API key or a Vercel OIDC token. It is billed through AI Gateway.
  - BYOK (a TypeSafe key held in the Gateway) needs purchased Gateway credits. [P] [AI Gateway pricing](https://vercel.com/docs/ai-gateway/pricing)
- **Other routes, not checked at a primary source.**
  - OpenRouter: independent repos call Jev as `typesafe/jev-1.13` through an OpenRouter "Decisions API" (`/api/alpha/decisions`). [I] [claude-code-jev](https://github.com/RahulBalakavi/claude-code-jev), [jevbench](https://github.com/dhruvmehra/jevbench)
  - OpenRouter's public model list shows only `typesafe/jev-router`, a model-picking product built on Jev, created 2026-09-25. [P] `openrouter.ai/api/v1/models`
  - Requesty lists `typesafe/jev-1.13.0`. [S] [Requesty blog](https://www.requesty.ai/blog/typesafe-jev-explained)
  - LangChain's integration is Python-only (`langchain-typesafe`). [S] [LangChain blog](https://www.langchain.com/blog/building-a-harness-with-jev)
- **Context7.** It indexes TypeSafe's docs as `/websites/typesafe_ai` and the JS SDK as `/websites/typesafe_ai_sdk_javascript`. The answers matched the docs. [P]

### 1.3 Sign-up, keys, free tier

- **Where keys come from.** The Quick start says "Get your API key from the [dashboard](https://console.typesafe.ai/keys)", and the SDKs read `TYPESAFE_API_KEY`. [V] [Quick start](https://docs.typesafe.ai/introduction/quickstart). The contract calls API keys "Access Credentials" and makes them TypeSafe Confidential Information. [V] [MCA §2.4, §14.1](https://typesafe.ai/legal/mca)
  - **The conventional env var name is `TYPESAFE_API_KEY`.**
  - Only if the AI SDK provider is used: `TYPESAFE_AI_API_KEY`.
  - Only if the Gateway is used: `AI_GATEWAY_API_KEY`.
- **Sign-up timeline.** All times UTC, from TypeSafe's own X posts read through the public syndication endpoint.
  - Launch was waitlist-only ("opening early access and bringing developers off the waitlist"). [V] launch post
  - 2026-09-20 21:30: "Jev is now available to everyone. No waitlist." [V] [x.com/typesafeai/status/2101786156572823624](https://x.com/typesafeai/status/2101786156572823624)
  - 2026-09-22 06:19: "we have to temporarily pause signups for Jev … existing signups … will continue to function." [V] [x.com/typesafeai/status/2102281508950307159](https://x.com/typesafeai/status/2102281508950307159)
- **Current status.** I could not confirm whether sign-ups are still paused on 2026-09-27. The console answers scripted requests with a Cloudflare block page. On 2026-09-24 a secondary source said "signups are still paused". (unverified) [S] [flaviocopes.com/jev-api-key](https://flaviocopes.com/jev-api-key/)
- **Login and billing.**
  - Secondary sources describe the console login as "Continue with Google" or an emailed code, and keys under **API Keys**. [S] [flaviocopes.com/jev-api-key](https://flaviocopes.com/jev-api-key/)
  - Billing is **prepaid Credits**. "Promotional Credits" are issued at TypeSafe's "sole discretion". If credits run out and auto-refill is off, TypeSafe "may decline to generate Output". [V] [MCA §8.2](https://typesafe.ai/legal/mca)
  - Several secondary sites say sign-up gave **$5 of credit**. I found no TypeSafe statement of it. (unverified)
- **Free tier through Vercel: none.**
  - The Gateway catalog marks Jev **`"availableToFreeTier": false`**. The free tier "includes a subset of models", so using Jev there needs purchased Gateway credits. [P] [vercel.com/ai-gateway/models](https://vercel.com/ai-gateway/models?freeTier=true) page data, [AI Gateway pricing](https://vercel.com/docs/ai-gateway/pricing)
  - A secondary source that calls Jev a Gateway "free-tier model" is contradicted by this catalog data.
  - A Vercel Community thread (2026-09-24, two Hobby teams) reports **HTTP 403** for Jev on both Gateway endpoints while other models work. It had no staff answer when read. [P] [community.vercel.com/t/…/49653](https://community.vercel.com/t/ai-gateway-jev-request-returns-403-and-is-absent-from-logs/49653)

---

## 2. The two numbers

### 2.1 What each number is

- **`probabilities`** is the model's distribution over **the options you supplied**, which sums to 1. "Every answer is constrained to the options you supplied … never a value outside them." [V] [Primitives](https://docs.typesafe.ai/primitives#what-comes-back)
- **`confidence`** is "a statistic computed from the probability distribution the answer already gives you". It "collapses that shape into a single number from 0 to 1". It is returned on Choice and Score answers, not on Noul. TypeSafe calls it "a convenient measure … you are never locked into our definition". [V] [Confidence](https://docs.typesafe.ai/confidence)
- **The formula.** The Confidence page's interactive `ConfidenceExplorer` computes `clamp((n × peak − 1) / (n − 1), 0, 1)`, where `n` is the number of options and `peak` is the top probability. [V] component source in the page HTML of [docs.typesafe.ai/confidence](https://docs.typesafe.ai/confidence). MarkTechPost's coding guide states the same formula. [S] [MarkTechPost, 2026-09-23](https://www.marktechpost.com/2026/09/23/a-coding-guide-to-typesafe-ai-jev/)
  - Every documented response I checked fits it within two-decimal rounding (analysis):

| Docs example | n | top p | reported `confidence` | (n·p−1)/(n−1) |
|---|---:|---:|---:|---:|
| API ref, `department` | 3 | 0.88 | 0.81 | 0.82 |
| Quick start, `department` | 3 | 0.85 | 0.78 | 0.78 |
| Choice page, `department` | 3 | 0.61 | 0.42 | 0.42 |
| Choice page, `shipping_issue` | 5 | 0.74 | 0.67 | 0.68 |
| Choice page, `requested_resolution` | 4 | 0.40 | 0.20 | 0.20 |
| Choice page, `tone` | 3 | **0.84** | **0.76** | 0.76 |
| Jaggedness page, yes/no Choice | 2 | 0.99 | 0.97 | 0.98 |
| API ref, Score `frustration` | 3 | 0.95 | 0.92 | 0.93 |

- **What the formula implies (analysis).**
  - For a fixed option list, `confidence` is a linear rescaling of the top probability: 0 when the top option is at chance (1/n), 1 at certainty.
  - It ignores how the remainder is spread. This conflicts with one cookbook sentence claiming confidence separates "a winner at 0.45 with a runner-up at 0.44" from "a winner at 0.45 with the rest … scattered". [V] [classification cookbook](https://docs.typesafe.ai/cookbooks/classification_using_confidence)
  - It depends on `n`. With the ticket's 15 options, confidence 0.60 means a top probability of about 0.63. With 3 options, it means 0.73.
- **The ticket's "billing 0.84, confidence 0.596" example.** I did not find it in TypeSafe's docs, launch post or homepage. Search summaries attribute it to "a documentation example" with "technical 0.159", but none of the pages I opened contain it. (unverified)
  - The docs' own answer with 0.84 on 3 options (`tone`) reports **0.76**, as the formula predicts.
  - The API rounds to two decimals, so a three-decimal 0.596 is not a raw API value.
  - Normalised entropy, `1 − H/ln 3`, over (0.84, 0.159, 0.001) gives 0.594, which is close to 0.596. The example may come from a write-up that used an entropy measure. (analysis)
- **Noul.** The number is the probability of yes. "A value near 0.5 means the model gives yes and no similar probability." It is "not a scale of the thing you asked about". [V] [Noul](https://docs.typesafe.ai/primitives/noul)

### 2.2 Calibration: the claim and the evidence

- **TypeSafe's claim.**
  - RLCD trains "probabilities … optimized against outcomes". Calibration "is measured across groups of predictions; it does not guarantee that an individual answer is correct." [V] [System One](https://docs.typesafe.ai/concepts/system-one), [AI primer](https://docs.typesafe.ai/introduction/machine-learning-primer)
  - The contract: "THE SERVICES MAY PRODUCE INACCURATE OR ERRONEOUS OUTPUT." [V] [MCA §9.3](https://typesafe.ai/legal/mca)
- **TypeSafe's own evidence.** 60 SEC filings, one Choice over 75 groups, `jev-1.12`. At confidence ≥ 0.9 the half above the cutoff was right 90% of the time. The half below was right 40%. [V] [classification cookbook](https://docs.typesafe.ai/cookbooks/classification_using_confidence)
- **Independent evidence.**
  - [AbdelStark/jev-benchmarks](https://github.com/AbdelStark/jev-benchmarks), pre-registered, 2026-09-17, `jev-1.13.0`, 100 examples per task [I]:

    | Task | Accuracy | ECE | Coverage at ≤5% error |
    |---|---:|---:|---:|
    | AG News (4 labels) | 0.91 | 0.064 | 0.83 |
    | Banking77 (72 labels) | 0.87 | 0.054 | 0.86 |
    | DAIR Emotion (6 labels) | 0.48 | 0.351 | 0.00 |

    On emotion, Jev "assigned exactly zero probability to the true label on 16% of examples", and its "mean top-label confidence was 0.819".
  - [anisselbd/jev-phishing-bench](https://github.com/anisselbd/jev-phishing-bench), 2026-09-17, 2,000 emails, one verdict question [I]:
    - Accuracy 62.6% vs Claude Haiku 4.5's 81.3%. ECE 0.154 vs 0.097.
    - Five narrow signal questions asked in the same call reached 95.0% through a fitted regression, on a held-out half.
    - **Repeatability:** 2.2% label flips between two passes, mean absolute difference 0.017, max 0.15. 1.0% flips 12 h later.
  - TypeSafe's own repeat test: plurality labels repeated 90.8% of the time over 15 runs of 8 Choices. [V] [self-consistency cookbook](https://docs.typesafe.ai/cookbooks/consistency_choice_cookbook)
- **Structural invariants don't hold.** TypeSafe warns that a Noul and a yes/no Choice on the same question give different numbers (0.22 vs 0.01). A question and its negation summed to 1.19. "Don't carry a threshold tuned on a Noul over to a Choice." [V] [Jev 1.13 jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13)

### 2.3 Which number TypeSafe thresholds on

- **Confidence is the documented axis.** "The answer tells you what; confidence tells you whether to act." Example floors in the docs are 0.5 (Confidence page), 0.6 with 0.85 for a risky action (confidence-gated routing), 0.5 (intent routing), 0.3 (Choice page triage) and 0.9 (SIC cookbook). Each one is stated as domain-dependent: "start with conservative thresholds, test with your own data". [V] [Confidence](https://docs.typesafe.ai/confidence), [Confidence-gated routing](https://docs.typesafe.ai/patterns/confidence-routing), [Intent routing](https://docs.typesafe.ai/patterns/intent-routing)
- **Top probability is also used.** The self-consistency cookbook abstains when "the top probability is below 0.60" and says it "uses the returned probabilities, not the API's separate `confidence` field". [V] [self-consistency cookbook](https://docs.typesafe.ai/cookbooks/consistency_choice_cookbook)
- **Secondary probability shares.** The Choice page copies a ticket to a second team when that team's probability is above 0.25. [V] [Choice](https://docs.typesafe.ai/primitives/choice)
- **Pin the version.** Aliases move when a release ships, "so the answers behind it can change". "If you have tuned confidence thresholds against a specific version, pin that version's ID instead of the alias." [V] [Models](https://docs.typesafe.ai/models#aliases)

---

## 3. Options and questions

- **How many options.**
  - Up to 255 per Choice. [V] API reference
  - "A Choice works reliably up to roughly 240 options." [V] [classification cookbook](https://docs.typesafe.ai/cookbooks/classification_using_confidence)
  - "For the higher cardinality choices, we do a 2 stage-system … hence the occasional slowdown." The threshold is not stated. [V] launch post
  - Adding options "costs a few tokens each, so give the model the full list". [V] [Choice](https://docs.typesafe.ai/primitives/choice)
  - 15 options is well inside all of these.
- **Descriptions are allowed and recommended.** Each option's value can be a string, a JSON object (for example `what`, `not_for`, `examples`) or `null`. "Write descriptions that separate the options from each other." [V] [Choice](https://docs.typesafe.ai/primitives/choice), [Advanced: structure](https://docs.typesafe.ai/primitives/advanced)
- **A "none" option is normal.**
  - "Add an `other` or `none of the above` option when the list might not cover every input, so the model can say none of the others fit." [V] [Primitives](https://docs.typesafe.ai/primitives#choose-a-question-type), [Choice](https://docs.typesafe.ai/primitives/choice)
  - TypeSafe's agent skill: "Include a no-match outcome when nothing may fit; use a separate presence judgment when it is independently useful." [V] [SKILL.md](https://github.com/typesafe-ai/skills/blob/main/skills/typesafe-ai/SKILL.md)
  - The date-extraction cookbook adds `"none"` to every Choice. [V]
- **Without a "none".** MindStudio asked an off-topic question ("what time the cafeteria closed") against billing/technical/sales. It "correctly picked 'other'" when `other` was offered. Without it, Jev "picked 'sales' anyway, with a low confidence score of 0.31", which is a top probability of about 0.54 on 3 options (analysis). [I] [MindStudio, 2026-09-18](https://www.mindstudio.ai/blog/jev-system-one-model-classification)
- **A Noul gate next to a Choice is also documented.**
  - "A Choice over options and one Noul per option answer different questions: the Choice is relative, settling *which* option, while each Noul is absolute and can be low for all of them." [V] [jaggedness page](https://docs.typesafe.ai/model-jaggedness/jev-1.13)
  - The **skill-suggestion cookbook is the closest analogue to this router**. One request asks a Choice over 182 skills plus Nouls ("need a skill at all?"). A second request re-checks the top three and "is free to reject all of them". The winner is injected into the LLM's system prompt as one line.
  - Over 488 requests with Claude Haiku 4.5 it cut wrong-skill loads from 16.8% to 7.3%, and loads when nothing fits from 9.8% to 4.0%. [V] [Skill suggestion](https://docs.typesafe.ai/cookbooks/skill_suggestion)
- **Several questions really run in one call.**
  - "All three question types can be mixed in a single API call. Every question is evaluated in parallel and in isolation against the same state … Adding questions barely changes the response time." [V] [Introduction](https://docs.typesafe.ai/introduction)
  - Questions are independent: "one answer does not become context for another question". So the Noul gate cannot condition the Choice inside one call. [V] [Primitives](https://docs.typesafe.ai/primitives#when-one-question-depends-on-another)
  - Vendor measurement: 13 questions on one 53,777-character document took 0.27 s as one call, against 2.71 s as 13 calls (`jev-1.12`). [V] [Parallel questions](https://docs.typesafe.ai/cookbooks/parallel_questions)
  - Independently, the phishing bench asked 6 questions per call. [I]

---

## 4. Input and state

- **Shape.** `state` is a string, a JSON object or an array of text. "Use an object for most requests so each part of the state has a descriptive name." Chat logs are a listed use: "structured data (object/array) for things like chat logs". Point questions at parts with backticked paths, such as `` `messages[2].text` ``. [V] [State](https://docs.typesafe.ai/concepts/state), [API reference](https://docs.typesafe.ai/api), [Primitives](https://docs.typesafe.ai/primitives#reference-specific-fields)
- **Limits.** "64k tokens per request; 32k tokens for `state` plus the longest question." The 64k covers the state plus all questions. The Gateway catalog says the same. [V] [Models](https://docs.typesafe.ai/models), [P] Gateway `GET /v1/models`
- **Text only.** English is the primary language. "Other languages, including CJK scripts, are handled but not equally well." [V] [Models](https://docs.typesafe.ai/models#language-support)
- **Less state is better.**
  - "Accuracy falls as the state grows with content unrelated to the decision … Filter first; send only what the question needs." [V] [jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13#large-state-full-of-irrelevant-detail)
  - It also reads literally: "answers the question you wrote, not the one you meant". [V]
  - It is weak at indirection, such as a "tell me more about that one" that needs a hop back through history. "Reduce hops; point to the relevant state." [V] jaggedness
- **Adversarial text.** "State is data, and `jev-1.13` does not treat it as hostile by default … an injected instruction … can move the answer." [V] jaggedness. MindStudio's single injection test passed but "doesn't establish broad immunity". [I]
- **Fixed overhead.** Documented tiny requests (one short sentence, one Noul) report 275 to 307 input tokens. [V] API reference examples, [P] Gateway docs example. So a request has about 250 to 300 tokens of overhead before the state (analysis).
- **Estimate for this site (analysis).** Using roughly 4 characters per token:
  - the page block is about 1,200 tokens;
  - the last 3 turns are about 300;
  - 15 described options plus one Noul are about 400;
  - with the overhead, the total is about 2,000 tokens per call.
  - That is far under the 32k and 64k limits. How much page text belongs in `state` is an open question (see the end).

---

## 5. Latency

- **TypeSafe's claims (vendor).**
  - "End-to-end response time is 70ms-500ms for TypeSafe. This can range from 40x-200x faster for the same levels of frontier intelligence for System One shaped queries."
  - The homepage's "193.6x faster, 444.6x cheaper" comes from its own workflow evals: "we expect that these are on the higher end of real world gains … made by individuals on our model capabilities team, so some bias could exist."
  - "Our published evals are generally run from our laptops on the West Coast (this is where our service is currently based)."
  - [V] [launch post](https://typesafe.ai/blog/introducing-system-one-models-and-jev)
- **Regions.** TypeSafe documents none. There is no region parameter in the API, SDK or Gateway entry (Jev's catalog row has an empty `residencyRegions`). [V] docs, [P] Gateway catalog. The Gateway lists two providers for `typesafe-ai/jev`: TypeSafe AI and DigitalOcean. The public endpoints API shows only DigitalOcean. [P] [vercel.com/ai-gateway/models/jev](https://vercel.com/ai-gateway/models/jev), `ai-gateway.vercel.sh/v1/models/typesafe-ai/jev/endpoints`
- **Independent measurements.**

| Who | From | Path | Result | Source |
|---|---|---|---|---|
| AbdelStark, 2026-09-17 | France | direct, `jev-1.13.0` | p50 end-to-end **236–256 ms** across 3 tasks (4, 6 and 72 labels) | [I] [report](https://github.com/AbdelStark/jev-benchmarks/blob/main/results/reports/btzsc-pilot-v1.md) |
| anisselbd, 2026-09-17 | France | direct | p50 **239 ms**, of which the network floor to the host was 163 ms | [I] [README](https://github.com/anisselbd/jev-phishing-bench) |
| RahulBalakavi, 2026-09 | not stated | OpenRouter | p50 **231 ms**, p95 **459 ms**, mean 264 ms (90 calls) | [I] [README](https://github.com/RahulBalakavi/claude-code-jev) |
| MindStudio, 2026-09-18 | browser, not stated | direct | **92–214 ms** "reported model evaluation time … not end-to-end" (8 calls) | [I] [article](https://www.mindstudio.ai/blog/jev-system-one-model-classification) |
| MarkTechPost coding guide, 2026-09-23 | not stated | direct | 123 ms for one call. 245 ms for one call against 2,847 ms for ten sequential calls | [S] [article](https://www.marktechpost.com/2026/09/23/a-coding-guide-to-typesafe-ai-jev/) |

- **From a Vercel function.** Nobody has published a measurement from a Vercel function region. (unverified) New Vercel projects run in `iad1` (US East) by default. The region can be changed per project or per function (`vercel.json` `regions`, for example `sfo1`). Hobby allows a single region. [P] [Vercel regions](https://vercel.com/docs/functions/configuring-functions/region). Ticket 23 plans to measure from a preview function.
- **Timeouts and cancellation: a known crash.** The SDK's per-attempt timeout (or an abort signal) firing while the response body is arriving can **terminate the Node process** on Node 20 and 22 with an unhandled `AbortError`. It passes on Node 24.
  - A comment dated 2026-09-25 reproduces it with the SDK's own `timeout` through the Vercel Gateway base URL. The issue is open. [V] [typesafe-sdk-js #2](https://github.com/typesafe-ai/typesafe-sdk-js/issues/2)
  - Vercel's default Node is 24.x, 22.x and 20.x are available, and Node 20 is deprecated on 2026-10-01. [P] [Vercel Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
  - Also open: "Accepted timeouts above Node's timer maximum fire after about 1ms" (#8), and blank `Retry-After` causing immediate retries (#9). [V]
- **Latency incidents since launch.** "Elevated API latency and connection issues" on 2026-09-23 (resolved 20:56 UTC), and "Elevated API latency" (resolved 2026-09-24 07:18 UTC). [V] [status.typesafe.ai](https://status.typesafe.ai)
- **The baseline to beat.** GPT-4o's time from send to the `scroll_to` or `highlight_project` call is measured in *Warp or scroll* (ticket 17), not here.

---

## 6. Cost, rate limits, uptime, SLA

- **Price.** "Charged per input token. Output tokens are free." It is **$0.042 per million input tokens**, or $42 per billion. [V] [Models](https://docs.typesafe.ai/models). The Gateway charges the same ($0.000000042 per token, output 0) with "no markup". [P] Gateway `/v1/models`, [AI Gateway pricing](https://vercel.com/docs/ai-gateway/pricing)
  - The launch post: "We can't prove it isn't subsidized … (which we expect to go down, not up)." [V]
- **Per call at this size (analysis).** About 2,000 input tokens is about **$0.000084 per prompt**. 10,000 prompts is about $0.84.
  - An independent run measured 316,861 input tokens for 300 predictions, a lower bound of $0.0133. [I] AbdelStark
  - The Gateway docs' 275-token example cost $0.00001155. [P]
- **Rate limits.** "250,000 tokens per second / 1,200 requests per minute." Going over either returns `429`. [V] [Models](https://docs.typesafe.ai/models)
  - "**Rate limits are adjusting dynamically** … the limits above can change without notice." Higher limits come with custom and enterprise plans. [V]
  - Through the Gateway, free-tier limits are lower. Jev is not on the free tier (§1.3). [P]
- **Uptime.** The status page shows `api.typesafe.ai` at **99.826%** over 90 days (2026-06-30 to 2026-09-27), and tracks `console.typesafe.ai` separately. [V] [status.typesafe.ai](https://status.typesafe.ai)
  - Parsing the daily bars gives 25 API days with downtime, 210 minutes in total. The worst were 59 min (08-04) and 20 min (07-10).
  - Since launch: 5 min (09-17), 18 (09-20), 2 (09-21), 12 (09-23), 3 (09-24) and 5 (09-25), which is 45 minutes in 13 days (analysis).
  - Incidents: 09-20 "Console is unavailable"; 09-21 "API issues … intermittent downtime and system instability"; 09-23 the two latency incidents above.
  - The page starting on 2026-06-30 suggests the API was running before launch (analysis).
- **SLA: none published.**
  - The MCA has a "Service Warranty" that the Services "will perform materially as described in its Documentation". The remedy is correction, then termination with a refund of unused prepaid fees. [V] [MCA §9.1–9.2](https://typesafe.ai/legal/mca)
  - Liability is capped at the greater of 12 months of fees or **$50**. [V] MCA §12.2
  - Support is "commercially reasonable efforts" at support@typesafe.ai. [V] MCA §3
  - The Gateway's own daily uptime for the DigitalOcean endpoint read 99.9758% when fetched. [P] endpoints API

---

## 7. Terms and data

- **Which documents govern API use.** The **Master Customer Agreement** (updated 2026-09-23) plus the **DPA** (2026-04-24), the **Privacy Policy** (2025-11-19) and the **Acceptable Use Policy** (2026-09-23). The site's Terms of Use (2026-09-19) cover only the website and defer to "a separate agreement". [V] [MCA](https://typesafe.ai/legal/mca), [DPA](https://typesafe.ai/legal/data-processing), [Privacy](https://typesafe.ai/legal/privacy-policy), [AUP](https://typesafe.ai/legal/acceptable-use-policy), [Terms of use](https://typesafe.ai/legal/terms)
- **Commercial use on a public site is allowed.** The licence "includes the right to include the API into one or more software applications developed and operated by Customer for the benefit of Customer's end users". [V] MCA §2.2
- **Visitor prompts are "Input". What TypeSafe may do with them:**
  - Process them during the Term to provide the Services.
  - **"In perpetuity"**, use them "to derive and generate Telemetry, … to monitor for fraud and abuse …, and … to comply with applicable Laws". Telemetry "may [be] Process[ed] … without restriction". [V] MCA §4.1, §4.3
  - **No training:** TypeSafe "will not include Customer Data in a dataset used to train … any artificial intelligence or machine learning models without Customer's prior consent". The Privacy Policy says the same for Input. [V] MCA §4.1, [Privacy](https://typesafe.ai/legal/privacy-policy)
  - **No fixed retention period.** The DPA: "retained for as long as necessary taking into account the purpose of the Processing". The Privacy Policy: "as long as reasonably necessary … or otherwise in support of our business or commercial purposes". TypeSafe also "will be under no obligation to store or retain Customer Data and may delete [it] at any time". [V] DPA Schedule I §8, Privacy, MCA §10.3
  - **Zero data retention (ZDR)** is offered "for enterprise customers" only. [V] [Legal](https://docs.typesafe.ai/legal)
  - Hosted in the US; "Services are hosted in the United States". [V] Privacy. Subprocessors are listed at `trust.typesafe.ai/subprocessors` (not read). [V] DPA §3.1
- **ZDR through the Gateway: the sources conflict.** (unverified)
  - Vercel's 2026-09-16 changelog says "Jev supports Zero Data Retention and No Training, enabled per request".
  - The Gateway `GET /v1/models` entry says `"zdr": "none"`, `"no_training": "all"`, and the endpoints API says `has_zdr: false` for DigitalOcean.
  - The catalog page data says `"hasZdrProvider": true`.
  - Per-request ZDR is Pro and Enterprise only. [P] [AI Gateway pricing](https://vercel.com/docs/ai-gateway/pricing)
- **The customer's duty to visitors.** "Customer represents … that it has made all disclosures, has provided all notices, and has obtained … all rights, consents, and permissions necessary for TypeSafe to exercise the rights granted … (including … Input)." [V] MCA §5. Under the DPA, the site owner is the "controller" and TypeSafe the "processor". [V] DPA §1.1. The site has no privacy notice today (§0), and already sends prompts to OpenAI and, optionally, LangSmith. [P] repo
- **Constraints that touch a public repo.**
  - **Keys:** Access Credentials must be kept confidential. [V] MCA §2.4
  - **Documentation:** "Notwithstanding anything to the contrary, including Section 14.3 (Exclusions), TypeSafe's Confidential Information includes the Access Credentials, **Documentation**, Customer's Fees and all pricing information, the terms and conditions of this Agreement". [V] MCA §14.1
    - Read literally, copying TypeSafe's documentation text into the public repo (comments, ADRs) is a risk, even though the docs are public.
    - Question wording written for this site is not Documentation. (analysis)
  - **Breaking changes:** TypeSafe "may from time to time update the Services, and that such changes may result in the API's becoming incompatible", with "commercially reasonable efforts to provide advance notice". [V] MCA §2.5
- **One AUP clause to weigh.** Customers may not use the Services to "mislead others about whether content, including Output, was generated by AI". [V] AUP §1.4
  - The system prompt tells GPT-4o never to say it is an LLM ("Never break character … Don't mention OpenAI, models"). [P] `lib/ai/system-prompt.ts`
  - Jev's output here would be a destination, not text shown to visitors. Whether §1.4 reaches this setup is not something the sources settle. (analysis)

---

## 8. Fit with this stack

- **AI SDK v6 can send a custom data part before `streamText` output.** From Context7 (`/websites/ai-sdk_dev`, pages [Streaming custom data](https://ai-sdk.dev/docs/ai-sdk-ui/streaming-data) and [createUIMessageStream](https://ai-sdk.dev/docs/reference/ai-sdk-ui/create-ui-message-stream)), checked against the installed `ai@6.0.168` type definitions:
  - `createUIMessageStream({ execute: async ({ writer }) => { … } })`. `execute` may return a Promise.
  - `writer.write({ type: 'data-<name>', id?, data, transient? })` writes a custom part. `data-${string}` is a `UIMessageChunk` variant in 6.0.168.
  - `writer.merge(result.toUIMessageStream())` then appends `streamText`'s stream.
  - `createUIMessageStreamResponse({ stream })` returns the SSE `Response`, replacing `result.toUIMessageStreamResponse()`.
  - **`transient: true`** parts are "not added to message history" and reach the client only through `useChat({ onData })`. `onData` exists on `ChatInit` in 6.0.168.
  - Non-transient parts are added to `message.parts`. Writing again with the same `id` updates the part in place.
  - The docs' own example writes a data part before calling `streamText`, so a destination part can reach the client before the first text token. [P]
- **Where the Jev call would sit (analysis, a sketch of the documented APIs, not a design).**

  ```ts
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const pick = await askJev(state);          // bounded by a timeout; null on failure
      if (pick) writer.write({ type: 'data-destination', data: pick, transient: true });
      const result = streamText({ /* system prompt told the pick; nav tools removed */ });
      writer.merge(result.toUIMessageStream());
    },
  });
  return createUIMessageStreamResponse({ stream });
  ```

  On the client, `onData` would `emit("scrollTo" | "highlightProject")` on the existing tool-effect bus, where `onToolCall` does it today.
- **Which client works with `ai` 6.**
  - `@typesafe-ai/sdk` (direct, or pointed at the Gateway) works as is: Node ≥ 20, zero dependencies, called from the Node-runtime route. [P]
  - The AI SDK path (`experimental_evaluate` plus `@ai-sdk/typesafe-ai`) needs a major upgrade to `ai` 7 and **Node ≥ 22**. The provider depends on `@ai-sdk/provider` 4.x, and the repo has 3.x. [P] npm registry
  - Plain `fetch` to `POST /v1/systemone` is also documented. [V]
- **Runtime.** The route is `runtime = "nodejs"`. The SDK refuses browsers by default, and the key stays server-side. [P] repo, SDK source. The Node 20/22 cancellation crash (§5) matters if the route's Node version is below 24. [V] #2
- **Repo contracts.**
  - Removing GPT-4o's `scroll_to` and `highlight_project` changes what `onToolCall` sees. It also changes the `toolCalls` breadcrumbs stored in `jrz-chat-v1` (`ToolCall.name` union). AGENTS.md says to mutate that store only through `lib/chat/store.ts`. [P] repo
  - A `transient` data part leaves the stored message shape unchanged. [P] AI SDK docs
  - The LangSmith wrapper wraps `streamText` only. A Jev call beside it is not traced unless added. [P] repo
- **The ticket's two questions in API terms (analysis).** One request, two questions:
  - `on_page`: a Noul, "the visitor is asking about something shown on the page";
  - `destination`: a Choice over the 14 destinations, each with a description, plus `none`.
  - Both see the same `state`, for example `{ view, recent_turns: [...] }`. They are evaluated independently, so the Noul does not gate the Choice inside the call; code combines them.

---

## 9. Maturity

- **Age.** Announced 2026-09-15, which is 12 days before this research. TypeSafe was founded in 2024 and spent "two years in stealth". It raised a $40M seed led by DCVC. [V] launch post, [S] [Wikipedia](https://en.wikipedia.org/wiki/Jev_(AI_model)) citing Forbes and TechCrunch
  - TypeSafe has not published the architecture, weights or a paper. "Outside observers have suggested the model may be built on an open-weight LLM." [S] Wikipedia citing TechCrunch and The Register. TypeSafe's FAQ: "Jev is neither small nor an LLM." [V] launch post FAQ
- **Change so far.**
  - Model: `jev-1.12` (cookbooks, 2026-08) to `jev-1.13.0` (launch). No preview build exists. [V] [Models](https://docs.typesafe.ai/models)
  - Both SDKs shipped a breaking change on launch day: `Score.criteria` became an ordered list. [V] changelogs
  - Python broke again on 09-18 (a `msgspec` to `pydantic` switch). [V]
  - The JS SDK has had no release since 09-15. Its repo has 14 open items. Those relevant here: #2 (a cancellation crash on Node 20/22), #15 (the Cloudflare HTML 403 on `curl` text), #14 (the "API key is echoed into APIConnectionError"), #13 (untyped 402 and 413), #9 and #8 (retry and timer bugs). [V] [issues](https://github.com/typesafe-ai/typesafe-sdk-js/issues)
- **Operations.** Sign-ups were paused on 09-22 after six days of access (§1.3). Rate limits change "without notice" (§6). There were three incidents in the week before this research (§6).
- **Known weaknesses, in TypeSafe's words.** Literal reading, numbers and counting, dates, indirection, large irrelevant state, adversarial content, contradictory criteria, no structural invariants, no generation. "Last reviewed 2026-09-17." [V] [Jev 1.13 jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13)
- **The launch claims against independent tests.**

| Claim (TypeSafe) | What the claim rests on | Independent result |
|---|---|---|
| "70ms-500ms" end to end; "40x-200x faster"; "193.6x faster, 444.6x cheaper" | Its own four workflows, built by its capabilities team, run "from our laptops on the West Coast". It calls the numbers the "higher end of real world gains". [V] | p50 231–256 ms from France and through OpenRouter, and p95 459 ms. Of 239 ms from France, 163 ms is network. [I] Against LLMs: 239 ms vs Claude Haiku 4.5's 687 ms p50 on the same emails. [I] No independent test reproduces 40–200×. |
| "can't hallucinate"; "no type errors … mathematically impossible" | Schema conformance: "Our number is not empirical. Schema matching is guaranteed." [V] | Holds for format. The phishing bench had 0 format errors and 0 API errors in 2,000 calls, but Claude Haiku 4.5 with JSON output also had 0 format errors. [I] Correctness is separate: 62.6% accuracy on a single phishing verdict, and zero probability on the true label for 16% of emotion items. [I] The contract itself says output "may [be] inaccurate or erroneous". [V] |
| "Calibrated: higher confidence means higher accuracy" | RLCD. The SIC cookbook: 90% vs 40% accuracy split at confidence 0.9. [V] | ECE 0.054–0.064 on topic and intent tasks, 0.351 on emotion. [I] ECE 0.154 vs Haiku's 0.097 on phishing. [I] |
| "More consistent: returns similar answers for similar inputs" | 90.8% plurality repeat over 15 runs. [V] | 2.2% label flips between two passes; max probability move 0.15. [I] |

---

## Open questions for the verdict

These are for *Pick the destination router* (ticket 23). They are not answered here.

1. **Which number to threshold.** Confidence and the top probability are linear maps of each other for a fixed option list (§2.1). Does the warp/offer/stay split key on the Choice's confidence, on its top probability, on the Noul, or on a combination? Should it be tuned on the eval set with the model pinned to `jev-1.13.0`?
2. **A "none" option, a Noul gate, or both.** The documented patterns are a `none` option inside the Choice, a separate Noul, or both, as in the skill-suggestion cookbook. What is each prompt class in the eval set supposed to produce: "hi", "are you available?", follow-ups?
3. **What goes in `state`.**
   - How many recent turns to send.
   - Whether to send the `viewContext` section.
   - Whether the page description belongs in `state` or in the option descriptions.
   - TypeSafe warns that irrelevant state costs accuracy, and that multi-hop follow-ups are weak (§4).
4. **Before GPT-4o or alongside it.**
   - Before: GPT-4o is told the pick, and time to first token grows by Jev's round trip.
   - Alongside: the warp starts sooner, but GPT-4o doesn't know the pick.
   - Or a hybrid, where GPT-4o gets the pick only if Jev returns within the timeout.
5. **Timeout and fallback.**
   - The SDK's default is 10 s per attempt with 2 retries, far longer than a warp can wait.
   - What budget applies (for example a few hundred ms), with retries off?
   - Is the fallback "no warp" or GPT-4o's tools?
   - How is the Node 20/22 cancellation crash avoided (§5)? Node 24, plain `fetch`, or letting the call finish in the background?
6. **Region.** Keep the function in `iad1` (US East, the default) or move it toward TypeSafe's West Coast service? A move also shifts latency to OpenAI and Supabase, which are out of scope but affected. Measure from a preview function either way.
7. **Access route.**
   - Direct TypeSafe: sign-ups may still be paused.
   - The Vercel Gateway with the TypeSafe SDK: Jev is not on the free tier, and there are Hobby 403 reports.
   - OpenRouter: not checked at a primary source.
   - Each route has different key names, billing and retention terms.
8. **Terms.**
   - Does the site need a privacy notice before visitor prompts go to another processor (MCA §5)?
   - Is TypeSafe's retention, "as long as necessary" plus perpetual telemetry, acceptable?
   - Does AUP §1.4 matter given the in-character persona?
9. **Removing the navigation tools from GPT-4o.** What happens to the stored `toolCalls` breadcrumbs, and to the `jrz-chat-v1` contract?
10. **Failure-mode text.** Visitors pasting shell commands trigger Cloudflare's HTML 403 (#15). Is that just the "no warp" path?

## Unverified

- **The source of the ticket's "billing 0.84, confidence 0.596" example.** It is not found in TypeSafe's docs, launch post or homepage. It contradicts the documented formula (0.84 on 3 options gives 0.76) and the API's two-decimal rounding. An entropy measure reproduces about 0.594 (analysis).
- **The live `confidence` formula.** It comes from the docs' interactive component and fits 8 of 8 documented responses. TypeSafe does not state it in prose, and says it may offer other measures.
- **Whether sign-ups are still paused on 2026-09-27.** The console blocks scripted reads. The last secondary check was 2026-09-24.
- **The "$5 credit" on sign-up.** Only secondary sites state it.
- **ZDR and No Training through the Vercel Gateway.** The changelog says per-request ZDR is supported. The `/v1/models` entry and the endpoints API say no ZDR provider. The catalog page says there is one.
- **Whether the Gateway's Hobby-team 403s for Jev are fixed**, and whether they come from Jev's paid-only status.
- **Latency from a Vercel function**, in `iad1` or `sfo1`. No measurement exists. None of the independent latency numbers come from the US East.
- **Where TypeSafe serves from** beyond "the West Coast". The API is behind Cloudflare, and the Gateway also lists a DigitalOcean endpoint whose region is not stated.
- **OpenRouter's "Decisions API"** (`/api/alpha/decisions`, model `typesafe/jev-1.13`). Seen only in independent repos. OpenRouter's public model list shows only `typesafe/jev-router`.
- **The secondary claims I did not use:** "25x vs 200x" (contextstudios), the "~430 ms floor from Europe via OpenRouter" and a Tokyo-vs-West-Coast latency probe (its repo 404s).
- **Why TypeSafe's repeat-run cookbooks add a fresh `uid` field to each call.** It may be to avoid server-side caching, but TypeSafe does not say.
