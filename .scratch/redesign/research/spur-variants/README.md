# Finalize the look back and the spur, round 1: the takes, on the real site

Scene 10 (the whole road, and a branch: 18.38–21.28 screens) in every take Janriz agreed to see (2026-10-03), made for real on the real site. Measured on the `redesign` branch, uncommitted, on 2026-10-03 (M5, headless Chromium with the GPU on, ANGLE on Metal), while other finalizations captured on the same GPU.

## Janriz's picks (2026-10-03), now the site's scene 10

**The glint, the roles named, the arc, from a node, into a capture orbit.** He took my recommendation on each but the labels, which he liked on desktop ("just make sure the phone version is also nice to see").
- **The labels, made good on a phone** (round 2, `r2-roles-390.png`, `r2-roles-1440.png`, `r2-roles-early.png`):
  - each name hangs off the side of its ring away from the road as it runs across the screen there, or the other side where that has no room, and changes sides only when that's clearly better;
  - it stays inside the frame, clear of the route map and of Pip;
  - the names keep clear of each other;
  - each sits on a faint plate (as the pointer layer's chips do), so a stretch of road behind it passes under it;
  - the dot rides the ring's rim, not its centre;
  - they come in once "Where it starts" has gone (18.80) and are gone before "Projects" writes in (19.68), on desktop too.
- **The glint, tightened:** a thinner, glossier coat (0.2 of a full coat, roughness 0.1), so a near plate carries a disc of his star's light with its words still readable, and a far one flashes as the light reaches it.
- **Set aside:** the other takes are off the site. Their code is in [`removed/`](removed/) (`recap-all-takes.ts`, `spur-all-takes.ts`, `spur-all-takes.test.ts.txt`).
- **The picks, every 0.15 screens:** `compare-picked-1440.png`, `compare-picked-390.png`; the glint's last tuning: `r2-g.png`.
- **Measured again** (GPU mean / p95 ms, round 3's bar measured just before):
  - **Playing:** at the bar (1440: 7.43 / 13.55 against 7.23 / 14.43; 390: 3.84 / 9.69 against 4.15 / 8.19).
  - **At the reading spots:** over the bar, most at "Projects", where Athena and the crawler are in frame (1440: 7.83 / 14.17 against 4.37 / 8.05; 390: 4.81 / 10.15 against 3.06 / 6.24).
  - 60 fps, with one long frame (33–34 ms) a run, as there was before the takes.
  - **Contrast:** unchanged (worst text 5.8:1).
- **After the cleanup:** unit 265/265 (outside `.scratch/`); e2e 18/18; tsc, eslint on the touched files and `pnpm build` pass.

The rest of this README is round 1, when every take was on the site.

## See them (round 1)

The dev server on :3000, then the "Takes" chip top left (development only), or the address. The first of each is the default and my pick:

| Choice | Takes |
|---|---|
| The slabs from above | `?lookSlabs=glint` · `faced` · `silhouette` |
| Labels on the look back | `?lookLabels=none` · `roles` |
| The spur | `?spur=arc` · `probe` |
| Where it leaves | `?spurFrom=node` · `branch` |
| Where it ends | `?spurEnd=orbit` · `at` |

`?lookSlabs=silhouette&lookLabels=none&spurFrom=branch&spurEnd=at` is scene 10 as it was, but with the spur already drawn in the road's hairline.

The camera path, the times, the text and its manners are the storyboard's (round 3). Only the bodies, their light and the spur's line differ.

## What's built

- **`lib/voyage/spur.ts`** (plain geometry, tested): the spur's points (a Hermite curve from the node on the road's tangent through the storyboard spur's middle, into a once-round capture orbit; or the storyboard's own Catmull–Rom for "as it was"), and the glint's order and pace.
- **`lib/voyage/recap.ts`**: the spur as a hairline (the road's, brighter while it draws), the node, the probe (the gates' CubeSat, 1.6× a bead), the role labels (HTML over the picture, aria-hidden), and the look back's facing and light.
- **Hooks:** `road.look` in `road.ts` (every plate cut whole; his star's light from behind you onto a point; each sealed plate's coat), `coat` on `createRoad` for the glint take; scene 10's block and the monolith loop in `stage.ts`.
- **The look back:**
  - **faced / glint:** from 18.48 every monolith turns square to the camera, its whole inscription cut in its plate (one plate redrawn a frame, so none hitches). His star's light comes from behind you, as on the ride, so the plates read through the fly back instead of going black.
  - **glint:** the plate's face is sealed under a clear coat (anodising is sealed); from 18.83 to 19.48 the light comes from straight behind you onto one plate after another, from the road's start to the present, and only that plate's coat catches it: a flash steps down the road. It's over before "Projects" writes in.
  - **roles:** each gate's company on a leader line, a dot, then the line, then the name, from 18.83 to 20.13.
- **The spur:**
  - **node:** an open diamond on LogoLife's burn, in the road's plane; the spur leaves it on the road's tangent towards the present.
  - **orbit:** the line curls once round Athena at 2.9 of her radius, tipped 55° from her equator about the way she's approached, so it never reads as a second ring. The arc takes the first 80% of the drawing, the loop the rest.
  - **probe:** a CubeSat flies the drawing's tip, then keeps going round the orbit, and goes before Athena's lines settle.
  - Once she's reached (20.88) the spur steps back to half its light, as the road does.

## Evidence

- **Scene 10 as it was:** `now-1440.png`, `now-390.png` (every 0.15 screens, 18.2–21.6).
- **The defaults:** `r1-default-1440.png`, `r1-default-390.png` (every 0.15 screens); the glint, every 0.05: `r1-glint-1440.png` (before the fixes) and `r1/g3` → `r1-g3.png` (one plate at a time).
- **Side by side:** `compare-lookback-1440.png` / `-390.png` (silhouette, faced, glint, roles at 18.8, 19.0, 19.25, 19.4); `compare-spur-1440.png` / `-390.png` (as it was against node + orbit at 20.0–20.9); `compare-probe-1440.png`; `r1-node.png` (where the spur leaves); `r1-pullout.png` (Contact's pull-out, as it was against node + orbit).
- **Frames** in `r1/<take>/`.

## Measured

- **Contrast** (`aa-spur.js`): every reading spot passes in every take, at 1440 and 390 (worst title 9.4:1, text 5.8:1, both the road's start at 390).
- **Frame cost** (`measure-spur.js`, GPU mean / p95 ms; 18.3–21.3 played in 10 s, then each reading spot):

  | | 1440 playing | 1440 spots | 390 playing | 390 spots |
  |---|---|---|---|---|
  | round 3's grey blocks (the bar) | 7.51 / 13.2 | 6.59 / 14.2 | 4.61 / 9.32 | 4.33 / 8.19 |
  | the defaults | 9.34 / 16.9 | 11.78 / 19.17 | 5.42 / 10.36 | 5.30 / 10.25 |
  | as it was | 8.41 / 15.8 | 11.07 / 19.48 | 5.54 / 12.0 | 5.82 / 11.68 |

  60 fps throughout. The takes add under about 1 ms over the old forms (noise, with other captures on the GPU). The stretch is over round 3's bar in both, at "Projects" most, where Athena and the crawler are in frame: not this scene's bodies.
- **Tests:** TDD for `spurPath`, `startFirst`, `glintAt` and the takes, each red then green. Unit 266/266 (outside `.scratch/`); e2e 18/18 against :3000; tsc, eslint on the touched files and `pnpm build` pass.

## Found

- **The node barely shows:** under the storyboard's camera the spur's foot sits at the frame's bottom-right edge, under Pip, for about 0.2 screens (19.95–20.15). It reads in Contact's pull-out, and on the route map.
- **The spur crosses "Projects"' lines** as they fade (20.75–20.9), in every take, as it did before.
- **The near plates at the frame's edge go black** in the fly back (19.8–20.0), as black anodised metal does when the light is off its face.
- **The probe is small:** about 12 px at 1440, a craft leading its track.
