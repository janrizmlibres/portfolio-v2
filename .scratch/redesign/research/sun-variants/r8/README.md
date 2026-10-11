# Finalize the hero and home, round 8: into the nebula, a system that grows out of its star, a flyby, the Moon

Janriz's notes on round 7 (2026-10-03), and what was done with each:
1. **"Zoom in more. Basically until the nebula fills the whole screen."** Locked on his star, the camera now comes in to a tenth of the hero's distance before the jump. By 0.9 screens the nebula round the star fills the frame edge to edge, the star dead centre, and the charge's streaks run through the gas.
2. **"The solar system just fades in and fades out during the jumps… how would it look like when we're actually in a spaceship?"**
   - **What a ship would see:** the star it jumps at stays a point dead ahead through the whole jump; nothing about it fades. As the ship drops out and slows down, the star swells into a sun, and its planets part from its glare as points and spread to their places. Leaving, the system draws back into one star.
   - **Now:**
     - His star stays the bright point the camera flies at through the charge, the jump and hyperspace. The sky's `spare` keeps its light when the other stars become a backdrop.
     - From halfway through hyperspace, the whole system grows out of that point, slowing as the jump does: the sun out of the star, the planets parting from it as points, the orbits widening with them.
     - Jumping out, the system shrinks back into the star, quickening, from halfway through the charge.
     - Nothing fades. The orbits' hairlines go only once the system is too small for them, so they never knot into a blot.
   - **How:**
     - A jump covers far more than the sky's compressed distances, so the system is drawn scaled about his star, from 0.003 to 1 (`system.s` in `stage.ts`).
     - The sun, Earth, the planets, their dots and their orbits all honour the scale (`sun.ts`, `home.ts`, `planets.ts`).
     - The sun's disc hands over to the sky's star point below about 4 px, as it always did, so the star and the sun are one thing.
3. **"When we drop down to Jupiter we should still see the sun… then camera turns to the left as it reaches Jupiter's right side."** The look stays between the sun and Jupiter on the way down, so the sun is in view and grows. The camera turns left to Jupiter at its right side.
4. **"We're kinda lingering a bit too long on Jupiter… just pan the camera at Jupiter's dayside surface after the camera turn then proceed to earth."** The loop is gone. After the turn, the camera comes round Jupiter's sunlit face, panning across it (crescent, gibbous, full, about 0.3 screens), and goes straight on to Earth.
   - **The turn to Earth goes left,** away from the sun. From Jupiter's side, Earth and the sun are only about 20° apart, and the sun is six times Earth's size there. So any other way to Earth looks into the sun; I tried three, and the sun filled a quarter of the frame.
   - **Earth is set left of the frame's centre,** so the sun, beside it on the left, stays past the edge.
   - **The turn is quicker in its middle,** which has nothing in it, and eases out of Jupiter and into Earth.
5. **"During zoom out, we get the blank space again. Get creative."** Earth's Moon now fills it. Spacecraft leaving Earth (Galileo, Juno, OSIRIS-REx) all looked back at the two together.
   - **The Moon** is NASA's LRO colour map (public domain, `public/voyage/home/moon.webp`, 300 KB).
   - **It's compressed like the planets:** about 0.6 of Earth's size and 8 of its radii off.
   - **It's set on Earth's far side from the sun,** so it's full-lit.
   - **On the pull-back** it comes in from the right as Earth recedes on the left, and the two go off together until the sun comes in.
   - **Coming in,** it also rides beside Earth on the approach to About, at the frame's right edge.
6. **"Did we change the fonts? … change it back to the font we settled (variant E) and just keep the structure and line for the hero."** Yes: round 2's hero had brought its serif name with it. The name is back in E's Jost capitals, now on one line (phones included), with round 2's structure: the role under it with no rule, then the line. ADR 0004's amendment says so.

The script's times are round 7's; the film is still 44.85 screens.

Measured on the `redesign` branch, uncommitted, on 2026-10-03 (M5, headless Chromium with the GPU on, ANGLE on Metal).

## See it

With the dev server on :3000: `http://localhost:3000/`.

## The opening, shot by shot (1440)

