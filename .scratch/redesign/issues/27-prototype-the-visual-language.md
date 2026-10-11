# Prototype the visual language

Type: prototype
Labels: wayfinder:prototype
Status: resolved
Blocked by: 12, 26

## Question

What does Deep Field look like? Build one throwaway page for Janriz to react to, using the real star data from *Export the sky*. It settles the look that *Pick the creative concept* left open:

- **Colour as light.** The direction is decided; this ticket gives it values.
  - Each stop on the voyage has its own tint of deep space (hero, About, Work, Projects, Contact), and the tints blend as scroll moves the camera.
  - Warmth appears only as energy (a star lighting up, the boosters, the wormhole's disc) and cools back down.
  - White marks what matters: text, the lit edges of the 3D pieces, the brightest stars.
  - Links, focus and buttons never depend on a colour, and they pass AA over every stop's light.
  - Don't lock in an accent. Janriz: "think like a designer for the theme and don't think of it as binary or a list of values".
- **Type.** The families, the scale, and how text sits over the world, in a calm text column the world arranges itself around. The font rules in the map's Notes bind the choice.
- **The hero.** The sky seen from outside, with his name in HTML. Do 93 stars read as a shape? Compare the PCA and UMAP layouts.
- **The stops at layout level:**
  - About as home;
  - Work as a newest-first route with model-release markers;
  - Projects as a world each;
  - Contact as a beacon.

  Their signature moments are *Plan the signature moments*' job.
- **The route map**, the navigation.
- **Phones** at 390 px.
- **The colour-fidelity rule for 3D.** Tone mapping shifts saturated colours: under AgX, the sample bot's `#FF5A1F` read salmon (*3D route verdict*). Possible rules are unlit or emissive-only accent materials, or a different tone mapping. The rule becomes an addendum to the 3D stack ADR (*Record the 3D stack ADR*).
- **Which prototype-derived content answers survive:** the "what I shipped" field, the retired copy keys, the title/subtitle split, the Mercado screenshot.

Use the stand-in bot and the speech bubble from *See the bot in the viewport*. The bot's look is *Model the mascot*'s, and the conversation surface is *Pick the AI entrypoint*'s.

Measure the world's frame cost at 1440 px and 390 px, with the usual caveat that an M5 proves nothing about a mid-range laptop.

Resolved when Janriz reacts. The answer is the visual language: its values, the type, the layouts and the fidelity rule. Terms that settle (for example, a word for a stop on the voyage) go into `CONTEXT.md`.

## Answer

Decided by Janriz on 2026-09-29, over four rounds of [`prototypes/deep-field-sky/`](../prototypes/deep-field-sky/README.md): `index.html` for the sky (rounds 1–3), `voyage.html` for the whole page (round 4), and `fidelity.html` for the 3D colour bench. Run `serve.sh` there and open http://127.0.0.1:4176/.

**The sky** (rounds 1–3; detail in the comments below):
- **93 stars read as a shape** from outside, so the concept holds.
- **Rendering: B+C.** Gas runs along the links between neighbours in meaning. Threads show only on hover and between the stars the agent read.
- **Layout: PCA.**
- **Lighting: Flare.** Each star the agent reads flares warm where it sits and cools to white, while the rest of the sky recedes and turns to face them.
- **Weak matches** are dimmer, so brightness follows similarity.
- **Far galaxies** are kept at the "clear" level: soft smudges, always dimmer than any real star. The build bakes them.
- **Size 1:** the sky takes as much of the screen as it can.
- **Hover labels and click-to-ask** work as built.
- **No telemetry line.**
- **Visitor words:**
  - a star is "something he's written down", and the verb is *explore* ("Exploring the sky…", "Explored 12 stars");
  - "passage", "wiki", "chunk" and "search" are never the visitor's words.

**Colour as light: round 4's values are the starting point, kept flexible.** Janriz: "I don't have any qualms with the colors so far. Just keep it flexible."
- Each stop has a tint of deep space, and a darker space colour beneath it. The tints keep about the same lightness and chroma while the hue walks, until the edge falls towards black. As OKLCH `[L, C, h]`, tint then space:

  | Stop | Tint | Space |
  |---|---|---|
  | hero, blue-violet | `[0.195, 0.061, 274]` | `[0.105, 0.016, 274]` |
  | About, plum | `[0.2, 0.055, 320]` | `[0.105, 0.014, 320]` |
  | Work, teal | `[0.2, 0.04, 210]` | `[0.1, 0.012, 210]` |
  | Projects, deep blue | `[0.195, 0.055, 256]` | `[0.1, 0.016, 256]` |
  | Contact, near-black | `[0.135, 0.03, 248]` | `[0.075, 0.01, 248]` |

  They blend in OKLab as the camera travels. The build tunes them, and they move to scenes once *Storyboard the voyage* sets the scenes.
- Warmth appears only as energy (a star lit, a world the agent points at, the beacon, the boosters) and cools back down.
- White is for what matters.
- Links, focus and buttons use white, weight, underline and outline, never colour.
- Contrast is measured, not assumed. Sample the rendered frame behind every visible text box and compare its brightest 2% with the ink (`checkContrast` in `voyage.js`).

**The 3D colour-fidelity rule, approved.** It goes into the 3D stack ADR (*Record the 3D stack ADR*).
- Lit surfaces use Khronos PBR Neutral tone mapping.
- Any colour that carries meaning (energy, the bot's eyes, a lit star) is drawn unlit and not tone mapped, and is written as a display value.

Measured on the stand-in bot and three swatches (ΔE in OKLab ×100):

| Set-up | ΔE |
|---|---|
| AgX | 8–11: `#ff5a1f` shows as `#d78264`, and white goes grey |
| Neutral | 3–4 |
| Neutral with meaningful colours unlit | 0 |

**Findings the build keeps:**
- **Contrast behind text.** A 3D piece behind text can drop small print to 1.7:1 on a phone. Every pose that shows text needs its own contrast check.
- **Frame cost.** The whole voyage cost 3.7–5.4 ms of GPU per stop (M5, dpr 2). Procedural surfaces must be baked once at load: live, Athena alone cost 9 ms.

**Round 4 was rejected as a direction**, and that reopened the page's shape. Janriz: it "feels more like a linear site / webpage that's slapped on top of a 3D background as a separate layer. It feels flat." He wants what Edolus does: "Every scroll is a transformation… Every scroll is a scene." It was built to this ticket's brief of a calm text column the world arranges itself around, which came from *Pick the creative concept*. So what round 4 asked moves on:
- **To [Make every scroll a scene](29-make-every-scroll-a-scene.md):**
  - how the page and the world relate;
  - how much text a scene carries, and where the rest lives;
  - the content answers (the "what I shipped" sentences, the title/subtitle split, screenshots, the portrait, the protocol marker).
- **To [Storyboard the voyage](30-storyboard-the-voyage.md):** the stops' shapes and every transition.
- **To [Finish one scene](31-finish-one-scene.md):**
  - the type, where round 4's Logbook, Plaque and Instrument systems and General Sans stay candidates;
  - the route map;
  - phones at 390 px.

Directions A, B and C are retired as directions.

**`CONTEXT.md`:** no terms settled here. The word for a stop or a scene belongs to *Make every scroll a scene*, which also revisits **Universe** ("behind the page") and **Voyage**.

## Comments

- 2026-09-28 — Janriz is taking *Export the sky* and then this ticket before *Plan the signature moments*, to validate the sky idea first. So the first round here shows **the sky on its own**, before any type or layout:
  - the hero's view from outside, in both layouts (PCA and UMAP);
  - the stars lit by a real question, using real retrieval once *Export the sky* has restored database access;
  - hover labels and click-to-ask, roughly.

  If the sky doesn't hold up, stop and take it back to *Pick the creative concept*'s core before designing the rest.
- 2026-09-29 — *Export the sky* resolved. The sky has **93 stars** (not 120–200), in `public/sky/stars-pca.json` and `public/sky/stars-umap.json`, with 44 topic keys. The legend mapping keys to pages is in that ticket's Answer, for rough hover labels. The database is back, so real retrieval works for lighting stars. Map retrieved chunk ids to stars with `lib/sky/chunk-stars.json`.
- 2026-09-29 — Claimed. **Round 1 is built: the sky on its own**, in [`prototypes/deep-field-sky/`](../prototypes/deep-field-sky/README.md). Run `.scratch/redesign/prototypes/deep-field-sky/serve.sh` and open http://127.0.0.1:4176/.
  - **What it shows.** It's the hero only: the real 93 stars, a placeholder name, and the stand-in bot and bubble.
    - Three renderings of the same stars (`?variant=`): **A Starlight** (points and diffraction spikes), **B Nebula** (gas filaments along the links between neighbours in meaning) and **C Threads** (hairlines to the two nearest neighbours, and a page's passages chained).
    - PCA ⇄ UMAP morphs the stars between the two layouts.
    - A faint deep field of far galaxies sits behind them.
  - **The lighting is real.** Asking runs today's agent: the same prompt, page context and tools, minus the limits. Each `search_wiki` result lights its stars as it arrives:
    - they flare warm, then cool to a brighter white;
    - the rest of the sky recedes;
    - the sky turns to face them.

    The browser receives star ids and similarities only.
  - **Hover and click.** Hover shows the topic label and passage count, and rings the page's other passages. Click asks about the topic. Tab and the arrow keys walk the stars.
  - **First values for colour as light** are in the prototype's README: the hero's blue-violet light, cool-white stars, warm energy, and violet and teal gas. Nothing is locked yet.
  - **Frame cost** (M5, headless, GPU on): every config held 60 fps.
    - A and C cost about 1.2 ms of GPU at 1440 px, B about 3.2 ms.
    - At 1920 px B peaks at a p95 of 8.9 ms while lit.
    - At 390 px everything is 0.5–1.5 ms.
  - **Timing, from the readout.** The agent's first search goes out at about 2.5–4 s, and the first stars light at about 3.5–5 s, before the reply's first words. That wait is the agent deciding to search, not the sky.
  - **Found: production retrieval is effectively off.**
    - `wiki_chunks`' `ivfflat` index has `lists=100` over 95 rows. At the default `probes=1`, 5 of 5 real questions got 0–1 rows back; with every list probed, each got 6 good hits.
    - The live agent answers from the page's display copy. *Export the sky*'s Answer says `search_wiki` "works again now"; it doesn't, for this reason.
    - The prototype probes every list, so its lighting shows the ranking production should give.
    - The fix is in the chat backend, out of this map's scope: dropping the index (an exact scan of 95 rows is instant) or setting `ivfflat.probes`. It's reported to Janriz, not fixed.
  - **For Janriz to react to:**
    1. Does the sky hold up as the hero from outside? If not, the concept goes back to *Pick the creative concept*.
    2. PCA or UMAP?
    3. A, B or C, or a mix (say B's gas with C's threads on hover)?
    4. The lighting: is the flare, the recede and the turn to face the stars too much or too little? And should stars light at all for weak hits? A thesis question also lit the thesis adviser; an Athena question lit AcceptedX, Tolstoy and early-career passages at similarities of 0.41–0.51.
    5. The far galaxies: keep or drop?
    6. Hover labels and click-to-ask: do they feel right?

  Type, the stops, the route map and the fidelity rule wait for this answer.
- 2026-09-29 — **Janriz's reaction to round 1, and round 2 built.**
  - **His answers:**
    - The rendering is **B's gas with C's threads**, where the threads show only on hover and between the stars the agent read.
    - **Keep the far galaxies.**
    - The hover labels and click-to-ask work for him.
    - He wasn't sure how much the lighting should do, so he asked for variations to compare.
    - He asked two questions, answered in the session:
      - The sky is the hero's picture, drawn as one canvas behind the real-HTML page. As he scrolls, the camera leaves it for the next stop.
      - PCA vs UMAP: PCA keeps the overall spread (one loose cloud), and UMAP keeps neighbours together (tight islands). The layout is still open.
  - **Round 2** (same folder, same URL):
    - B+C is the default rendering; round 1's three are under ⚙ Rendering.
    - The ‹ › switch now compares four lightings. Each lights exactly what the agent's searches returned:
      - **Flare:** each star flares warm in place and cools to white, the sky recedes and turns.
      - **Trace:** a spark leaves the bot and hops from star to star in reading order, and the path stays while the answer stands.
      - **Beam:** a beam from the bot to each star.
      - **Quiet:** the stars fade up to white with a ring, and nothing else moves.
    - A new setting, ⚙ Weak matches, makes weaker hits dimmer (the default), as bright, or not lit (below 80% of the best).
    - The bot looks at each star as it lights.
    - B+C holds 60 fps: 3.0 ms of GPU at 1440 px, 4.9 ms lit at 1920 px, 1.3 ms at 390 px (M5).
  - **Still to answer:** which lighting, PCA or UMAP, and what happens to weak matches. Then type, the stops, the route map and the fidelity rule.
- 2026-09-29 — **Janriz's second look, and round 3.**
  - **Decided:**
    - **PCA** ("the flare is more spread apart");
    - **weak matches dimmer** (brightness follows similarity);
    - the rendering stays B+C.
  - **Lighting: between Flare and Trace, he asked for help choosing.** Timed against real answers:
    - Flare lights each search's stars within 0.1 s of the result.
    - Trace's first star lights 0.6–0.75 s after the result, then about 0.35 s per hop, so about 2 s per six-star search. On "What did he study?", it was still lighting stars 0.6 s after the reply had finished.
    - The recommendation given was **Flare**:
      - it's honest about timing;
      - it reads at a glance, which matters if the lighting has to show where the sky is out of view;
      - it shows PCA's spread as scattered points instead of long crossing lines;
      - it leaves travel to the warp, so reading and travel don't use the same kind of motion.
    - The telemetry line now carries the order Trace showed. Waiting for his pick.
  - **The far galaxies** were effectively invisible: about 25 on screen, 1–4 px and very dim. There are now 24,000, about 500 on screen: soft, faint smudges, always dimmer than the faintest real star, with the odd small spiral. The levels are clear, faint and off. They cost about 1.5 ms of GPU at 1440 px drawn live, so the build should bake them into a cube map.
  - **From the case studies** (asked to look again), one addition: **US Avionix's telemetry line**.
    - It shows one mono line per real agent event: thinking, each search with its query, the passages read, the warp it would take, writing, answered.
    - Each line arrives warm and settles to white, like a star.
    - It fills the 2–4 s before the first stars light. It shows one line on phones, and it's `aria-hidden`, since the bubble is the accessible record.
    - The line shows the agent's own search query. The prompt already forbids confidential names in tool arguments visible to the visitor, and the build keeps it that way.
  - **Other case-study ideas, raised but not built here** (they belong to other tickets):
    - US Avionix's match cut, where a still of the sky paints first and the live render takes over in the same pose. That's the First visit fog.
    - US Avionix's tick-mark nav, for the route map round.
    - Accent-then-settle on the reply's own words, for the reply reveal.
    - Edolus's hotspot with an x-ray, or Hashgraph's object that opens round the pointer, for the bot. That's *Model the mascot* and *Pick the AI entrypoint*.
    - Edolus's adaptive DPR, for the build.
  - **He asked how the lighting relates to the warp.** They answer different things:
    - the lighting shows what the agent read, on every question that searches;
    - the warp is where it takes you, on questions with a destination and on nav links, from anywhere, the hero included.

    They collide on a question like "Tell me about Athena": the warp starts at about 0.25 s, the first stars light at about 3–4 s, mid-journey. It's recorded on *Plan the signature moments*, along with where lighting shows once the sky is out of view.
- 2026-09-29 — **The sky is settled** (Janriz's third look). Rounds 1–3 decided:
  - **Rendering:** B+C: gas along the links between neighbours in meaning, with threads only on hover and between the stars the agent read.
  - **Layout:** PCA.
  - **Lighting:** **Flare** (his pick): each star flares warm where it sits and cools to white, the rest of the sky recedes, and it turns to face them.
  - **Weak matches:** dimmer, so brightness follows similarity.
  - **The far galaxies:** kept, at the "clear" level (soft smudges dimmer than any real star). The build should bake them.
  - **Hover labels and click-to-ask** as built.
  - **No telemetry line.** In his words it "reads more like a stack trace", and a visitor wouldn't know what a "passage" or a "wiki" is. It's off by default and kept only as a toggle.
  - **A rule for visitor-facing words**, from the same reaction:
    - "Passage", "wiki", "chunk" and "search" are our words, never the visitor's.
    - In the prototype a star is "something he's written down", and the bot *reads stars*: "Read 6 stars", "11 stars · click to ask", "Reading the sky…".
    - The copy pass writes the final words under the same rule.
  - **Next round:** type, the stops at layout level, the route map, phones and the colour-fidelity rule, built around the settled sky.
- 2026-09-29 — **Size: 1** (Janriz): "I like the constellation of stars to take as much space in the screen as possible." It was 0.8 on desktop and 0.92 on phones.
  - At 1, the sky spans about the full height on desktop and the full width on a phone.
  - On desktop its right side now runs under the bubble. The layout round decides where the text and the bubble sit, so the sky can stay this big, for example by moving its centre left of the bubble.
- 2026-09-29 — **The verb is "explore"** (Janriz): "Explored 12 stars" is better than "Read 12 stars". The visitor-facing words are now:
  - "Exploring the sky…";
  - "Explored 12 stars · exploring more…";
  - "Explored 12 stars";
  - the greeting's "watch which stars I explore".

  This updates the words rule above; the copy pass keeps the verb.
- 2026-09-29 — **Round 4 is built: the voyage.** It's the whole page around the settled sky, in [`prototypes/deep-field-sky/voyage.html`](../prototypes/deep-field-sky/README.md#round-4-the-voyage). Run `serve.sh` and open http://127.0.0.1:4176/voyage.html.
  - **Three directions** (‹ ›), each a layout, a type system and a route map. ⚙ mixes them.
    - **A Column:** a calm column on the left, the world on the right. Logbook type (Newsreader, a text serif, with Instrument Sans). Ticks at the right edge.
    - **B Alternate:** the column swaps sides per stop and the bot crosses to the world's side. Plaque type (Jost, Futura's line, with tracked capitals). A line across the top.
    - **C Centre:** a centred column with the world on both flanks. Instrument type (Geist). A small map of the real voyage, whose 93 stars light as the bot explores, from anywhere on the page.
  - **The stops.** The voyage runs outward and the camera looks back, so the sky shrinks behind each stop and stays in view. Its flares read from About, Projects and Contact.
    - **About:** home, a small planet in plum light.
    - **Work:** a route spaced by time. A ring marks each role and a tick each model release, and a dashed line runs off its head into what's next. The camera looks back along it towards the present.
    - **Projects:** a world each, the AI work first and biggest; Athena has the ring.
    - **Contact:** a pulsar beacon at the edge, looking back over the whole voyage. It warms when you reach for a link.
  - **Colour as light, with values.** Every stop has the same lightness and chroma, and only the hue walks: blue-violet, plum, teal, deep blue, then near-black at the edge. It blends in OKLab as you travel.
    - Warmth appears only as energy: a star lit, a world the agent points at, the beacon.
    - Links, focus and buttons use white, underline and outline, never colour.
  - **Two layout rules, found by measuring contrast behind the text:**
    - A piece never grows wider than the free field beside the column.
    - Only the current stop is lit; the others recede.

    With both in place, 54 screenshots (three directions × nine stops × 1440 and 390) all pass AA. The small print reads at 5.2–5.5:1. Before, it dropped to 1.7:1 on a phone.
  - **Phones:** one column, with each stop's piece in the top quarter. The name moves to the top, because the First visit's bubble owns the bottom. The parked bot still covers the text's bottom-right corner, which is *Pick the AI entrypoint*'s to solve.
  - **The colour-fidelity rule, measured** in `fidelity.html`, where the stand-in bot and swatches are read back as pixels:
    - AgX shifts the palette by ΔE 8–11 (`#ff5a1f` shows as `#d78264`, and even white goes grey);
    - Neutral shifts it by 3–4;
    - Neutral with meaningful colours drawn unlit and not tone mapped shifts it by 0.

    The candidate rule: lit surfaces use Neutral, and any colour that carries meaning is unlit, written as a display value. That's how the sky is already drawn.
  - **Frame cost** (M5, dpr 2): 3.7–4.7 ms of GPU per stop at 1440 and 4.1–5.4 ms at 390, 60 fps everywhere. Procedural planet surfaces cost 9 ms for Athena until they were baked once at load, which the build should do too.
  - **The content answers, as shown:**
    - a "what I shipped" sentence per role;
    - the retired copy keys stay retired, with one hero line in their place;
    - project titles split into title and subtitle;
    - no featured Mercado screenshot: each public project shows its own, and the NDA work shows none.
  - **Found:** from this network, the Supabase pooler, jsdelivr, Fontshare and GitHub all timed out today. The prototype's libraries now load locally, and the lighting-from-afar shots light stars directly. General Sans was the first pick for Instrument and Geist stands in for it.
  - **For Janriz to react to:**
    1. A, B or C, or a mix (layout from one, type from another, nav from a third)?
    2. The type: Logbook, Plaque or Instrument? (General Sans can be tried in Geist's place once Fontshare answers.)
    3. The route map: ticks, line or map? The map would also answer *Plan the signature moments*' question of where the lighting shows once the sky is behind you.
    4. The light per stop: does the hue walk read? ⚙ Light: *the hero's everywhere* is there for comparison.
    5. The stops' shapes: home planet, the route looking back, a world each, the beacon?
    6. The fidelity rule: approve Neutral plus unlit meaningful colours, as the 3D stack ADR's addendum?
    7. Content: keep the "shipped" sentences, the title/subtitle split, no featured screenshot, and the portrait in About? Should the Model Context Protocol marker stay on a route of model releases?
- 2026-09-29 — **Janriz's reaction to round 4: it's flat.** "This feels more like a linear site / webpage that's slapped on top of a 3D background as a separate layer. It feels flat. It's far from what I was going for." He pointed back to the case studies, Edolus above all: "Every scroll is a transformation, rather than a linear progress… Every scroll is a scene."
  - **Why round 4 reads that way.** It was built to this ticket's brief, "a calm text column the world arranges itself around" (from *Pick the creative concept*), and that brief is what he's rejecting:
    - the text and the world run on two clocks: the text scrolls at page speed while the camera eases behind it, and no word ever belongs to an object;
    - the camera only dollies, so nothing transforms: every piece is a sphere that comes nearer, then dims;
    - the fit rule keeps each piece away from the text, the opposite of Edolus, where the label sits on the object;
    - there are no poses, so there's no beat.
  - **What the references do** (Edolus's transition clips, looked at again frame by frame):
    - Each scroll changes the subject, usually by going into or out of the last one: satellite → clouds → city map → data-centre corridor → one rack → its tray slides out and comes apart → the chip → the chip bursts into light → UI cards → the cards pull back and turn out to be the car's dashboard screen → the car.
    - Text is a title and one to four short lines, attached to the subject, arriving and leaving with it.
    - The stage never scrolls away. US Avionix pins one full-screen stage over native scroll and gives each scene 5 screens of it. Edolus and Hashgraph snap to a hero pose when the scrolling stops.
  - **It doesn't fit this ticket.** It changes a recorded decision: ADR 0001 has one world *behind* the page and text "readable at any scroll position", and this ticket has the calm column. A scene-by-scene film is also several sessions of work. Proposed, waiting on Janriz:
    - this ticket resolves on what holds either way: the sky (rounds 1–3), plus the colour-fidelity rule and the per-stop light if he approves them;
    - a short grilling amends ADR 0001: a pinned stage, every scroll a transformation, hero poses, how much text a scene carries and where the rest lives;
    - a storyboard prototype: the whole voyage as a greybox animatic scrubbed by real scroll. It absorbs most of *Plan the signature moments*, since in a film the transitions are the moments;
    - a style-frame prototype: one transition at full finish, which settles type, the route map and phones;
    - then a build ticket per scene.
- 2026-09-29 — **Resolved** (Janriz: "go ahead"). He has no qualms with the colours so far, as long as they stay flexible. The Answer above lists what settled and where the rest went.
