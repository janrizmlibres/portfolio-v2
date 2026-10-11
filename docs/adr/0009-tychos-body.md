# Tycho's body: a helmeted explorer, on one node tree

Status: accepted (2026-10-04)

*Model the mascot* modelled three body plans for Tycho in Blender, following ADR 0002's route for authored assets, and ran each through every emote and his part of the warp on the real site:
- **a probe:** a ball in a gimbal ring, after JAXA's Int-Ball;
- **an explorer:** a helmeted head on a torso with arms, after the ISS's CIMON and a suited astronaut;
- **a cat:** built as hardware, with his antenna as a tail.

I recommended the probe, as the most like real flown hardware. Janriz picked the explorer: "It's more anthropomorphic. Body language is clearer." He kept the probe to switch back to, as home keeps the ring ship, and had both finished.

## Decision

**Tycho is the explorer.** A white helmet, with a visor of dark glass set into a recess in a graphite rim. Round sensor pods for ears and an antenna on a collar. A bellows neck and an egg torso with a chest plate. Two chunky arms ending in three-fingered grippers. A foil pack of boosters on his back. The probe stays as a take until he says otherwise.
- **His body language does the work.** The arms are thick enough to read as gesture at 92–128 px: a wave, a point, a hand to the back of his head when he apologises. When his look or his emotes are shaped further, gesture wins over strict realism. His materials stay hardware (painted composite, black-anodised parts, foil, nav lights).
- **His face is light on glass.** His eyes are glyphs drawn on the visor, one per expression: Open, Wide, Happy, Squeeze, Spiral and Shut. A blink swaps them.
  - They're drawn in the sky's energy colour `#ffa95a`, unlit and not tone mapped, as ADR 0002's colour rule asks.
  - The same goes for the beacon on his antenna, the charge band round his collar (eight segments, which the wake-up fills as it loads) and his thrusters' glow.

**Every body plan shares one node tree,** and the one rig (`lib/tycho/rig.ts`) skips what a plan lacks.
- **The parts:**
  - `Body`;
  - `Head` (pitch and turn);
  - `EyeL`/`EyeR` with their glyphs;
  - `Antenna` > `AntennaTip`;
  - `Lights` > `Charge0..n`;
  - `ArmL/R` > `ForearmL/R` > `HandL/R`.
- **The boosters:**
  - `HatchL/R`, hinged at the top edge;
  - `PodL/R`, travelling between the `PodStowL/R` and `PodOutL/R` empties;
  - `JetL/R`, `JetMain`.
- **Squash and stretch** is a scale on the pivot round his whole body, so the model carries no morph targets.

**Shadows, not baked occlusion.** The key light casts one soft shadow map over his own small canvas. A baked map is right for a body that holds still, like the ship, but Tycho's arms and head move, and the shadow moves with them. The meaningful colours neither cast nor receive shadows.

## Considered options

- **The probe.**
  - **For:** the most like real hardware, and the chunkiest silhouette.
  - **Against:** no arms, so he could point only by turning, and the bow hid his face.
  - Kept as a take.
- **The cat.**
  - **For:** a nod to Janriz's cats.
  - **Against:** the tail that carried his mood was hidden from the front, and the plan leaned cartoonish.
  - Dropped.
- **Baked ambient occlusion,** as on the truss ship. Rejected because it's wrong once he moves, and costs a texture.

## Consequences

- **His weight:** the explorer is 84 KB gzipped (27k triangles) and the probe 63 KB. The stand-in it replaces was 98 KB.
- **Optimising** needs `--prune false` and `--palette false` on top of ADR 0002's command, which now says so.
- **The wake-up's flat drawing** must match the explorer's first frame.
- **The warp's rebuild** uses his launch, plunge and arrival as the rig plays them: hatches, pods, the circle, eyes going from > < to spirals and then to O, and a squash on landing.
