# Finalize the hero and home: the three homes

Home's body made for real three ways, each in place on the real site, so Janriz can pick one. The camera, the timings, the text, the plate, the sun and the orbit are unchanged; only home's body differs. Measured on the `redesign` branch, uncommitted, on 2026-10-02 (M5, headless Chromium with the GPU on, ANGLE on Metal).

## See them live

With the dev server on :3000 (the voyage is what a returning visitor sees):

- <http://localhost:3000/?home=tiny>
- <http://localhost:3000/?home=stone>
- <http://localhost:3000/?home=earth>
- <http://localhost:3000/>: the stand-in, for comparison.

`?home=` is a temporary switch (`homeKind` in `lib/voyage/homes.ts`). It goes once one is picked.

## The three

### 1. A tiny home world

Modelled in Blender, in `home-variants.blend`, scene *TinyWorld*. It's an authored `.glb` (ADR 0002).

- **The planet:** a meadow world with gentle hills.
- **The cottage**, at the Little Prince's scale (about a third of the planet's width):
  - stone footing, gable roof with rows of shingles, and a chimney;
  - a porch over the door;
  - **a lit front window and a lit round attic window**, with dark windows on the back and side.
- **Round the cottage:** a picket fence, a stepping-stone path, and a lit lamp post.
- **A telescope** beside the house, aimed at the sky.
- **Elsewhere on the planet:**
  - a pond with a bench;
  - about 40 trees, round and pine, in a garden, a grove on the far side, and a scatter over the rest;
  - bushes along the walls;
  - rocks and pale flowers.

  Every side of home has something on it as it turns.
- **The light:** his star's light casts real shadows (a 2048 shadow map), so the trees and the house throw shadows across the meadow.
- **Colour:** vertex colours, with no textures. The colour rule's warmth is only in the lit windows and the lamp.
- **Size:** 55k triangles. **316 KB, 176 KB gzipped.**

### 2. A sculpted stone world

Sculpted in Blender with geometry nodes, in `home-variants.blend`, scene *StoneWorld*, then baked. It's an authored `.glb`.

- **The sculpt** has 1.3M faces:
  - ridged mountains on a domain-warped noise;
  - craters with rims;
  - canyons that cut in and out;
  - a finer net of fractures.
- **The surface** comes from a shader that reads the same procedural nodes, so it sits exactly on the relief:
  - dark basalt in broad tones;
  - paler dust settled in crater floors and canyons;
  - **quartz veins** along the fractures;
  - **mica flecks**.

  The veins and flecks are smooth, so they glint as the world turns past his star.
- **The baked mesh:** Cycles bakes the sculpt onto a 64k-triangle sphere:
  - a normal map, 2048 × 1024;
  - colour with ambient occlusion folded in, 2048 × 1024;
  - roughness, 1024 × 512.

  All three are WebP inside the `.glb`. The light mesh keeps the sculpt's silhouette, so the relief shows at the limb.
- **Size:** **1.58 MB, 1.32 MB gzipped.**

### 3. An Earth-like planet

Written in code from NASA's public-domain maps: a sphere and three shaders (the ground, the clouds, the air past the limb).

- **The maps:**
  - **Day:** Blue Marble Next Generation, July 2004, with topography and bathymetry shading (NASA Visible Earth), 4096 × 2048.
  - **City lights:** Black Marble 2016 (NASA Visible Earth), 4096 × 2048.
  - **Clouds:** Blue Marble clouds (NASA Visible Earth), 2048 × 1024.
  - **Relief and sea mask:** GEBCO 2008 elevation and bathymetry, as rendered by NASA Visible Earth, 2048 × 1024.
- **What the shader draws:**
  - day and night across the terminator;
  - land in relief;
  - **his star glinting on the seas**, where no cloud covers them;
  - clouds that drift slowly and shade the ground;
  - **city lights where night has fallen**, dimmed under cloud. They're energy, so they're warm;
  - the air's blue at the limb on the lit side, and a halo just past it.
- **What faces the camera:** at About, the Philippines face the camera in daylight, with Australia below.
- **Size:** four JPEGs, **1.82 MB**: day 700 KB, clouds 495 KB, night 379 KB, relief 248 KB.
- **Licence:**
  - NASA's texture maps "generally are not subject to copyright in the United States" (NASA's media guidelines), credit NASA Visible Earth.
  - "The GEBCO Grid is placed in the public domain and may be used free of charge", with credit asked: GEBCO Compilation Group.

## How each is lit

