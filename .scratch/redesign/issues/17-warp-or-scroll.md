# Warp or scroll

Type: prototype
Labels: wayfinder:prototype
Status: resolved
Blocked by: 16

## Question

When the agent sends the visitor to a section, does the page scroll there, or does the bot warp the visitor through space to it? For example, "tell me about Athena" fires `highlight_project('athena')`, which lives in Work.

**Janriz's idea** (2026-09-27): replace scrolling with a warp, so the robot looks as if it is taking the visitor through space to the section. The case studies push the other way. Their most repeated "avoid" is taking scroll away from the reader:

- the wheel hijack in Edolus and Hashgraph Ventures;
- US Avionix's stepper, where one gesture moves one scene;
- Trionn's scroll lock.

So the prototype compares three readings rather than assuming one. Build it on the page from *See the bot in the viewport*, with the same backdrop, and let a canned "tell me about Athena" reply fire the jump.

**Rough now, tuned later.** As with *See the bot in the viewport*, this is a rough call made before the concept and the site design. If the warp stays, its look (what streaks, the star field, the palette) and timing are tuned on the real site in its build ticket. The design may be shaped around the warp, not the other way round.

The three readings:

- **A — scroll.** A smooth scroll via ScrollSmoother, plus the existing highlight.
- **B — warp for jumps only.** Jumps are the agent's `scroll_to` and `highlight_project` tool effects, and maybe the nav links. The warp:
  - the bot leads;
  - the content stretches or streaks away over a star field;
  - the scroll position jumps at the peak, while the screen is covered;
  - the content slows into place at the target section.

  Wheel and touch still scroll natively for reading.
- **C — warp replaces scrolling.** Every change of section warps, wheel and touch included. This is the idea taken whole.

The warp keeps the standing constraints:

- text stays real HTML: DOM transforms over a canvas layer, never a canvas copy of the page;
- focus moves to the target section's heading;
- a reduced-motion branch (an instant jump or a crossfade) and a lighter mobile tier;
- it lasts about a second.

**How it's built**, following *3D route verdict*: generative 3D is code, and authored assets come from Blender.

- **The star field and streaks:** procedural three.js. GSAP tweens a single `speed` value, and the streak length, star density and camera push follow it.
- **The page:** real DOM, which GSAP moves with CSS transforms (scale and depth under perspective), blur and opacity. ScrollSmoother jumps to the target at the peak.
- **The bot:** the sample `.glb`, with GSAP flying it ahead towards the vanishing point.
- **One WebGL context** for the bot and the star field together. The bot's canvas widens to the full viewport only during the warp. Produx's "avoid" was one context per effect.
- **A tuning panel**, so Janriz can dial the feel himself: duration, streak length, blur, star density and the bot's lead.
- **The agent checks its own work** with an MP4 walkthrough (headless, GPU on, per *Capture setup*) and the frame cost per phase, as in *3D route verdict*. Janriz judges the feel in his own browser.

**Also measure one fact:** how long the current chat (`/api/chat`, GPT-4o) takes from send to the `scroll_to` or `highlight_project` tool call, over a few real questions. This is the baseline that *Pick the destination router* has to beat. That ticket decides whether GPT-4o's tools, a Jev router or an embeddings router picks the destination.

Janriz reacts. The answer says:

- A, B or C;
- whether "travel through space" is strong enough to shape the concept.

It feeds *Pick the creative concept*. If the warp stays, it also becomes a candidate for *Plan the signature moments*, and a place for the transition sound Janriz liked most in Edolus.

## Answer

Janriz picked **B, warp for jumps only**, on 2026-09-28, after six rounds: "Yep this is it. I like what we have now so far. B all the way." The prototype is [../prototypes/warp-or-scroll/](../prototypes/warp-or-scroll/README.md); run `serve.sh` there and open `http://127.0.0.1:4175/`. Its defaults are now his config.

**His config:**
- **Reading scrolls natively; jumps warp.** The agent's `scroll_to` and `highlight_project`, and the nav links, warp. Wheel and touch scroll the page for reading, and a hop of under 0.6 of a screen scrolls in every case.
- **Style: the wormhole journey.** Its five acts:
  1. launch: the boosters open, Pip flies one clean circle round the middle, and its fire becomes a ring that winds into a spark;
  2. swallow: a black hole bursts open in front of the page, and the page spirals into it;
  3. plunge: Pip dives in;
  4. transit: down the throat, past pieces of the page just left (Throat: Page);
  5. emerge: out of a white hole, from which the target pours into place.
