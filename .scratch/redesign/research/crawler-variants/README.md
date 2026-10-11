# Finalize the crawler: the takes, on the real site

## Janriz's pick (2026-10-04), now the site's crawler

He took round 2's recommendation: "go with pick". The crawler is the refinery with its companion craft, the ghost lens and the split. Sylvia, the queued rocks, the hard hole and the x-ray opening are off the site:
- **Code:** set aside in [`removed/`](removed/) (`crawler-round1.ts`, `crawler-round2-all-takes.ts`, `takes-round2.ts`, `sylvia.glb`, `moons.glb`); `crawler.py` still builds the models.
- **After the cleanup:** `takes.test.ts` checks the crawler's choices are gone, unit tests 280/280, tsc and eslint clean.
- **The final form:** `shots/final-1440.png`.

The rest of this README is the rounds as they were shown.

## Round 2 (2026-10-03/04): the refinery, finished, and its companions

After round 1, Janriz picked the refinery ("the rings look better on the refinery"), and ghost + split "hold up". Round 2 is his answers on the real site:
- the refinery taken to the truss ship's finish;
- its two companion craft;
- the lens as a thin skin through the white fairing.

The lens and opening takes are off the site. Their round 1 code is kept in [`removed/crawler-round1.ts`](removed/crawler-round1.ts).

| Choice | Takes (the first is the default) |
|---|---|
| The crawler | `?crawler=refinery` · `sylvia` (kept to compare) |
| Round the crawler | `?crawlerMoons=craft` · `rocks` |

- **The refinery, finished** (`crawler.py`, `refinery.glb`: 36k triangles, 858 KB with three baked occlusion maps):
  - **The fairing:** an ogive over a clamshell column, with panel lines (box-mapped), a base frame, stringer bands and a gold shoulder band. A hatch with handrails, separation rails and bolts along the seam on each half, and four reaction-control clusters.
  - **The captured rock** rides on the half that faces it, so it stays in view and moves with that half as the column opens. It's held by three jointed arms (shoulder, upper arm, elbow, forearm, wrist, grip pad) and fed in through a ribbed gold chute and hopper.
  - **The service ring** sits below the fairing's foot, so the halves slide clear over it, on three struts. One lattice mast carries two solar blankets out to the other side, with a blanket box at its root, a tip bar and position lights.
  - **Occlusion:** baked per part with Cycles (each half without its twin, so its inside isn't shut in), and reaching direct light as the ship's does (`occludeDirect`, now exported from `ships.ts`).
- **Its companions** (`companions.glb`, 9k triangles, 287 KB, baked):
  - **The Crawler Dashboard:** a relay satellite in gold foil, its dish held on the refinery, with two solar wings, a star tracker and an omni antenna.
  - **The Data Maintenance Pipeline:** a service tug, its jointed robotic arm reaching ahead, with a docking probe, four reaction-control clusters, small wings and a main engine.
  - Both are turned to face the refinery and drawn larger than the rocks, so their parts read. The tug rides a little closer in (2.85 radii).
  - Their labels hang beyond each craft, on the side away from the refinery (per-moon `clearPx(ref)`).
  - **The rocks take:** two captured rocks queued in orbit (Romulus and Remus round Sylvia).
- **The lens through the fairing:** a thin skin. The fairing's silhouette and panel lines are faint white over the dark inside; elsewhere it's round 1's ghost.
- **Falling records:** 40 now, up from 12. The prototype's swarm is *Finalize the pipeline and its climax*'s, noted there.
- **Evidence:** `look/1440-t25.83-r2*.png`, `look/390-t*-r2.png`; walkthroughs `out/crawler-r2-1440.mp4` and `out/crawler-r2-390.mp4`, each with a contact sheet.
- **Contrast at the reading spot (1440):** title 17.2, text 11.9, small print 7.4, labels 16.8. At 390 the labels are a list.
- **Frame cost ([`evidence/cost-refinery.txt`](evidence/cost-refinery.txt), paired runs):** 60 fps through the stretch at both sizes, no frame over 20 ms. The refinery and its companions add about 1.2–1.7 ms GPU at the reading spot at 1440, and 1.5–2 ms at 390.
- **Tests:** unit 279/279 outside `.scratch`; tsc and eslint clean.

## Round 1


Scene 12's first half, built for real on the real site in the takes Janriz asked for on 2026-10-03 (my pick on each of round 1's seven questions):
- the AI Web Crawler;
- its lens;
- the pipeline folded inside it;
- its opening and the pipeline's drop;
- its moons;
- its records.

