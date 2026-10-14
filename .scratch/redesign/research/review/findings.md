# Pre-ship review findings (2026-10-13)

Five read-only reviewers, partitioned by area. Each item is `file:line` (line numbers may have drifted after the takes
removal; re-find by the named symbol), the defect, and the smallest fix. "Look" marks a change Janriz must see before
it ships; those are NOT in the fix waves.

Already fixed: Tycho's eyes left shut when an emote is cut off mid-blink (`lib/tycho/rig.ts`, `stop()` in the emote
runner; proven by `.scratch/redesign/research/eyes/repro.mjs`).

## Wave A1: server, AI, SEO, page weight (owner: server agent)

1. `lib/ai/withheld-retrieval.ts` restore only rewrites `tool-search_wiki` parts in `output-available`; a posted
   `dynamic-tool` named search_wiki, or `output-error` with errorText, reaches the model as a forged search result.
   Fix: match `isToolUIPart(part) && getToolName(part) === "search_wiki"` in any state, re-run, drop `dynamic-tool`.
2. `app/api/chat/route.ts` trusts the body: `role: "system"` messages and `providerMetadata` pass to the model. Fix:
   keep only user/assistant roles, only `text` parts plus the known tool parts, strip providerMetadata; 400 on a
   malformed body (also covers non-JSON and messages without `parts`, today a 500).
3. `route.ts` pastes `viewContext.label/sectionId/domId` unescaped into the system prompt. Fix: accept only a known
   `sec-*` id (and known domId), look the label up server-side.
4. `route.ts` records usage only in `onFinish`, which never runs when the client aborts. Fix: `result.consumeStream()`
   (not awaited) so onFinish always runs.
5. No caps on message count, part size, body size; concurrent requests all pass `hasBudget()`. Fix: keep the last ~20
   messages, cap each text part (~4k chars) and the body (413).
6. `withheld-retrieval.ts` runs one embedding + transaction per forged part in `Promise.all`. Fix: restore at most the
   last ~6 searches, deduped by query.
7. `lib/limits/rate-limit.ts`: @upstash/ratelimit's 5 s timeout resolves success with `reason: "timeout"` and no
   `degraded`. Fix: `degraded: r.reason === "timeout"`, `timeout: 1000`.
8. `db/client.ts` falls back to `postgres("")` when `SUPABASE_DB_URL` is missing. Fix: throw on first use.
9. `app/layout.tsx` render-blocking fontshare stylesheet in `<head>` (General Sans fallback only). Fix: delete it.
10. `app/layout.tsx` next/font preloads every family (~445 KB): Fraunces is dead (only `text-italic-accent`, whose
    only user `renderItalicMarkers` has no callers); JetBrains Mono used once. Fix: remove Fraunces, `preload: false`
    on JetBrains Mono and Newsreader italic.
11. `app/page.tsx` is `"use client"` only to call `registerGsapPlugins()`, which SmoothScroll already calls;
    `lib/gsap/register.ts` registers unused `Draggable`. Fix: page back to a server component; drop Draggable.
