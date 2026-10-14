# AGENTS.md

> **For agentic workers (Claude Code, Codex, etc.) opening this repo.**

## Stack overview

- **Next.js 16.2.4** (App Router). This is NOT the Next.js you may have seen before — APIs and conventions differ from older versions. Read `node_modules/next/dist/docs/` before writing routing or server-component code; heed deprecation notices.
- React 19.2.4 + TypeScript 5
- Tailwind CSS v4 (`@theme` block in `app/globals.css`)
- **Animation: GSAP only.** Never reach for framer-motion, motion, react-spring, or CSS-only motion when GSAP is the right tool. Use `@gsap/react`'s `useGSAP` hook in client components. Plugins are registered once via `lib/gsap/register.ts`. Fetch GSAP API docs via context7 when in doubt — APIs evolve.
- **Vercel AI SDK v6** (`ai`, `@ai-sdk/openai`, `@ai-sdk/react`) for chat streaming. Note v6 API differs from older docs: `inputSchema` (not `parameters`), `stopWhen: stepCountIs(N)` (not `maxSteps`), `toUIMessageStreamResponse()` (not `toDataStreamResponse()`), `sendMessage({ text })` (not `append`), `chat.status` (not `isLoading`), `toolCall.input` (not `toolCall.args`). Use `DefaultChatTransport({ api: '/api/chat' })` to wire the client to the route handler.
- **OpenAI** GPT-4o for chat, `text-embedding-3-small` (1536d) for embeddings.
- **Drizzle ORM** + `postgres-js` driver against **Supabase Postgres + pgvector**. Use the **transaction-pooler endpoint (port 6543)** for serverless connections — and `prepare: false` on the postgres client. The `wiki_chunks` table is a snapshot of the last publish from the adjacent `llm-wiki` repo; its publisher was removed on 2026-08-31, so nothing writes to the table now.
- **Upstash Redis** + `@upstash/ratelimit` for per-IP rate limiting and a monthly cost cap. Both modules fail-open with `degraded: true` on Upstash error.

## Project structure

