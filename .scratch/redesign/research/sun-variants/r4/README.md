# Finalize the hero and home, round 4: the jump, the system from above, Earth's day side

Janriz's answers to round 3 (2026-10-02), and what was done with each:
1. **Earth at About: the disc**, but "the surface is dark". "We can probably just showcase the sun as we scroll but then we only show the light side of Earth for About." The horizon take is gone. The dive now comes down onto the sun and skims over its limb. At About the camera is on Earth's day side with the sun behind it, out of the frame.
2. **How text arrives: round 2** (:4179, "cleaner"). About is written in word by word with the scroll and dissolved the same way. The light threads are gone from the engine.
3. **The solar system:**
   - "The orbital rings. Where are they?" The orbits are drawn.
   - "A light travel effect as transition for the zoom in, just so we can have a feel for scale." The dive is now a jump at light speed, in two takes (below).
   - "An oblique top-down view of the solar system at first, then zoom into Earth." The jump drops out above the system, and the camera comes down from there.
4. **The 4096 maps:** "Go for what you would recommend." Everyone loads the 2048 maps. The 4096 ones load once the page is idle, and only where About's Earth is big enough on screen to show the difference.
5. **Culling:** "idk if it's possible to not render objects outside the view area… the sun and other planets not visible isn't rendering in the About." It already happens. Two layers that bypassed it now skip themselves too (below).

Measured on the `redesign` branch, uncommitted, on 2026-10-02 (M5, headless Chromium with the GPU on, ANGLE on Metal).

## See it

With the dev server on :3000. The voyage is what a returning visitor sees.

- **The take switcher** ("Takes" chip, top left, development only) now has one choice: the jump.
- **By address:** `http://localhost:3000/` is the streaks take (the default), and `http://localhost:3000/?jump=starbow` is the starbow.

## The opening, shot by shot

| Screens | What you see |
|---|---|
| 0 | The hero, unchanged: the whole sky, his name on the left. |
| 0.1–0.8 | **The jump.** The camera goes to light speed towards his star and the name is passed by it. The camera looks the way it travels, so the jump comes from the frame's centre, with his star just below. It drops out at 0.7–0.8. |
| 0.8–1.1 | **The system from above,** seen obliquely: the sun at the centre and every orbit round it, out to Neptune's (Saturn's on a phone). Planets sit on their orbits. The camera drifts round and down. |
| 1.1–1.6 | **Down onto the sun.** The orbits fade, and the sun grows until it fills the frame: granulation, sunspots, prominences. Mercury, Venus, Earth and Mars stand round it. |
| 1.6–1.8 | **Over its limb.** The camera skims just over the sun's edge and turns to Earth ahead. |
| 1.8–2.2 | **Out to Earth's day side.** Earth grows, lit from behind the camera, and About's title comes in. |
| 2.2–4.05 | **About:** the whole Earth, lit, at the frame's right. The sun is behind the camera, 32° off, so the terminator is just round the far limb (light from the upper left). The portrait is pinned to Cebu. |
| 4.05–4.85 | **The zoom-out** rises over Earth's pole, and the sun and the system come back into view. |
| 4.85–6.2 | "Around home", as before: the system small round the sun, About's lit stars round it. |

## The jump at light speed: two takes (`?jump=`)

- **streaks** (default): faint stars round the camera's way are drawn out into streaks rushing past from the point it travels towards. They grow as it reaches light speed and shrink back to points as it drops out. It's the classic look, the one films use.
- **starbow**: no streaks. The sky itself is shown as it would look near light speed.
  - Everything crowds towards the way the camera travels. That's aberration, and it's the real effect: at full speed the whole half of the sky ahead fits in the frame.
  - Light ahead shifts blue and brightens, and light towards the frame's edge shifts red. The direction of the shift is real; its size is compressed so it shows within the frame (the real one would stay blue across a 32° frame).
- **Both move with the scroll, backwards too.** The streaks' travel is integrated from the scroll, so scrolling back runs them back.
- **The glossary's Warp also travels at light speed** (Pip's jump to a reading spot), so the look picked here can be the warp's later.

## The orbits

- **A hairline per orbit**, about a css pixel wide, home's a little brighter. They're drawn depth-tested, so the sun hides the far side of the inner ones.
- **They show from the drop-out** (0.7–0.9) to the descent onto the sun (fade out from 1.42), so they're there for the view from above and never cut across Earth at About.
- **One passing close to the camera fades**, so none ever slices across the frame.
- **Home's orbit is back**, so *Finalize the peel and the road* can start the road from it, as storyboarded.

