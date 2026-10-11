# Finalize the hero and home, round 7: lock on, gentle curves, a loop at Jupiter, a straight way out

Janriz's answers to round 6 (2026-10-03), and his notes while round 7 was being built, with what was done with each:
1. **"Zoom in a little bit into the constellation / star before the light speed drive starts… This also ensures the text is fully gone"**, then **"make sure that when we commence hyperdrive the star is at the very center of the viewport and stays at the center… first we lock onto the star, charge commence, then jump. It's that simple."**
   - **Why the star had drifted to the bottom left:** two things were still moving it while the charge began.
     - The camera was still turning from the hero's framing onto the star.
     - The hero sky's own slow turn was still being unwound. It turns round the constellation's centre, not his star, so it carried the star off the frame's centre.
   - **Now:**
     - By 0.45 screens the camera has locked onto his star at the frame's centre and the sky's turn is fully unwound.
     - It then zooms in on the star (to about a third of the hero's distance, "a little bit more" per his note) while the hero's text goes, gone by 0.62.
     - The charge starts at 0.64, and the jump comes at 0.92.
     - The star stays dead centre through the charge, the jump and hyperspace.
2. **"The turns are too sharp. I want the camera path to be gentle curves… Gently camera turns as well"**, with his sketch of the path past Jupiter, then **"we go to Jupiter's right, not left… The camera turns left to see Jupiter's right side then pan to Jupiter's front (light side). We do the circle / loop right in that spot facing Jupiter's light side… and then proceed to earth."**
   - **Why it was sharp:** the camera ran through a few far-apart poses, and each of its values (where it looks, from which way, how far) eased separately. Each one stopped dead wherever it turned back, so the camera stopped and swung at every pose.
   - **Now, from the view above the system to About, it's one move (`glide`, `lib/film/path.ts`, new and tested).** Where the camera is and where it looks each run on a smooth curve through stops. The curves bend through each stop without stopping, kinking or swinging wide, and the speed and turning change smoothly.
   - **The way down,** as he described it:
     1. Down towards Jupiter's right side. The look is turned a little away from the sun, so the sun leaves the frame while it's small.
     2. Past Jupiter's right, turning left to it: a crescent, then gibbous.
     3. Round to its sunlit face, full.
     4. There, heading away from Earth, an anticlockwise loop facing the lit face. It swoops in close to Jupiter and out again, and comes out heading for Earth.
     5. A left turn to Earth. The sun is beside Earth on the left, so it stays past the frame's left edge.
     6. Round Earth to its day side for About.
   - **The loop sits just past Jupiter's sunward side.** I first put it directly between Jupiter and Earth, and the turn from one to the other then crossed about 170° of empty stars. From where it is now, Earth is about a quarter turn from Jupiter, so the turn is about 115°. It's quicker in the middle and eases out as Jupiter leaves and in as Earth arrives.
3. **"Zoom out without light speed until we can see the entire solar system again then light speed out to Around Home."** After About's text has gone, the camera draws back out the way it came in, over about one screen:
   - back past Earth, Earth on the left and the sun past the frame's edge;
   - then up high over that side, the orbits coming out again;
   - the sun comes into the frame only once it's far and small (about 60 px at most at 1440);
   - until it sees the whole system from above. Then the jump out.
4. **"The stars at the bottom right here is off-putting and breaks scale. Where did they come from?"**
   - **Where they came from:** they were About's lit stars, since each of About's lines lights the stars of what it's about. In the scene they sit right beside the system, so from inside it they read as huge neighbours.
   - **Now:** inside his star's solar system that light is held back, with one new control in the sky (`marked`). From the drop-out to the jump back out, the stars are only a backdrop. About's lit stars and their threads come back during the jump out, round his star at Around home.
5. **"Don't twist the solar system during the drive out."** The camera had swung round to Around home's angle while the system was still on screen. Now the whole-system view, the jump out and Around home all look at his star from one way, so the system only shrinks away into the star, fading in hyperspace.
6. **"The streaks should be reversed during the zoom out (instead of growing towards the camera it's away from it)."** Jumping out, the streaks now run in towards his star.
7. **"Serif for sure."** The name is Newsreader, large, on one line (two on a phone), with the role under it and no rule.
   - The take and the switcher are gone (`takes.ts`, `TakeSwitcher.tsx`).
   - ADR 0004 is amended.

The opening is longer for it:
- About comes 1.2 screens later (3.4);
- Around home and everything after come 2.4 screens later;
- the film is 44.85 screens.

Measured on the `redesign` branch, uncommitted, on 2026-10-03 (M5, headless Chromium with the GPU on, ANGLE on Metal).

## See it

With the dev server on :3000: `http://localhost:3000/`.

## The opening, shot by shot (1440)

| Screens | What you see |
|---|---|
| 0 | The hero: the constellation, the serif name laid over its edge. |
| 0–0.45 | The camera turns onto his star, which comes to the frame's centre. |
| 0.45–0.62 | Zooming in on the star as the hero's text goes. |
| 0.64–0.92 | **The charge:** the stars draw out into streaks round the star, which stays dead centre. |
| 0.92–1.4 | **The jump:** a flash, hyperspace, and the drop-out above the system. |
| 1.4–1.7 | The system from above, every orbit drawn. |
| 1.7–2.0 | Down towards Jupiter's right, the sun leaving over the frame's edge while small. |
| 2.0–2.4 | Round Jupiter's right to its lit face: crescent, gibbous, full. |
| 2.4–2.8 | **The loop,** facing the lit face, swooping in and out. |
| 2.8–3.05 | The turn left from Jupiter to Earth. |
| 3.05–3.4 | Round Earth to its day side; About's title comes in. |
| 3.4–5.0 | **About.** |
| 5.0–6.0 | **The pull-back** past Earth and up, to the whole system. |
| 6.03–6.65 | **The jump out:** streaks into the star, the system fading, purple hyperspace. |
| 6.65– | **Around home:** his star among About's lit stars. |

## Evidence

All made by [`evidence.sh`](evidence.sh) with the scripts in [`../../hero-and-home/`](../../hero-and-home/README.md):
- **The reading spots** at 1440, 390 and 844: `shots/spots/`.
- **The in-betweens,** every 0.1 screens at 1440 and 390, each set with contact sheets (`sheet-*.png`):
  - the lock-on, the jump, the way down past Jupiter and About: `shots/in/`;
  - the pull-back, the jump out and Around home: `shots/out/`.
- **The walkthroughs:** `out/opening-{1440,390}.mp4`.
- **Contrast:** `aa.txt`.
- **Frame cost:** `frame-cost.txt`, and `frame-cost-jump.txt` for the jump alone.

## Results

### Contrast (`aa.txt`)

Every reading spot passes:
- worst title 14.9:1 (844, hero);
- worst text 11.3:1 (1440, Around home);
- worst small print 7.3:1.

**Around home on a phone held sideways** first measured 4.4:1 for its text, under the bar. The new way his star is seen from spread About's lit stars under the text there, in that wide, short frame. That frame alone now draws back a little and sets his star further right: 12.4:1.

### Frame cost (`frame-cost*.txt`)

GPU time per frame, mean / p95 in ms (1440 at the tier's DPR 1.8 with the 4096 maps; 390 at DPR 1.5); all at 60 fps.

| | Stretch, hero to Around home (0–8.85) | Hero | About | Around home | The jump in alone (0–1.45) |
|---|---|---|---|---|---|
| The bar | 4.66 / 7.21 | | | | |
| 1440 | 2.63 / 5.75 | 1.91 / 2.11 | 2.88 / 3.24 | 2.22 / 3.33 | 2.47 / 4.96 |
| 390 | 0.87 / 1.42 | 0.59 / 0.69 | 1.18 / 1.39 | 0.66 / 1.01 | 0.83 / 1.62 |

### Tests

- **TDD:**
  - the opening's new times (the script's storyboard table, red then green);
  - `curveThrough` and `glide` (red then green). Their tests check that the curve:
    - passes through every stop;
    - never stops dead where it turns back;
    - changes speed and heading smoothly through every stop;
    - doesn't swing wide.
  - The sky's `marked` control is shader-side and is checked in the frames (`shots/out/`).
- **Results:**
  - unit 194/194 (the `.scratch` capture file fails as before);
  - `voyage.spec` and `smooth-scroll.spec` 18/18;
  - tsc passes;
  - eslint flags only the pre-existing `app/page.tsx` error.

### Refactor verdicts

- **The path, the jump out and Around home share one viewing direction (`outD`)** instead of two. Kept.
- **The framing helpers** (`homeAim`, `shy`, `turning`, `roundJ`, `loopAt`) close over this film's bodies and are used only here. Kept in `stage.ts`, not moved to `lib/film/`.
- **Splitting the opening out of `stage.ts`** (now 874 lines): deferred while the opening is still being decided; a split now would churn under each round.
- **The take module and switcher:** removed now that no choice is open. The switcher's pattern stays for the next one.
- **Gone:** the round-6 approach poses (`nearHome`, `fromJ`, `pastJ`, `jDir`, `NEAR_HOME`) and Around home's own direction (`a2dir`).

## Left for finishing

- **On a phone, the turn from Jupiter to Earth** crosses about 0.3 screens of plain stars. The phone's frame is about 15° wide and the two are about 115° apart at the turn. Options:
  - turn faster on a phone only;
  - or let Jupiter go by in the foreground as Earth comes in.
- **The road's start** still flies from Around home to the road's tip with no jump: *Finalize the peel and the road*'s.
- From round 6:
  - Jupiter's map at 2048;
  - the satellite's geometry to compress;
  - the shared noise GLSL.
