# Model the mascot

Type: prototype
Labels: wayfinder:prototype
Status: resolved
Blocked by: 24, 27

## Question

What does the mascot look like? It's the bot that guides Deep Field and is its AI entrypoint. Its palette comes from *Prototype the visual language*, and its name and personality from *Name and voice the mascot*. Model it in Blender through Blender MCP, following *3D route verdict* (`.glb`, named nodes, meshopt), and swap it into the prototype bot for Janriz to react to.

**It must be able to emote** (Janriz, 2026-09-28). The face and body carry the reactions at about 150 px tall on a laptop and 115 px on a phone, through a visor or screen face, modelled eyes, or antenna and posture. The emote set so far, from *See the bot in the viewport*:
- greet;
- anticipate (a crouch before a move);
- settle on parking;
- the shoo sequence: notice, apologise, glance, scoot, then "all good";
- perk up on hover;
- a hint flinch;
- thinking while a reply loads;
- talk beats while it streams;
- idle bob, sway and blink, and the pointer look-at.

*Name and voice the mascot* may add to it.

**The warp's needs** (*Warp or scroll*):
- boosters built into the body: named hatches, pods, nozzle empties;
- eyes that morph (O, ^ ^, > <, spirals);
- squash and stretch on the whole body.

The stand-in with all of this weighs 98 KB gzipped.

**Body plan.** Open: a cute robot, a cyber animal and so on. It should belong in a small universe as its explorer and pilot. His interests include cats. No AI-generated model ships, and library assets are never the bot.

Resolved when Janriz picks a look and the model runs in the prototype through every emote and a warp. The answer records the body plan, the weight and anything the build must know about its node tree.

