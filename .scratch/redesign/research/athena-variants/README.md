# Finalize Athena, round 1: the takes, on the real site

Scene 11 (Athena, her moons, her core, her opening, the stream of records) in the takes Janriz asked for on 2026-10-03 ("agree to all", my pick on each of round 1's seven questions), made for real on the real site. Measured on the `redesign` branch, uncommitted, on 2026-10-03 (M5, headless Chromium with the GPU on, ANGLE on Metal).

## Janriz's pick (2026-10-03), now the site's Athena

He took my recommendation: "Agree with Haumea", her moons the icy moons. The station and the orbiters are off the site; their code and models are set aside in [`removed/`](removed/) (`athena-all-takes.ts`, `takes-all.ts`, `station.glb`, `orbiters.glb`), and `athena.py` still builds them. After the cleanup: `takes.test.ts` checks Athena's choices are gone, unit tests pass (bar the frozen prototype under `.scratch`), e2e 18/18, tsc and eslint clean.

The rest of this README is round 1, when both forms were on the site.

## See them (round 1)

The dev server on :3000, then the "Takes" chip top left (development only), or the address:

| Choice | Takes (the first is the default) |
|---|---|
| Athena | `?athena=haumea` · `station` |
| Her moons | `?athenaMoons=match` (icy moons round Haumea, orbiters round the station) · `moons` · `orbiters` |

Her reading spots are at 22.53 (Athena) and 23.00 (her opening). To see the peek, rest the mouse on her between about 21.1 and 22.0, before the scroll opens her.

The camera path, the timings, the text and its manners are the storyboard's (round 3). Only the bodies, their light and where the labels hang differ.

## What's built

`lib/voyage/athena.ts` (new), wired into scene 11 of `lib/voyage/stage.ts`.

- **Haumea** (the default): the real ringed dwarf planet.
  - **What it is:** an egg of crystalline ice, her true proportions (2322 × 1704 × 1026 km, the 2017 occultation's), spinning about her short axis. Fine craters, a few fractures and her Dark Red Spot. A narrow ring in her equator's plane, drawn at 1.75 of her long radius where the real one is at 1.97, so she isn't lost inside it at a third of the frame.
  - **How she's made:**
    - Authored in Blender by script ([`athena.py`](athena.py)). Her ice is hollowed round her core and cut by three half-planes through her spin axis into three wedges. `public/voyage/athena/haumea.glb`: 41k triangles, 433 KB (meshopt, WebP).
    - Her surfaces are made in code ([`tex.py`](tex.py), numpy): equirectangular albedo and normal maps sampled from 3D noise, so nothing seams.
    - Her ring is code: a shader band of dark ice, lit by her star, brighter seen towards it, and dark where she shades it.
  - **The cutaway:** at the scroll's opening, the three wedges slide straight out from her core. Their cut faces are shaded in code by depth, as NASA's interior diagrams draw a body: a thin bright crust, ice that darkens and blues with depth, then the rock's edge, warmed by the core.
  - **Her core:** hot rock. Dark, with seams of heat in its own emission and no bloom (Hashgraph's rock).
  - **Her light:** her own star's light (a directional light with a shadow map, so her moons and wedges shade her), through PBR Neutral. Her ring's shadow falls on her ice, computed in her shader.
- **The station** (the second take): a ringed station round a captured boulder, after NASA's asteroid redirect concept.
  - Three white shroud sectors part on rails round the same hot rock.
  - A spine with a docking node above and a drive below.
  - A ring of 18 solar arrays on three trusses between the sectors.
  - `station.glb`: 39k triangles, 531 KB.
- **Her moons:**
  - **Icy moons:** two irregular, cratered ice moons (`moons.glb`, 142 KB).
  - **Orbiters:** a dish-carrying orbiter with RTGs and a boom, and a probe with two wings (`orbiters.glb`, 98 KB). They're drawn 1.7× their moons' size so their parts read.
  - They ride the storyboard's moon orbits, turned to face her.
- **The pointer's peek:** before the scroll opens her, the wedge nearest the pointer opens 6% of her radius over 1.5 s (`power2.out`), follows the pointer as it slides, and reseals over 2 s.
  - It's live from her arrival until the scroll opens her, and only with a fine pointer that isn't over the page's UI.
  - It reads the pointer layer's `pointer` (`lib/film/pointer.ts`).
  - On a touch screen, the wedge facing you breathes once as she arrives (scroll-driven).
  - None under reduced motion.
- **The stream of records:** 44 slabs lying down, in black anodised metal, flow from the crawler along the stream with the scroll. Each one joins her ring (Haumea) or docks at the station's node, shrinking as it joins.
- **Her labels:**
  - Her moons' and patterns' labels hang outside her silhouette, their leaders still starting on their object. This is a new `StageView.labelClear` and `LabelInput.clear` in `lib/film/place.ts`.
  - Labels of two blocks on screen at once now keep clear of each other and of riding titles (a per-frame `taken` list in `lib/film/runtime.ts`).
  - A label above its parent gives way upwards.
  - On a phone her three patterns are a list between her and her lines.
- **Phones and reduced motion:**
  - On a portrait screen she's drawn at 0.8 of her size, ring included, in the frame's top half.
  - Reduced motion shows the stage's stills: open, every label on.
- **The hand can ask about her:** she registers herself with the pointer layer as the subject `athena` (a disc taking in her ring), so its `[ ASK ABOUT ATHENA ]` chip finds her.

## Evidence

- `shots/<take>/`: her reading spots at 1440 and 390. `shots/<take>/in/` and `in-sheet-1440.png`: the scene every 0.25 screens from 20.5 to 24.75. `shots/haumea/still/`: the reduced-motion stills.
- `shots/compare-1440.png` and `compare-390.png`: both takes at both spots (Haumea first in each pair).
- `out/athena-<take>-{1440,390}.mp4`: walkthroughs from the spur's end, with the cursor resting on her (the peek), through both spots and up the stream, then back a little. Each has a contact sheet beside it.
- `look/`: the close looks made while building (`look.js`).

### Contrast ([`aa-athena.js`](aa-athena.js), the road's measure plus labels → `evidence/aa-*.txt`)

Text over the sky against the brightest 2% of the frame behind each box. AA: 4.5 for text, small print and labels; 3 for titles.

| Take | Title | Text | Small print | Labels |
|---|---|---|---|---|
| Haumea, 1440 | 15.1 | 10.7 | 6.8 | 11.2 (the worst, at her opening) |
| Haumea, 390 | 15.9 | 11.1 | 6.4 | a list on the sky |
| Station, 1440 | 15.7 | 10.7 | 6.8 | 14.2 |
| Station, 390 | 15.8 | 11.1 | 6.4 | a list on the sky |

### Frame cost ([`measure-athena.js`](measure-athena.js) → `evidence/cost-*.txt`)

The scene (20.3 to 24.6 screens) played in 10 s, then 90 frames at each reading spot. GPU mean / p95 in ms, DPR 2 at 1440, DPR 3 at 390.

**This machine was shared with four other sessions rendering the site at the same time, so absolute numbers drift by several ms between runs.** For example, Haumea's final run at 1440 put 12 ms on the projects spot, where she's a dot. What she costs is therefore read from paired runs, back to back: the same frames with her shown, then with her hidden (`__athena.hide()`, development only).

| Run (1440) | Playing | Reading spots |
|---|---|---|
| Round 3's grey blocks (the bar) | 4.47 / 8.79 | 3.37 / 7.07 |
| Haumea, before the fix below | 5.50 / 11.75 | 8.17 / 14.44 |
| Hidden (same session) | 4.18 / 8.23 | 4.69 / 8.96 |
| **Haumea, after the fix** | **5.60 / 10.48** | **6.00 / 11.25** |
| **Hidden (back to back)** | **5.20 / 10.85** | **5.57 / 9.97** |
| Station (a quiet run) | 5.16 / 9.93 | 4.49 / 7.76 |

- **What she adds at 1440 is about 0.4 ms**, playing and at her spots, at 60 fps with no frame over 20 ms.
  - The first pass added 1.5–3.5 ms, because Blender exported her materials double-sided, and three draws a transparent double-sided mesh in two passes. Every part is a closed shell, so she now draws front faces once.
- **At 390** she's at the bar or under it (Haumea 2.89 / 7.16 playing against round 3's 3.07 / 7.21).
- **The site's own frame here, without her** (5.2–5.6 ms at 1440), is above round 3's grey blocks (3.4–4.5). That gap isn't hers; it's the rest of the page as it stands today, measured on a busy GPU. A quiet re-run is worth doing before the build.

## Engineering

- **Files:**
  - new: `lib/voyage/athena.ts` and `public/voyage/athena/*.glb`;
  - `lib/voyage/stage.ts`: scene 11 only;
  - `lib/voyage/takes.ts`: `athena` and `athenaMoons`;
  - `lib/voyage/script.ts`: her patterns' phone box;
  - `lib/film/place.ts` and `place.test.ts`, `lib/film/runtime.ts`, `lib/film/stage.ts`: label clearance, labels clear of other blocks and titles, and giving way upwards.
- **Tests:**
  - `place.test.ts` 35/35 (4 new, written failing first);
  - unit 422 passing (the one failure is the frozen solar-system prototype under `.scratch`, which vitest also picks up);
  - e2e 18/18 (voyage and smooth scroll, against the dev server);
  - tsc and eslint clean on the changed files.
- **Refactor verdicts** (`place.ts`):
  - the overlap test pulled out as `hits()`: done;
  - the two settle passes (downwards, then upwards) folded into one with a sort key: kept as two, which reads more plainly;
  - the clearance applied in runtime instead of `placeLabels`: kept in `placeLabels`, so it's tested where the placement is.
- **Rebuild the models:** `./build.sh` (Blender headless, then `gltf-transform optimize` with join, flatten, instance and palette off, so the wedges stay separate nodes). `tex.py` remakes the surfaces.
- **Coordinated** with the parallel finalization sessions (gates, Contact, the pointer layer, the route map, the bubble): take-key prefixes, the shared label code, the hand's pointer and subjects, and capture runs.
