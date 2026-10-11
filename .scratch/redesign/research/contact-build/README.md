# Build Contact: evidence

Scene 14 on the real site (`redesign`, uncommitted, 2026-10-04), M5, headless Chromium with the GPU on (ANGLE on Metal), against the dev server on :3000. Every run took the machine-wide heavy lock.

## Recordings

- `rec/contact-1440.mp4`: from the ribbon's last card through the pull-out to Contact, a drag on both axes and its coast, a second drag back, then "Back to the start" replaying to the first frame. Sheet: `rec/contact-1440.sheet.png`.
- `rec/contact-390.mp4`: the same on a phone, without the drag (a touch scrolls the page). Sheet: `rec/contact-390.sheet.png`.
- Script: `record-contact.js` (`MODE=phone` for 390).

## Stills

- `before/`: the pull-out's end every 0.3 screens from G1 + 0.6 before this ticket. The route and its loop round the beacon are drawn at G1 + 1.6 and G1 + 1.9.
- `after2/`: the same frames now. Only the bodies shrink away, and no trajectory is drawn.
- `spots/`: the reading spot at 1440 and 390, film and reduced motion (`*-bare.png` is the same frame with the text hidden, used for contrast). Also `1440-dragged.png` (after a drag on both axes) and `1440-replayed.png` (after "Back to the start"). Sheets: `spots/sheet-1440.png`, `spots/sheet-390.png`.

## Numbers

- **The pull-out's hitches** (`pullout.js`, G1 − 0.4 → END in 3 s, two passes, frames over 20 ms):
  - before: 150 ms and 101 ms frames at 1440 and 134 ms and 83 ms at 390, first pass only, at G1 + 1.29 and G1 + 1.77;
  - after: no frame over 20 ms on either pass, at 1440 and 390, played in 3 s (`after2.log`) and in 1.5 s (`after2-fast.log`): 60.0 fps, p95 17.7 ms, worst 17.8 ms.
- **Cause** (`diagnose.js`): three.js's program count jumped by 23 (121 → 144) at the first hitch and by 13 more (→ 157) at the second. Athena's, the crawler's and the ribbon's key lights lived inside their bodies' roots. A root hidden as its body left took its light with it, so the number of lights changed and every lit material in view recompiled. The fix is `lib/voyage/rig.ts`: the lights stay in the scene, dark when their body is hidden. The film now compiles about 74 programs, once.
- **What the rig costs on the GPU** (`rig-cost.js`, 60 frames at every reading spot, with the rig vs without): at 1440, a mean of 6.9 ms vs 6.3 ms (worst spot 12.6 ms, the ribbon's cards, the same as without); at 390, 2.6 vs 2.8 ms (noise). Every lit fragment now samples four shadow maps instead of one or two.
- **The one repeatable dropped frame left** (33 ms at G1 + 1.97, every pass) was the route map's SVG re-rendering under React (47 ms, `profile.js`). Ticket 45 memoised it: the longest React run on the pull-out is now 2.1 ms.
- **Contrast at the reading spot** (`contrast.py spots`: the text's colour with its alpha against the 95th-percentile pixel behind its box): the title 5.3:1 (1440) and 12.1:1 (390); the lines 13.1:1; the clock's line 7.7:1; the links 18.7:1 and up. Every line passes AA, film and reduced motion alike.
- **The drag** (`spots.js`): a drag left and down at Contact moved the camera's az 0.71 → 2.18 and its el 0.18 → 0.68 (the pitch clamp, 0.5 above the rest).
- **The replay**: after the click, t 0, `#sec-hero`.

## Tests

- `lib/voyage/rig.test.ts` (5): red (no module), then green. The shadow-flag case was added red when ticket 39 needed it.
- `lib/film/place.test.ts`: the two `star` cases were red (the unknown side fell through to above-left), then green.
- vitest on rig, place, replay, turn and script: 83 passed. `tsc --noEmit`: exit 0.