## Comments
- 2026-10-03 — From [Finalize the bubble](finalize.md#t64) (resolved): Tycho's thinking emote is settled as motion, on the stand-in bot. While he waits, he looks up at the sky (head pitched up, eyes raised), his head drifts side to side and his eyes scan, as if reading the stars he lights. No dots. `lib/pip/rig.ts` (`think`) holds the numbers. The real body needs a head that pitches and turns and eyes that move, or its equivalents, so this carries over. The bubble's leader line starts at a dot on his head.
- 2026-10-03 — From [Name and voice the mascot](24-name-and-voice-the-mascot.md) (resolved; ADR 0008): he's **Tycho**, after Tycho Brahe, who catalogued the stars by eye. "He", a curious explorer, warm and plain, credible to recruiters: never cartoonish, no gushing. No new emotes are needed. The waiting state is "reading his notes", which the settled thinking emote (looking up and scanning the sky) already shows.
- 2026-10-04 — Round 1 built, waiting on Janriz: three body plans, modelled in Blender, on the real site at `localhost:3000/?tycho=probe|explorer|felis`. The take switcher (top left) flips between them. The lab (bottom left, "Tycho · …") plays every emote, the shoo sequence, think, hover, charge → doze → wake, each face, and his part of the warp. Details, evidence and the scripts are in [research/tycho-variants/](../research/tycho-variants/README.md).
  - **A, probe** (after JAXA's Int-Ball): a white ball with a round screen face, turning inside a graphite gimbal ring that holds his boosters. 52 KB gz.
  - **B, explorer** (after CIMON, a suited astronaut): a helmeted head with a visor, round sensor-pod ears, an egg torso with two short arms, a foil booster pack. 68 KB gz.
  - **C, felis** (a cat built as hardware): a wide head with sensor-fin ears, a small body, his antenna as a jointed tail that carries his mood. 49 KB gz.
  - All three share one node tree and one rig (`lib/tycho/rig.ts`). The eyes, beacon, charge band and thruster glow are the sky's energy colour, unlit. At 92 px every face reads: O, ^ ^, > <, spirals, shut.
  - **Ideas taken from the case studies:**
    - eyes as light on dark glass, not drawn on a cartoon face (US Avionix's emissive lines, Trionn's warm accents on dark hardware);
    - a chunky silhouette, because thin forms fade small (Hashgraph's particle figure);
    - anticipation, action and settle in every emote (Trionn's hold-to-blast);
    - banking into the warp's circle (US Avionix's flight).
  - **Ideas held for the finish:** panels that part over a lit core on hover (Hashgraph); the flat silhouette as the wake-up's first frame (US Avionix's match cut, *Finalize the wake-up*).
  - ➡️ **I'd pick A, the probe.** It's the closest to real flown hardware (Int-Ball is on the ISS), so it sits best with the documentary-real voyage and is credible to a recruiter. Its silhouette is the chunkiest at 92–128 px. The whole face is the screen, so every expression reads first. The ring holds the boosters naturally for the warp.
    - What tips it against B: the arms give the most body language, but at this size they're thin, and the plan reads as a generic toy robot.
    - Against C: the tail is a lovely cat nod, but it's hidden from the front and pushes towards cartoon.
    - A's cost: no arms, so he points by turning and leaning. If pointing needs more, a small arm can come out of a ring housing.
  - **For Janriz:** which plan, and anything to change in it before the finish pass (detail, occlusion, the ring's proportions)?
- 2026-10-04 — Janriz picked **B, the explorer**, over my pick (A): "I like B actually. It's more anthropomorphic. Body language is clearer." The explorer is now the default take. The probe and the cat stay on the switcher until this resolves. Next: the finish pass on B (detail, chunkier arms for 92–128 px, baked occlusion), shown in place before it resolves.
- 2026-10-04 — Round 2, the finish on both, waiting on Janriz. Janriz again: "probe is growing on me", "can we save the two just like the truss / ring for home", and asked for the finish on both. The switcher holds `explorer` (the default) and `probe`; the cat is off the site. Details: [research/tycho-variants/](../research/tycho-variants/README.md), "Round 2".
  - **The explorer** has a helmet with a recessed visor and a back shell, ribbed sensor ears, a bellows neck, and chunky arms with grippers. Also: a chest plate, and a foil pack with a handrail and latched hatches. 84 KB gz.
  - **The probe** has a face window cut into the ball, fan grilles, a bolted and grooved ring, panelled housings, and a skirt round the main bell. 63 KB gz.
  - Both get live soft shadows from the key light instead of baked occlusion, so a raised arm still shades his torso.
  - Every emote, face and the warp play on both (`shots/finish/`).
  - **For Janriz:** is the finish right on both? Which is the default when this resolves (the explorer today)? Anything to change?

## Answer

Resolved 2026-10-04 with Janriz. ADR 0009 records it; ADR 0002 gains two optimise flags; `CONTEXT.md`'s Tycho entry now describes him.

**The look: the explorer** ("It's more anthropomorphic. Body language is clearer."). The **probe** is kept on the switcher to change back to, as home keeps the ring ship ("can we save the two just like the truss / ring for home"). Both are finished, and Janriz judged the finish right on both. The cat is dropped; its script stays in the research folder.

- **The explorer:**
  - **Head:** a white helmet with a pale back shell; the visor of dark glass set into a recess in a graphite rim. Round sensor-pod ears with ribs and a lens. Vents at the back, and the antenna on a collar with the beacon.
  - **Torso:** a bellows neck, then an egg torso with a raised chest plate and the nav lights. The charge band (eight segments) runs round his collar.
  - **Arms:** chunky enough to read as gesture at 92–128 px. A shoulder cap and joint, a tapered upper arm, an elbow, a cuffed forearm, and a three-fingered gripper.
  - **Pack:** foil between frame bands, with an ISS-yellow handrail and two latched hatches over the pods. The main bell sits in a skirt under him.
  - **Size:** 27.3k triangles, 84 KB gzipped.
- **The probe:**
  - **Ball:** a white front shell and a pale back shell. The face is a window cut through the shell, with the glass and bezel behind it. Six fan grilles.
  - **Ring:** a grooved, bolted graphite gimbal ring. On each side a panelled housing with a latched hatch and a pod. A skirt round the main bell, and the antenna on a collar.
  - **Size:** 21.2k triangles, 63 KB gzipped.
- **Both:**
  - His eyes, beacon, charge band and thruster glow are the sky's energy colour `#ffa95a`, unlit and not tone mapped.
  - The key light casts a soft shadow map on his own canvas, so a raised arm shades his torso. There is no baked occlusion.
  - Every emote, every face and his part of the warp run on both on the real site. The take switcher swaps them, and the dev-only lab, bottom left, plays them. Evidence: `research/tycho-variants/shots/finish/`.

**What the build must know** (ADR 0009, and `research/tycho-variants/README.md`):
- **One node tree for both,** driven by `lib/tycho/rig.ts`:
  - `Tycho` > `Body` and `Head` (pitch and turn at the neck);
  - `EyeL`/`EyeR`, each holding one glyph per expression (`Open`, `Wide`, `Happy`, `Squeeze`, `Spiral`, `Shut`); a blink swaps them;
  - `Antenna` > `AntennaTip`;
  - `Lights` > `Charge0..7`;
  - `ArmL/R` > `ForearmL/R` > `HandL/R` (the explorer only);
  - the boosters: `HatchL/R`, `PodL/R` between `PodStowL/R` and `PodOutL/R`, `JetL/R`, `JetMain`, `ThrusterGlow`.
- **The rig's API:**
  - `emote(greet | anticipate | settle | notice | apologise | glance | scoot | allGood | flinch | point)`;
  - `face(x)`, `think()`/`relax()`, `talkBeat()`, `perk(on)`;
  - `charge(p)`, `doze()`, `wake()`;
  - `warp()`: the launch, the circle, the plunge and the arrival, on a stage canvas;
  - a pointer look-at.
- **Squash and stretch** is a scale on the pivot round his whole body; there are no morph targets.
- **Optimising:** ADR 0002's command plus `--prune false --palette false`. Meaningful materials need distinct values, or dedup merges them. Quantisation puts a scale on mesh nodes, so the rig hides a glyph relative to its rest scale.
- **Sources:** the Blender scripts are `research/tycho-variants/{tycholib,explorer,probe}.py`, rebuilt with `optimize.sh`. Round 1's are kept as `-v1`.
- **Not done here:**
  - frame cost with the shadow map (*Build Tycho in the film* measures it);
  - the wake-up's flat drawing (*Finalize the wake-up*);
  - his place and movement in the film (*Finalize Tycho in the film*).
