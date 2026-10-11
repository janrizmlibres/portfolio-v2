# AI breakthroughs on the Work route: research findings

Ticket: [32 — Research the AI breakthroughs on the Work route](../issues/32-research-the-ai-breakthroughs.md) · researched 2026-09-29 · the facts and a proposed shortlist, not the storyboard (that is *Storyboard the voyage*, ticket 30).

## 1. Short answer

- **Claude Sonnet 5.5 checks out as the latest marker.** Anthropic dates it **2026-09-28**. It went out at 11:00 PDT, which was 02:00 on **2026-09-29 in Cebu**, so Janriz's date is right in his own time zone. With month-level labels ("Sept 2026"), the difference disappears.
- **Claude Opus 5.5 came six days earlier, on 2026-09-22.** It was the first model of the Claude 5.5 family, so "just after Opus 5.5" holds.
- **Project Glasswing was announced on 2026-04-07.** It is Anthropic's defensive-security initiative, not a model. It is built on the gated, invitation-only **Claude Mythos Preview**. It expanded on 2026-06-02.
- **There are two Fable releases:**
  - **Claude Fable 5, on 2026-06-09,** was the first Mythos-class model open to all customers. It was pulled for everyone on 2026-06-12 under a US export-control directive, and restored worldwide on 2026-07-01.
  - **Claude Fable 5.1 followed on 2026-09-01.**
  - Glasswing does come "before" Fable, as Janriz remembers it.
- **All 13 of round 4's markers check out to the month,** and each now has a day-exact date. Two of their names need to be more exact: "Claude 4" was Claude Opus 4 and Claude Sonnet 4, and "OpenAI o1" was o1-preview and o1-mini.
- **The 2025-11 → 2026-09 gap** is filled below. It is the densest stretch of the whole route: roughly 30 candidates in 10 months.
- **Proposed shortlist: 14 markers across the 13 quarters** from 2023-Q3 to 2026-Q3 (§3). Four of them are "built with": GPT-4o, MCP, GPT-4.1 and GPT-5.

## 2. Full table (newest first)

"Built with?" is marked only where `lib/content/*.ts` or round 4's `content.js` shows the use (§4.8). Confidence levels are defined in §5. The "why it changed what could be built" column is my analysis, based on the vendor's own claim for each row.

