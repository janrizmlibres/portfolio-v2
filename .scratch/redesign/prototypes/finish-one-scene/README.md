# PROTOTYPE — Finish one scene (throwaway)

For [Finish one scene](../../issues/31-finish-one-scene.md). This is the voyage's opening, taken to finish: the sky, the dive into his star, home, the stars round home, and the orbit starting to peel off into the route. These are scenes 1–3 of round 3's [shot list](../voyage-storyboard-3/SHOTLIST.md), with the transitions in (the first frame) and out (the peel).

**Decided** (Janriz, 2026-10-01; ADR 0004): type **E · Plaque + Logbook**, the route map as built, and the phone framing and finish bar below. The page opens on E. How the text moves gets judged again once the real lighting is built.

**Scope** (Janriz, 2026-10-01): this is a polish slice, not a vertical slice. The chat, Pip's wander and his real model wait on *Pick the AI entrypoint*, *Name and voice the mascot*, *Stop sending chunks to the browser* and *Model the mascot*. The stand-in Pip sits parked in the corner he'll hold, with his bubble, so the frame is composed round him.

## Run

```sh
.scratch/redesign/prototypes/finish-one-scene/serve.sh        # then open http://127.0.0.1:4181/
LAN=1 .scratch/redesign/prototypes/finish-one-scene/serve.sh  # reachable from a phone on the network
```

The page uses static files only. three.js, GSAP, the stars and the portrait link into `deep-field-sky/`, and the stand-in bot into `voyage-storyboard-3/`. Round 3 (the whole film) still runs on :4180.

The yellow chrome is the prototype, never the design:
- **‹ › or ← →** switch the type system.
- **⚙** opens the settings: motion (full or reduced), view (this window, 390 portrait, phone landscape, plain), and the readout (live contrast and frame cost).
- **J / K** jump to the next or previous reading spot.
- **H** hides the chrome.

## Walkthroughs

In the chosen type, E: [recording/out/finish-one-scene-desktop-plaquelog.mp4](recording/out/finish-one-scene-desktop-plaquelog.mp4) (1440 × 900, 57 s) and [recording/out/finish-one-scene-phone-plaquelog.mp4](recording/out/finish-one-scene-phone-plaquelog.mp4) (390 × 844, 50 s). The first takes, in A Logbook:

- [recording/out/finish-one-scene-desktop.mp4](recording/out/finish-one-scene-desktop.mp4) (1440 × 900, 58 s). The page opens and the lockup arrives. A star is asked about, the sky is dragged, and the route map is opened. Then the stretch is scrolled at reading pace with the chip over home, and scrolled back up to the first frame.
- [recording/out/finish-one-scene-phone.mp4](recording/out/finish-one-scene-phone.mp4) (390 × 844, 50 s). The route map unfolds, the stretch is scrolled, and a star is tapped.

`node recording/record.js` re-records the desktop take, and `MODE=phone` or `TYPE=plaque` (and so on) record the others.

## For Janriz to react to

1. **Type.** Which system: A Logbook, B Plaque, C Instrument, D General Sans, or E (B's voice with A's text, added after his first look)? Each one changes the hero lockup's order, case and rule, not only the faces. *Decided: E.*
2. **How text moves.** Three manners, each tied to the scroll:
   - the hero passed by the dive;
   - About's lines written out of their stars;
   - titles arriving letter by letter.
3. **The route map.** The sky in miniature, top right: it opens on hover, and on a phone it folds into a pill.
4. **Phone framing**, portrait and landscape.
5. **The finish:**
   - home's look, his star as a sun, the plate;
   - whether every in-between frame holds up (`shots/inbetween-1440.png`, one frame every 0.2 screens).
6. **The finish bar** below, which every per-scene build ticket is held to.

## What it does

**The dive.** From the first pixel of scroll his star brightens, so you know which one you're diving at. The camera pushes in on one continuous path (cam.js: a monotone cubic, distance in log space).
- The hero's lockup is passed like the stars are: each row is pushed out from his star and grows as it goes, the small print first and the name last, fading only near the end of its way.
- His star drifts dead centre, and you dive at it alone.
- The camera slides past the star, which becomes a small sun with a corona. Home comes into view as you pass it (one clean fade, t 1.35–1.6), and the camera curves round home to About, with the star up and to the left, above the text column.
- **The path is round 3's, unchanged** (Janriz, 2026-10-01). A first version turned the camera to move the sun off the text and straightened the curve; it was put back. Composition problems are solved with light and text placement, not by moving the camera.
- Scroll back up and all of it runs backwards.

