# Build the hero and home: evidence

The voyage's opening (scenes 1–3: the sky and the dive, home, around home) on the real site, held to the finish bar (ADR 0004). Everything here was measured on the `redesign` branch, uncommitted, on 2026-10-02 (M5, headless Chromium with the GPU on, ANGLE on Metal).

## Walkthroughs

- [out/hero-and-home-1440.mp4](out/hero-and-home-1440.mp4) (1440 × 900, 35 s)
- [out/hero-and-home-390.mp4](out/hero-and-home-390.mp4) (390 × 844, 34 s)

Both scroll by wheel at 2.4 s a screen, pause at each reading spot, go on to the peel, then scroll back up to the first frame. Each MP4 has a contact sheet beside it. To record: `node record.js` (`MODE=phone` for 390), with the dev server on :3000.

## Shots

- `shots/`: every reading spot at 1440, 390 and 844 × 390.
- `shots/inbetween/`: one frame every 0.2 screens from 0 to 6.4, at 1440 and 390. The sheets are `shots/inbetween-1440.png` and `shots/inbetween-390.png`.
- `shots/still/`: the reduced-motion stills at each reading spot.

To shoot: `node shots.js [sizes] [filter]`, or `EVERY=0.2 FROM=0 TO=6.4 node shots.js 1440,390`. Add `REDUCED=1` for the stills.

The live prototype on :4181 was shot the same way (`OUT=… node check.js`). The two match frame for frame:
- the camera's position, and his star's place on screen at every sampled time;
- every in-between at 1440;
- the dive past his star at 390.

The one deliberate difference is at 6.4, where the peel starts. The prototype straightens the orbit into the route there; that is *Build the peel and the road*'s.

## Contrast (`node aa.js` → `aa.json`, `aa.txt`)

Round 4's check: the brightest 2% of the rendered frame behind each text box, against its ink. Every reading spot passes AA.

| | Worst |
|---|---|
| Titles | 5.8:1 (390, "Around home") |
| Text | 7.5:1 (390, "Around home") |
| Small print | 6.4:1 (1440, the caption) |

## Frame cost (`node measure.js` → `frame-cost.txt`)

The stretch (0–6.45 screens) is played through in 10 s, then 150 frames are taken at each reading spot. The GPU timer runs round the sky's whole frame. Round 3 and the finish prototype were measured with the prototype's own `measure.js`.

| | 1440: GPU mean / p95 | 390: GPU mean / p95 | Frames over 20 ms |
|---|---|---|---|
| Round 3, grey blocks | 4.66 / 7.21 ms | 4.56 / 8.40 ms | |
| The finish prototype | 4.13 / 5.87 ms | 4.54 / 7.68 ms | |
| **The real site** | **2.44 / 3.27 ms** | **0.83 / 1.50 ms** | **0 at either size; 60 fps** |

The real site draws at a pixel ratio of 1.8 at 1440 and 1.5 at 390, where the prototypes draw at 2. Part of its saving is that cap; the rest is the gas no longer drawn when the camera is inside it.

## Load (production build)

- **LCP**, median of 7 (`research/perf/lcp.cjs`):
  - 1440: 284 ms;
  - 390 with 4× CPU and throttled network: 660 ms.

  The film engine's were 244 and 872 ms.
- **After first paint:** 193 KB, up from 157 KB. Of the rise:
  - 35 KB is the plate's photo (`public/voyage/plate.jpg`, a 384 × 512 copy of the portrait);
  - about 3 KB is the opening's code in the stage's chunk.
