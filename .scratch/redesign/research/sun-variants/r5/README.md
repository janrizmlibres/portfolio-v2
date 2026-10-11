# Finalize the hero and home, round 5: black space, a jump at the star, the sun kept small

Janriz's answers to round 4 (2026-10-02), and what was done with each:
1. **"The purple hue… doesn't look realistic. It should look exactly like what outer space would look like."**
   - Inside his star's solar system the light is now deep space as it's photographed: black, with no hue (a new `space` light, `lib/universe/light.ts`), and no gas.
   - From the drop-out above the system through About and Around home to the road, the frame is black with white stars, the sun, the planets and their orbits.
   - Earth's and the planets' night sides go black with it, as in NASA's footage.
2. **"The zoom should be at that exact star… we just make a transition in between."** The dive is the earlier rounds' zoom straight at his star, which comes to the frame's centre and stays there. Partway in, the jump takes over: its streaks (or, in the starbow take, the crowding) come from his star itself. While it lasts it hides three things:
   - the gap in scale between the constellation and the solar system inside it;
   - the camera's swing round to above the system;
   - the constellation's coloured light going to black.

   It drops out above the system.
3. **"The sun is SO bright… as we zoom into Earth, we should find a path where the sun isn't seen or at least minimized."**
   - The dive no longer comes down onto the sun. After the view from above, the camera comes down to Earth from beside it.
   - Earth is set towards the frame's left, so the sun, which is to Earth's left from there, sits past the frame's left edge: small (80 px at most at 1440, against 21 px from above) and sliding out by 1.5 screens.
   - The camera then comes round to Earth's day side for About, the sun behind it.
   - The same route is used drawing back from About (the sun peaks at 50 px) and going back in towards the road (87 px, half past the edge).
4. **"In the Around Home section the orbital rings should still be visible and without the purple hue."** The orbits come back as the camera draws away from Earth, and stay through Around home, on black.

Measured on the `redesign` branch, uncommitted, on 2026-10-02 (M5, headless Chromium with the GPU on, ANGLE on Metal).

## See it

With the dev server on :3000: `http://localhost:3000/` (streaks, the default) and `http://localhost:3000/?jump=starbow`. Or use the "Takes" chip, top left, in development.

## The opening, shot by shot

| Screens | What you see |
|---|---|
| 0 | The hero: the constellation, his name on the left. |
| 0–0.3 | The zoom at his star begins. It comes to the frame's centre, and the constellation opens round it. |
| 0.1–0.8 | **The jump**, streaming from his star. Inside it, the colour goes to black and the camera swings round to above the system. |
| 0.8–1.1 | **The system from above,** in black space: the sun at the centre and every orbit out to Neptune's (Saturn's on a phone). |
| 1.1–1.8 | **Down to Earth from beside it.** The orbits fade, the sun slides out past the frame's left edge, and Earth grows. |
| 1.8–2.2 | Round to Earth's day side, About's title coming in. |
| 2.2–4.05 | **About:** the whole Earth, lit from behind the camera, on black. |
| 4.05–4.85 | Drawing back the way it came, the sun kept past the edge, then round to see Earth among About's lit stars. |
| 4.85–6.2 | **Around home:** the system on black, its orbits and About's lit stars round it. |
| 5.6–6.2 | Back in beside Earth, then out to the road, as before. |

## How it's done

- **The light:** a `space` light, black and without hue (tested: nothing over 1/255 on screen, no chroma). Every key from the jump's middle to the road's start is in it, with no gas.
- **The jump:**
  - Its keys look at his star throughout, closing on it as far again each step.
  - The camera's swing to above the system and the change of light both sit between 0.3 and 0.62, while the jump is at full speed.
  - Its streaks and its starbow are aimed along the way to his star, not the way the camera happens to move, so they always come from the star.
- **Coming down to Earth** (`APPROACH` in `stage.ts`): two poses beside Earth, each with Earth turned left of the frame's centre.
  - Seen from there, the sun is to Earth's left, so setting Earth left pushes the sun past the edge.
  - The sun's size and place were checked in the page every 0.05 screens (below).
