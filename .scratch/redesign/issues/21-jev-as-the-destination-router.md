# Jev as the destination router

Type: research
Labels: wayfinder:research
Status: resolved
Blocked by: —

## Question

Can Jev, TypeSafe's "System One" model announced on 2026-09-15, work as the router that picks where the page goes, and what would it take? Facts with primary sources, not a verdict. The verdict is *Pick the destination router*.

**The idea** (Janriz, 2026-09-27): every prompt goes through Jev before GPT-4o writes, with two questions:

- a Noul question: "the visitor is asking about something shown on the page";
- a Choice question over the destinations: the `scroll_to` sections and the `highlight_project` slugs in `lib/ai/tools.ts`.

The confidence then decides between warping, offering, and staying. GPT-4o is told the pick, so its answer matches the page, and it loses its navigation tools.

Establish:

- **The API.**
  - Endpoints, request and response shapes, SDKs (TypeScript in particular), and auth.
  - How to sign up, whether there is a free tier, and what a key is called in its docs.
- **The numbers.** Choice returns a probability for each option **and** a separate confidence. In TypeSafe's own example, "billing" gets 0.84 while the confidence is 0.596. Find out:
  - what each number means and how it is calibrated;
  - which one fits a threshold.
- **Options.**
  - How many options a Choice question takes, and whether option descriptions are allowed.
  - Whether a "none" option is normal, or whether a Noul question should gate it.
  - Whether several questions really run in one call.
- **Input.**
  - How much state it takes (the last few chat turns, plus a page description).
  - Token limits, and how to format the state.
- **Latency.** Documented or measured by others, including from a Vercel function's region, and whether regions exist.
- **Cost and limits.** Price per call at this size, rate limits, uptime or status page, and SLA.
- **Terms.** Commercial use on a public site, data retention of visitor prompts, and anything that constrains this repo being public.
- **Fit with this stack.** How the route (`app/api/chat/`, Vercel AI SDK v6) can call Jev before `streamText`, and send the pick to the client first so the warp starts before the answer. Check with Context7 whether AI SDK v6 has custom data parts in UI message streams.
- **Maturity.** It is 12 days old: changelog, breaking changes, and known issues. Separate TypeSafe's own claims ("40–200× faster", "cannot hallucinate") from independent tests.

## Answer

Full findings and citations: [../research/jev-router.md](../research/jev-router.md). Facts, not a verdict: the verdict is *Pick the destination router*.

