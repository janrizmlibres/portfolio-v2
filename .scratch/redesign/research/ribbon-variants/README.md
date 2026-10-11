# Ribbon variants

## Round 2 (settled)

Janriz picked the array, the boom (a step smaller) and unfold, kept the phone framing, and asked for the array to fold back up as the camera pulls out. The takes are gone.
- `r2/sheet.png`: the flight at 1440, the record now an engraved packet that opens screens-inside into Mercado (34.3–35.95).
- `out/ribbon-1440.mp4` and `out/ribbon-390.mp4`: re-recorded through the fold-back into Contact.
- **Measured** on round 1's stretch (33.9–40.3): 60 fps at 1440 and 390, no frame over 20 ms.
  - The ribbon adds about 3.4 ms of GPU at 1440 (9.2 against 5.8 without; the machine was busier than in round 1).
  - At 390, 3.9 ms in all.
- **The pull-out** (39.9–41.6) has frame hitches with or without the ribbon: 100–117 ms without it (Contact's own) and 180–233 ms with it. Left to the builds.

## Round 1

Evidence for *Finalize the record's flight and the ribbon* (scene 13), built on the real site.

**Takes** (also on the dev-only "Takes" switcher; each first value is the default):
- `?ribArray=array|strip`: the deployable array of screens, or Trionn's unlit strip.
- `?ribColumn=boom|none`: the boom and its canister, or the helix hanging free.
- `?ribFlight=unfold|grow`: the record opening out of four leaves, or growing all the way (the storyboard's).

**Look here first:**
- `out/ribbon-1440.mp4` and `out/ribbon-390.mp4`: the scene played by wheel from the climax's end at a reading pace, with a beat at each project. On the wide screen the cursor rests on the card square to you, so its chip shows. Contact sheets sit next to them.
- `r1/sheet.png`: the default takes at 1440, from the flight (34.4) to PulseVR (39.22).
- `r1-takes/sheet.png`: the other takes (grow, strip, none).
- `r1-390/sheet.png`: the phone at 35.5, 36.94, 37.81, 39.22.
- `now/`: the stand-in before this round (grey boxes).

**Measured** (headless GPU Chromium, ANGLE on Metal, shared GPU):
- **Frame rate:** 60 fps through 33.9–40.3 at 1440 and 390, no frame over 20 ms (`measure-ribbon.js`; `HIDE=1` for the site without the ribbon).
  - GPU at 1440: 6.9 ms mean (8.2 at the reading spots), against 4.2 ms (5.0) without the ribbon, so the ribbon adds about 2.7–3.2 ms.
  - GPU at 390: 3.1 ms (3.5) against 1.9 ms (2.0), so about 1.2–1.5 ms.
  - A first-sight 466 ms hitch at 1440 was each screenshot's GPU upload. Textures are now uploaded as they load (`renderer.initTexture`).
- **Contrast** (`aa-ribbon.js`, `out/aa.json`): every reading spot passes. The lowest is PulseVR's title at 390, at 11.1.

**Made:**
- `ribbon.py` + `build.sh`: the canister and the boom's tip in Blender by script, occlusion baked per part. Output: `public/voyage/ribbon/ribbon.glb`, 8.7k triangles, 176 KB.
- `public/voyage/ribbon/*.webp`: the eight screenshots, 1344 wide (365 KB together) and 1024 for phones (227 KB).
- `lib/voyage/deploy.ts` (tested): the array's hinge chain.
- `lib/voyage/ribbon.ts`: the cards, screens, band, column, stays and flight.
