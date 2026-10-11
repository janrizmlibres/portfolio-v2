# Finish one scene

Type: prototype
Labels: wayfinder:prototype
Status: resolved
Blocked by: 30

## Question

What does a finished scene look like? Take one scene from *Storyboard the voyage*'s shot list, with its transitions in and out, to full polish for Janriz to react to. It sets the bar that every per-scene build ticket is held to. The likely pick is the dive from the hero into home, since it's the first scroll every visitor makes, but the storyboard chooses.

It settles what round 4 of *Prototype the visual language* left open:
- **Type:**
  - the families and the scale;
  - how text moves in and out of the shot (GSAP on real HTML).

  The candidates are round 4's three systems plus General Sans, which can be tried once Fontshare answers. The font rules in the map's Notes bind the choice.
  - Logbook: Newsreader with Instrument Sans.
  - Plaque: Jost with DM Mono.
  - Instrument: Geist with Geist Mono.
- **The route map nav**, in its final form.
- **Phones at 390 px.**

It also shows:
- the scene's reduced-motion version;
- AA contrast at its hero pose, measured with the sampling check from round 4;
- frame cost at 1440 and 390 px.

The camera and objects move by the storyboard's device. The polish is in timing, easing, light and text. The effects rule applies.

Resolved when Janriz reacts. The answer records the type, the route map, the phone framing, how text moves, and the finish bar for the build.

## Answer

Decided by Janriz on 2026-10-01, over one round of [`prototypes/finish-one-scene/`](../prototypes/finish-one-scene/README.md): "yea let's go with E… I'll take it. I like the route map — it's a creative way to have a nav menu that fits with the universe idea." Recorded in ADR 0004. **Finish bar** is added to `CONTEXT.md`.

**Scope:** a polish slice of the voyage's opening (scenes 1–3, from the first frame to the start of the peel), not a vertical slice. The chat, Pip's wander and his real model wait on their own tickets. The stand-in Pip is parked in the corner the frame keeps clear.

**Type: E, Plaque's voice with Logbook's text.**
- The name and the scene titles are set in Jost capitals, tracked open, with a hairline rule under the name.
- Small print and labels are DM Mono capitals.
- The reading lines are Newsreader.

It passes AA at every reading spot at 1440, 390 and 844 (`shots/aa.json`). The other four systems were Logbook, Plaque, Instrument and General Sans.

**How text moves.** Fine for now. Janriz will judge it again once the real lighting is built.
- **The hero's lockup** arrives once on load, rising out of the scene's light into white. The dive then passes it: each row is pushed out from his star and grows as it goes, like the stars, and it comes back if you scroll up.
- **A line is written out of the star it comes from,** along a hairline of its light, a visual line at a time with a soft write head. It settles from the scene's tint to white, and on the way out it erases back into the star. "I'm Janriz…" is written by his own star. A line whose star is out of frame gets a thread from the frame's edge.
- **Titles** arrive letter by letter, in the scene's tint.

**The route map: the form as built.**
- The sky in miniature, top right: the stars from the hero's side, not turning, with the voyage drawn through them and the part you've travelled brighter.
- A "you are here" ring on what the camera is looking at.
- The flare plays on it.
- Hovering or focusing it opens the five links. Hovering a link marks that section on the map and draws the warp's way there.
- On phones it's a pill that unfolds into a sheet.
- One finding goes to its build ticket: at rest, with only the current section's name showing, Janriz didn't at first read it as the nav. Showing all five names, dimmed, at rest is one fix.

**Phone framing** is fine.
- Portrait: the subject in the top half, the title above it, and the lines across the bottom third, ending above Pip's pill.
- Landscape: the desktop composition with the phone-size Pip and the folded route map.
- Pip's bubble spans the width above him. It covers the last lines while it's open, which is *Pick the AI entrypoint*'s call.

