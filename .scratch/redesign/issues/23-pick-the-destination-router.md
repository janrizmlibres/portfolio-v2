# Pick the destination router

Type: prototype
Labels: wayfinder:prototype
Status: open
Blocked by: 17, 21, 22

## Question

What decides where the page goes? Three contenders:

- **Tools**, as today: GPT-4o's `scroll_to` and `highlight_project`.
- **Jev**: a router run on every prompt before GPT-4o writes. The facts are in *Jev as the destination router*.
- **Embeddings** (added by Janriz on 2026-09-27): a router that needs no new vendor. It embeds the prompt with the site's existing `text-embedding-3-small` (`lib/ai/embed.ts`), compares it with pre-computed embeddings of a short description of each destination, and moves the page only on a strong match.
  - It needs no sign-up and adds no new processor of visitor prompts, since OpenAI already receives them.
  - It will probably be weaker on follow-ups, so test two versions: the prompt alone, and the prompt plus the last turn.
  - It is also the fallback if *Get a Jev API key* finds both routes to a key closed.

The baseline timing is in *Warp or scroll*.

1. **Build an eval set** of about 30 realistic visitor prompts. The agent drafts it, and Janriz corrects the labels. It includes:
   - direct asks ("tell me about Athena");
   - vague asks;
   - follow-ups that need history ("tell me more about that one");
   - prompts that should not move the page at all ("hi", "are you available?").

   Each prompt is labelled with its destination, or "none".
2. **Run the set through each contender:**
   - **Tools:** the current `/api/chat`, recording the tool call it makes and the time from send to that call.
   - **Jev:** the Noul gate plus the Choice question, recording its picks, both numbers (per-option probability and confidence) and its latency. Skip it, and say so, if *Get a Jev API key* found no route to a key.
   - **Embeddings:** recording the top destination, its similarity, the gap to the runner-up, and the latency.

   Where possible, measure latency from a Vercel preview function as well as locally.
3. **Compare** accuracy, latency, and whether each router's score separates right picks from wrong ones well enough to set thresholds.

Janriz reacts. The answer is tools, Jev or embeddings. If it's a router (Jev or embeddings), the answer also settles:

- the wording of the options and their descriptions, and for Jev, the questions;
- the thresholds for warp, offer and stay, and which score they key on;
- the timeout, and falling back to no warp when the router is slow or down;
- whether the router runs before GPT-4o (the answer matches the page) or alongside it (a faster answer);
- removing the navigation tools from GPT-4o.

For Jev, the full list of what the answer must settle is "Open questions for the verdict" in [../research/jev-router.md](../research/jev-router.md). Facts from that research that shape the Jev run:

- **Thresholds.** Confidence is `(n × top − 1)/(n − 1)`, so thresholds depend on the option count. Tune them on the real option list with the model pinned (`jev-1.13.0`). About 2% of labels flip between identical runs, so run each prompt more than once.
- **"Stay".** A `none` option in the Choice, a Noul, or both. The Noul can't gate the Choice inside one call, because the questions run independently.
- **Accuracy is the open risk.** Independent tests range from 48% to 91% by task, and 62.6% against Claude Haiku 4.5's 81.3% on one test. "Can't hallucinate" means only that the answer fits the schema. This eval is the check.
- **Timeout.** The SDK's defaults (10 s, 2 retries) are far too slow for a warp, and a mid-response abort can crash Node 20/22. The timeout needs its own design, and the Vercel runtime needs pinning to Node 24.
- **Privacy notice.** TypeSafe keeps visitor prompts "as long as necessary", and its contract (MCA §5) makes the site owner responsible for telling visitors. The site has no privacy notice today. If Jev wins, the answer says where that notice lives.

Resolving this ticket writes the router ADR in `docs/adr/`.

## Comments

- 2026-09-28 — The baseline from *Warp or scroll* is measured. Send to the jump tool through `/api/chat` takes ≈ 1.7 s when the model calls it in its first step, and ≈ 3.7 s (max 6.2 s) when it searches the wiki first. The numbers and conditions are in that ticket's comment and in `prototypes/warp-or-scroll/latency/README.md`. Two facts change this ticket's framing:
  - The chat model is `gpt-5.4` (set in `.env`), not GPT-4o. Wherever this ticket says GPT-4o, read "the chat model".
  - Locally, `search_wiki` failed on every call (the Supabase pooler rejected the database user), so the tools baseline was measured with retries on empty searches. The eval's "Tools" run needs a working database first, or its timings carry the same confound.
- 2026-09-28 — *Warp or scroll* resolved: B. Janriz's config there has "Destination known" set to **a router at 0.25 s**, so the journey plays while the reply is still being written. That is the timing he picked the warp with, not a choice of router: this ticket still decides tools, Jev or embeddings. For comparison, the chat model's tools reach the jump at ≈ 1.7 s (tool first) or ≈ 3.7 s (search first), as measured there.
- 2026-09-28 — *Pick the creative concept* resolved. *Export the sky* restores database access first, so the tools baseline can be re-measured without empty-search retries once it's done. The concept also makes the chat stream feed the sky: the stars the agent reads light up. That doesn't change this ticket's question.
- 2026-09-29 — *Export the sky* resolved. The Supabase project had been paused and is back, so `search_wiki` returns real chunks again, locally and in production. The tools baseline can be re-measured without the empty-search confound. The wiki holds 95 chunks from May.
- 2026-09-29 — **From [Make every scroll a scene](29-make-every-scroll-a-scene.md)** (resolved): the warp now starts by pulling back out to the whole sky and waits there for the flare, 2–4 s in, before the light travel. So **the destination isn't needed until the flare**, and a router's 0.25 s head start matters much less than it did.
  - Each section sits in its own region of the sky, so the destination could also be read from where the explored stars lit up. That only tells sections apart, not single projects: most projects have one star or none ([research/scene-star-clusters.md](../research/scene-star-clusters.md)).
- 2026-10-01 — From [Plan the signature moments](13-plan-the-signature-moments.md) (resolved; ADR 0005): **the options are reading spots, not five sections.**
  - **The destinations:**
    - the hero, About and Work;
    - each company's gate: LogoLife, Tolstoy, Elinnov, the Yearbook;
    - Projects, Athena and the AI Web Crawler;
    - each personal project: Mercado, FlowStack, PulseVR;
    - Contact.

    The monoliths aren't destinations.
  - **`highlight_project` becomes the point.** Any subject warms for about 3 s and shows its label: a world, a moon, a gate, a crawler stage or a screenshot. After a warp, it plays on arrival.
  - Whichever router wins picks among these. Build the eval set's labels from this list.