Measured on the `redesign` branch, uncommitted, on 2026-10-03 (M5, headless Chromium with the GPU on, ANGLE on Metal).

## See them

Use the dev server on :3000, then the "Takes" chip top left (development only), or the address:

| Choice | Takes (the first is the default) |
|---|---|
| The crawler | `?crawler=sylvia` · `refinery` |
| The lens | `?crawlerLens=ghost` · `hole` |
| How she opens | `?crawlerOpen=split` · `xray` |

- **Where to look:** her reading spot is at 25.83. The lens is live from about 25.0 until she opens at 25.83: rest the mouse on her. She splits from 25.83, and the pipeline drops out of the gap from 26.08.
- **What's unchanged:** the camera path, the timings, the text and its manners are the storyboard's (round 3). Only the bodies, their light, where the moons ride and when the pipeline drops differ.

## What's built

`lib/voyage/crawler.ts` (new) and `lib/voyage/record.ts` (new), wired into scene 12 of `lib/voyage/stage.ts`. The stream now leaves from her mouth (`lib/voyage/world.ts`).

- **Sylvia** (the default) is (87) Sylvia, the first known triple asteroid.
  - **What she is:** a primitive rubble pile (363 × 249 × 191 km), turning about her short axis, with about half of her voids.
  - **How she's made:**
    - Authored in Blender by script ([`crawler.py`](crawler.py)): her ellipsoid, lumped at three scales.
    - Hollowed inside: a gallery through her middle, a bore up to her mouth and down through her south pole, and fourteen rubble voids.
    - Split along a fault into two halves.
    - `public/voyage/crawler/sylvia.glb`: 39k triangles, 392 KB (meshopt, WebP).
    - Her regolith is made in code ([`tex.py`](tex.py)): angular, half-buried boulders of every size, and softened craters.
    - Her cut faces and voids are shaded in code as rubble: blocks of every shade, packed in darker fines.
  - **Her mouth:** one bored opening on her north pole, with a machined metal collar. It's the only sign of the machine from outside. The records leave from it, and the stream now starts there.
- **The refinery** (the second take) is a refinery craft clamped onto a captured rock.
  - A white clamshell fairing holds the pipeline. Its output port is on top, with the same collar.
  - Three capture arms and a gold-foil chute hold and feed the rock. Two solar wings sit on its service ring.
  - `refinery.glb`: 21k triangles, 359 KB.