12. `next.config.ts` caches only `/audio`. Fix: `/voyage/:path*` and `/sky/:path*` get
    `public, max-age=86400, stale-while-revalidate=604800` (names aren't hashed, so not immutable).
13. `public/projects/**` PNGs (3.7 MB) never fetched (`ribbon.ts` loads `/voyage/ribbon/*.webp`, paths used as keys
    only). `public/voyage/gates/*` unreferenced. Fix: back up, delete, keep the key strings.
14. `lib/seo/structured-data.ts` `WebSite.description` is the old tagline "the chat is me". Fix: profile.siteDescription.
15. `lib/content/profile.ts` dead fields from the deleted state1/state2 UI (`taglineState2`, `headlineTypewriter`,
    `headlineSuffix`, `aboutItalicWords`, `aboutBody`, `currentlyStack`, `currentlyOpenTo`, `greetingName`,
    `portraitAlt`, `taglineState1` after 14). Delete.
16. `lib/content/italic.tsx` `renderItalicMarkers` no callers; dead CSS in `app/globals.css` (`.scrolled-to`,
    `animate-blink`, `animate-pulse-soft`, `container-prose`, `text-display`, `text-italic-accent`, phosphor tokens).
    Delete; fix AGENTS.md's italic-accents convention line.
17. `lib/content/work-timeline.ts`: only `[0].company` read. Fix: `personSchema.worksFor` reads `ROLES[0].company`
    from voyage.ts; delete work-timeline.ts. NOT the title drift with llms.txt (Janriz's call).
18. `lib/ai/tools.ts` / `lib/rag/retrieve.ts`: `portfolioRoute` always null, unused `type`/`tags` options,
    `source_path`/`tags`/`metadata` selected then dropped. Remove.
19. `app/layout.tsx` `icons.apple: "/profile.jpg"` overridden by `app/apple-icon.png`. Drop the `icons` config.

## Wave A2: Tycho and the chat (owner: tycho agent)

1. `lib/tycho/flight.ts` hides the corner Tycho during a warp but never `drawing(false)` on the corner rig: it renders
   shadowed MSAA frames under the warp. Fix: `currentRig()?.drawing(false)` in begin, `true` in end.
2. The stage rig (`flight.ts` creates it) runs 7 infinite idle tweens + blink loop forever while undrawn, and adds a
   `pointermove` listener with a layout read. Fix: no idle loops/blink/pointer listener when `stage`.
3. `rig.ts` `onPointer` reads `getBoundingClientRect` every pointermove. Fix: cache the rect once per frame in apply.
4. `rig.ts` `destroy` leaks the GLTF's geometries/materials/textures, the PMREM env target, the shadow map; a pending
   load's `ready.then` renders after destroy. Fix: `dead` flag; full dispose.
5. `lib/tycho/roam.ts` `hold` is one boolean shared by the warp and the point. Fix: a counter; `reset()` zeroes it.
6. `components/chat/use-tycho-chat.ts` `onFinish` with `isError` but no prior `onError` returns without
   `hold.arrive`: stuck in thinking. Fix: arrive with the error line.
7. `lib/chat/conversation.ts` `ask` resets `away`. Fix: keep `c.away`.
8. `conversation.ts` / `lib/chat/hold.ts` `arrive` can un-end. Fix: `ended: c.ended || ended`.
9. `useChat` re-renders Tycho + the whole Log per chunk/keystroke. Fix: `experimental_throttle: 50`; `memo(Log)` with
   stable callbacks; memoise parsed entries.
10. Reply parsed 2-4 times a frame. Fix: single-entry memo in `parseReply`.
11. `roam.ts` `obstacles()` walks every text node with getComputedStyle + Range rects 4-8×/s. Fix: per text element,
    and skip when nothing scrolled since the last think.
12. Rig sized only on window resize, but its CSS size flips with `.is-phone` after. Fix: ResizeObserver in the rig.
13. `components/effects/PointEffectHandler.tsx` cleanup leaves `whenParked`/`whenStill` ticker callbacks. Fix: track
    and remove them.
14. `lib/chat/page-effects.ts` `move()` queues under `stay`. Fix: `if (stay) return`.
15. Clean-up: `ChatStore.setMessages` + `useChatState.setMessages` dead; `ToolCall.resultPreview`, `ChatMessage.toolCalls`,
    role `"tool"` dead (readers ignore unknown fields, shape stays compatible); duplicated sentence splitter
    (`components/bubble/voice/engine.ts` vs `lib/chat/sentences.ts`); unused exports `countWords`, `WANDER_S`,
    `HOP_PX`, `MARGIN` (spots), `PageEffects` type; duplicated `announce` live-region helper (PointEffectHandler vs
    `lib/film/warp.ts`: put one in `lib/a11y/announce.ts` or similar, both import it); stray doc comment above
    `float()` in rig.ts; dated-quote comments.
16. Two tabs overwrite each other's conversation (`lib/chat/store.ts`): listen for `storage` on the key and re-read.

## Wave A3: wake, sound, route map (owner: wake agent)

1. `components/wake/WakeUp.tsx` stall deadline counts hidden-tab time: a background-opened tab drops to plain. Fix:
   count only frame time (`loadMs += min(dt, 0.1)` in watch); never stall when `data-universe` is ready.
2. Stall ignores which milestone is missing; slow audio download drops to plain. Fix: stall only on a 3D milestone;
   mark `sound` after a cap (~3 s after `warm`).
3. `lib/audio/engine.ts` `rewake()` returns before restoring the replay's dip when muted. Fix: ramp `dip.gain` to 1
   before the `!state.on` return.
4. `components/routemap/RouteMap.tsx` sets warp/dest before `warpTo()`, which silently refuses during another warp.
   Fix: `warpTo` (lib/film/warp.ts) returns whether it started; set them only then. (The film agent owns warp.ts:
   coordinate; A3 changes RouteMap, A4 changes warpTo's return.)
5. `engine.ts` show-again resumes only when state !== running; misses a pending suspend. Fix: always `void resume()`.
6. `engine.ts` "Sound stuck? Restore" flashes on wake/toggle while resume is pending. Fix: a `resuming` flag.
7. `engine.ts` `lastClock` survives suspension → Restore flash on return. Fix: null it when not running/hidden.
8. `WakeUp.tsx` `onUni()` finishing synchronously before listeners register leaks them. Fix: call it after listening.
9. `engine.ts` `holdScenes` no-ops while off; toggle-on doesn't re-run it. Fix: let-go always runs; call in setSound(true).
10. `WakeUp.tsx` wake before the audio client import resolves loses the gesture. Fix: import the client statically
    with the page script, or replay setSound(true) on arrival.
11. `components/sound/SoundToggle.tsx` import only after 1.5 s; an early click does nothing. Fix: import on
    pointerenter/focus too.
12. `RouteMap.tsx` Escape blurs whatever is focused. Fix: only if the map contains it.
13. `lib/wake/stage.ts` / `WakeUp.tsx` star canvas (10-49 MB) kept all visit. Fix: zero `.wk-stars`/`.wk-glow` size in
    `finish()` (replay redraws).
14. `SoundToggle.tsx` `getComputedStyle` every frame. Fix: read once per effect run.
15. `engine.ts` `push()` schedules automation while suspended. Fix: return when off/hidden; push on resume.
16. `RouteMap.tsx` tick runs under the wake loader; paints the pill map on desktop; allocates `arc()` per hovered frame.
    Fix: skip under `html.wake`; render the pill only on phone; recompute hoverWay on change.
17. `WakeUp.tsx` every resize while loading redraws the star canvas. Fix: ignore height-only changes under ~15%.
18. Clean-up: `engine.ts` `level()` dead; `charge(onProgress)` + chunked `fetchBytes` progress plumbing only a test
    reads; `DUCK` defaults duplicated (mix.ts vs engine.ts); `UI_SOUNDS` unused by callers (use it or drop it);
    `onTierChange` one-caller wrapper; `lib/wake/drawing.ts` "PROTOTYPE" header; dated-quote comments.
19. (Phones) `engine.ts` keeps decoded stems after sound off: optional, phones only, clear after the off-suspend.

## Wave A4: film engine, universe, scroll (owner: film agent)

1. `lib/universe/sky.ts` no `webglcontextlost`/`restored`: timer-query queue never drains after restore, `tq` stale; a
   never-restored context leaves a black picture. Fix: listeners; on loss clear queries, `perf.gpu = null`, ~3 s timer
   to `setTier("plain")`; on restore cancel and re-fetch `tq`.
2. `components/universe/Universe.tsx` leaks the sky and stage when stage setup throws/rejects. Fix: dispose in catch.
3. `lib/film/warp.ts` reduced-motion crossfade overlay is inside `#stills` (CSS opacity 0) and absolute: invisible.
   Fix: `position:fixed;inset:0;width:100vw;height:100lvh;opacity:1`.
4. `lib/film/runtime.ts` stills kept per block forever (hundreds of MB). Fix: keep the shown pair plus a neighbour.
5. `runtime.ts` every resize (phone toolbar) rebuilds the film. Fix: early return when width unchanged, screen
   unchanged, port/short unchanged. Same for `sky.ts` `resize()` (skip when w/h/dpr unchanged).
6. `lib/universe/governor.ts` without the timer query, a 30 fps cap (Low Power Mode, Energy Saver) counts every frame
   as missed: floor forever. Fix: judge missed frames against the measured cadence (median dt); allow one miss per
   window for a step up. Keep tests green; add cases.
7. `governor.ts` steps down without checking it helped. Fix: if the first judged window after a step isn't ~15%
   cheaper (GPU timer path only), step back and latch.
8. `warp.ts` flight never disposed; second `.then` runs after the sky went. Fix: guard; dispose on sky change.
9. Voyage finding moved here: `lib/voyage/stage.ts` `seek` updates the bodies before the sky applies this frame's pose
   (`sky.ts` applyPose inside render), so the still tier and Athena's culling use the previous frame's camera. Fix:
   expose a `sky.pose(p)` and call it in `seek` before `update(pos)`. (The voyage agent also edits stage.ts; keep edits
   small and re-read before editing.)
10. `warpTo` returns whether it started (for A3's RouteMap fix).
11. `sky.ts` `dispose()` doesn't bump `gen`: star flares fire after dispose. Fix: `gen++`.
12. `runtime.ts` `measureOrigin()` layout read every tick; `lib/film/here.ts` `filmT()` forces style+layout per scroll
    frame. Fix: measure on resize/fonts.ready/ResizeObserver; publish screen/origin for here.ts and scroll.ts.
13. Per-frame allocations: a new `gl.createQuery()` every frame (pool), `orbitPose` arrays, per-word string keys in
    runtime, SVG leader attributes rewritten when unchanged.
14. Clean-up: dead `!inPlace` sky chat path + `turnTo`, `setReduced`, `perf.cpu`, `perf.scale`, `mags`; `lib/film/pace.ts`
    + test dead; unused exports (`clockText`, `atHue`, `readingStretch`, `MANNERS` value, `SMOOTH_CONTENT_ID`);
    duplicated `clamp01`/`smooth` (one small module) and `filmT` (warp imports here.ts's); misplaced doc comments in
    `lib/film/place.ts`; dated-quote comments.
15. Stills/crossfade drawn at 1 CSS px per pixel (blurry under reduced motion): size by DPR capped at the sky's.
16. Warp keeps its first frame size through a rotation: `run?.hurry()` on resize.

## Wave A5: the voyage's scenes (owner: voyage agent)

1. `lib/voyage/traffic.ts` early return when traffic is off skips hiding docking craft (parented to the station): a
   docked craft shows through About/Projects after a jump. Fix: hide every docker before returning.
2. `lib/voyage/subjects.ts` company `ref: relay:${id}` resolves to nothing. Fix: `stack:${id}:0`.
3. `lib/voyage/pipeline.ts` `hostOf` toggles `transparent` without `needsUpdate`; a warm at vis=1 compiles OPAQUE. Fix:
   set `needsUpdate` on the toggle (as ribbon.ts does). Same pattern in crawler.ts.
4. `ships.ts` `stationAt` runs `outer.updateMatrixWorld()` up to ~300 times a frame through Work; per-frame
   `new Matrix4()` and vector allocations in traffic.ts. Fix: precompute stationM; scratch objects.
5. `lib/voyage/jump.ts` allocates two arrays per star per frame and re-uploads the colour buffer. Fix: write by index;
   fill colours once; drive opacity.
6. `relays.ts` / `traffic.ts` warm with an empty draw: textures upload on first appearance. Fix: a real warm (as
   athena.ts) or `initTexture` per map.
7. `ribbon.ts` screenshots 2-8 upload back to back as they arrive. Fix: each after `afterWake`/`idle`.
8. `pipeline.ts` mast/magazines `frustumCulled = false`. Fix: computeBoundingSphere, cull on.
9. `later.ts` second warm pass forces every shadow map on each of up to three renders in one idle task. Fix: force
   shadows only on the first render of the pass, or split the jobs.
10. Clean-up: the relay's beam (geometry/material/mesh/field, `CORE`, `MOUTH`; stage.ts sets `relay.beam = 0`) dead;
    `engrave.ts` + test, `text-occlusion.ts`, `occlude.ts` + test used only by tests; `hairlines.ts` dead uniforms/paths
    (`uEll`, `uEllK`, `uOcc2`, `uDraw`/`uHere`/`uGain`, `aE.z/w`, `cover()`); `lit.ts` `litMaterial` + its shaders and
    `LitOptions` (keep `KEY`); stale comments about the road, gates and monoliths; "42.45 screens" in stage.ts header;
    dated-quote comments.

## Wave B: device tiers (after A, one judgement agent; look-affecting parts shown to Janriz)

- One device tier decided once (`lib/universe/tier.ts` `pickTier`: coarse pointer or short side < 600, plus a weak-GPU
  signal), passed to the stage, the warp (replacing `warp.ts`'s own `phone()`), Tycho's rigs and the audio.
- Phone / low tier: 1024² shadow maps (ships.ts, athena.ts), Tycho's rig DPR ≤ 1.5 and 1024→512 shadow, no MSAA on
  the stage rig, governed by the sky's governor or its own frame budget.
- Static-light scenes: `shadowMap.autoUpdate = false` where the light and caster are still.
- Look: `lightBy` on crawler/pipeline/swarm/report materials (`lightBy(m, null)` is look-neutral; own star changes
  the look).
- Measure with `.scratch/redesign/research/perf/audit.mjs` before and after, plus CPU-throttled (4×/6×) phone runs.

## Janriz's calls (not in any wave)

- LogoLife's title: "Data / AI Engineer" (`work-timeline.ts`, `llms.txt`, `profile.ts`) vs "Full-Stack / AI Engineer"
  (`voyage.ts`, what the page shows); durations disagree too.
- The domain: system prompt says "jrz.dev"; `lib/seo/site.ts`, OG image and /wiki say `jrz-dev.vercel.app`.
- `llms.txt` doesn't list the work projects (Athena, the AI Web Crawler); Mercado's stack differs from the page's.
