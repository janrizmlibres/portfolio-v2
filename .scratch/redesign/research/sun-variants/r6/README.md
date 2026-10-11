# Finalize the hero and home, round 6: a hyperdrive, Jupiter, satellites, round 2's hero

Janriz's answers to round 5 (2026-10-03), and what was done with each:
1. **"It should look like we just hyperdrived into that single star in the constellation."** The jump is now a ship's jump to light speed from your own point of view, like the Star Wars shot he pointed to:
   1. **The charge** (0.06–0.3 screens): the constellation's own stars and the far galaxies draw out into streaks running back to his star, longer as it charges. They're the sky's stars stretched in their own shaders, not a new layer laid over a fading sky.
   2. **The jump** (0.3): a short flash from his star, and the streaks shoot to the frame's centre.
   3. **Hyperspace** (0.3–0.54): blue streaks stream past from his star, and a tunnel of faint stars adds to them. Each streak spreads its light along its length, so the frame never whites out.
   4. **The drop-out** (0.54–0.78): the streaks draw back into points, now the stars of black space round his star's solar system, and the system is there.

   The jump still hides the change of scale, the camera's swing to above the system and the colour going to black. The starbow take is gone: he described this one.
2. **"Go down on Jupiter as we zoom in… around it, then going to Earth."** From the view from above, the camera comes down to Jupiter and round it:
   - 1.0–1.2: Jupiter, half lit from above;
   - 1.2–1.34: round to its lit side, gibbous;
   - 1.34–1.44: on round to its far side, a crescent;
   - 1.44–1.66: past its limb, Jupiter going by in the foreground on the right as Earth comes in ahead on the left;
   - then down to Earth and round to its day side for About.

   The sun stays out of the frame the whole way. Close up, the planets are lit by the sun's own light, terminator and all; the turned light is only for when they're small.
3. **Satellites round Earth.** One model built in Blender: a bus in gold foil, two solar wings of three panels each, a dish and two whip antennas, 1,612 triangles (`public/voyage/home/satellite.glb`, 117 KB).
   - **Built with Blender run headless** from a script, [`../../satellites/make_satellite.py`](../../satellites/make_satellite.py). The Blender MCP bridge was up but had lost its Blender.
   - **Three of them** orbit at 1.2 to 1.75 Earth radii. Each is placed where the shot at About's reading spot sees it: above right, in front of the disc, and coming round the right limb. They move on as you scroll.
   - **Lit by the sun,** with a faint bluish earthshine on the side facing Earth.
   - **Their wings turn to the sun,** as real arrays track it, and the solar cells are drawn as a grid.
4. **The hero, round 2's composition:** the constellation moved to the centre and is a little bigger, with the name laid over its edge.
   - **The name's type is a take** (`?name=`, or the take switcher), since the finish bar (ADR 0004) had set the name in Jost capitals:
     - `serif` (default): round 2's large Newsreader on one line, the role under it without a rule;
     - `caps`: the finish bar's two-line Jost capitals.
5. **"Light speed again but for zoom out so that the sun would be a star again… and bring back the purple hue."** After About the camera jumps back out:
   - Streaks run outwards from Earth, a flash, purple hyperspace.
   - It drops out among the constellation, with About's lit stars and their lines round his star, a star again in the sky's coloured light.
   - The sun's body, Earth and the planets go during hyperspace; the system is too small to see out there.
   - Around home's title now heads its lines, since Earth is too small to ride.

Also: the sun's halo is drawn only while its disc is in the frame. A camera shows no halo from a sun out of shot, and it had left a brown band at the frame's edge.

Measured on the `redesign` branch, uncommitted, on 2026-10-03 (M5, headless Chromium with the GPU on, ANGLE on Metal).

## See it

With the dev server on :3000: `http://localhost:3000/` (the serif name) and `http://localhost:3000/?name=caps`, or the "Takes" chip, top left, in development.

## Evidence

All made by [`evidence.sh`](evidence.sh) with the scripts in [`../../hero-and-home/`](../../hero-and-home/README.md):
- **The reading spots** at 1440, 390 and 844: `shots/spots/`.
- **The hero in the caps take:** `shots/caps/`.
- **The in-betweens,** every 0.1 screens at 1440 and 390:
  - the jump, the system, Jupiter, Earth and About: `shots/in/`;
  - the jump back out to Around home: `shots/out/`.

  Each set has contact sheets.
- **The walkthroughs:** `out/opening-{1440,390}.mp4`, each with a contact sheet.
- **Contrast:** `aa.txt`.
- **Frame cost:** `frame-cost.txt`, and `frame-cost-jump.txt` for the jump alone.

## Results

### Contrast (`aa.txt`)

Every reading spot passes: worst title 14.8:1 (844, hero), worst text 12.0:1 (1440, hero), worst small print 7.4:1. Around home is 17.2 / 12.2 at 1440.

### Frame cost (`frame-cost*.txt`)

GPU time per frame, mean / p95 in ms (1440 at the tier's DPR 1.8 with the 4096 maps; 390 at DPR 1.5); all at 60 fps.

| | Stretch, 0–6.45 | Hero | About | Around home | The jump alone |
|---|---|---|---|---|---|
| The bar | 4.66 / 7.21 | | | | |
| 1440 | 2.63 / 5.00 | 3.12 / 4.73 | 2.54 / 3.98 | 3.49 / 5.68 | 3.41 / 6.56 |
| 390 | 1.95 / 3.51 | 2.43 / 3.33 | 2.42 / 3.48 | 2.42 / 3.50 | 1.96 / 3.50 |

- **The first build of the jump was over budget at 1440:** 7.0 / 19.8 ms, 25 frames over 20 ms. All 24,000 far galaxies drew as long streaks, filling the frame many times over.
- **Now** only the brightest tenth streak (the faint specks fade as it charges), and streaks are at most 2.5 css px across (5 for stars). It's in budget, and looks the same.
- **The one long frame** as About first comes in (33 ms) is the development-only React task seen in round 4.

### Weight

- `satellite.glb`: 117 KB. Its geometry isn't compressed yet; meshopt would take it to about a third.

### Tests

- **TDD:** `takes` for the name, red then green.
- **Results:**
  - unit 191/191 (the `.scratch` capture file fails as before);
  - `voyage.spec` and `smooth-scroll.spec` 18/18;
  - tsc passes;
  - eslint flags only the pre-existing `app/page.tsx` error.

### Refactor verdicts

- **The two jumps share one shape:** `jumpAt` and their constants `JUMP_IN` and `JUMP_OUT`. Their streaks, hyperspace and flash come from one driver.
- **The starbow:** removed (the sky's aberration and its take).
- **The approach list:** cut to its last pose (`NEAR_HOME`).

## Left for finishing

- **Jupiter's map is 2048 across**, a little soft at the size it's seen (a 4096 Cassini map would do).
- **The satellite's geometry** to compress.
- **The road's start** flies from Around home to the road's tip with no jump: *Finalize the peel and the road*'s.
- **The portrait on a phone held sideways.**
- **The shared noise GLSL.**
