# 3D route verdict

Type: prototype
Labels: wayfinder:prototype
Status: resolved
Blocked by: 08, 09

## Question

Which route should this site's 3D assets take: Blender MCP, procedural in code, AI-generated, or a mix?

Build the **same small test asset** — a simple bot, since it is the most demanding plausible case — through Blender MCP (exported `.glb`) and procedurally in Three.js, render both in one throwaway page, and compare: visual quality, effort, file size, animatability, frame cost. Janriz reacts; the answer is the route (and for what kind of asset each route is used).

Also settle, from *3D routes*' "Open questions for the verdict" (`research/3d-routes.md`): whether glTF `AnimationMixer` clips count as "GSAP only" or must be replaced by GSAP-driven motion, and R3F vs plain three.js for this site.

## Answer

Decided by Janriz on 2026-09-27, after reacting to the prototype. Prototype, measurements and a consolidated record of the bpy code: [../prototypes/3d-route-verdict/](../prototypes/3d-route-verdict/README.md). Run `serve.sh` there and open `http://127.0.0.1:4173/`. The tracker is untracked, so the prototype lives in this folder rather than on a throwaway branch.

**The route depends on the kind of asset:**
- **Authored 3D assets** (the bot or persona, any hero object) are made **in Blender through Blender MCP**. They ship as `.glb` with a named node tree and flat PBR materials, with no textures unless a design needs one.
- **Generative 3D** (particles, instanced fields, shader surfaces, shapes whose parameters change at runtime) is written **procedurally in three.js**.
- **AI-generated models never ship.** At most one is a reference or blockout to model over in Blender.
- **Library assets play supporting roles only, never the bot** (added by Janriz on 2026-09-27; libraries were not among the routes compared).
  - Allowed: Poly Haven HDRIs to light Blender renders and stills, props or set dressing if the concept puts the bot in a scene, and starting points to restyle in Blender. All available through Blender MCP.
  - Licences: CC0 first (Poly Haven, most of Poly Pizza). CC-BY needs a visible credit. Never non-commercial (NC) licences, which Sketchfab often uses.
  - Anything that ships is restyled to the palette and goes through the same export and optimise pipeline.
  - Mind the weight. Poly Haven's `potted_plant_01` is about 6 MB with 1k textures, against 36 KB for the bot. On the page, a 1k HDRI is about 1.5 MB against 0 bytes for three's code-generated `RoomEnvironment`, so it ships only if the concept wants realistic reflections.
  - Hyper3D Rodin and Hunyuan 3D, also in the MCP panel, count as AI generation. The prototype used Stable Fast 3D, the weakest option, so the "lumpy" finding is soft for these. One fused mesh with no parts to animate is probably still what they return.

**Motion: GSAP authors it, and clips are for deformation only.**
- All motion is GSAP tweens on named nodes and pivots.
- Baked glTF clips are allowed only for motion GSAP can't author well: skinned (skeletal) or shape-key motion. They play through an `AnimationMixer` advanced from `gsap.ticker`, and GSAP tweens the action weights and time.
- A rig-less bot needs no clips.
- Each motion layer owns its own property, or its own pivot node. In the prototype, the baked Idle clip owned the head's rotation, so pointer look-at had to be switched off while clips played. The GSAP version layers bob, sway, look-at, greet and blink through separate properties and a `lift` proxy.

**Renderer: plain three.js, not React Three Fiber.**
- It is one client component, imported after first paint and rendered from a `gsap.ticker` listener.
- React reaches it through a small imperative handle and the tool-effect bus.
- R3F measured +102 KB gzip over plain three for the same scene. About 50 KB of that is lost tree-shaking, because fiber's `extend(THREE)` keeps all of three. The rest is fiber and its inlined reconciler. drei adds only about 3 KB on top.

**What the prototype measured.** Headless Chromium on Metal, a 480 px canvas at DPR 2. "Renders" is how many times the scene is drawn per frame (a cost amplifier).

| | A: Blender `.glb` | B: procedural | C: AI (Stable Fast 3D) |
|---|---|---|---|
| gzip download | 35.9 KB, plus GLTFLoader and the 7 KB meshopt decoder | 1.6 KB | 255.8 KB (160 KB of it texture) |
| Triangles · draw calls | 13.7k · 14 | 12.6k · 14 | 15.1k · 1 |
| GPU per frame, 1 / 20 renders | 0.88 / 12.9 ms | 0.87 / 12.3 ms | 0.92 / 11.5 ms |
| Structure | named nodes; GSAP code and clips both work | named nodes | one fused mesh, features painted into the texture |

Runtime JS over a React + GSAP baseline, measured with esbuild (indicative):

| | gzip |
|---|---|
| plain three | +172 KB |
| R3F | +274 KB |
| R3F + drei | +277 KB |

- **A and B look the same and draw the same.** Frame cost does not separate the routes. Blender won on:
  - a viewport feedback loop (a screenshot caught a broken visor);
  - a `.blend` that can be edited by hand;
  - shapes that primitives can't make, which matters if the persona turns out organic;
  - one source for stills and pre-rendered frames.
- **C** (Stable Fast 3D) was lumpy off the front: blotchy ears, a sliver antenna, the floating gap filled in. It had no parts to animate and was 7× A's size. Its licence also requires a "Powered by Stability AI" notice. TRELLIS.2 ran out of its anonymous ZeroGPU quota.
- All 3D loads after first paint, so none of it counts toward LCP.

**Pipeline defaults** (learnt while building A):
1. **Blender export.** Use `export_merge_animation='NLA_TRACK'`, with one NLA track per clip name. The default merges by action name and would split clips per object. Leave texcoords off when there are no textures. Turn backface culling on in the materials, or every material exports double-sided.
2. **Optimise.** Run `gltf-transform optimize --compress meshopt --flatten false --join false`. The default `--flatten --join` collapses the named node tree that GSAP targets. The result is Meshopt **EXT** plus quantisation: 273 KB → 74.6 KB (36 KB gzip).
3. **Tone mapping shifts the accent.** Under AgX (both Blender's and three's), the `#FF5A1F` eyes read salmon. The spec needs a colour-fidelity rule for 3D accents: for example unlit or emissive-only accent materials, or a different tone mapping.

**Left for other tickets:**
- Canvas shape (full overlay vs a small travelling canvas) and bot body plan hang on *Pick the creative concept*.
- Verifying the frame budget on real devices is the "Performance baseline" fog.