| Date | Name | What it is | Why it changed what could be built | Built with? | Source | Confidence |
|---|---|---|---|---|---|---|
| 2026-09-28 | Claude Sonnet 5.5 | The second Claude 5.5 model: a faster, cheaper partner to Opus 5.5 | 5.5-generation agentic coding at Sonnet's $2 / $10 price, 30%+ faster than Sonnet 5 | | [anthropic.com/claude-sonnet-5-5](https://www.anthropic.com/claude-sonnet-5-5); [Claude Platform release notes](https://platform.claude.com/docs/en/release-notes/overview) ("September 28, 2026") | High. In Cebu it was 09-29 (§4.1) |
| 2026-09-22 | Claude Opus 5.5 | The first Claude 5.5 model, for long-running agentic coding and knowledge work | Anthropic says it "performs at the level of Claude Fable 5.1 on most work", at 40% less than Opus 5, with 1M context by default | | [anthropic.com/claude-opus-5-5](https://www.anthropic.com/claude-opus-5-5); [release notes](https://platform.claude.com/docs/en/release-notes/overview) | High |
| 2026-09-22 | GPT-6 Sol and GPT-6 Luna | OpenAI's GPT-6 reasoning models, released in the API | GPT-6-generation reasoning through the ordinary Responses and Chat Completions APIs | | [OpenAI API changelog](https://developers.openai.com/api/docs/changelog) | High (API date) |
| 2026-09-10 | OpenAI Agents API (public beta) | A managed Codex harness. OpenAI runs the orchestration, context compaction and recovery | OpenAI now hosts the agent loop, as Anthropic's Managed Agents do | | [OpenAI API changelog](https://developers.openai.com/api/docs/changelog) | High |
| 2026-09-03 | GPT-6 Astra | OpenAI's "most capable model, built for the hardest end-to-end work" | The first GPT-6 model, and OpenAI's counterpart to the Fable/Mythos class | | [OpenAI API changelog](https://developers.openai.com/api/docs/changelog) | High (API date). ChatGPT's public release on 09-04 comes only from a [secondary source](https://en.wikipedia.org/wiki/GPT-6_Astra) |
| 2026-09-01 | Claude Fable 5.1 (with Claude Mythos 5.1) | The second Fable release | Same $10 / $50 price, but cache reads cut to $0.25 / MTok, far fewer false-positive refusals, and vulnerability discovery allowed | | [anthropic.com/claude-fable-and-mythos-5-1](https://www.anthropic.com/claude-fable-and-mythos-5-1) (the page says only "September 2026"); [release notes](https://platform.claude.com/docs/en/release-notes/overview) ("September 1, 2026"); [anthropic.com/claude/fable](https://www.anthropic.com/claude/fable) | High |
| 2026-08-19 | Computer use out of beta, plus the browser-use toolset | The Claude API's `computer_toolset_20260801` and `browser_toolset_20260801`. Agent Skills came out of beta the same day | Driving a computer or a browser became a stable API, not a beta | | [release notes](https://platform.claude.com/docs/en/release-notes/overview) | High |
| 2026-07-24 | Claude Opus 5 | A step change over Opus 4.8 | "Comes close to the frontier intelligence of Claude Fable 5 at half the price", with 1M context | | [anthropic.com/news/claude-opus-5](https://www.anthropic.com/news/claude-opus-5) | High |
| 2026-07-09 | GPT-5.6 (Sol, Terra, Luna) | OpenAI's three-tier GPT-5.6 family | Frontier, balanced and high-volume tiers in one generation | | [OpenAI API changelog](https://developers.openai.com/api/docs/changelog) | High (API date) |
| 2026-06-12 → 07-01 | Claude Fable 5 suspended, then restored | A US export-control directive barred foreign nationals. Anthropic disabled Fable 5 and Mythos 5 for all customers, then restored them worldwide on 07-01 behind a new classifier | A released frontier model was pulled by government order. Fable 5 was usable for 3 days, then gone for 19. The directive targeted foreign nationals, which includes Janriz | | [Statement, Jun 12](https://www.anthropic.com/news/fable-mythos-access); [Redeploying, Jun 30](https://www.anthropic.com/news/redeploying-fable-5); [release notes](https://platform.claude.com/docs/en/release-notes/overview) (July 1) | High |
| 2026-06-30 | Claude Sonnet 5 | "The most agentic Sonnet model yet" | Close to Opus 4.8 performance at $2 / $10 | | [anthropic.com/news/claude-sonnet-5](https://www.anthropic.com/news/claude-sonnet-5) | High |
| **2026-06-09** | **Claude Fable 5** (with Claude Mythos 5) | The first Mythos-class model open to all customers. Mythos 5, the same model with fewer safeguards, went only to Glasswing partners | The most capable model Anthropic had made generally available, for "ambitious, long-running, asynchronous work". Classifiers fall back to Opus 4.8 in high-risk areas | | [anthropic.com/news/claude-fable-5-mythos-5](https://www.anthropic.com/news/claude-fable-5-mythos-5); [release notes](https://platform.claude.com/docs/en/release-notes/overview) | High |
| 2026-05-28 | Claude Opus 4.8 | An Opus update | 1M context by default, and "dynamic workflows" in Claude Code for very large problems | | [anthropic.com/news/claude-opus-4-8](https://www.anthropic.com/news/claude-opus-4-8) | High |
| 2026-05-19 | Gemini 3.5 Flash (GA) and Managed Agents in the Gemini API | Google's model, plus hosted agents that include the Antigravity Agent | Google's version of hosted agents | | [Gemini API changelog](https://ai.google.dev/gemini-api/docs/changelog) | High |
| 2026-04-24 | GPT-5.5 | An OpenAI frontier model "for complex professional work" | OpenAI's flagship of the spring | | [OpenAI API changelog](https://developers.openai.com/api/docs/changelog) | High (API date). ChatGPT got it on 04-23, per a [secondary source](https://en.wikipedia.org/wiki/GPT-5.5) |
| 2026-04-24 | DeepSeek-V4 preview (V4-Pro, V4-Flash) | Open-weight models with a 1M context by default | 1M-context models with open weights | | [api-docs.deepseek.com/news/news260424](https://api-docs.deepseek.com/news/news260424/) | High |
| 2026-04-16 | Claude Opus 4.7 | An Opus update | Gains "on the most difficult" software-engineering tasks | | [anthropic.com/news/claude-opus-4-7](https://www.anthropic.com/news/claude-opus-4-7) | High |
| 2026-04-08 | Claude Managed Agents (public beta) | A harness Anthropic hosts, with sandboxing, built-in tools and streaming | Long-running cloud agents without writing your own harness | | [release notes](https://platform.claude.com/docs/en/release-notes/overview) ("April 8, 2026") | High |
| **2026-04-07** | **Project Glasswing** (with Claude Mythos Preview) | An Anthropic-led initiative that uses the gated Mythos Preview to find and fix vulnerabilities in critical software. It had 12 launch partners and $100M in credits, and expanded to about 150 more organisations on 06-02 | Showed a model finding zero-days in every major OS and browser, and set the gated-release pattern that Fable and Mythos 5 followed | | [anthropic.com/glasswing](https://www.anthropic.com/glasswing); [Mythos Preview's cyber capabilities](https://www.anthropic.com/research/mythos-preview); [release notes](https://platform.claude.com/docs/en/release-notes/overview) ("April 7, 2026"); [Expanding Project Glasswing](https://www.anthropic.com/news/expanding-project-glasswing) (Jun 2) | High |
| 2026-03-05 | GPT-5.4 | An OpenAI frontier model for professional work, with computer use and tool search built in | Computer use built into an OpenAI flagship | | [OpenAI API changelog](https://developers.openai.com/api/docs/changelog) | High |
| 2026-02-24 | GPT-5.3-Codex | OpenAI's agentic coding model, released to the Responses API | A stronger coding agent in Codex and the API | | [OpenAI API changelog](https://developers.openai.com/api/docs/changelog) | Medium. Announced 02-05 per a [secondary source](https://en.wikipedia.org/wiki/GPT-5.3-Codex) (§4.6) |
| 2026-02-17 | Claude Sonnet 4.6 | "Our most capable Sonnet model yet" | Gains across coding, computer use and long context at Sonnet's price | | [anthropic.com/news/claude-sonnet-4-6](https://www.anthropic.com/news/claude-sonnet-4-6) | High |
| 2026-02-05 | Claude Opus 4.6 | Opus with a 1M-token context (beta), and agent teams in Claude Code | Several agents working in parallel on one codebase, with a whole repo in context | | [anthropic.com/news/claude-opus-4-6](https://www.anthropic.com/news/claude-opus-4-6) | High |
| 2026-01-12 | Claude Cowork (research preview) | Claude Code's agent brought to non-coding work in Claude Desktop, first for Max on macOS. GA 2026-04-09 | Agentic work moved beyond the terminal | | Primary page now re-dated (§4.4). 01-12 per [Simon Willison](https://simonwillison.net/2026/jan/12/claude-cowork/) (secondary). GA per the [Claude Help Center release notes](https://support.claude.com/en/articles/12138966-release-notes) | Medium |
| 2025-12-11 | GPT-5.2 | An OpenAI GPT-5-family flagship | Incremental | | [OpenAI API changelog](https://developers.openai.com/api/docs/changelog) | High |
| 2025-12-09 | MCP joins the Agentic AI Foundation | Anthropic donated MCP to a new Linux Foundation fund co-founded with Block and OpenAI. goose and AGENTS.md were its other founding projects | MCP became vendor-neutral infrastructure | | [blog.modelcontextprotocol.io](https://blog.modelcontextprotocol.io/posts/2025-12-09-mcp-joins-agentic-ai-foundation/) | High |
| 2025-11-24 | Claude Opus 4.5 | An Opus update | "State-of-the-art on tests of real-world software engineering" | | [anthropic.com/news/claude-opus-4-5](https://www.anthropic.com/news/claude-opus-4-5) | High |
| 2025-11-18 | Gemini 3 (Gemini 3 Pro) and Google Antigravity | Google's next-generation model, plus an agentic development platform | Google's agent-first IDE | | [blog.google: Gemini 3](https://blog.google/products-and-platforms/products/gemini/gemini-3/) | High |
| 2025-11-13 | GPT-5.1 | An OpenAI GPT-5-family flagship | Incremental | | [OpenAI API changelog](https://developers.openai.com/api/docs/changelog) | High |
| 2025-10-16 | Agent Skills | "Folders that include instructions, scripts, and resources that Claude can load when needed". Published as an open standard on 2025-12-18 | Agent know-how became packaged and reusable | | [claude.com/blog/skills](https://claude.com/blog/skills); [release notes](https://platform.claude.com/docs/en/release-notes/overview) | High |
| 2025-10-06 | Sora 2 and Sora 2 Pro in the API | Video generation through the new `v1/videos` endpoint, launched at OpenAI DevDay | Generated video became an API call that a workflow could use | y (his Upwork UGC-ad workflow, Nov 2025, via Kie.ai) | [OpenAI API changelog](https://developers.openai.com/api/docs/changelog) ("Oct 6") | High (API date; the consumer launch date wasn't verified, since openai.com returned 403) |
| 2025-09-29 | Claude Sonnet 4.5 and the Claude Agent SDK | A Sonnet update, plus "the building blocks we use ourselves to make Claude Code" | Claude Code's agent loop became something you could build on | | [anthropic.com/news/claude-sonnet-4-5](https://www.anthropic.com/news/claude-sonnet-4-5) | High |
| 2025-09-19 | Grok 4 Fast | xAI's "cost-efficient reasoning model" | Frontier-level reasoning at a fraction of the token cost | y (the LogoLife crawler's enrichment stage) | [x.ai/news/grok-4-fast](https://x.ai/news/grok-4-fast) ("Sep 19, 2025") | High |
| 2025-08-07 | GPT-5 (`gpt-5`, `-mini`, `-nano`) | OpenAI's GPT-5 family in the API | A new flagship generation | y (Tolstoy; `gpt-5-mini` in LogoLife's crawler) | [OpenAI API changelog](https://developers.openai.com/api/docs/changelog) | High |
| 2025-05-22 | Claude Opus 4 and Claude Sonnet 4; Claude Code GA | The Claude 4 models, and Claude Code made generally available | Agentic coding left research preview | | [anthropic.com/news/claude-4](https://www.anthropic.com/news/claude-4) | High |
| 2025-04-16 | OpenAI o3, o4-mini and Codex CLI | New o-series reasoning models, and OpenAI's coding CLI | OpenAI's terminal coding agent | | [OpenAI API changelog](https://developers.openai.com/api/docs/changelog) | High |
| 2025-04-14 | GPT-4.1 (`gpt-4.1`, `-mini`, `-nano`) | "Improved instruction following, coding, and a larger context window (up to 1M tokens)" | A 1M context and more reliable instruction following in an OpenAI API model | y | [OpenAI API changelog](https://developers.openai.com/api/docs/changelog) | High |
| 2025-03-11 | OpenAI Responses API and Agents SDK | "A new API for creating and using agents and tools", plus an orchestration framework | OpenAI's agent primitives | | [OpenAI API changelog](https://developers.openai.com/api/docs/changelog) (March 2025) | High |
| 2025-02-24 | Claude 3.7 Sonnet and Claude Code | "The first hybrid reasoning model on the market", plus "a command line tool for agentic coding" (limited research preview) | The terminal coding agent appeared | | [anthropic.com/news/claude-3-7-sonnet](https://www.anthropic.com/news/claude-3-7-sonnet) | High |
| 2025-01-20 | DeepSeek-R1 | An open-source (MIT) reasoning model | Reasoning in open weights | | [api-docs.deepseek.com/news/news250120](https://api-docs.deepseek.com/news/news250120) | High |
| **2024-11-25** | **Model Context Protocol** | "A new standard for connecting AI assistants to the systems where data lives" | One protocol for plugging tools and data into any assistant | y | [anthropic.com/news/model-context-protocol](https://www.anthropic.com/news/model-context-protocol) | High |
| 2024-10-22 | Computer use (public beta) | Claude operating a computer, in public beta | Agents that use graphical interfaces | | [anthropic.com/news/3-5-models-and-computer-use](https://www.anthropic.com/news/3-5-models-and-computer-use) | High |
| 2024-09-12 | OpenAI o1-preview and o1-mini | Models "trained with reinforcement learning to perform complex reasoning" | The first reasoning models | | [OpenAI API changelog](https://developers.openai.com/api/docs/changelog) | High |
| 2024-08-06 | Structured Outputs | "Model outputs now reliably adhere to developer supplied JSON Schemas" | Reliable JSON for pipelines | y (the LogoLife crawler's extraction stage) | [OpenAI API changelog](https://developers.openai.com/api/docs/changelog) | High (§4.8) |
| 2024-07-23 | Llama 3.1 405B | "The first frontier-level open source AI model" | A frontier-level model in open weights | | [ai.meta.com/blog/meta-llama-3-1](https://ai.meta.com/blog/meta-llama-3-1/) | High |
| 2024-06-20 | Claude 3.5 Sonnet and Artifacts | Outperformed Claude 3 Opus "with the speed and cost of our mid-tier model". Artifacts added a side workspace for generated content | Top-tier results at mid-tier price | | [release notes](https://platform.claude.com/docs/en/release-notes/overview) ("June 20th, 2024"); [news post](https://www.anthropic.com/news/claude-3-5-sonnet) | Medium. The news page shows Jun 21 (§4.5) |
| **2024-05-13** | **GPT-4o** | "Our fastest and most affordable flagship model" | GPT-4-class at a price that suits production | y | [OpenAI API changelog](https://developers.openai.com/api/docs/changelog) | High |
| 2024-03-04 | Claude 3 (Haiku, Sonnet, Opus) | The Claude 3 family, in three tiers | Speed and cost tiers from one family; Opus led Anthropic's line-up | | [anthropic.com/news/claude-3-family](https://www.anthropic.com/news/claude-3-family) | High |
| 2024-02-15 | Gemini 1.5 Pro | "Up to 1 million tokens" of context | "The longest context window of any large-scale foundation model yet", per Google | | [blog.google: Gemini 1.5](https://blog.google/technology/ai/google-gemini-next-generation-model-february-2024/) | High |
| 2024-01-25 | OpenAI embedding v3 models | "Released embedding V3 models" (`text-embedding-3-small` / `-large`) | Cheaper, better embeddings for RAG | y (`-large` in the LogoLife crawler's dedup; `-small` places this site's sky) | [OpenAI API changelog](https://developers.openai.com/api/docs/changelog) (January 2024) | High (§4.8) |
| 2023-12-06 | Gemini 1.0 | Google's "most capable and general model", natively multimodal | Google entered the frontier | | [blog.google: Gemini](https://blog.google/technology/ai/google-gemini-ai/) | High |
| 2023-11-21 | Claude 2.1 | A 200K-token context and tool use (beta) | Whole documents in one prompt | | [anthropic.com/news/claude-2-1](https://www.anthropic.com/news/claude-2-1) | High |
| 2023-11-06 | GPT-4 Turbo and the Assistants API | Released at OpenAI's DevDay, alongside GPT-4 Turbo with Vision, DALL·E 3 in the API and text-to-speech | A cheaper GPT-4 plus an API for assistants | | [OpenAI API changelog](https://developers.openai.com/api/docs/changelog) | High |
| 2023-08-24 | Code Llama | Meta's open LLM for code | Open code models | | [ai.meta.com: Code Llama](https://ai.meta.com/blog/code-llama-large-language-model-coding/) | High |

## 3. Proposed shortlist (about one a quarter)

**The test for inclusion** (ticket 12): only breakthroughs that changed what he could build, about one a quarter, in plain text, with the ones he built with marked. Where a quarter had several candidates, a "built with" one won, then one Janriz named, then the one that most changed how software got built. The runners-up are listed so the storyboard can swap them.

| Quarter | Date | Marker (plain text) | Built with | Why this one | Runners-up |
|---|---|---|---|---|---|
| 2026-Q3 | 2026-09-28 | Claude Sonnet 5.5 | | The route's head, as Janriz asked. Verified | GPT-6 Astra (09-03), Claude Fable 5.1 (09-01), Claude Opus 5 (07-24) |
| 2026-Q3 | 2026-09-22 | Claude Opus 5.5 | | Named by Janriz. It is six days from Sonnet 5.5, so the two could share one marker, "Claude Opus 5.5 and Sonnet 5.5", as round 4 paired "Claude 3.7 Sonnet and Claude Code" | |
| 2026-Q2 | 2026-06-09 | Claude Fable 5 | | Named by Janriz ("felt like AGI at the time"). The suspension from 06-12 to 07-01 could be part of its scene | Claude Sonnet 5 (06-30), Claude Opus 4.8 (05-28) |
| 2026-Q2 | 2026-04-07 | Project Glasswing | | Named by Janriz. It is the moment the Mythos class appeared, two months before Fable | Claude Managed Agents (04-08), GPT-5.5 (04-24) |
| 2026-Q1 | 2026-02-05 | Claude Opus 4.6 | | 1M context and agent teams: parallel agents on one codebase | Claude Cowork (01-12), GPT-5.4 with built-in computer use (03-05) |
| 2025-Q4 | 2025-11-24 | Claude Opus 4.5 | | Kept from round 4 | Gemini 3 and Antigravity (11-18), MCP joins the Agentic AI Foundation (12-09), Agent Skills (10-16) |
| 2025-Q3 | 2025-08-07 | GPT-5 | ✓ | Built with | Claude Sonnet 4.5 and the Claude Agent SDK (09-29) |
| 2025-Q2 | 2025-04-14 | GPT-4.1 | ✓ | Built with | Claude Opus 4 and Sonnet 4, with Claude Code GA (05-22) |
| 2025-Q1 | 2025-02-24 | Claude 3.7 Sonnet and Claude Code | | The terminal coding agent appeared | DeepSeek-R1 (01-20), Responses API and Agents SDK (03-11) |
| 2024-Q4 | 2024-11-25 | Model Context Protocol | ✓ | Built with (Athena's MCP server) | Computer use (10-22) |
| 2024-Q3 | 2024-09-12 | OpenAI o1 | | The first reasoning models | Structured Outputs (08-06), Llama 3.1 405B (07-23) |
| 2024-Q2 | 2024-05-13 | GPT-4o | ✓ | Built with (Counselor Dashboard) | Claude 3.5 Sonnet (06-20) |
| 2024-Q1 | 2024-03-04 | Claude 3 | | Anthropic's first GPT-4-class family | Gemini 1.5 Pro's 1M context (02-15) |
| 2023-Q4 | 2023-11-06 | GPT-4 Turbo | | Kept from round 4. It came with the Assistants API | Claude 2.1 (11-21), Gemini 1.0 (12-06) |
| 2023-Q3 | none | | | The route starts on 2023-08. The only verified candidate, Code Llama (08-24), fails the test | |

**What changes from round 4:**
- **Added:** the four 2026 markers, plus Opus 5.5 at the head.
- **Dropped:** Claude 3.5 Sonnet, DeepSeek-R1, Claude 4 and Claude Sonnet 4.5. These were second markers in quarters that already had one, and all four are now runners-up.
- **Tightened names:** "OpenAI o1" can stay as the plain label; its exact release was o1-preview and o1-mini.

2026 carries four markers in two quarters. The acceleration is real: 2026 alone has about 25 rows in §2. It could be the scene's point rather than a thing to thin out.

## 4. Conflicts and unverifiable claims

1. **Sonnet 5.5's date: 09-28 or 09-29.**
   - Anthropic's page and the platform release notes both say September 28, 2026. The page gives no time of day.
   - TechCrunch stamped its story "11:00 AM PDT · September 28, 2026", and SiliconANGLE "14:00 EDT", which is the same instant. Both are secondary. That instant is 02:00 on September 29 in Cebu (UTC+8).
   - Janriz's date is therefore his local date, and the source's date is 09-28.
   - With month labels ("Sept 2026", as round 4 uses), nothing conflicts. If the route shows days, use 2026-09-28, the source's date.
2. **Fable is three events, not one.**
   - Claude Fable 5 came out on 2026-06-09. It was disabled for **all** customers on 2026-06-12, after a US directive that targeted foreign nationals, and restored worldwide on 2026-07-01.
   - Claude Fable 5.1 followed on 2026-09-01.
   - "Felt like AGI" is Janriz's own impression. Anthropic's Fable pages do not use the word "AGI". Quote it as his, never as a vendor claim.
   - A secondary source says OpenAI's president described GPT-6 Astra as possibly the arrival of AGI. That is unverified at a primary source.
3. **Glasswing is not a model.** The model behind it is Claude Mythos Preview. Access was invitation-only and limited to defensive security work, so no one outside the partners built with it. The first Mythos-class model anyone could use was Fable 5.
4. **Cowork's launch date rests on secondary sources.**
   - The first-party post ([claude.com/blog/cowork-research-preview](https://claude.com/blog/cowork-research-preview)) now shows "Aug 26, 2026" and describes a later version, so the page appears to have been rewritten.
   - 2026-01-12 comes from Simon Willison's dated first-impressions post and from InfoQ, both secondary.
   - The GA date, 2026-04-09, is first-party: the Claude Help Center release notes.
5. **Claude 3.5 Sonnet: 06-20 or 06-21.** The platform release notes say "June 20th, 2024". The news post shows "Jun 21, 2024". I used 06-20, the availability date.
6. **openai.com could not be read.**
   - Every announcement post and the Help Center release notes returned **HTTP 403**. I retried once with WebFetch, then with curl and a browser user agent.
   - So every OpenAI date here is the **API availability date** from OpenAI's own developer changelog, a first-party source.
   - ChatGPT-side dates rest only on Wikipedia:
     - GPT-5.5 in ChatGPT on 04-23;
     - GPT-5.3-Codex announced on 02-05;
     - GPT-6 Astra public on 09-04;
     - GPT-5.6's limited preview on 06-26;
     - a reported July 2026 incident of "unsanctioned cyberattacks by OpenAI agents".
   - None of these was used for a date in the table.
7. **Fable 5.1's announcement page gives only "September 2026".** The day, 2026-09-01, comes from the platform release notes and the claude.com Fable page.
8. **What "built with" can and can't show:**
   - **GPT-4o and MCP** are shown in `lib/content`: `professional-projects.ts` (the Counselor Dashboard uses "OpenAI (GPT-4o)"; Athena has "MCP"), `work-timeline.ts` and `profile.ts`.
   - **GPT-4.1 and GPT-5** are marked `built: true` only in round 4's `content.js`. Nothing in `lib/content` names them: it says only "OpenAI". Treat these two marks as Janriz's claim, to confirm with him. **Update, 2026-09-29:** Janriz has built with OpenAI models only at LogoLife. The two marks stand only if he used these models there. He also built with them at Tolstoy (Aug – Oct 2025), where the newest general-purpose OpenAI models were the GPT-5 family, so **GPT-5's mark is confirmed**. "Built with" means a model that powered an app he shipped, never a coding tool. **GPT-4.1's mark is confirmed too:** his resume (v7, as filed on his personal wiki) lists GPT-4.1 Nano/Mini alongside GPT-5 and GPT-5 Nano at Tolstoy. See ticket 32's Comments.
   - **Grok:** `lib/content` gives no version, but Janriz's crawler diagram (2026-09-29) names **Grok 4 Fast**, so it now has a row.
   - **The embedding v3 row is blank.** This site's own chat uses `text-embedding-3-small`, per `AGENTS.md`, but `lib/content` doesn't show it.
   - **The Structured Outputs row is blank.** The Data Maintenance Pipeline's "structured-output updates" run on Grok and OpenAI, and can't be tied to OpenAI's feature.
9. **Round 4's labels are right to the month.** Every one of its 13 months matched a primary source. Two names need to be more exact: "Claude 4" = Claude Opus 4 and Claude Sonnet 4, and "OpenAI o1" = o1-preview and o1-mini. I did not check the full o1 release.
10. **Aug to Oct 2023 is thin.** Code Llama (2023-08-24) is the only verified candidate. GPT-4 with vision (Sept 2023) was not checked, because openai.com was unreachable.
11. **Checked and left out:**
    - Gemini 4 and Gemini 3.5 Pro had not shipped as of today. Only secondary reports cover them.
    - Gemini 3.6, 3.7 and 3.8 Flash (07-21, 08-13, 09-02 in the [Gemini API changelog](https://ai.google.dev/gemini-api/docs/changelog)) and DeepSeek-V4-Pro GA (08-13) were left out as incremental.
12. **A summarizer error was caught.** WebFetch passes each page through a summarizing model. On the first pass it misdated two OpenAI changelog entries (the Responses API as 2026, and gpt-5.3-codex as Mar 3). I re-read those entries verbatim and corrected them. For Anthropic, I downloaded the release notes as raw Markdown and grepped the date headings myself. Benchmark numbers are left out because they came only through a summarizer.

## 5. Method

- **Sources, in order of trust:**
  - Vendor announcement posts (anthropic.com, claude.com, blog.google, ai.meta.com, the MCP blog, api-docs.deepseek.com);
  - vendor changelogs and release notes: the [Claude Platform release notes](https://platform.claude.com/docs/en/release-notes/overview) (read as raw Markdown), the [Claude Help Center release notes](https://support.claude.com/en/articles/12138966-release-notes), the [OpenAI API changelog](https://developers.openai.com/api/docs/changelog) and the [Gemini API changelog](https://ai.google.dev/gemini-api/docs/changelog);
  - secondary sources (Wikipedia, TechCrunch, SiliconANGLE, Simon Willison), used only to find leads, to get a time of day, or where no primary source could be read. Each use is marked in its row.
- **Confidence:**
  - **High:** a first-party source states the date.
  - **Medium:** two sources disagree, or the date rests on a secondary source.
  - **Low:** unverified. No row is Low.
- **No date was inferred.** Where a page gave only a month, the day comes from another first-party source, and both are cited.
- **"Why it changed what could be built"** is my one-line reading of the vendor's own claim. It is analysis, not a quote.
- **Repo sources for "built with?":** `lib/content/*.ts` and `.scratch/redesign/prototypes/deep-field-sky/content.js` (`MODELS`, `PROJECTS`, `ROLES`).
- **What I did not do:** sign up for anything, call any model API, or use a browser session. All reads were of public pages on 2026-09-29.

## 7. Update from Janriz (2026-09-29): LogoLife's crawler

Janriz shared the LogoLife crawler's pipeline, whose stages are:
1. Firecrawl search and crawl;
2. **extraction with OpenAI `gpt-5-mini`, using Structured Outputs;**
3. **deduplication with OpenAI `text-embedding-3-large`;**
4. **enrichment with xAI's Grok 4 Fast;**
5. a second dedup pass with the same embeddings;
6. storage in MongoDB Atlas.

At Tolstoy (Aug – Oct 2025) his apps ran on OpenAI's newest models, which were the GPT-5 family. "Built with" means a model or feature that powered an app he shipped. Coding tools don't count. It now stands on:
- GPT-4o;
- MCP;
- GPT-5;
- Structured Outputs;
- embedding v3;
- Grok 4 Fast;
- GPT-4.1, whose Nano and Mini ran at Tolstoy according to his resume;
- Sora 2, in his Upwork UGC-ad workflow (Nov 2025).

His earlier "only at LogoLife" was a slip he corrected: this site's own chat (GPT-4o) and his Upwork automations (GPT and Sora 2) count too.

**Effect on the shortlist.** Under §3's tie-break, where built-with wins its quarter, two quarters would change:
- 2024-Q1 would go to embedding v3 instead of Claude 3;
- 2024-Q3 would go to Structured Outputs instead of o1;
- 2025-Q4 would go to Sora 2 instead of Claude Opus 4.5.

Those are features rather than breakthroughs, so the tie-break may overweight them. *Storyboard the voyage* decides whether a built-with feature displaces a bigger breakthrough. 2025-Q3 keeps GPT-5, with Grok 4 Fast as a built-with runner-up.