**Home.**
- A low-poly world with low relief, each facet a shade of its own. The key light is his star's warm white, and facets flash as they turn past it.
- The night side is filled by the region's light (half its hue, half grey), so home never reads as a hole.
- It goes through Khronos PBR Neutral tone mapping. The sun is drawn unlit, under the colour rule in ADR 0002.
- The plate is his portrait on the first slab. The orbit's hairline is brighter on the sunward side, and leaves a gap where the plate rides it, so it never strikes across his face.

**Text.**
- The hero lockup arrives once on load, rising out of the scene's light into white (1.1 s, `expo.out`, staggered 0.09 s). It's skipped under reduced motion or on a deep link.
- **Lines are written out of their stars.**
  - A hairline of the star's light reaches the line in the first fifth of its window.
  - The line then writes along it, left to right, one visual line at a time (GSAP SplitText, re-split on resize), with a soft write head. The thread's end rides the head.
  - Words arrive in the scene's tint and settle to white.
  - On the way out the thread comes back, the line erases into it from its end, and the light goes back up into the star.
  - "I'm Janriz…" is written by his own star. A line whose star is out of frame gets a thread from the frame's edge, pointing where the star is.
  - Threads pass under the words they cross, and a thread longer than half the frame fades.
- Titles ride their subject and arrive letter by letter, in the scene's tint.

**The route map.**
- The 93 stars, seen from the hero's side and not turning (a map doesn't turn), inside the sky's edge. The voyage is drawn through them as one hairline, and the part you've travelled is brighter.
- "You are here" is a ring on what the camera is looking at, moving with the scroll.
- The flare plays on it: a star the film or Pip lights, lights here too.
- Desktop: top right, showing only the current section's name. Hover or focus opens all five links, US Avionix's tick nav made keyboard-reachable. Hovering a link marks that section on the map and draws the warp's way there as a dashed line.
- Phones: folded into a pill (the current name and a small map). A tap unfolds a sheet with a larger map and five 44-px rows. Escape folds it.
- The links are a real `<nav>` of `<a href="#sec-…">`. Start and About scroll here; Work, Projects and Contact say they warp in the build.