| Path | What lives here |
|---|---|
| `app/` | Next.js App Router routes (`page.tsx`, `layout.tsx`, `globals.css`, `api/chat/`) |
| `components/voyage/` | The voyage: the runway (the page's text in film order, server-rendered) and the film runtime's mount |
| `components/chat/` | The chat's client: the store's provider, and `useTychoChat` (the AI SDK's `useChat` on `/api/chat`, keeping the conversation in the store) |
| `components/bubble/` | Tycho and his bubble, the one conversation surface: the card on its leader line (`Bubble.tsx`), the log's sheet (`Log.tsx`), the reveal, the fold, the flat Tycho without 3D and his voice's link to his talking |
| `components/wake/` | The wake-up, every load's opening: the loader (under which the whole voyage loads, ADR 0018), Tycho's charge-up (a show of fixed length) and the `[ WAKE ME ]` button; its rules (the gate, the lock, the count) are `lib/wake/` |
| `components/routemap/` | The route map: every section's link (another section warps, Start replays) |
| `components/universe/` | The universe's fixed canvas behind the page: loads three.js lazily after first paint and fades the sky in |
| `components/sound/` | The sound toggle and the restore control (a stand-in look) |
| `components/scroll/` | `SmoothScroll` (ScrollSmoother over native scroll, plus deep links) |
| `components/effects/` | The chat's page effects: `scroll_to` warps to a section, `highlight_project` is the point (the page goes to a subject, `lib/voyage/subjects.ts`, and Tycho points at it). What a reply does, in order (stars lit, then its move), is `lib/chat/page-effects.ts` |
| `lib/content/` | Hand-authored display content (profile, projects, contact, and `voyage.ts`: every block of text the film writes in, and the roles in `ROLES`). NOT sourced from the wiki — display vs RAG is split. |
| `lib/chat/` | The conversation (localStorage-backed store), the log's exchanges, the bubble's exchange as plain state (`conversation.ts`: one question at a time, the reveal, the fold), sentences and their announcements, the reply's word units, Tycho's fixed lines, and the hooks other parts read: `answering.ts` (he's answering), `ask.ts` (ask him from the page), `talk.ts` (each moment of his talking, for his voice and the score) |
| `lib/ai/` | System prompt, tool definitions, OpenAI embed helper |
| `lib/rag/` | pgvector retrieval module |
| `lib/limits/` | Rate limit + cost cap modules |
| `lib/gsap/` | Plugin registration, `useTypewriter` |
| `lib/universe/` | The sky (plain three.js), its readiness, the visit's quality level (`tier.ts`) and its governor, and colour as light per region |
| `lib/audio/` | The sound engine on raw Web Audio: the score's stems and their mix, the instrument, one-shots, Tycho's suit radio, the toggle and the remembered mute. `stems.json` and `shots.json` are written by `pnpm audio:export` (`scripts/export-audio.ts`), which renders or takes the stems and one-shots, checks each loop's seam and writes content-hashed files to `public/audio/`. The score and one-shots are rendered by `scripts/audio/render/` (`--render score|shots`; its `fetch.py` fetches the sources, listed with their licences in `sources.json`). What's held decoded, and its budget, is `memory.ts` |
| `lib/film/` | The film engine, generic: camera path, word windows and modes, the manners that move rows, visual lines and letters, reading spots, text placement, the clock, the tier, and the runtime that plays the runway |
| `lib/voyage/` | The voyage itself: its script (blocks, scenes, times; plain data) and its 3D world and stage (loaded after first paint, every scene under the wake-up's loader through `loading.ts`), with the opening's bodies (`home.ts`: the ship in `ships.ts`, its models in `public/voyage/ship/`, and the sun; About's camera on the ship and its turn in `about.ts`), Work, home built job by job (`work.ts`: the plan, plain math: the relay by home, a quarter of the ring a company, the breakthroughs' calls; `work-camera.ts`: the camera, the relay's departure and the build; `relays.ts`: the relay, Work's intro, one model in `public/voyage/relay/`; `jump.ts`: its throw's streaks and flash; the ship building itself is `ships.ts`'s `revealBuilt`; `traffic.ts`: the drones, workers and breakthroughs' craft round home as it's built, one model in `public/voyage/craft/traffic.glb`), the finishes the hardware wears (`finish.ts`: metal on the relay, cloth on the ring ship), the lit material (`lit.ts`, PBR Neutral), and the warp's wormhole (`warp-hole.ts`, drawn in the sky's frame through its `overlay`), Tycho's fire (`warp-trail.ts`) and the section left behind tumbling down its throat (`warp-debris.ts`); the warp's beats are `lib/film/warp-plan.ts` and the journey `lib/film/warp.ts` |
| `lib/tycho/` | Tycho's rig (three.js, his own canvas), where he parks and flies (`think.ts`, `roam.ts`), the bubble's place (`card.ts`) and the warp's stage Tycho (`flight.ts`: a second rig in flight mode, flying 3D paths from `flight-path.ts`) |
| `lib/wake/` | The wake-up's rules: the gate (what each input does in each phase, and when the 3D gives way), the lock (what waits for the wake), the load's count (every milestone the button waits on) and `built.ts` (each later scene, and the warp, marking itself built) |
| `lib/scroll/` | Deep links under smooth scrolling |
| `lib/tool-effects/` | Typed event bus for chat → UI side effects |
| `db/` | Drizzle schema (`wiki_chunks`), migrations, client |
| `docs/design/` | Redesign prototype HTML — a reference, not a locked target |
| `tests/e2e/` | Playwright tests |
| `scripts/models/` | The voyage's hardware, built headless in Blender from Python: the station made real (`station.py`, home's ring ship, in pieces with each vertex's build time), the relay (`relay.py`), Work's traffic (`craft.py`, `hauler.py`, `pod.py`, `shuttle.py`, `crane.py`, `drone.py`, `worker.py`), and the crawler's pipeline (`pipeline.py`: each stage's ring fitted out for its work, its fixture, the report's bars, the mast's pieces), with their shared helpers (`shiplib.py`) and generated maps (`tex.py`). `build.sh station\|relay\|traffic\|pipeline` writes the compressed model into `public/voyage/` (ADR 0012, 0013, 0014, 0015) |
| `scripts/film/` | Measuring the film from the running dev server: `turns.mjs` (how fast the camera turns, from its live path, and every stretch over a limit) and `shots.mjs` (frames at given film times) |

## One page, and Tycho's bubble

There is one page: the voyage, with Tycho on the screen's edges. The conversation lives in his bubble (the current exchange) and its log (all of it), and is kept per browser in `localStorage` under `jrz-chat-v1`, which holds only the conversation.

- **Asking:** clicking Tycho, the keyboard's "Ask Tycho" button, or asking from the page (`askTycho` in `lib/chat/ask.ts`: a block's "Ask Tycho about …" button, a star, a chip) opens the bubble. One question at a time: while he answers, `lib/chat/answering.ts` says so and every way of asking waits.
- **The reveal** reads the reply as it streams and shows it at a brisk pace (`PACE` in `lib/chat/reveal.ts`, which his voice is timed to); a tap shows the rest.
- **The page moves first:** a reply's warp or point goes before he answers; while a move waits or a warp runs, the reply is held (`lib/chat/hold.ts`) and his bubble is put away until he lands (`away` in `lib/chat/conversation.ts`). A question asked from a star never moves the page: the stars light and he answers (`askTycho(q, { stay: true })`, and the server tells the model).
- **Following his talking:** `lib/chat/talk.ts` tells listeners each moment (asked, first word, each sentence opening, each word shown, hushed, done), synchronously, so sound can start in the asking gesture.

## Work: adding a company

Work builds home (`lib/voyage/work.ts`, ADR 0014): the relay by home is its intro and throws you back to August 2023,
where home is only its core, and the companies build it, a quarter of its ring each, oldest first. Adding a company is
adding its role to `ROLES` in `lib/content/voyage.ts` (newest first, with its dates, its lines and its stack) and any AI
breakthroughs from its time to `BREAKTHROUGHS`. Everything follows from the dates:
- **Its quarter** builds in its turn (`quartersOf`), while its words are read in the column; its stack hangs on leader
  lines from the parts of its quarter (`stackPoint` in `traffic.ts`). The ring has four quarters, one a company: a
  fifth company needs a ring of five (`scripts/models/station.py`), and `quartersOf` throws until it has one.
- **Its breakthroughs** come by after its build, those from its start to the next company's (`gapsOf`), each as a craft
  (`callsOf`): one he built with (`built`) docks at the hub, the rest pass close, never as the craft or the way before.
  Each card is pinned in the column, its leader following its craft.
- The script's times and the film's length change with it: regenerate `STORYBOARD` in `lib/voyage/script.test.ts`, and
  check `work-camera.test.ts` (the side lit from the side, each quarter turned to it, the turn rate) still passes.

## The film's camera: keeping it smooth

The camera is one path of keys (ADR 0003), and the film eases each value of a key on its own: the target, the
direction, the log of the distance. Keys that are each right can still jolt the camera between them. The rules this
has taught (ADR 0003's amendment of 2026-10-11 has the measurements):
- **A target that moves with the camera keeps its distance.** An eye that leaps ahead or falls back carries the camera
  on and back (the "bump" into a relay's barrel). Keep the eye one distance off and only turn it (`eye` in
  `lib/voyage/work-camera.ts`).
- **Shots that look from far apart are bridged** with `bridge(a, b)` (`lib/film/path.ts`), a great-circle turn.
  Otherwise the view whips round between them.
- **A stretch that takes over from another starts from where it was looking** (as `aboutHold` takes the dive's
  `target`). A key that snaps the aim is a jump cut.
- **Two subjects further apart than the frame is tall aren't joined by a turn**, which crosses empty sky. Move until
  the second is in frame beside the first (round home until Athena comes out past its rim), then fly to its shot
  (`travel` in `lib/film/path.ts`). Turn the eye while the camera's far from what it looks at, and never at the same
  time as an orbit: the turns add.
- **Curves are travelled by their length** (`byLength`), and come in at an angle, never from straight above where
  they end. Keys sit closer (0.02 screens) where the camera is close to hardware.
- **Don't chase a subject along its curve.** The camera that chased the record's flight to the old ribbon rose and fell
  with its arc, its view swinging from 57° up to 34° down and back (ADR 0016). Draw back to a shot that holds the
  subject's whole way, and let it move through the frame.
- **Measure it.** `node scripts/film/turns.mjs [from] [to] [--phone]` lists every stretch turning faster than 265° a
  screen. `voyage.spec.ts` holds the whole film under 270 (325 on a phone), and `work-camera.test.ts` holds Work's
  camera (ADR 0003).

## 3D models and sound: things that bit

- three's `GLTFLoader` writes a node name's spaces as underscores (`coil 0` is found as `coil_0`, `drone root` as
  `drone_root`).
- `gltf-transform optimize` merges identical materials and prunes empty nodes. Give each emitter that must light on its
  own a slightly different value, and keep anchor points in code (`stackPoint` in `traffic.ts`), not as empties.
- `gltf-transform optimize` leaves custom attributes (`_BUILD`) as floats, which compress badly; quantize them first
  (`build.sh station` does), and quantize before compressing: quantizing a compressed model drops its compression.
- A compressed model's node translations carry the quantization's offsets: place a piece from where it loads, or from
  the plan (`station.py`'s angles), never from its node's origin.
- Blender's separate-by-loose keeps every material slot on each piece: classify a piece by the materials its own faces
  use.
- Blender's join keeps only the active part's modifiers and applies them to the whole joined mesh; the other parts' own
  bevels and thicknesses are dropped. Apply each part's modifiers before joining (`join` in `pipeline.py`); `shiplib.py`'s
  `join` doesn't yet.
- Soft shadows on thin geometry read as noise: three samples a shadow radius of 3 with a noisy pattern, which smeared
  the station's lattice shadows into blotches. Use 1 there.
- Compare frame costs within one session. A GPU shared with another tab or job inflates every number.
- A one-shot no cue plays still counts in the sound budget, as held all along (`lib/audio/memory.ts`). When a sound's
  last cue goes, drop it from `scripts/audio/render/fx.py`, `lib/audio/shots.json` and `public/audio/fx/`.
  `pnpm audio:export --shots <dir> --add` adds or redoes just the one-shots in `<dir>`, keeping the rest.

## Display vs RAG content

- **Display** (Hero / About / Work / Projects / Contact) — hand-authored in `lib/content/*.ts`, played as the voyage's blocks. Never auto-generated. The agent does NOT render these sections.
- **RAG** (chat agent's knowledge) — sourced from the canonical wiki at `/Users/janlibs/dev/llm-wiki/`. The wiki published embedded chunks to `wiki_chunks` until its publisher was removed (2026-08-31), so the table is a snapshot of that last publish; portfolio reads it via `lib/rag/retrieve.ts`. The agent answers deeper questions than what's visible on the page — this is intentional.

## Decoupling principle

The wiki is unaware of consumers. A `metadata.routes.<consumer>` convention was planned for consumer-specific routing, but the publisher never wrote it: no chunk carries routes, and `search_wiki` returns none. Never hardcode portfolio-specific fields into the wiki's content.

## Conventions

- **Path alias:** `@/*` → repo root. Use it; relative `../../../` paths invite mistakes.
- **Server vs client components:** default server. Mark `"use client"` only when needed (state, refs, browser APIs, GSAP).
- **No framer-motion / motion.** All animation is GSAP. If you reach for one of those packages, stop and rewrite with GSAP.
- **The voyage is a film played by native scroll.** `<html data-film>` says how it plays (`film`, `still` under reduced motion, `plain` without WebGL), set by a head script before first paint (`lib/film/tier.ts`). In the film nothing scrolls by: each block's text is fixed in the frame and the film eases its own picture behind the scroll, so there's no ScrollSmoother; move through it with `lib/film/scroll.ts` (`jumpTo`, `glideTo`), and anything on the runway lands on its block's reading spot. Its stage is drawn by the film once a frame (`sky.setManual`), so text and picture share one camera.
- **Smooth scrolling (the plain page only):** there the page scrolls inside `SmoothScroll` (GSAP ScrollSmoother), whose content moves by transform. Anything `position: fixed` goes outside it, and `position: sticky` doesn't work inside it: pin with ScrollTrigger instead. Scroll programmatically through `ScrollSmoother.get()?.scrollTo(...)`.
- **3D loads after first paint, and all of it under the loader** (ADR 0018). three.js is only ever reached through the dynamic import in `components/universe/Universe.tsx`; never import `three` or `lib/universe/sky.ts` statically from page code. Every scene's models are fetched as the stage is made, through `voyageLoader()` (`lib/voyage/loading.ts`), decoded in workers and built, compiled, uploaded and warmed one job a turn (`inTurn`, `lib/film/turns.ts`; `warmInTurn`, `uploadTextures`), and each later scene, and the warp, marks itself built (`markBuilt`, `lib/wake/built.ts`): the wake button waits on every one (`MILESTONES`, `lib/wake/count.ts`), for 15 s of the loader at most (`CAP_S`): with the first scene in by then, whatever is still missing is built in its turn after the wake, never dropped and never the plain page's cause. `stage.whole`, and `data-stage="whole"` on the universe's container, say they're all in. Nothing loads, builds or compiles once the charge-up has begun: a new scene's assets go through `voyageLoader()` and the count too. `?perf` shows a frame readout that names what each late frame did (`lib/film/perf-hud.ts`), on any device, the deployed site included; `.scratch/redesign/research/motion/scroll.mjs` scrolls the film with it on.
- **The sky's resolution is governed.** `lib/universe/governor.ts` steps the sky's pixel ratio down while the GPU can't hold 60 fps (its timer query, or missed frames) and back up once it can, never below DPR 1. Anything drawn a set number of pixels wide reads `sky.px` or `renderer.getPixelRatio()` each frame, never a value kept from load; anything that copies the frame's own pixels holds the resolution meanwhile (`sky.holdScale`, as the warp does).
- **One quality level a visit** (`lib/universe/tier.ts`, ADR 0017): `high`, `mid` or `low`, and `DETAIL`, what each means (the sky's DPR cap and far galaxies, every shadow map's size, Tycho's canvas DPR and MSAA, the warp's stage Tycho's buffer, the warp's `lite`). Whatever costs differently by device reads `quality()` or `detail()`, and follows `onQuality` where it can change live; never test for a phone to save cost (whether it's a phone is a composition question: `isPort`, `isShort`). A visit starts from cheap signals (a phone starts at mid) and only steps down: the governor asks once the pixel ratio is at its floor and frames are still missed. A lower level loses sharpness and shadow fidelity, never composition, camera or timing; `high` is the laptop's film as tuned. `?quality=high|mid|low` forces a level and holds it, in development and automated browsers; `scripts/film/shots.mjs --query quality=…` and `.scratch/redesign/research/perf/audit.mjs --quality …` take it.
- **One AudioContext.** Every sound plays through the engine in `lib/audio/` (`currentSound()`); never create another context. The engine loads after first paint (a dynamic import of `lib/audio/client.ts`), and a sound starts only from a click, tap or key. Changing the score means re-running `pnpm audio:export`.
- **Retrieved chunks stay on the server.** The browser sees the `search_wiki` call but its output arrives as null, and the server re-runs those searches when the conversation is posted back (`lib/ai/withheld-retrieval.ts`), so the model still reads them. Never forward chunk text, titles, source paths or ids to the browser; anything new the browser needs from retrieval gets its own opaque field. The one that exists: each search's stars, sent just before its nulled output as a transient `data-stars` part holding star ids only (`lib/ai/star-ids.ts`; the chunk → star map `lib/sky/chunk-stars.json` is server-only), which the sky lights in place (`lib/chat/sky.ts`).
- **Don't bypass the chat-store.** The localStorage shape (`jrz-chat-v1`) is contract; mutate via `lib/chat/store.ts` only.
- **Content data is plain text:** no `*word*` markers or `<em>` tags in it. Italics are the CSS's (a block's `sub`, for one).
- **Don't add CAPTCHA, accounts, or server-side chat persistence** without checking the spec — those were explicitly deferred.
- **NDA work** in `lib/content/professional-projects.ts` stays at implementation-pattern level. No screenshots, no proprietary specifics. The "⊘ NDA" footer is intentional and must remain.

## SEO / GEO sync

The site's discoverability surface (search engines + LLM ingesters like GPTBot, ClaudeBot, PerplexityBot) is driven by a small set of files. **When site content changes, keep these in sync** — drift here is silent and only surfaces weeks later in stale LLM citations or missing rich results.

| If you change… | Also update |
|---|---|
| `lib/content/profile.ts` (bio, stack, location) | `public/llms.txt` — mirror new bio/stack lines. JSON-LD auto-syncs via `lib/seo/structured-data.ts`. |
| `lib/content/voyage.ts` (the voyage's words) | `public/llms.txt` if a fact in it changes (a role in `ROLES`, Athena's or the crawler's lines, a project line). `personSchema.worksFor` reads `ROLES[0]`, so the most recent role auto-syncs. |
| `lib/content/personal-projects.ts` (add/remove/rename) | `public/llms.txt` — add/remove the project entry. JSON-LD `ItemList` auto-syncs. **Slug change?** Anchor URL `#project-{slug}` changes too — check inbound links. |
| `lib/content/contact.ts` (new link) | `public/llms.txt`. JSON-LD `sameAs` auto-syncs. New external link? It needs `rel="me"` (already wired in `ContactSection.tsx`). |
| Site copy in `app/layout.tsx` `metadata.title`/`description` | `app/opengraph-image.tsx` (the rendered headline), `public/llms.txt` lede. |
| Add a new section to the voyage | Its blocks carry `sec: "sec-{name}"` in `lib/voyage/script.ts` (matches the `scroll_to` tool convention). Consider whether it deserves a `Person.knowsAbout` entry or a JSON-LD type. |
| Production domain change | Set `NEXT_PUBLIC_SITE_URL` on Vercel (or change `lib/seo/site.ts`'s default). The system prompt, the OG wordmark, robots, sitemap and JSON-LD read it. By hand: the comment in `public/wiki` and the redesign prototype in `docs/design/`. Resubmit sitemap to Search Console. |

**Files that should never need manual edits if the above is followed:**
- `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts` — derive from `siteUrl`
- `lib/seo/structured-data.ts` — derives from `lib/content/*`

**Verification after a sync:**
```bash
curl -s http://localhost:3000/robots.txt
curl -s http://localhost:3000/sitemap.xml
curl -s http://localhost:3000/llms.txt
curl -s http://localhost:3000 | grep 'application/ld+json'
```
Then paste the deployed URL into [Rich Results Test](https://search.google.com/test/rich-results) — should pick up `Person`, `WebSite`, `ItemList`.

**When NOT to expand SEO surface:**
- Don't add `WebSite.potentialAction` SearchAction — there's no `/search` route.
- Don't add per-project routes just for SEO; the chat-first single-page UX is the product. Anchors (`#project-{slug}`) are sufficient for LLM citation.
- Don't auto-generate `llms.txt` from `lib/content/*` — the curated voice and section ordering is intentional and matters for LLM extraction quality.

## Testing

- `pnpm test` — Vitest unit + integration. Cover retrieval ranking, chat-store, the bubble's conversation and reveal, rate-limit, cost-cap, typewriter.
- `pnpm test:e2e` — Playwright: the bubble (`bubble.spec.ts`, with the chat server stood in for; `bubble-flat.spec.ts` without WebGL); the wake-up (`wake.spec.ts`); the route map and the warp (`routemap.spec.ts`, `warp.spec.ts`); the sky lit from the chat (`sky-chat.spec.ts`); smooth scrolling and deep links; the voyage (`voyage.spec.ts`, including how fast its camera turns). The voyage's specs need a real GPU: they launch with ANGLE on Metal.
- `prefers-reduced-motion` is honored globally (CSS in `app/globals.css`) and per-component (typewriter, ambient bloom, autoscroll). When adding animation, also add the reduced-motion branch.

## When in doubt

- Redesign prototype: `docs/design/2026-09-27-redesign-prototype.html` — a reference for the redesign, not a locked target (open in a browser). Its colours, type, layout and chat bar/drawer are all still open, so don't build to it. Its design tokens are the CSS custom properties at the top of the file.
