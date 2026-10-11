# Model the mascot, round 1: three body plans for Tycho

PROTOTYPE. Three body plans, each modelled in Blender from a script, run through every emote and his part of the warp on the real site. Built on the `redesign` branch (uncommitted) on 2026-10-04: headless Blender 5.2.2, M5, headless Chromium with the GPU on (ANGLE on Metal).

## See them

- **Open** `http://localhost:3000/?tycho=probe` (or `explorer`, `felis`). The take switcher, top left, flips between them.
- **The lab** is bottom left: "Tycho · probe". It plays:
  - every emote, including the shoo sequence and talk beats;
  - think (a toggle), hover;
  - the wake-up's charge, then doze, then wake;
  - each face;
  - **warp:** his part of the journey, on a stage over the page.
- Both panels are for development only and stay out of automated browsers, which drive him through `window.__tycho`.

## The three plans

All three are hardware in the documentary-real family: white painted composite, black-anodised machined parts, foil, red and green nav lights. The colours that carry meaning (his eyes, the beacon, the charge band, a thruster's glow) are the sky's energy colour `#ffa95a`, drawn unlit and not tone mapped.

| Take | After | Body | How he emotes | Boosters | Weight (gz) |
|---|---|---|---|---|---|
| **A, probe** | JAXA's Int-Ball | a white ball with a round screen for a face, turning inside a graphite gimbal ring | the ball turns and pitches inside the ring; the eyes; the antenna on the ring | a housing on each side of the ring: a hatch, a pod that swings out; the main bell under the ring | 52 KB |
| **B, explorer** | the ISS's CIMON, a suited astronaut | a helmeted head with a visor, round sensor pods for ears, an egg torso, two short arms with grippers | the head and visor; arms (a wave, a point, a hand to the back of his head); the antenna | a foil pack on his back: two hatches over pods; the main bell under him | 68 KB |
| **C, felis** | a cat, built as hardware | a wide head, a screen face, sensor-fin ears; a small body tapering to the thruster | the head; ears that prick and flatten; the antenna as a jointed tail (curls when glad, droops when sorry, flicks when he thinks) | hatches on his flanks over pods; the main bell under him | 49 KB |

The stand-in flight bot of *Warp or scroll* weighed 98 KB gzipped. Triangle counts: A 17.2k, B 18.3k, C 15.7k.

## Evidence

- **Contact sheets** in [`shots/`](shots/):
  - `sheet-1440.png` and `sheet-390.png` show each take at rest and at the peak of every emote and face, cropped round his corner;
  - `warp-{take}.png` holds frames of the warp;
  - `{take}-{size}-frame.png` shows him in place.
- **Blender previews** (front, side, back): `out/{take}-{view}.png`.
- **Scripts:**
  - `tycholib.py`, the shared node tree and helpers;
  - `probe.py`, `explorer.py`, `felis.py`;
  - `optimize.sh`;
  - `shots.js`, `warp-shots.js`, `sheet.py`.

## What the build must know (so far)

**The node tree** is the same for every plan. A plan lacking a part skips it, and the rig (`lib/tycho/rig.ts`) handles all three.
- **Core nodes:**
  - `Tycho` > `Body`, which stays level;
  - `Head`, which pitches and turns at the neck;
  - `EyeL`/`EyeR`, each holding one glyph per expression: `Open`, `Wide`, `Happy`, `Squeeze`, `Spiral`, `Shut`;
  - `Antenna` > `AntennaTip`;
  - `Lights` > `Charge0..n`.
- **The boosters:**
  - `HatchL/R`, hinged at their top edge;
  - `PodL/R`, travelling between the `PodStowL/R` and `PodOutL/R` empties;
  - `JetL/R`, `JetMain`, `ThrusterGlow`.
- **Plan-specific nodes:** `ArmL/R` > `ForearmL/R` > `HandL/R`; `EarL/R`; `Tail0..4` under `Antenna`.

**Optimising** uses ADR 0002's command plus two flags:
- `--prune false`, because prune drops the empty leaf nodes the rig aims at;
- `--palette false`, because the palette merges materials and drops their names, and the rig finds the meaningful ones by name.

Meaningful materials need distinct values, or dedup merges them (Eye and Charge did).

**Quantisation sets a scale on each mesh node.** So the rig hides a glyph by scaling it away from its rest scale, never by setting a scale of 1.

**Squash and stretch** is a scale on the pivot round the whole body, not shape keys. So the model needs no morph targets.

## Not yet done

- **No finish pass yet.** There are no panel details, no baked occlusion and no greebles: that waits for the pick, as the truss did.
- **The flat drawing for the wake-up** (an SVG silhouette matching his first frame) is *Finalize the wake-up*'s.
- **Frame cost** isn't measured yet. The corner canvas is 128 px, and he renders each tick as the stand-in did.

## Round 2: the finish, on both (2026-10-04)

**The pick.** Janriz picked B: "I like B actually. It's more anthropomorphic. Body language is clearer." Then: "probe is growing on me", "can we save the two just like the truss / ring for home". He asked for the finish on both.
- The switcher now holds `explorer` (the default) and `probe`. The cat is off the site, and its script stays here.
- Round 1's scripts are kept as `explorer-v1.py` and `probe-v1.py`.

**The explorer** (`explorer.py`):
- **The helmet:** a white front shell and a pale back shell, split at a seam behind the ears. The visor sits in a recess cut into the helmet, in a graphite rim. There are three vents at the back.
- **The ears:** round sensor pods, each with ribs and a lens.
- **The antenna** stands on a collar.
- **The neck:** a three-ring bellows.
- **The torso:** a raised chest plate with the nav lights, and the waist seam now on the surface (it floated before).
- **The arms are chunky,** so they read as gesture at 92–128 px:
  - a pale shoulder cap and a dark shoulder joint;
  - a tapered upper arm and a dark elbow;
  - a forearm with a cuff;
  - a three-fingered gripper (two fingers and a thumb).
- **The pack:** foil between thin frame bands, an ISS-yellow handrail on top, and a latch on each hatch.
- **Under him:** a skirt round the main bell.
- **Size:** 27.3k triangles, 84 KB gzipped.

**The probe** (`probe.py`):
- **The ball:** a white front shell and a pale back shell.
- **The face:** a window cut through the shell, the glass a smaller sphere behind it, in a graphite bezel.
- **Six fan grilles,** each a dark well with three bars.
- **The ring:** a groove along it, and four bolts at each hub.
- **The housings:** each with a pale panel, corner bolts and a latched hatch.
- **The antenna** stands on a collar, and a skirt sits round the main bell.
- **Size:** 21.2k triangles, 63 KB gzipped.

**Shadows instead of baked occlusion.** The rig turns on one soft shadow map from the key light (1024, PCF soft) over his own small canvas. His head shades his collar, and an arm shades his torso as it moves, which a baked map can't do once he emotes. The meaningful colours neither cast nor take shadows.

**Evidence** in `shots/finish/`:
- `sheet-1440.png` and `sheet-390.png`, every emote and face for both;
- `rest-pair.png`;
- `warp.png`;
- the Blender previews `out/{explorer,probe}-{front,side,back}.png`, tiled in `out/finish-sheet.png`.
