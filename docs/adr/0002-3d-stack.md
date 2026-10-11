# The 3D stack: plain three.js, GSAP-authored motion, and assets by kind

Status: accepted (2026-09-27), colour-fidelity rule added 2026-09-29, optimise flags added 2026-10-04

The universe is drawn with **plain three.js**, not React Three Fiber. It is one client component, imported after first paint and rendered from a `gsap.ticker` listener; React reaches it through a small imperative handle and the tool-effect bus. For the same scene R3F cost +102 KB gzip over plain three (+274 KB against +172 KB over a React + GSAP baseline). About half of that is lost tree-shaking, because fiber's `extend(THREE)` keeps all of three, and the rest is fiber and its inlined reconciler. The site has one canvas and no need for a declarative scene graph, so R3F would buy nothing that weight is worth.

## Motion: GSAP authors it

All motion is GSAP tweens on named nodes and pivot nodes. Baked glTF clips are allowed only for what GSAP can't author well: skinned (skeletal) or shape-key deformation. They play through an `AnimationMixer` advanced from `gsap.ticker`, and GSAP tweens the actions' weights and time, so there is one clock. A rig-less bot needs no clips.

Each motion layer owns its own property or its own pivot node. When a baked idle clip owned the head's rotation, pointer look-at had to be switched off while it played; separate properties (bob, sway, look-at, greet, blink, a `lift` proxy) layer cleanly.

## Assets: the route depends on the kind

- **Authored assets** (the bot, any hero object) are made in Blender through Blender MCP. They ship as `.glb` with a named node tree and flat PBR materials, with no textures unless a design needs one.
  - Export with `export_merge_animation='NLA_TRACK'`, one NLA track per clip, no texcoords when there are no textures, and backface culling on (otherwise every material exports double-sided).
  - Optimise with `gltf-transform optimize --compress meshopt --flatten false --join false`. The default `--flatten --join` collapses the named node tree that GSAP targets. The result is Meshopt EXT plus quantisation: the test bot went from 273 KB to 36 KB gzip.
  - Add `--prune false --palette false` (2026-10-04, ADR 0009):
    - prune drops empty leaf nodes, and the rig aims at empties (a jet, a pod's stowed and deployed marks);
    - the palette merges materials and drops their names, and the meaningful colours are found by name.

    Give each meaningful material distinct values, or dedup merges two of them.
  - Quantisation puts a scale on each mesh node. So animate a mesh node's scale relative to its rest scale, never to 1.
- **Generative 3D** (particles, instanced fields, shader surfaces, shapes whose parameters change at runtime) is written in three.js code. Procedural surfaces are baked once at load, not evaluated live: one planet cost 9 ms of GPU per frame until it was baked.
- **AI-generated models never ship.** At most one serves as a reference or blockout to model over in Blender.
- **Library assets** play supporting roles only, never the bot: HDRIs to light renders, props or set dressing, starting points to restyle. CC0 first; CC-BY needs a visible credit; never a non-commercial licence. Anything that ships is restyled to the palette and goes through the same export and optimise pipeline, and its weight is justified (a 1k HDRI is about 1.5 MB against 0 bytes for three's code-generated `RoomEnvironment`).

## Colour fidelity

Tone mapping shifts saturated colours, and colour on this site carries meaning (warmth is energy, a lit star is one the agent explored). So:

- lit surfaces use **Khronos PBR Neutral** tone mapping;
- any colour that carries meaning (energy, the bot's eyes, a lit star) is drawn **unlit and not tone mapped** (`MeshBasicMaterial`, `toneMapped: false`), and is written as a display value.

Measured on a stand-in bot and three swatches, read back as pixels (ΔE in OKLab ×100):

| Set-up | ΔE |
|---|---|
| AgX | 8–11 (`#ff5a1f` shows as `#d78264`, and white goes grey) |
| Neutral | 3–4 |
| Neutral, meaningful colours unlit | 0 |

## Considered options

- **React Three Fiber (+ drei).** Rejected for the weight above; drei itself adds only about 3 KB.
- **`AnimationMixer` clips for all motion.** Rejected: clips fight pointer-driven and state-driven motion for the same properties, and a second clock drifts from GSAP's.
- **Everything procedural in code.** It drew the same as the Blender bot at 1.6 KB, but Blender won on a viewport feedback loop, a hand-editable `.blend`, shapes primitives can't make, and one source for stills and pre-rendered frames.
- **AI-generated models.** Rejected: lumpy from off-angles, one fused mesh with no parts to animate, 7× the size (texture-heavy), and licence notices.
- **AgX tone mapping** (three's and Blender's default look). Rejected for the colour shift above.

## Consequences

- All 3D loads after first paint and never counts toward LCP.
- The GLTFLoader and the 7 KB meshopt decoder ship with the first authored asset.
- A new colour that carries meaning must be added as an unlit, non-tone-mapped material, never as a lit one tuned by eye.