| Screens | What you see |
|---|---|
| 0 | The hero: the constellation; the name in Jost capitals on one line, the role and line under it. |
| 0–0.45 | The camera turns onto his star, to the frame's centre. |
| 0.45–0.92 | **In until the nebula fills the frame;** the text goes by 0.62, and the charge starts at 0.64. |
| 0.92–1.16 | **The jump:** a flash, hyperspace, his star a point dead ahead. |
| 1.04–1.4 | **The system grows out of the star:** the sun swells, the planets part from it, the orbits widen. |
| 1.4–1.7 | The system from above. |
| 1.7–2.0 | Down towards Jupiter's right, the sun in view, growing. |
| 2.0–2.36 | **The turn left to Jupiter, and the pan across its sunlit face:** crescent, gibbous, full. |
| 2.36–2.6 | The turn left to Earth, away from the sun. |
| 2.6–3.4 | Earth and the Moon, then round Earth to its day side; About's title comes in. |
| 3.4–5.0 | **About.** |
| 5.0–5.6 | **The pull-back:** Earth and the Moon recede together. |
| 5.6–6.0 | Up to the whole system, the sun coming in small. |
| 6.03–6.42 | **The jump out:** the system shrinks back into his star, the streaks running into it. |
| 6.42– | **Around home:** his star a star again among About's lit stars. |

## Evidence

All made by [`evidence.sh`](evidence.sh) with the scripts in [`../../hero-and-home/`](../../hero-and-home/README.md):
- **The reading spots** at 1440, 390 and 844: `shots/spots/`.
- **The in-betweens,** every 0.1 screens at 1440 and 390, with contact sheets (`sheet-*.png`):
  - `shots/in/`: 0 to 3.5;
  - `shots/out/`: 4.9 to 7.6.
- **The walkthroughs:** `out/opening-{1440,390}.mp4`.
- **Contrast:** `aa.txt`.
- **Frame cost:** `frame-cost.txt`, and `frame-cost-jump.txt` for the jump alone.

## Results

### Contrast (`aa.txt`)

Every reading spot passes:
- worst title 15.0:1 (844, hero);
- worst text 11.3:1 (1440, Around home);
- worst small print 7.3:1.

### Frame cost (`frame-cost*.txt`)

GPU time per frame, mean / p95 in ms (1440 at the tier's DPR 1.8; 390 at DPR 1.5); all at 60 fps.

| | Stretch, hero to Around home (0–8.85) | Hero | About | Around home | The jump in alone (0–1.45) |
|---|---|---|---|---|---|
| The bar | 4.66 / 7.21 | | | | |
| 1440 | 2.67 / 4.76 | 2.40 / 4.48 | 2.67 / 4.16 | 2.62 / 4.82 | 3.00 / 6.11 |
| 390 | 1.84 / 3.65 | 2.17 / 3.94 | 2.24 / 4.34 | 2.36 / 3.48 | 2.19 / 3.92 |

- **390 reads about 1.5 ms higher than round 7** at every spot, the hero included, whose picture didn't change. So the machine was busier this run.
- **All under the bar.** The jump's worst single frame is 13.2 ms; the close nebula is the most costly frame in the film.

### Tests

- **No new unit tests.** The system's scale, the spared star and the Moon are drawing; they are checked in the frames (`shots/in/`, `shots/out/`).
- **Results:**
  - unit 194/194 (the `.scratch` capture file fails as before);
  - `voyage.spec` and `smooth-scroll.spec` 18/18;
  - tsc passes;
  - eslint flags only the pre-existing `app/page.tsx` error.

### Refactor verdicts

- **The system's scale is one number handed to each body's update,** not a scale on a shared parent: the orbits, the dots and the sun's glow sheet are drawn from world positions, so a parent's scale wouldn't reach them. Kept.
- **The sun's radius as drawn** is named `Rs` in its update, instead of shadowing the full-size radius. Done.
- **Gone:** the loop round Jupiter (`loopAt`), the look turned off the sun (`shy`), the high crossing (`overJH`, `clearOfSun`) and the two passes at it that didn't work.
- **Kept:** `turning` (the left turn to home) and `homeAim`, which the flyby uses as round 7's loop did.

## Left for finishing

- **The turn from Jupiter to Earth still crosses empty sky:** about 0.1 screens at 1440 and 0.2 on a phone. Every way to Earth that isn't a left turn looks into the sun.
- **The sun on the way down to Jupiter is large** before it leaves the frame's edge (as asked, it's in view).
- From earlier rounds:
  - the road's start;
  - Jupiter's map at 2048;
  - the satellite's geometry to compress;
  - the shared noise GLSL.