**Pip.** The stand-in is parked in the corner the frame keeps clear, at 118 px on desktop and 84 px on phones, in portrait and landscape. Asking (a star, home, the plate, or the keyboard's "Ask Pip about…" button) opens his bubble:
- desktop: above him;
- phones: across the width above him, opaque.

On a phone the bubble covers the last lines while it's open. A bubble against a panel is *Pick the AI entrypoint*'s call.

**Tiers.**
- *Reduced motion:* a still per reading spot, crossfaded. The words hand over in turn (out in the first half, in in the second), so two blocks never sit on each other.
- *Plain* (no WebGL): the blocks flow as a page, and the route map is a row of links.
- *Phones:* every reading spot is composed twice.
  - Portrait: the subject in the top half, the title above it, and the lines across the bottom third, ending above Pip's pill.
  - Landscape: the desktop composition with a narrower column, the phone-size Pip and the folded route map.

## Measured

**Contrast at every reading spot** (`node aa.js` → `shots/aa.json`): 5 type systems × 3 sizes × 3 reading spots, using round 4's sampling check (the brightest 2% of the frame behind each text box, against the ink). Every one passes AA.

| | Worst |
|---|---|
| Titles | 4.6:1 (General Sans, phone landscape, "Around home" over the cloud) |
| Text | 7.5:1 (phone portrait, "Around home") |
| Small print | 6.2:1 (Instrument, phone landscape, "Around home") |

For E alone the worst are titles 5.1:1, text 7.5:1 and small print 6.4:1.

**Frame cost** (`node measure.js` → `shots/frame-cost.json`): M5, headless, GPU timer round the sky's whole frame. It held 60 fps throughout. The worst frame was 18.7 ms, one frame.

| | Played through (mean / p95) | At the reading spots (mean) |
|---|---|---|
| 1440 × 900 @2x | 4.6 / 9.3 ms | 3.8–5.2 ms |
| 390 × 844 @3x (capped at 2x) | 5.3 / 10.4 ms | 3.2–4.1 ms |

Round 3's grey blocks over the same stretch, measured the same way (`BASE=http://127.0.0.1:4180/ END=6.45 node measure.js`):

| | Played through (mean / p95) |
|---|---|
| 1440 × 900 @2x | 5.9 / 11.1 ms |
| 390 × 844 @3x (capped at 2x) | 8.0 / 14.9 ms |

So the finish costs nothing extra. The saving is the gas that fades out near the camera and is no longer drawn. The p95 is mostly the live far galaxies and the gas, which the build bakes. Whether this holds on a mid-range laptop belongs to the performance fog.

## The finish bar (proposed)

Every per-scene build ticket is held to this, at 1440 × 900, 390 × 844 and 844 × 390.

1. **Every frame is finished, not just the reading spots.** Check frames every 0.2 screens (0.1 through transitions):
   - nothing pops in or out without a cause, and a body under ~16 px fades by its size;
   - no full-frame wash (gas fades when the camera is inside it);
   - no hairline cuts across the picture (anything longer than half the frame's diagonal fades);
   - no text sits on other text;
   - no orphaned single words mid-transition: text moves by rows and visual lines, not word by word.
2. **The camera never stops and never jumps.** One monotone path, continuous speed, distance in log space. A deep link, a reload and a resize land on the same frame. The path is the storyboard's: the polish changes the look, not the motion, unless Janriz asks.
3. **Text is real HTML, in page order, moved by the scroll, and reversible.** Each scene's text arrives in a manner tied to what the scene does, in its tint, and settles to white. Titles ride their subject.
4. **Contrast is measured at every reading spot:** 4.5:1 for text and small print, 3:1 for titles, sampled from the rendered frame.
5. **Light follows the colour rule:**
   - lit surfaces through PBR Neutral;
   - meaningful colours unlit;
   - no night side pure black (the region's light fills it);
   - warmth only as energy.
6. **Composition keeps three things clear at every reading spot:** the subject from the text, Pip's corner, and the route map's corner. A riding title is clamped clear of the route map.
7. **Phones are composed, not scaled.** Portrait and landscape are framed on their own, the voice shrinks while the labels hold their size, and the phone tier draws less.
8. **Tiers work:** reduced motion (stills, text handing over in turn), plain (a complete page), and keyboard (every subject has an "Ask Pip about…" button; the route map is a list of links).
9. **Cost** is no more than round 3's for the same stretch, measured the same way, at 60 fps on the M5. The mid-range laptop budget check belongs to the performance fog.
10. **Evidence on the ticket:**
    - an MP4 at 1440 and at 390;
    - screenshots at every reading spot and every 0.2 screens;
    - the contrast table and the frame cost.

## Case studies used

All six, per the map's standing rule:
- **Edolus:**
  - General Sans as a candidate (its own face, with JetBrains Mono);
  - display leading at or under 1, with tracking opened only on small capitals;
  - phone sizes set per role rather than by a fluid clamp;
  - colour that lives only in the light;
  - real HTML pinned to 3D anchors.
- **Izanami:**
  - text that arrives in the site's own material, here light written along a thread;
  - body text kept at 16 px or more on phones (its 11.6 px was too small);
  - the slow easing that carries the mood.
- **Produx:**
  - one material story;
  - callouts pinned by leader lines;
  - its warning against generic word-by-word fills, which is why the lines write by visual line with a soft head and not word by word, and why round 3's star-mode debris words are gone.
- **US Avionix:**
  - the tick nav, where only the current label is open and hover opens the rest, rebuilt as real links;
  - "labels hold their size, only the voice shrinks" on phones;
  - accent-then-settle colour;
  - the callout order of dot, line drawn, then text;
  - a soft text shadow instead of a scrim.
- **Hashgraph Ventures:**
  - the closest parallel (a faceted lit body, a figure on a slab);
  - glow kept in the subject (the sun's corona) rather than a post effect;
  - copy in a third of the width beside a centred subject.
- **Trionn:**
  - glints sliding across dark facets as the body turns;
  - tight negative tracking that scales with size;
  - hero lines pinned to anchors re-projected from the turning subject.

**Our own:**
- the lockup passed by the dive like the stars;
- lines written out of their stars along a hairline, his own star writing "I'm Janriz";
- the route map that draws your voyage as you go;
- the orbit's gap for the plate;
- gas that fades when you're inside it.

## Not in this prototype

- The chat: the bubble shows only what would be asked.
- Pip's wander, Pip as the film's guide, and his real model.
- The warp: route map links outside this stretch say they warp in the build.
- Sound.
- Final copy: every sentence is a stand-in.
- The rest of the film: round 3 runs it.

## Files

- `index.html`: the four type systems as CSS custom properties, the route map's two forms, Pip's corner, and the chrome.
- `main.js`: the scroll, the text manners (`heroAt`, `titleAt`, `threadAt`), the hand, the contrast check and the readout.
- `film.js`: scenes 1–3 and the start of the peel: the camera keys, the timeline, the blocks and their windows.
- `stage.js`: home, the sun, the plate, the orbit and the route's first stretch.
- `routemap.js`: the route map.
- `sky.js`: round 3's sky, plus gas that fades and is skipped near the camera, and threads that fade by length.
- `cam.js`, `world.js`, `content.js`, `labels.js`, `rig.js`: round 3's, unchanged.
- `check.js` (screenshots), `aa.js` (contrast), `measure.js` (frame cost), `recording/record.js` (MP4), `sheet.py` (contact sheets).
- `shots/`: the reading spots at 1440, 390 and 844 (A), and at 1440 and 390 for the others in their own folders, the in-betweens, `aa.json` and `frame-cost.json`.