- **API & sign-up.**
  - There is one endpoint, `POST https://api.typesafe.ai/v1/systemone`, with a Bearer key. The body is `{ state, model, questions }` and the reply is `{ model, answers, usage }`. The model is `jev-1.13.0`; pin it rather than use `jev-latest`.
  - The TypeScript SDK is `@typesafe-ai/sdk` 0.6.0: Node ≥ 20, no dependencies, and it works with this repo's `ai` 6.
  - The AI SDK route (`experimental_evaluate` with `@ai-sdk/typesafe-ai`) needs `ai` 7 and Node ≥ 22.
  - The conventional key name is **`TYPESAFE_API_KEY`**. The AI SDK provider reads `TYPESAFE_AI_API_KEY`, and the Vercel Gateway path uses `AI_GATEWAY_API_KEY`.
  - Sign-up is at console.typesafe.ai. It opened to everyone on 2026-09-20 and was **paused on 2026-09-22** (TypeSafe's X posts). Whether it has reopened is unconfirmed.
  - Billing is prepaid credits. A "$5 credit" appears only in secondary sources.
  - Through the Vercel Gateway, the TypeSafe SDK works with only a base-URL change. But Jev is **not on the Gateway free tier**, and two Hobby teams report 403s.
- **The two numbers.**
  - `probabilities` is a distribution over the given options that sums to 1, rounded to 2 decimals.
  - `confidence` is derived from it: the docs' formula is `(n × top − 1)/(n − 1)`, and it fits all 8 documented answers. For a fixed option list, it is a linear rescale of the top probability, and it depends on the option count. With 15 options, confidence 0.6 means top ≈ 0.63.
  - The ticket's "0.84 → 0.596" is not in TypeSafe's docs. The docs' own 0.84 on 3 options reports 0.76.
  - TypeSafe thresholds confidence in its examples (0.3 to 0.9, "depends on your domain"), but one cookbook uses the top probability at 0.60 instead.
  - Independent calibration is mixed: ECE 0.05–0.06 on topic and intent tasks, 0.35 on emotion, 0.154 on phishing (Haiku 4.5: 0.097). About 2% of labels flip between identical runs.
- **Options & input.**
  - A Choice takes up to 255 options, each with a string or JSON description.
  - A `none` option is the documented default for "might not fit". A Noul next to the Choice is also documented; the skill-suggestion cookbook uses both, and it is the closest analogue to this router.
  - Without a `none`, an off-topic question was forced into a wrong bucket at confidence 0.31 (an independent test).
  - Several questions per call is real: they run in parallel and independently, so the Noul cannot gate the Choice inside one call.
  - `state` is text or JSON, up to 64k tokens per request (32k for state plus the longest question). Irrelevant state and multi-hop follow-ups cost accuracy.
  - This site's call would be about 2,000 tokens.
- **Latency & cost.**
  - TypeSafe claims 70–500 ms and serves from "the West Coast". It documents no regions.
  - Independent p50 is 231–256 ms (from France, 163 ms of it network, and through OpenRouter), with p95 459 ms.
  - There is no measurement from a Vercel function. New Vercel projects run in `iad1` (US East) by default.
  - The price is $0.042 per million input tokens, output free: about $0.00008 per prompt here.
  - Limits are 1,200 requests/min and 250k tokens/s, "adjusting dynamically … without notice".
  - The status page shows 99.826% over 90 days, and 45 minutes of API downtime since launch. There is no SLA; liability is capped at the greater of fees or $50.
- **Terms & data.**
  - Commercial use in a public app is allowed (MCA §2.2).
  - Visitor prompts are never used for training. They are kept "as long as necessary", and used in perpetuity for telemetry, abuse monitoring and legal compliance. Zero retention is enterprise-only.
  - The site owner must have given visitors notice (MCA §5), and the site has no privacy notice today.
  - The MCA marks TypeSafe's Documentation as confidential even though it is public, so don't copy doc text into this public repo.
  - AUP §1.4 bans misleading people about AI-generated content.
- **Stack fit.**
  - AI SDK v6 can write a custom data part before the model's output. Confirmed in Context7 and the installed `ai@6.0.168` types: `createUIMessageStream`, `writer.write({ type: 'data-…', transient: true })`, then `writer.merge(result.toUIMessageStream())` and `createUIMessageStreamResponse`. The client reads it in `useChat({ onData })` and can `emit()` on the existing bus.
  - Removing the nav tools changes the stored `toolCalls` breadcrumbs in `jrz-chat-v1`.
  - The SDK defaults to a 10 s timeout with 2 retries. An open issue shows its timeout or abort can crash Node 20/22; Node 24 is fine.
- **Maturity.**
  - Jev is 12 days old.
  - Both SDKs broke on launch day, and Python broke again on 09-18. The JS SDK has 14 open issues, including the Node crash and Cloudflare returning an HTML 403 when the text contains a `curl` command.
  - There were three incidents in the last week. Sign-ups paused.
  - "40–200×" rests on TypeSafe's own workflows, which it calls the "higher end". No independent test reproduces it.
  - "Can't hallucinate" means schema conformance only. Independent accuracy ran from 48% to 91% by task, and 62.6% on a single phishing verdict, against Haiku 4.5's 81.3%.

**Unverified:** where the 0.596 example comes from; whether sign-ups are still paused on 2026-09-27; the $5 credit; ZDR through the Gateway (the Vercel sources conflict); whether the Hobby 403s are fixed; any latency from a Vercel region; OpenRouter's Decisions API. The full list is in the research file's last section.