- **Pieces: words** (lines on the light tier). Twist 1.
- **Journey: 7 s, kept tunable.** "We should still be able to tune the journey duration (wormhole) later tho." The build keeps the length as one setting, as the prototype's ⚙ Journey does (3–10 s, with every beat scaled to it), and tunes it on the real site.
- **Nav links warp.** Tier Auto: light on phones and touch. Wander lively, as in *See the bot in the viewport*.
- **Destination known: a router at 0.25 s.** His config plays the journey while the reply is still being written. Which router, or whether GPT-4o's tools stay, is *Pick the destination router*'s call; a comment there points here.
- The tunnel's and streaks' sliders (duration, streak length, page blur, star density, the bot's lead) don't touch the wormhole.

**Rules that come with it**, settled over the rounds:
- **Input.** The page is locked while a journey runs. Wheels, swipes and scroll keys are swallowed and don't hurry it; momentum still running at landing is swallowed too. A click, tap or Esc hurries it to the end at 4×.
- **Focus.** After a jump from the chat, focus stays in the input and a live region says where the page went. After a link or a key, focus moves to the target's heading.
- **Reduced motion** gets a crossfade, and the page stays real HTML throughout: its pieces are the page's own DOM, moved by transforms.

**Departures from this ticket's plan**, taken knowingly:
- "It lasts about a second" became about 7 s, since he wanted a journey that builds to "what was that??". It can be hurried, and the build could shorten it for the second and later jumps of a visit.
- "One WebGL context" became three during a journey: the space behind the page, a layer in front of it, and the bot. The build could merge them.

**Does travel through space shape the concept?** His reaction didn't say, and it wasn't asked outright. *Pick the creative concept* weighs it. The journey is a candidate for *Plan the signature moments* either way, and a place for the Edolus-style transition sound he liked.

**For the mascot and the build:**
- Pip here is a stand-in, remodelled in Blender from the sample bot (`bot-flight.blend`). What carries over to whichever mascot is chosen is the approach, since the journey needs it:
  - boosters built into the body (named hatches, pods, nozzle empties);
  - eyes that morph (O, ^ ^, > <, spirals);
  - squash and stretch on the whole body.
- Frame cost: 60 fps in every config on an Apple M5, with at most one frame over 20 ms per journey. A mid-range laptop is still unproven. The flight bot is 98 KB gzipped against 36 KB for the sample.
- The prototype README lists the known rough edges for the build.

## Comments

- 2026-09-28 — From Janriz while trying *See the bot in the viewport*: "I kinda want the bot to be animated around the warp as well." He asked how the warp works if surface A (the chat panel) is picked. Suggested for this prototype, to judge rather than assume:
  - **Desktop.** The panel stays open, still and legible, and only the page column warps. The bot:
    1. turns towards the page from its perch in the panel header;
    2. hops out across the panel's edge;
    3. leads into the vanishing point in the middle of the column;
    4. comes back out of the depth at the target, braking;
    5. turns to the highlighted card;
    6. returns to the perch while the reply streams.
  - **One canvas.** During the warp the canvas covers the whole viewport, above the panel. The star field is drawn only inside the column (scissor), and the bot can be drawn anywhere.
  - **Phones.** The sheet covers 74% of the screen, so it drops to a peek strip for the warp, and the reply streams in that strip.
  - **Focus.** It conflicts with "focus moves to the target section's heading": in A the visitor is typing in the panel. Suggested: for jumps from the chat, focus stays in the input and a live region announces the move; for nav-link jumps, focus goes to the heading.
- 2026-09-28 — *See the bot in the viewport* resolved, and Janriz leans towards B (speech bubble plus log). Its defaults are now B, direct travel and lively wander, so build on those. The suggested warp with B:
  1. the bubble folds into the bot at launch;
  2. the bot leads into the vanishing point;
  3. the page jumps at the peak;
  4. the bot comes out of the depth and parks beside the target (the Athena card);
  5. the bubble reopens there, and the reply streams next to what it's about.

  Nothing on screen has to stay still during the warp, so the one-canvas scissor from the A note isn't needed. The focus note still applies: the visitor may be typing in the bubble. On phones the bubble reopens under or over the bot, as it does in conversation. The bot may park on the card's text here, because the bubble talks about it; it moves off once the bubble closes.
- 2026-09-28 — Prototype built, waiting on Janriz's reaction: [../prototypes/warp-or-scroll/](../prototypes/warp-or-scroll/README.md). Run `serve.sh` there and open `http://127.0.0.1:4175/`. The bottom bar switches A, B and C. B is the default, and the ⚙ panel holds the tuning sliders (duration, streak length, blur, star density, the bot's lead, scroll smoothing).
  - **What's in it.** The page is *See the bot in the viewport* with surface B. The warp with B follows the comment above:
    1. the bubble folds into the bot;
    2. the bot turns its back and leads into the vanishing point;
    3. the page rushes past as the stars streak;
    4. the scroll jumps at the peak;
    5. the target arrives out of the depth;
    6. the bot comes back out of it, braking, and parks at the card's corner;
    7. the card lights up and the bubble reopens under it with the reply.

    One WebGL context draws both the bot and the stars, widened to the viewport only during a warp. The page stays real DOM. Focus follows the rule in the first comment: after a jump from the chat it stays in the input, and a live region says where the page went; after a link or a key it moves to the target. Reduced motion is a crossfade in B and C and an instant jump in A. Phones get the light tier. A hop of under 0.6 of a screen scrolls in every reading.
  - **Checked by the agent.** MP4 walkthroughs, headless with the GPU on: six desktop clips in `recording/motion/` (B's first visit with the Athena question, nav and reading, router timing, A, C by wheel, reduced motion) and two phone clips in `recording-mobile/motion/`. Frame cost, measured without screenshots (Apple M5, ANGLE Metal, dsf 2):
    - 60 fps in every phase of every reading, with no frame over 20 ms;
    - WebGL per frame is 0.6 ms parked and 2.0–2.4 ms mid-warp at 1440 px, 1.4 ms on the light tier and 0.5 ms at 390 px.

    An M5 proves nothing about a mid-range laptop, and the page's CSS scale and blur aren't in the WebGL timer, so the build still has to check the budget on one.
  - **The measured fact: send to jump tool, through `/api/chat`** (15 requests from this Mac via `next dev`; details in `prototypes/warp-or-scroll/latency/README.md`):
    - **≈ 1.7 s** (p50) when the model calls `highlight_project` or `scroll_to` in its first step. It did this for questions that name a project (Athena, Mercado).
    - **≈ 3.7 s** (p50; p90 4.7 s, max 6.2 s) when it runs `search_wiki` first and jumps only in the next step. It did this for section questions (projects, stack, where he worked, Tolstoy).
    - First text arrives at ≈ 3.9 s and ≈ 5.9 s respectively. "Is he available?" called no tool.
    - About 0.27 s of every request is the rate-limit and cost-cap checks before the stream starts.
  - **Two surprises from that run**, for *Pick the destination router*:
    - The chat model is `gpt-5.4` (`OPENAI_CHAT_MODEL` in `.env`), not GPT-4o. GPT-4o is only the route's fallback.
    - Locally, every `search_wiki` failed (24 of 24): the Supabase pooler rejected the database user as "tenant/user not found". So the model retried empty searches, and answers came from the page context. A working database would drop the retries, but a jump after a search still waits a full round trip.
  - The prototype's "Destination known" setting replays these timings: tool first 1.7 s (the default), search first 3.7 s, a router at 0.25 s, or canned. With the router timing, the warp plays while the reply is still being written.
- 2026-09-28 — Janriz's first reaction: the warp "feels thin or incomplete. It's like an effect that's just slapped onto the page. I want it to be fuller." He wants it "like a spiral. Like think of a 'tunnel' or like a 'warp drive'", and his other idea was that the elements actually "warp in", "like a blackhole or wormhole sucking in". Built as a second round in the same prototype ([README](../prototypes/warp-or-scroll/README.md)); the ✦ button in the bottom bar switches the style. In both new styles, the page itself is the effect: what's on screen comes apart into its words (GSAP SplitText; anything with a border or a picture moves whole), and the space is drawn behind the page, not over it. The text stays real HTML, moved by transforms.
  - **Tunnel** (now the default): the page streams past in a spiral, down a tunnel with walls towards a light at its end; the target comes out of the depth and assembles. About 1.35 s from click to parked.
  - **Wormhole**: the bot slips under the page and opens a black hole; the page spirals in, stretched towards the hole; the horizon swells over the screen at the peak; the target pours back out. About 1.7 s.
  - **Streaks**, the first take, stays for comparison. A Twist slider sets how far it spirals (0 gives a straight tunnel), and a Pieces setting chooses words, lines or blocks.
  - **Plausibility:** black-hole lensing at the pixel level, where text actually bends round the hole, isn't cheap with real text. It needs the page drawn into WebGL (the text stops being HTML) or an SVG displacement filter (costly, and poor in Safari). So it's done per piece: each word or card is sucked in along its own spiral and stretched towards the hole. It was not built at the pixel level.
  - **Checks:** 60 fps in every phase and style, including 390 px. Two frames over 20 ms, one each in two configs. WebGL takes 2.3–3.8 ms per frame mid-warp on the full tier, on an M5 (the same caveat as before). New MP4s: `recording/motion/07`–`12` and `recording-mobile/motion/03`–`04`, including a quarter-speed clip of each style.
  - Still waiting on Janriz's reaction, which now covers A, B or C, and which style (tunnel, wormhole, streaks, or tunnel for jumps with the wormhole saved for one moment).
- 2026-09-28 — Janriz's second reaction: "definitely like the wormhole more." Four notes on it:
  - the bot "sometimes goes behind the elements and can't be seen";
  - the wormhole's streaks feel "mid";
  - even at 2 s "it still feels short. I want it to be an experience, as if the user is literally being transported into so I don't mind it being longer";
  - it needs "an 'oomph' at the start … right now everything feels linear", and the bot should have "an actual animation to them, not just a turn".

  He also asked: "what if the user scrolls while the effect is ongoing. will the gesture fight with the animation?"

  The answer was yes, in B: nothing stopped native scrolling during a warp, so a wheel moved the page under the flying pieces and away from the target. C already ignored input during a jump.

  Built as a third round ([README](../prototypes/warp-or-scroll/README.md)):
  - **The wormhole is now a journey** of about 6 s (⚙ Journey, 3–10 s), and the default style. It has five acts, paced unevenly:
    1. **Launch:** the bot winds up while the page draws back, then casts. A black hole bursts open and a shockwave races over the page, knocking the words aside and revealing space.
    2. **Swallow:** after a held beat, the page turns about the hole and falls in, slowly and then all at once. The bot braces.
    3. **Plunge:** the bot looks back, grins and dives in, and the horizon swells.
    4. **Transit:** we fly down the wormhole's throat after the bot, which rolls and waves. The scroll jumps here.
    5. **Emerge:** a portal opens onto a white hole. The bot bursts out and lands with a hop, and the target pours out into place.
  - **No streaks.** The space is one shader with a lensed star field, an accretion disk of gas, and the throat's glowing gas.
  - **The bot is always in front.** The space has its own canvas behind the page, and the bot has its own canvas over everything.
  - **Scrolling during a warp:** the page is locked while a warp runs. A fresh gesture hurries the warp to its end: a click or tap, Esc, a scroll key, or a wheel or swipe after a pause. Momentum carrying on from before the warp is ignored, and momentum still running at landing is swallowed.
  - **Checks:**
    - 60 fps in every config, no frame over 20 ms.
    - WebGL per frame during the journey (on an M5, the same caveat as before):

      | Config | WebGL per frame |
      |---|---|
      | 1440 px and 1920 px | 2.6–4.0 ms |
      | Light tier | 1.8–2.0 ms |
      | 390 px | 2.4–3.1 ms |

      A baked noise texture cut the shader from 7–11 ms to about a quarter of that.
    - The scroll guard is checked end to end: momentum neither moves nor hurries the warp, a fresh wheel or a click hurries it, and the page scrolls again after landing.
    - New MP4s: `recording/motion/13`–`16` and `recording-mobile/motion/05`.
  - Still waiting on Janriz's pick of A, B or C. The style now leans wormhole. Open question for the build: is 6 s right on every jump, or only the first?
- 2026-09-28 — Janriz's third reaction: "play with perspectives. especially as we are flying, Pip can move backwards and forwards as if it's actual 3D space. right now he looks kinda goofy just moving around like a png across the page lol."
  - At the start, "he can be like 'swoosh' across the screen like circle around then settle at the center instead of just 'swipe' into place. He can take as much screen space as he needs."
  - "I'm thinking of making Pip have boosters so he'd actually look like he's flying. nevertheless i want everything to be fluid."
  - "it would be better to have the portal be at the front as well because sometimes it can't be seen" (his screenshot: the white hole behind the Mercado photo).
  - "make it look cool. imagine the user / visitor going 'wait woah what's happening.. wo- what.. woahhh. what's going onnn.. what the... holy.. what was that??'"

  Built as a fourth round ([README](../prototypes/warp-or-scroll/README.md)):
  - **Pip flies in 3D.** The eye is a camera in front of the screen, and Pip flies smooth paths through points in depth: he grows as he comes at us and shrinks into the distance, and is seen from the angle his place gives. In flight he leans into his motion like a drone, and looks where he goes; when he slows, he faces us. His look at rest is unchanged. Close passes make him as big as about 60% of the screen height.
  - **Boosters:** two pods pop out of his back and fold away on landing. With the thruster under his body, that's three jets with flames, nozzle glows and trails of fire.
  - **The journey is about 7.5 s**, written as an escalation:
    1. Ignition.
    2. A swoosh at the camera and a loop round the middle, which leaves a ring of fire.
    3. The ring winds into a spark and bursts into a black hole with a flash and a shake. The blast throws Pip back.
    4. Pip strains against the pull, facing us, while his exhaust curls into the hole and the page is swallowed.
    5. A glance, a grin, and a head-first dive.
    6. A close pass and a barrel roll down the throat.
    7. A white hole, a swoop past us, a braking landing, and the boosters folding away.
  - **The hole and the portal are in front of the page**, on a new canvas between the page and Pip, so they're never hidden behind a picture. The starfield stays behind the page.
  - **A camera** shakes, rolls and zooms the page, the space and Pip together.
  - **Checks:**
    - 60 fps in every config. One frame per config over 20 ms (24–27 ms), across six jumps, most likely at the start of a journey.
    - WebGL per frame while flying, on the M5: 4.3–6.2 ms at 1440, 3.7–4.9 ms at 1920, 2.4–3.0 ms on the light tier and 2.9–5.4 ms at 390 px. That's up from 2.6–4.0 ms, and this machine's timers are noisy (up to 2× between runs).
    - Regressions pass: tunnel, streaks, the chat, C, reduced motion, 390 px and the scroll guard (hurried by a wheel in 3.05 s, by a click in 3.56 s).
    - New MP4s: `recording/motion/17`–`20` and `recording-mobile/motion/06`.
  - Only the wormhole flies in 3D; the tunnel and streaks keep the flat bot.
  - Still waiting on Janriz's pick of A, B or C.
- 2026-09-28 — Janriz's fourth reaction: "definitely better." He asked what Blender models could add, and took three ideas: boosters built into the body, a face that reacts, and squash and stretch ("go for 1-3 for the bot model"). He wanted objects in the throat, if they're pieces of the page. And for the opening: "I think it's a bit too much, can we tone it down a notch like keep the circling to a minimum (like let's remove 1 spiral) and see how it looks".

  Built as a fifth round ([README](../prototypes/warp-or-scroll/README.md)):
  - **One circle.** The loop after the swoosh is a quarter turn instead of 1¼. His fire closes itself into a ring round the middle, which winds into the spark as before. The journey is about 7 s now. ⚙ Pip's loop (¼–1¼ turns) brings the old loop back to compare.
  - **The page in the throat:** 8–10 pieces of the section just left tumble past at different depths: its biggest words, a card or two, the photo. They keep off the side Pip flies past on, bar one that shoots past him as he rolls. ⚙ Throat: Page / Empty.
  - **Pip remodelled in Blender**, on a copy of the sample bot (`bot-flight.blend`; the verdict's `bot.blend` is untouched):
    - hatches on his back that flip open, pods that slide out of their bays and swing out on struts, with fins, stripes and nozzles whose throats glow with thrust;
    - eyes that morph into round Os, ^ ^, > < and spirals;
    - squash and stretch on the whole body, into the dive and in the landing, where he ends up dizzy.
    Still GSAP-driven: the model's shape keys are weights on the emote layer, as *3D route verdict* allows for deformation.
  - **Checks:**
    - 60 fps in every config, with one frame over 20 ms per journey or fewer, at its start (23–34 ms), as in the fourth round.
    - WebGL per frame during the wormhole: 3.4–4.8 ms at 1440, 3.2–5.4 ms at 1920, 1.7–2.1 ms on the light tier, 1.8–2.6 ms at 390 px. The throat's pieces sit within the noise.
    - Regressions pass: tunnel, streaks, the chat, C, reduced motion, the phone and the scroll guard.
    - The model is 94 KB gzipped, up from 36 KB, mostly the squash and stretch keys.
    - New MP4s: `recording/motion/21`–`23` (`23` is the old loop, to compare) and `recording-mobile/motion/07`.
  - Still waiting on Janriz's pick of A, B or C.
- 2026-09-28 — Janriz's fifth reaction:
  - "the circling to me looks erratic. I want it to be a clean circle, right now he does a lot of 'S' curves".
  - On Pip's back: "Looks like squiggly lines idk."
  - "at the very end of the warp I find that only the top element seem to fall into place (animate in), like when I warp to projects section on the word 'time' animates in the rest are already in place. Is this intended?"
  - "the user might scroll while the decision engine is running and by the time the effect runs the animation speeds up until the end -> can we remove speed up from the effect?"

  Built as a sixth round ([README](../prototypes/warp-or-scroll/README.md)):
  - **One clean circle.** Pip takes off up, spirals onto a circle round the middle, goes round it once and curls in to stop in front of it, his back to us.
    - The line never bends the other way. It is drawn as a circle on the screen, and depth only changes his size.
    - From eight parked spots on desktop and three on a phone, the old path bent back three or four times; the new one never does.
    - The arc of fire closing into the ring now runs on round the circle.
    - ⚙ Pip's loop is gone.
  - **Pip's back:** the squiggles were faults, not the design.
    - The left hatch swung into the body.
    - An open hatch had no underside, so from behind it showed as a thin line.
    - The dark bays sat so close to the body that it poked through them. Their glossy finish also mirrored the room's lights as white blotches.

    Both hatches now flip up and out as solid flaps, and the bays are matte and lifted clear.
  - **Not intended: a bug.** The target was measured while the camera had the page rolled and zoomed, so most of it counted as off screen: 11 pieces for Projects, some from the section left behind. It is measured as laid out now: 61 pieces, and the whole section pours out of the white hole.
  - **Janriz, on the same round:** "the 'Where I've worked' block doesn't animate at wrap end, but it does break when warp start". A second bug. The column is pinned with ScrollTrigger, and when the scroll jumped, the pin still held it where the scroll had left it: after a jump from below, off screen, so it wasn't taken apart and appeared in place a frame later. The pins are now brought up to the jump before measuring: About comes apart into 122 pieces, not 109. Checked from above and below, in the wormhole and the tunnel.
  - **Scrolling no longer speeds the journey up.** Wheels, swipes and scroll keys are swallowed while it runs; the page scrolls again once Pip lands. A deliberate click, tap or Esc still hurries it, so seven seconds is never a trap.
  - **Checks:**
    - Regressions pass: tunnel, streaks, the chat, C, reduced motion, the phone and the guard. A fresh wheel no longer hurries (7.15 s); a click (3.42 s) and Esc (3.12 s) do.
    - The wormhole holds 60 fps in every config, with one frame over 20 ms per config (22–26 ms).
    - The model is 98 KB gzipped (was 94 KB).
    - New MP4s: `recording/motion/24`–`26` and `recording-mobile/motion/08`.
  - Still waiting on Janriz's pick of A, B or C.