**The finish bar** (ten points, in full in ADR 0004 and the prototype's README):
1. Every frame is finished, checked every 0.2 screens: no pops, no washes, no frame-crossing hairlines, no text on text, no stray single words.
2. The camera never stops or jumps, and it follows round 3's path: the polish changes the look, not the motion.
3. Text is real HTML, moved by the scroll, and reversible.
4. Contrast is measured at every reading spot.
5. Light follows the colour rule.
6. Three things stay clear at every reading spot: the subject, Pip's corner and the route map's corner.
7. Phones are composed twice.
8. The tiers work.
9. The cost is no more than the stretch's grey-block storyboard.
10. The evidence is an MP4 at 1440 and 390, the shots, the contrast table and the frame cost.

**What the finish changed from round 3,** for *Build the hero and home* to port:
- **Home:** a faceted world with low relief, lit by his star through PBR Neutral, with glints on the facets and a night side filled by the region's light.
- **His star** becomes a small sun with a corona as you dive.
- **Home** comes into view as the camera slides past his star (t 1.35–1.6), in one clean fade rather than round 3's stipple.
- **The camera follows round 3's path, unchanged**, so it curves round home after passing his star. A first version turned the camera to keep the sun off the text column, which straightened the dive. Janriz caught it, and it was put back (see Comments).
- **Round home,** the cloud's light fills home's night side, so it reads as a body rather than a hole.
- **Gas** fades, and isn't drawn, when the camera is inside it.
- **Threads** longer than half the frame fade.
- **The orbit** leaves a gap for the plate.

**Measured on round 3's path:** 60 fps at 1440 and 390. The mean GPU time is 4.6 and 5.3 ms, below round 3's grey blocks for the same stretch (5.9 and 8.0 ms). Every reading spot passes AA for all five type systems at 1440, 390 and 844. The worst cases are titles 4.6:1 (Around home over the cloud), text 7.5:1 and small print 6.2:1.

**Graduated:** [Build the route map](build.md#t45).

## Comments

- 2026-09-29 — **From [Make every scroll a scene](29-make-every-scroll-a-scene.md)** (resolved).
  - **The finish bar covers in-between frames,** not just holds. The stage settles only near a hold, so a visitor can rest on any frame, like Edolus's rack held mid-wane.
  - **Text:**
    - arrives at its own pace and wanes with the scroll;
    - the title rides its subject;
    - the body lines sit steady;
    - AA is measured at the hold.
  - **The route map is the sky in miniature,** with a "you are here", links that warp, the flare playing on it, and folded away on phones until tapped. This ticket settles its final form.
  - **Phones:** every hold is composed twice, landscape and portrait, with titles above or below the subject.
  - **Reduced motion:** the hold as a still, crossfaded.
  - **Janriz likes round 4's direction A** (Logbook type: Newsreader with Instrument Sans; a column and world; ticks). It's frozen in `prototypes/voyage-round4-a/`, so weigh Logbook as a liked candidate.
- 2026-10-01 — **From [Storyboard the voyage](30-storyboard-the-voyage.md)** (resolved). Unblocked.
  - **The storyboard's pick:** the dive from the hero into home (scenes 1–2). The alternative is the crawler's climax, the main highlight.
  - **The grammar changed** (ADR 0003): there are no holds and no settling.
    - The camera never stops: reading stretches only slow it, and the subject keeps moving.
    - Text is tied to the scroll, word by word. About's lines come out of their stars, and words arrive in the scene's light and settle to white.
    - So "AA at its hold" becomes AA at its reading spot, and the finish bar covers every frame.
  - **What round 3 already does in this stretch** (`prototypes/voyage-storyboard-3/`):
    - his star dead centre from the first frame until it's home's sun;
    - his portrait as the film's first slab, riding home's orbit;
    - stars that show their topic and ask Pip on click;
    - a drag that turns the sky in the hero.
  - **Type** is still round 4's Logbook as a stand-in, so it's still open here.
  - **Polish:** Janriz will polish along the way through the build tickets, held to this ticket's bar. Any design change goes back to all six case studies.
- 2026-10-01 — **Claimed. Scope: a polish slice, not a vertical slice** (Janriz: "go for recommendation").
  - **Not in it:** the bot answering, his wander, and his real model. They wait on *Pick the AI entrypoint*, *Name and voice the mascot*, *Stop sending chunks to the browser* and *Model the mascot*.
  - **What it is:** the stretch at finish. The stars can be hovered and asked about, and the sky can be dragged in the hero. The stand-in Pip is parked in the corner he'll hold, with his bubble at 390 px, so the frame is composed round him.
- 2026-10-01 — **Round 1 is built:** [`prototypes/finish-one-scene/`](../prototypes/finish-one-scene/README.md).
  - **Run it:** `serve.sh`, then http://127.0.0.1:4181/. ‹ › switches the type system, and ⚙ has reduced motion, the 390 and landscape views, plain, and a live readout.
  - **What it covers:** scenes 1–3 of the shot list (the sky and the dive, home, around home), with the first frame and the start of the peel.
  - **Walkthroughs:** `recording/out/finish-one-scene-desktop.mp4` (1440, 58 s) and `…-phone.mp4` (390, 50 s).
  - **What changed from round 3, each a design change taken back to all six case studies:**
    - **Home is finished.**
      - It's a faceted world with low relief, lit by his star's warm white, through PBR Neutral, with facets that glint as they turn (Trionn).
      - Its night side is filled by the region's light, so it never reads as a hole.
      - His star becomes a small sun with a corona as you dive at it. It's drawn unlit.
      - The camera sees home three-quarters lit, with the sun up and to the left, above the text column.
      - Home is there beside his star from the start of the dive, so it grows in its light rather than popping in.
    - **How text moves:**
      - **The hero lockup is passed by the dive.** Each row is pushed out from his star and grows as it goes, like the stars, and it comes back if you scroll up. It arrives once on load, rising out of the scene's light into white.
      - **About's lines are written out of their stars.** A hairline of the star's light reaches the line, and the line writes along it, a visual line at a time, with a soft write head. On the way out it erases back into the star. "I'm Janriz…" is written by his own star. A line whose star is out of frame gets a thread from the frame's edge.
      - This replaces round 3's word-by-word star mode, whose stray words read as debris, the generic fill the Produx study warns about.
      - **Titles** arrive letter by letter, in the scene's tint.
    - **The sky:**
      - gas fades (and is skipped) when the camera is inside it, so the dive never washes the frame;
      - threads longer than half the frame fade, so close stars never throw diagonals across it.
    - **The plate:** the orbit leaves a gap where the plate rides it, so the hairline never strikes across his face.
  - **Type.** Four systems, each changing the lockup's order, case and rule:
    - A Logbook (Newsreader + Instrument Sans);
    - B Plaque (Jost + DM Mono);
    - C Instrument (Geist + Geist Mono);
    - D General Sans (+ JetBrains Mono). Fontshare answers now, served unmodified from its API.

    **Recommendation: A Logbook.** A serif that reads as something written down suits lines written out of the stars, and he already liked it. C is the strongest sans, but it's the most common look for a tech portfolio. D is Edolus's own face, so it would read as borrowed.
  - **The route map, proposed final form:**
    - the 93 stars from the hero's side, not turning, with the voyage drawn through them as a hairline and the travelled part brighter;
    - "you are here" as a ring on what the camera looks at;
    - the flare plays on it.
    - Desktop: top right, with only the current section's name showing. Hover or focus opens the five links (US Avionix's tick nav, as real links). Hovering one marks that section and draws the warp's way there.
    - Phones: a pill that unfolds into a sheet with a larger map and five 44-px rows.
  - **Phone framing:**
    - Portrait: the subject in the top half, the title above it, and the lines across the bottom third, ending above Pip's pill.
    - Landscape: the desktop composition with the phone-size Pip.
    - The bubble spans the width above Pip and covers the last lines while it's open. A bubble against a panel is *Pick the AI entrypoint*'s call.
  - **Measured:**
    - **Contrast:** every reading spot passes AA, for all four systems at 1440, 390 and 844. The worst cases are titles 11.8:1, text 10.3:1 and small print 6.2:1.
    - **Frame cost:** 60 fps at 1440 and 390. Mean GPU is 5.2 ms at 1440 and 6.7 ms at 390, below round 3's grey blocks over the same stretch measured the same way (5.9 and 8.0 ms).
    - **Reduced motion:** stills crossfaded, with the words handing over in turn.
    - **Plain:** a complete page, with the route map as a row of links.
  - **A proposed finish bar** (ten points, in the README): every in-between frame checked every 0.2 screens; no pops, washes, frame-crossing hairlines or text on text; a camera that never stops; text that is real HTML and reversible; contrast measured at every reading spot; the colour rule; three clear zones (the subject, Pip's corner, the route map's corner); phones composed twice; the tiers; cost no more than round 3's; and an MP4 plus shots as evidence.
  - **For Janriz to react to:**
    1. The type: A, B, C or D?
    2. How text moves: the lockup passed by the dive, lines written out of their stars, titles letter by letter.
    3. The route map's form.
    4. Phone framing.
    5. The finish (home, the sun, the plate, the in-betweens in `shots/inbetween-1440.png`).
    6. The finish bar.
- 2026-10-01 — **Janriz's first reactions to round 1.**
  - **Type:** "A is fine, but I kinda like the look of B in the hero." So **E · Plaque + Logbook** is added for comparison: B's voice (the name and titles in Jost capitals, the rule, DM Mono small print) with A's text (Newsreader). It passes AA at every reading spot, like the other four. The pick is still open.
  - **How text moves:** fine for now. It gets judged for real once the actual light effect is built (the sky lit by what Pip explores).
  - **Phone framing:** fine.
  - **The route map:** he asked what it was. At rest, the round map at top right didn't read as the site's navigation, because its links show only on hover. Its form is still open.
  - **The finish bar:** not yet reviewed (it's in the prototype's README).
- 2026-10-01 — **Janriz caught a motion change.** "For that prototype I like how we zoom in in kind of a curve fashion from the hero section to the about. For the build one scene ticket it just zooms in straight… make sure we don't derail a lot from what's already in place in the prototype because this might affect the build tickets."
  - **The cause:** to keep the sun off the About text column, the finish had changed the camera:
    - its view of home (turn 1.25 → 0.8, lift 0.28 → −0.35);
    - the dive's keys, adding one at 1.45 that pre-turned towards home;
    - the view round home.

    The camera swept only 32° round home from the pass to About, against round 3's 53°. Home also showed beside his star from t 0.8, so the dive read as a zoom at home.
  - **The fix:** round 3's path and home's reveal are back, and the sweep is 53° again, matching round 3 frame for frame. What the change had broken was fixed without moving the camera:
    - **Home's reveal** is one clean fade (1.35–1.6), in place of a stipple.
    - **Home's night side round About-2** is filled by the cloud's light (×4), because it was reading as a black hole.
    - **The About text in phone landscape** moves down (y 0.34 → 0.46), so his star sits above it. Its text contrast went from 4.8 to 11.6.
  - **Re-measured:**
    - Contrast: every reading spot passes, all five systems at three sizes.
    - Frame cost: 4.6 and 5.3 ms.
    - The type E walkthroughs were re-recorded.
  - **The rule this sets,** added to ADR 0004's point 2: build tickets port round 3's camera path and timings. The polish changes the look, not the motion, unless Janriz asks.
- 2026-10-02 — **Correction (Janriz): "Home is finished" was wrong.**
  - This prototype set the finish bar and the opening's skeleton: the camera, timings, composition, type, and text manners. It never set the final look.
  - Its home, sun, orbit and plate are code-made stand-ins. *Build the hero and home* ported them unchanged, and when Janriz saw them on the real site he said: "the planet is still a placeholder".
  - In his words: "the prototype is NEVER the final look. it's the skeleton."
  - Their final form is [Finalize the hero and home](finalize.md#t51)'s.
  - Every build ticket now waits on a finalization grilling like it (the map's Notes, ADR 0004).