- **The top-down view** is turned to the side Earth is come down to from (`TOP_TURN`), so the descent is short.

### The sun on the way down (1440)

| Screens | 0.8 (from above) | 1.3 | 1.4 | 1.45 | 1.5 on |
|---|---|---|---|---|---|
| Sun's radius | 21 px, centre | 54 px | 80 px, at the left edge | 95 px, a sliver in | out of the frame |

In round 4 it filled the frame (900 px).

## Evidence

All made by [`evidence.sh`](evidence.sh) with the scripts in [`../../hero-and-home/`](../../hero-and-home/README.md):
- the reading spots at 1440, 390 and 844: `shots/spots/`;
- the in-betweens of the jump, the system, the way down and About, every 0.1 screens at 1440 and 390, per take: `shots/streaks/`, `shots/starbow/`, with contact sheets;
- after About, every 0.2 screens: `shots/after/`;
- the walkthroughs: `out/opening-{streaks,starbow}-{1440,390}.mp4`, each with a contact sheet;
- contrast: `aa.txt`; frame cost: `frame-cost-*.txt`.

## Results

### Contrast (`aa.txt`)

Every reading spot passes, all higher than round 4's now the frame behind the text is black.

| | Worst title | Worst text | Worst small print |
|---|---|---|---|
| Round 5 | 11.8 (390, Around home) | 12.6 (1440, hero) | 7.6 (390, hero) |
| Round 4 | 5.9 | 7.5 | 6.4 |

About is 19.4 / 13.4 (title / text) at 1440 and 390.

### Frame cost (`frame-cost-*.txt`)

GPU time per frame, mean / p95 in ms (1440 at the tier's DPR 1.8 with the 4096 maps; 390 at DPR 1.5).

| | 1440 stretch | 1440 hero | 1440 About | 390 stretch | 390 About | the jump, 1440 |
|---|---|---|---|---|---|---|
| The bar | 4.66 / 7.21 | | | | | |
| streaks | 3.33 / 5.82 | 2.46 / 5.20 | 3.44 / 5.61 | 1.69 / 3.83 | 1.63 / 3.96 | 3.08 / 5.84 |
| starbow | 3.37 / 5.87 | 2.48 / 5.33 | 3.62 / 5.74 | 1.70 / 3.22 | 1.62 / 3.96 | 3.75 / 7.08 |
| Round 4, streaks | 3.15 / 4.74 | 1.80 / 2.69 | 2.86 / 3.18 | 1.14 / 2.21 | 1.18 / 1.52 | 2.32 / 3.55 |

- **Everything reads about 0.6 ms higher than round 4, the hero included**, whose code didn't change. So the machine was busier this run; compare the takes and scenes within a round.
- **Within the round:** About costs about 1 ms over the hero, as in round 4.
- **All under the bar's mean and p95**, at 60 fps.
- **The one long frame** as About first comes in (about 32 ms) is still there in development and absent from the production build (round 4).

### Tests

- **TDD:** the `space` light (black, without hue), red then green.
- **Results:**
  - unit 191/191 (the `.scratch` capture file fails as before);
  - `voyage.spec` and `smooth-scroll.spec` 18/18;
  - tsc passes;
  - eslint flags only the pre-existing `app/page.tsx` error.

### Refactor verdicts

- **The approach's poses** are one list (`APPROACH`), used three ways: coming down to Earth, drawing back from it (reversed), and going back in towards the road (its first pose).
- **`nearHome`** composes every one of them.
- **The round 4 dive onto the sun** (`overSun`, the skim) and the night-side road pose are gone.

## Left for finishing

- **The road's start** (*Finalize the peel and the road*) still flies from beside Earth to the road's tip; the sun peaks at 87 px there, half past the frame's edge.
- **The portrait on a phone held sideways** is still not shown.
- **The shared noise GLSL.**