Each home follows the colour rule (ADR 0002), as the stand-in did:
- his star's warm white is the key light;
- the region's light fills the night side, so no night side is black;
- everything goes through PBR Neutral.

**The `.glb` homes** use three's own materials, ending in the same output as the rest of the film (`neutralOut` in `lib/voyage/lit.ts`). The lights are matched so that a modelled body is lit as `litMaterial` lights the rest: `matchLights`, test-first.

**The Earth** is its own shader, ending the same way.

## Evidence

- **Side by side,** the stand-in and the three homes at every reading spot: [compare-1440.png](compare-1440.png) and [compare-390.png](compare-390.png).
- **Every reading spot:** `shots/<home>/` at 1440, 390 and 844 × 390.
- **Every 0.2 screens, from 0 to 6.4:** `shots/<home>/inbetween/`, with sheets at `shots/<home>/inbetween-1440.png` and `inbetween-390.png`.
- **Walkthroughs:** `out/home-<home>-1440.mp4` and `out/home-<home>-390.mp4`, each with a `.sheet.png`. These are the same walk as *Build the hero and home*'s.
- **Blender:**
  - `home-variants.blend` is the source;
  - `preview/` holds the modelling renders;
  - `out/*.raw.glb` are the exports before Meshopt.
- **Re-running:**
  - `./evidence.sh [tiny stone earth]` re-runs every capture, with the dev server on :3000;
  - `python3 sheets.py` rebuilds the sheets.

## Contrast (`aa-<home>.txt`)

Every reading spot passes AA with every home. The three tables are identical to each other and to the stand-in's, because no text sits over home: the composition keeps the subject clear of the words.

| | Worst |
|---|---|
| Titles | 5.8:1 (390, "Around home") |
| Text | 7.5:1 (390, "Around home") |
| Small print | 6.4:1 (1440, the caption) |

## Frame cost (`frame-cost-<home>.txt`)

Measured the same way as *Build the hero and home*: the stretch (0 to 6.45 screens) is played through in 10 s, then 150 frames are taken at each reading spot.

| | 1440: GPU mean / p95 | 390: GPU mean / p95 | Frames over 20 ms |
|---|---|---|---|
| Round 3, grey blocks (the bar) | 4.66 / 7.21 ms | 4.56 / 8.40 ms | |
| The stand-in | 2.44 / 3.27 ms | 0.83 / 1.50 ms | 0 |
| **Tiny world** | 3.41 / 4.69 ms | 1.60 / 2.53 ms | 1 at 1440 (33 ms, at 2.8; see below) |
| **Stone world** | 3.20 / 5.43 ms | 1.68 / 3.24 ms | 0 |
| **Earth** | 2.87 / 4.35 ms | 1.02 / 1.97 ms | 0 |

All three run at 60 fps, under round 3's bar.

**Two hitches found and fixed:**
- **Home's first sight hitched**, by up to 168 ms for the Earth. Shaders compiled and textures uploaded on the frame home first came into view (the US Avionix study's warning).

  Fix: home is now drawn once, off screen, as soon as it has loaded (`warmUp` in `homes.ts`).
- **The fade into view switched three's program,** because toggling `transparent` compiles a new one.

  Fix: a modelled home's materials stay transparent throughout, writing depth, and the fade changes only their opacity.

**One hitch predates this work:** a dropped frame at 2.8 screens, where About's lines finish writing. The stand-in drops it too, in some runs. A heavier home makes it longer: 33 to 50 ms for the tiny world, against 33 ms for the stand-in. It belongs to the text's runtime, not home.

The walkthroughs were recorded before the two fixes. The picture is the same, but a take may stutter once where home comes into view.

## Load

- **Each home's assets** (sizes above) load after first paint, with the stage.

  The stage waits for them (`Stage.ready`) before the film takes the stage up, so a deep link or a reduced-motion still never shows home missing.

  On a slow phone that wait is longest for the Earth (1.8 MB) and the stone world (1.3 MB gzipped), and shortest for the tiny world (176 KB). In the build, ADR 0005's wake-up charge covers it.
- **The glTF loader and the Meshopt decoder** add 21 KB gzipped (14 + 7) to the stage's chunk. The Earth doesn't need them.
- **LCP:** not affected. Nothing here touches first paint.

## Credits

- The Earth's maps: NASA Visible Earth: Blue Marble Next Generation, Black Marble 2016, and Blue Marble clouds.
- Its elevation and bathymetry: GEBCO Compilation Group, the GEBCO 2008 Grid, as rendered by NASA Visible Earth.
