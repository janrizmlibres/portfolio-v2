# The pipeline made real: one stage as the sample (2026-10-12)

Janriz: "is the realism factor alright, the same that we did for the ship, relay, and Tycho?" It wasn't. The rings are
glossy-black tori with a flat glowing band, the heaters flat peach tubes, the mast white rods and hairlines, all lit flat.
This round rebuilds one stage to the station's and relay's standard as a sample, behind the take switcher, with the mast
made real all the way down and the crawler's shadow following the fall.

## See it

`?pring=real` on :3000 (or the Takes chip, "The pipeline's hardware"); `now` (the default) is the site as it was.
Enrich's reading spot is 29.63; Dedup 1 is 28.87 and Dedup 2 is 30.39, either side of it.

- [`sheet-desktop.png`](sheet-desktop.png): now (top) and real (bottom) at 28.87, 29.63 and 30.39, 1440×900.
- [`sheet-phone.png`](sheet-phone.png): the same at 390×844.
- [`sheet-climax.png`](sheet-climax.png): the whole shaft at 32.4, now and real (the mast's truss reads all the way).
- [`crop-enrich-real.png`](crop-enrich-real.png): Enrich close, at the site.
- [`shadow-compare.png`](shadow-compare.png): the sample with its shadows (left) and without (right). The heaters' shadows
  fall on the far side of the bore.
- [`sheet-blender.png`](sheet-blender.png) and `blender/`: Cycles renders of the sample beside the ring it replaces, its
  rim close, and a heater from inside the bore.
- Single frames in `shots/{now,real,now-phone,real-phone}/`.

## Why Enrich

Its heaters were the most toy-like part of the pipeline. A heater is also the fixture whose realism tells the stage's
story: a coil glowing in a gold reflector reads as "heat" with no label.

## What changed

**The model** (`scripts/models/pipeline.py`, built by `scripts/models/build.sh pipeline` into
`public/voyage/pipeline/pipeline-real.glb`, 0.97 MB, loaded after the wake only under the take):
- **The bulkhead** (`ring4`, 19.6k tris):
  - a machined aluminium frame (the station's brushed `alu` maps, mostly diffuse: a mirror metal in space reflects black);
  - bolted lips top and bottom;
  - the station's quilted blankets in panels between the lips and the light, with seams, cleared round each fitting;
  - the stage's colour as a run of opal diffusers in a black trough, a clip between each (material `channel`, lit by
    the site as before);
  - hex bolts and washers in two circles;
  - a clevis at each longeron (base plate, cheeks, pin and nuts, the longeron's end block);
  - three avionics boxes in gold foil with lids, handles and connectors, each with a three-line harness tied down
    along the top face to the next fitting;
  - handrails;
  - the stage's tag stencilled on the top face.
- **The heaters** (`fix4`, 26.8k tris): ten infrared emitters, each with
  - a coiled filament (material `heater`, warmed by the site as before) in a quartz sleeve (see-through, keeping its
    opacity under the host's fade);
  - a gold reflector trough (`reflector`, which the site now warms a little as the filament would light it);
  - a finned back that sheds heat;
  - ceramic end blocks with terminals and leads, and two arms bolted to the bore.
- **The mast's pieces** (`mast longeron`, `hinge`, `batten`, `cable`, `turnbuckle`), authored at the origin in ring units for
  the site to instance:
  - carbon-dark longerons hinged at mid-bay;
  - a batten frame there;
  - tensioned diagonal cables, X-braced on each face of each half-bay, a turnbuckle on each.
- Occlusion is baked per part, as before.
- `VARIANT=now` (`build.sh pipeline-now`) is the old research script ported into `scripts/models/`. Its raw build is
  checked, 68,068 tris as before. It writes to `public/voyage/pipeline/pipeline.glb` only if run without `--raw`, which
  wasn't done.

**The site:**
- `takes.ts`: the `pring` take, `now` first (the default).
- `pipeline.ts`, under the take:
  - Ring 4's ring and fixture are swapped for the real ones, dressed as before. The material dressing is now one
    function, `dress`, with a `reflector` kind and authored opacity kept.
  - The mast is the real truss (`realTruss`), instanced per bay each frame, so it folds with the rings as the old
    one did.
  - The front's crest runs down the real longerons: the crest hook is now `crested`, used by both masts.
  - The old rod mast stays (count 0), so the crawler's lens hook still fires.
- `crawler.ts`, under the take: while the pipeline falls, its key's shadow box follows the fall (±3.2 ring radii round
  the depth being passed, 1024² map), so the hardware shades itself. Otherwise the box covers the crawler as before.
  Measured: the box's half-size is 0.0186 during the fall against 0.0281, and its target moves down with each stage.

## Cost (GPU ms, mean of 60 frames, same session, the governor at the same pixel ratio for both takes)

| | now | real |
|---|---|---|
| 1440, Dedup 1 / Enrich / Dedup 2 / climax 32.4 | 6.4 / 5.7 / 6.3 / 3.7 | 6.3 / 5.9 / 7.1 / 5.2 |
| 390, Enrich | 2.4 | 4.3 |

Runs are in `cost-*.txt`; the repeats of one take vary by ±1 ms on this shared GPU.
- **At 1440** the reading spots differ by −0.1 to +0.8 ms, within that noise. The whole shaft at 32.4 is +1.5 ms,
  likely real: every bay's truss is in view there.
- **On a phone** it's a real +1.7 to 1.9 ms at Enrich.
- **Where the phone's cost goes** ([`cost-isolate-390.txt`](cost-isolate-390.txt)):
  - the sample ring and heaters take about 1.6 ms, where the old ring 4 takes 0.85 ms;
  - the real mast's instanced pieces take about 0.6 ms.
  - Trimming the geometry (washers, bevels, coil: ring4 23.8k → 19.6k, fix4 33.7k → 26.8k tris) barely moved it, and
    neither did dropping the thin pieces' shadows. It's mostly the frame-filling textured surfaces at that spot.
- Comfortably inside the frame either way.

## Recommended next steps (my picks)

1. **The other seven rings:** build them all from this bulkhead. The frame, lips, blankets, diffusers, bolts and fittings
   are shared, so only the fixture changes per stage:
   - Search: dish antennas on booms, with feed horns and cables;
   - Extract: a die press with hydraulic rams and guide rails;
   - Dedup: the twin ring as a real counter-rotating comparator, with bearings and an encoder;
   - Save and Start: the magazine as a racked cartridge store with guide rails;
   - Report: the deck as an instrument panel.

   Budget about 30–40k tris a stage. My pick: keep the bulkhead identical on every stage, so the stages differ by
   their colour and fixture alone, as now.
2. **Cost for the full build:**
   - one bolt and washer as an instanced mesh per ring, instead of 200 merged copies;
   - the blanket bands' normal map dropped on a phone;
   - the far rings swapped for the old plain ring past a few hundred pixels (they read the same at that size).

   My pick: the bolt instancing first, which is cheap and halves the ring's triangle count.
3. **The mast:** keep this truss. My pick is to keep its longerons dark: as white rods they read as the hairlines
   Janriz didn't like. The batten frames give the scale cue the old mast lacked.
4. **The lighting:**
   - Keep the shadow box following the fall.
   - The records don't receive shadows yet (`swarm.ts`, the slate round's): give the slates `receiveShadow`, so the
     rings' and heaters' shadows fall across what falls through them.
   - The region's fill is strong in the crawler's brown, so shadows read soft. My pick: drop the fill about 20% while
     the fall is on, which will make the hardware read more solid.
5. **The heaters:** at the site they read as warm stripes in grey pillars from outside, and as glowing coils from inside
   the bore. If Janriz wants them hotter, raise the reflector's warmth (0.16 in `pipeline.ts`) rather than the
   filament's, which already clips.

## Checks

- tsc: exit 0.
- ESLint on `pipeline.ts`, `crawler.ts`, `takes.ts`, `takes.test.ts`: exit 0.
- vitest `lib/voyage`: 225 pass and 2 fail, both in `script.test.ts`'s storyboard (the film is now 42.75 screens, the
  outcome's window moved). That's the camera rework's retiming in `script.ts`, not this round.
- `takes.test.ts` has the new take's test, which failed before the take was added and passes now.
