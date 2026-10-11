# 3D routes

Type: research
Labels: wayfinder:research
Status: resolved
Blocked by: —

## Question

What are the realistic routes to 3D assets for this site, and what does each cost in quality, effort, file size and runtime performance?

- **Blender MCP** — what it is (current primary repo/docs), its tools (scene control, Python execution, viewport screenshots, asset integrations), what it's good and bad at (hard-surface vs organic/character, rigging, animation), how an asset leaves Blender for the web (glTF/`.glb` export settings). Produce an **install checklist** Janriz can follow for *Set up Blender MCP* (Blender version, addon, MCP server config for Claude Code, how to verify).
- **Procedural in code** — Three.js directly vs React Three Fiber, in this repo's stack (Next.js 16 App Router, React 19); geometry, shaders, particles, instancing; how GSAP drives Three.js objects (GSAP stays the only animation library).
- **AI-generated models** — which generators have free tiers and licences that permit use on a public site; typical quality and cleanup needed.
- **Web pipeline** — compression (Draco / Meshopt / gltf-transform), texture formats (KTX2), lazy-loading after first paint, a transparent full-viewport overlay canvas and its cost, mobile GPU limits.
- **Feasibility of Janriz's seed idea** — a bot character always visible on the front layer, wandering the screen's edges and corners, interactable, as the AI entrypoint: modelling, animation (skeletal clips vs procedural look-at / idle / walk), pathing along viewport edges, hit-testing, performance of an always-on render loop, and the accessibility / reduced-motion fallbacks it would need.

Facts with primary sources, not a verdict — the verdict is *3D route verdict*.

## Answer

Full findings, citations and the install checklist: [../research/3d-routes.md](../research/3d-routes.md).

- **Blender MCP.** There are two projects. The community `mcp-for-blender` (MIT, PyPI 2.1.1) has scene and code tools, viewport screenshots, `export_scene` to GLB, and asset and AI integrations. The official Blender Lab server (GPL, Blender 5.1+) covers analysis, scripting and screenshots, with no export tool. Both use port 9876 and run unguarded Python. The LLM writes `bpy` code, which suits stylised hard-surface bots. Blender 5.2's glTF exporter does Draco or Meshopt; choose Meshopt **EXT**, because drei/three-stdlib can't read KHR.
- **Procedural.** R3F 9.8 and drei 10.7 fit React 19.2 and Next 16 through a client-only `next/dynamic` import. GSAP tweens three objects directly. `frameloop="never"` with `advance()` from `gsap.ticker` gives a single loop. It is open whether `AnimationMixer` clips count as "GSAP only".
- **AI models.** Free-tier licences: Meshy is CC BY 4.0 with credit; Tripo free is "Non-Commercial"; Rodin exports are paid; Hunyuan3D's licence excludes EU, UK and KR display; TRELLIS.2 is MIT but needs a 24 GB NVIDIA GPU. Expect dense triangle meshes that need decimation or retopo.
- **Web pipeline.** `gltf-transform optimize` defaults to meshopt plus texture resize. Decoders: meshopt 29 KB, Draco 250 KB, Basis 585 KB. A canvas is never the LCP element; import it after first paint. A full-viewport overlay pays fill cost on every pixel (5.2 M px at 1440×900 @2×), while a small travelling canvas costs about 2% of that.
- **Seed bot.** Feasible. The cheapest body is a non-humanoid hover bot (no rig, pure GSAP). Mixamo and Meshy rigging are humanoid-only. RobotExpressive is a CC0 rigged precedent, but Quaternius now uses QAL. It needs a WCAG 2.2.2 pause control, a proxy hit volume or DOM button, and a static HTML AI entrypoint as the keyboard and reduced-motion path. Precedents: oneko.js, Duolingo Lily (Rive), and Copilot's Mico (being retired from Copilot Voice).