## The planets, re-spread

The view from above shows the whole system, so the planets are spread round their orbits instead of bunched on one side. Each is 90° or more round from Earth, seen from Earth, so none is in About's frame. The new layout (degrees round from Earth, the way the orbits turn):

| Mercury | Venus | Mars | Jupiter | Saturn | Uranus | Neptune |
|---|---|---|---|---|---|---|
| 140 | −110 | 60 | −70 | 120 | −150 | 75 |

## Earth at About

- **Lit by the real sun, no cheat.** The light that was turned towards the camera is only used far off now, where Earth is a few pixels across.
- **The sea's glint** was a broad white spot beside Cebu with the sun behind the camera. It's now tighter and dimmer: a sun glint, not a hot spot.
- **The maps:**
  - **Everyone loads the 2048 day and cloud maps**, as in round 2 (Earth's four maps total 545 KB).
  - **The 4096 maps load once the page is idle**, on screens where About's Earth is big enough to show them: `wantsSharpMaps`, at more than 1.25 times the 2048 maps' detail. They're swapped in after being sent to the GPU, off the frame's path.
  - **Who gets them:**

    | Screen | Earth's radius at About | Maps |
    |---|---|---|
    | 1440 × 900 laptop at DPR 1 | 270 px | 2048 |
    | 1440 × 900 retina laptop (the tier's DPR 1.8) | 486 px | 4096 |
    | 1920 × 1080 monitor | 324 px | 2048 |
    | 2560 × 1440 monitor | 432 px | 4096 |
    | 390 × 844 phone (DPR 1.5) | 234 px | 2048 |

    Checked in the page: 1440 at DPR 1 kept 2048, at DPR 2 swapped to 4096, and the phone kept 2048.
  - **The weight they add** (+1.40 MB: 403 KB day, 993 KB clouds) is only paid by those screens, after the page is idle.

## Culling: what's drawn at About

three.js already skips any mesh whose bounds are outside the camera's view (frustum culling), and the opening's bodies use it. At About's reading spot, listed in the page:

- **Skipped as out of view:** the sun's body, all seven planets and Saturn's rings.
- **Drawn:**
  - the sky round you (the far galaxies, the stars and their links, the gas). It surrounds the camera, so some of it is always in view.
  - Earth (ground, clouds, air).
  - The planets' point layer: eight points, which cost nothing.
- **Two layers that bypassed the test now skip themselves:**
  - **The sun's glow sheet.** Its shader places it, so three.js can't tell where it is. It was drawn every frame the sun was on. It now has its real bounds. Close to the sun (at About the camera is 1.9 sun radii from its centre) those bounds still take the camera in, so it's also tested against the frame's cone: at About it isn't drawn.
  - **The road's stand-in lines** (the route, the spur, the stream), drawn at zero opacity before they appear.

  Both were near free already: the sheet's corners fell behind the camera, and the lines drew nothing. So this won't show in frame time.
- **Where About's cost is:** Earth's three shaders over about a third of the frame, the sky's gas, and the sky.

## Text: round 2's manner

- About is written in word by word with the scroll and dissolved the same way (the `rise` word mode), as in storyboard round 2. Each line still lights the stars of what it's about as it writes in. In About-1 those stars are now behind the camera; they're seen lit in the zoom-out.
- **Gone from the engine:**
  - the `thread` manner, its letters, the beam (`thread-look.ts`) and its SVG layer;
  - the manners' thread functions and their tests;
  - the e2e test of the thread.
- **ADR 0004** has an amendment saying so.

## Evidence

All made by [`evidence.sh`](evidence.sh) with the scripts in [`../../hero-and-home/`](../../hero-and-home/README.md):
- **The reading spots** at 1440, 390 and 844: `shots/spots/`.
- **The in-betweens:**
  - the jump, the system, the sun and About, every 0.1 screens at 1440 and 390, per take: `shots/streaks/`, `shots/starbow/`, with contact sheets (`sheet-*.png`);
  - after About, every 0.2 screens: `shots/after/`.
- **The walkthroughs:** `out/opening-{streaks,starbow}-{1440,390}.mp4`, each with a contact sheet.
- **Contrast:** `aa.txt`, `aa.json`.
- **Frame cost:** `frame-cost-{streaks,starbow}.txt` (the stretch to 6.45 and each reading spot), and `-jump.txt` (the jump alone, 0 to 0.95).

## Results

### Contrast (`aa.txt`)

Every reading spot passes. The reading spots are the same in both takes (the jump is over by 0.8).

| | Worst title | Worst text | Worst small print |
|---|---|---|---|
| Round 4 | 5.9 (390, Around home) | 7.5 (390, Around home) | 6.4 (1440, Around home) |
| Round 3, disc | 5.9 | 7.1 | 6.4 |

About itself went from 10.7 / 8.6 (title / text, 1440) to 17.1 / 12.0, since the sun no longer stands behind its lines. It's 17.1 / 11.9 at 390 and 17.0 / 11.9 at 844.

### Frame cost (`frame-cost-*.txt`)

GPU time per frame, mean / p95 in ms. The stretch is 0 to 6.45 played in 10 s; "About" is 150 frames at its reading spot. 1440 is at the tier's DPR 1.8, so it runs with the 4096 maps; 390 is at DPR 1.5.

| | 1440 stretch | 1440 About | 390 stretch | 390 About | the jump, 1440 | the jump, 390 |
|---|---|---|---|---|---|---|
| The bar (*Finish one scene*) | 4.66 / 7.21 | | | | | |
| streaks | 3.15 / 4.74 | 2.86 / 3.18 | 1.14 / 2.21 | 1.18 / 1.52 | 2.32 / 3.55 | 0.74 / 1.64 |
| starbow | 3.18 / 4.79 | 2.95 / 3.23 | 1.16 / 2.24 | 1.21 / 1.90 | 3.07 / 4.53 | 0.83 / 1.76 |
| Round 3, disc | 3.64 / 6.54 | 4.55 / 7.41 | 1.75 / 4.28 | 2.06 / 4.68 | | |

- **Both takes are under the bar** everywhere, and hold 60 fps.
- **About is cheaper than round 3's** (2.9 ms against 4.55 at 1440): the sun is out of the frame there and no longer drawn.
- **The starbow costs a little more during the jump** (3.07 against 2.32 ms at 1440): it bends 24,000 far galaxies in their shader.
- **One long frame (33 ms at 1440, 50 at 390) at 2.8 screens, the first time only.** It's a React task as About comes in (long-animation-frame timing: `performWorkUntilDeadline`, 54 ms), so script, not the picture. Round 3 had it too. **On the production build there's none** at either size, in two runs each, so it's development-mode React.

### Weight

- **First load:** Earth's four maps total 545 KB again, as in round 2. Round 3 had raised that to 1.60 MB for everyone.
- **Sharp maps:** +1.40 MB, only on the screens that show them, after the page is idle.
- **The jump and the orbits** are code: no assets.

### Tests

- **TDD**, each red then green:
  - `takes` for the jump;
  - About written word by word (`script.test.ts`);
  - `wantsSharpMaps` (`earth.test.ts`).
- **Results:**
  - unit 190/190 (the `.scratch` capture file fails as before). Down from 213: the thread manner's tests went with it;
  - `voyage.spec` and `smooth-scroll.spec` 18/18, run against the dev server on :3000 (Next won't start a second dev server, the config's :3099, beside it). The thread's e2e test is now one for word-by-word writing;
  - tsc and `pnpm build` pass;
  - eslint on app, components, lib and tests flags only the pre-existing `app/page.tsx` error.

### Refactor verdicts

- **`takes` for the jump:** keep (same shape).
- **About's size:** lifted into one constant (`ABOUT_SIZE`), shared by the framing and the sharp-maps check.
- **The four-corner instanced quad,** built three times (the sky, the orbits, the jump's field): keep. It's three lines each, and sharing it would have the voyage import the sky's internals.
- **The orbits' hairline shader and the sky's link shader:** keep separate. The sky's reads its stars' state texture and keeps clear of their cores.
- **The thread manner:** removed (`thread-look.ts`, the runtime's thread rows and letters, the manners' thread functions, the threads SVG, `rowStars`).
- **The noise GLSL in `sun.ts` and `planets.ts`:** still to share when finishing.

## Left for finishing the picked take

- **The jump's tuning** once a take is picked: length, density, how fast it drops out.
- **The zoom-out's first beat** (4.0–4.2): the sun's light still glows in at the frame's edge as the camera rises over Earth's pole.
- **The portrait on a phone held sideways** (844): not shown, as in round 3.
- **The shared noise GLSL.**
- **The peel** (*Finalize the peel and the road*) can start the road from home's orbit again.