- **The lens** (Edolus's x-ray) works inside her shell's own shader:
  - **Ghost:** inside a lens 0.18 of the screen's height (at most 0.9 of her disc), her shell turns to a ghost: its own light at a twelfth, plus a faint rim. Its depth is pushed to the back, so the pipeline inside draws over it.
  - **Edge:** soft and drifting a little (fbm). A hairline ring sits over it.
  - **Motion:** it follows the pointer (0.08 s), opens over 0.35 s, and closes over 0.3 s. **It stays open while the pointer rests**, which fixes Edolus's flaw.
  - **When it's live:** from her arrival until she opens, with a fine pointer that isn't over the page's UI. It reads the pointer layer's `pointer`.
  - **Touch:** it opens once at her centre while she's read.
  - **Reduced motion:** her still shows it open at her centre.
  - **Hole (the second take):** round 3's hard-edged hole instead.
  - **Cost:** her shell is drawn in two versions, a plain one and a lensed one, swapped as the lens opens. The lensed shell's pushed-back depth turns off the GPU's early depth test, so it's drawn only while a lens is open.
- **The pipeline**, folded inside her, is made in code:
  - one machined ring per stage, each with a recessed channel lit by its stage's colour from his diagram;
  - a pulse of light running down the rings every 2.4 s;
  - a central boom with three spokes per ring;
  - twelve records falling through.
- **The opening:**
  - **Split (the default):** her fault turns square to you, the two halves part, and the pipeline drops out of the gap as her text leaves. Each ring opens out to full size once it's clear of her, down to the shaft's own places.
  - **X-ray (the second take):** the x-ray takes her whole shell, and the pipeline unfolds down through her.
- **Her moons:** Romulus (the Data Maintenance Pipeline) and Remus (the Crawler Dashboard), irregular rubble moons (`moons.glb`, 183 KB).
  - They're drawn larger than true, Romulus the larger.
  - Remus goes round 2.6 times as fast, as their real periods are (1.4 and 3.6 days).
  - Their phases put Romulus above her right and Remus below her while she's read, both clear of the text and the corners.
- **Every record is engraved** (`record.ts`): a hairline border and five fields (a dim label, then a value in words) cut through the black anodising to bare metal. They're patterns, not text. The stream into Athena uses it too.
- **Her light:** her star's, a directional light with a shadow map, through PBR Neutral. She's drawn opaque once she's fully in.
- **The hand can ask about her:** she registers herself as the subject `crawler` (her disc).
- **Her moons' labels** hang outside her silhouette (`labelClear`).

## Evidence

- `shots/compare-1440.png`: every take, with the lens open at her reading spot and at her opening (26.2). `shots/compare-390.png`: Sylvia and the refinery on a phone, at the touch lens (25.6) and the opening.
- `shots/sylvia/in-sheet-1440.png`: the scene every 0.25 screens from 24.5 to 27.5.
- `out/crawler-1440.mp4` (with the cursor resting on her) and `out/crawler-390.mp4`: walkthroughs from the stream, through her reading spot, her opening and the pipeline's drop to its first stage, then back a little. A contact sheet sits beside each.
- `look/`: the close looks made while building.

### Contrast ([`aa-crawler.js`](aa-crawler.js) → `evidence/aa-*.json`)

AA: 4.5 for text, small print and labels; 3 for titles.

| Take | Title | Text | Small print | Labels |
|---|---|---|---|---|
| Sylvia, 1440 | 17.2 | 11.9 | 7.4 | 4.8 (the Crawler Dashboard) |
| Sylvia, 390 | 16.9 | 11.9 | 7.3 | a list on the sky |
| Refinery, 1440 | 17.2 | 11.9 | 7.4 | 4.8 |
| Refinery, 390 | 16.9 | 11.9 | 7.3 | a list on the sky |

### Frame cost ([`measure-crawler.js`](measure-crawler.js) → `evidence/cost-*.txt`)

- **Frame rate:** 60 fps playing her stretch (24.4 to 26.9) at 1440 and 390, with no frame over 20 ms.
- **GPU time at her reading spot (1440, DPR 2):** 7–9 ms with her and 5–6.5 ms without. She adds about 2–3 ms: her shadow, her body and the pipeline about a third each.
- **Before the plain-shell swap and the opaque draw,** she added 5–7 ms.
- **Caveat:** the GPU was shared with four other sessions, so single runs swing by several ms. A quiet re-run is due before the build.

## Open, for the build or the next round

- **The upstream pass:** the stream's records are about 15 px as the camera passes them, so they read as slabs, but their engraving shows only in the shaft, where they're falling up close.
- **The cut faces** are lit straight on as she opens and read a little like cracked mud. Their look is a candidate for the pipeline's finalization, along with the rings' finish (up close they read as bright machined metal).
- **On a phone,** the dropping rings cross her body text in its last moments (26.2 to 26.6), and again when scrolling back.
- **Romulus's label** passes under the route map, top right, for a moment as she opens.
- **`tests/e2e/landing.spec.ts` fails on the running site** (State 2 stays hidden after the chip); the other 18 pass. It's in the chat's landing flow, not the crawler.
