# 3D routes: research findings

Ticket: [08 — 3D routes](../issues/08-3d-routes.md) · researched 2026-09-27 · facts, not a verdict (the verdict is [10 — 3D route verdict](../issues/10-3d-route-verdict.md)).

**Method.** Every claim is cited to the source that owns it: official docs, source code at a pinned tag or `main` on the research date, first-party terms and pricing pages. Anything I worked out myself is marked **(analysis)**. Anything I could not confirm at a primary source is marked **(unverified)** and collected at the end. Library API facts came through Context7 first, then the source repos.

**Version snapshot (2026-09-27).**

| Thing | Version / date | Source |
|---|---|---|
| This repo | Next 16.2.4, React 19.2.4, gsap ^3.15.0, @gsap/react ^2.1.2, no three.js yet | `package.json` |
| three | 0.186.1 (r186, released 2026-09-24) | [npm](https://registry.npmjs.org/three), [GitHub releases](https://github.com/mrdoob/three.js/releases) |
| @react-three/fiber | 9.8.1 (2026-09-24). Peer: `react >=19 <19.4`, `three >=0.156`. v10 exists only as `alpha`/`canary` | [npm](https://registry.npmjs.org/@react-three/fiber) |
| @react-three/drei | 10.7.9 (2026-09-25). Peer: `react ^19`, `@react-three/fiber ^9`. v11 is `alpha` | [npm](https://registry.npmjs.org/@react-three/drei) |
| @gltf-transform/cli | 4.5.0 (2026-09-01) | [npm](https://registry.npmjs.org/@gltf-transform/cli) |
| Blender | 5.2 LTS, released 2026-07-14. **5.2.2 is installed** at `/Applications/Blender.app` but has never been launched (no `~/Library/Application Support/Blender/`) | [blender.org 5.2](https://www.blender.org/download/releases/5-2/), local check |
| uv / uvx | 0.12.10 at `/opt/homebrew/bin/uvx` (already installed) | local check |
| MCP for Blender (community) | PyPI `mcp-for-blender` 2.1.1, uploaded 2026-09-27 | [PyPI](https://pypi.org/project/mcp-for-blender/) |
| Blender Lab MCP (official) | v1.0.3 "Screenshot Fix", 2026-09-11 | [releases API](https://projects.blender.org/lab/blender_mcp/releases) |

---

## 1. Blender MCP

### 1.1 There are now two "Blender MCP" projects

| | **MCP for Blender** (community) | **Blender Lab MCP** (official) |
|---|---|---|
| Repo | [ahujasid/mcp-for-blender](https://github.com/ahujasid/mcp-for-blender), renamed from `ahujasid/blender-mcp`. The PyPI package was renamed `blender-mcp` → `mcp-for-blender`, and `uvx blender-mcp` still works ([README](https://github.com/ahujasid/mcp-for-blender#quickstart), [issue #366](https://github.com/ahujasid/mcp-for-blender/issues/366)) | [projects.blender.org/lab/blender_mcp](https://projects.blender.org/lab/blender_mcp), with docs at [blender.org/lab/mcp-server](https://www.blender.org/lab/mcp-server/) |
| Maintainer | Siddharth Ahuja. The README says it is "a third-party integration and not made by Blender" | Blender Lab (`maintainer = "Blender Lab"` in [blender_manifest.toml](https://projects.blender.org/lab/blender_mcp/src/branch/main/addon/blender_mcp_addon/blender_manifest.toml)) |
| Licence | MIT ([pyproject](https://github.com/ahujasid/mcp-for-blender/blob/main/pyproject.toml)) | GPL-3.0-or-later (manifest) |
| Latest | No GitHub releases or tags. PyPI 2.1.1 on 2026-09-27. The legacy PyPI name `blender-mcp` stopped at 2.0.0 on 2026-09-16 ([PyPI JSON](https://pypi.org/pypi/mcp-for-blender/json)). 29.4k GitHub stars | Tags v0.1.0 (2026-03-24), v1.0.0 (2026-04-27), v1.0.2 (2026-09-08), v1.0.3 (2026-09-11). The in-repo manifest still reads 1.0.0 for the add-on and 1.0.2 for the MCP server |
| Min Blender | 3.0 (README prerequisites; `bl_info["blender"] = (3, 0, 0)` in [addon.py](https://github.com/ahujasid/mcp-for-blender/blob/main/addon.py)) | 5.1.0 (`blender_version_min`) |
| Aimed at | Prompt-driven modelling, scene building, asset fetching and AI model generation (README "Features") | "Scene analysis and performance optimization, data-block renaming, … scene debugging, … code execution" ([Lab page](https://www.blender.org/lab/mcp-server/)) |
| Relation to Claude | Setup instructions for Claude Desktop, Claude Code, Codex, Cursor and others | Anthropic's post of 2026-04-28 says "The Blender developers have created an MCP connector, which is now officially available for Claude" ([Anthropic](https://www.anthropic.com/news/claude-for-creative-work)). That this connector *is* the Lab repo is **(analysis)**: same organisation, and Lab v1.0.0 shipped 2026-04-27 |
| Default port | 9876 (`BLENDER_PORT`, README) | 9876 (`DEFAULT_PORT` in `mcp_to_blender_server.py`) |

In short, "Blender MCP" in the ticket and in most tutorials means the community project. It is the one with modelling, asset and export tools. The official Lab server is narrower (inspect, script, screenshot) and GPL.

### 1.2 Tools

**Community ([server.py](https://github.com/ahujasid/mcp-for-blender/blob/main/src/blender_mcp/server.py), `@mcp.tool` functions on `main`):**
- Scene: `get_scene_info`, `get_object_info`, `get_viewport_screenshot` (PNG, `max_size` default 1000), `get_addon_status`
- Code: `execute_blender_code` (arbitrary Python), `describe_node_type`, `bpy_api_lookup`
- Export: `export_scene` writes GLB or FBX from the whole scene, the selection or named objects. Its docstring says GLB "keeps PBR materials, emission, skins, shape keys, animation", and to pass `apply_modifiers: false` "for rigged / shape-key meshes"
- Poly Haven: `get_polyhaven_categories`, `search_polyhaven_assets`, `get_polyhaven_asset_preview`, `download_polyhaven_asset`, `set_texture`
- Sketchfab: `search_sketchfab_models`, `get_sketchfab_model_preview`, `download_sketchfab_model`
- Poly Pizza: `search_polypizza_models`, `download_polypizza_model`
- AI generation: Hyper3D Rodin (`generate_hyper3d_model_via_text`, `…_via_images`, `poll_rodin_job_status`, `import_generated_asset`), Hunyuan3D (`generate_hunyuan3d_model`, poll, import), Tripo (`generate_tripo_model`, poll, import)
- Misc: `disable_telemetry`, `record_trajectory_feedback`

**Blender Lab** ([mcp/blmcp/tools/](https://projects.blender.org/lab/blender_mcp/src/branch/main/mcp/blmcp/tools)): `execute_blender_code`, `get_blendfile_summary_*` (datablocks, missing files, linked libraries, path info, usage guess), `get_objects_summary`, `get_object_detail_summary`, `get_screenshot_of_area_as_image`, `get_screenshot_of_window_as_image` / `_as_json`, `jump_to_tab_by_name` / `_by_space_type`, `jump_to_view3d_object_by_name` / `_data_by_name`, `render_thumbnail_to_path`, `render_viewport_to_path`, `get_python_api_docs`, `search_api_docs`, `search_manual_docs`. The Blender API reference and the user manual ship as bundled resources ([README](https://projects.blender.org/lab/blender_mcp/src/branch/main/mcp/README.md)). It has no asset integrations and no dedicated export tool, so export would go through `execute_blender_code` **(analysis)**.

### 1.3 Asset integrations in the community project, and which are free

| Integration | Cost / key | Licence of what you get | Source |
|---|---|---|---|
| Poly Haven (HDRIs, textures, models) | Free, no key, no account | CC0: "You can use our assets for any purpose, including commercial work. You do not need to give credit" | [README](https://github.com/ahujasid/mcp-for-blender#poly-haven), [polyhaven.com/license](https://polyhaven.com/license) |
| Poly Pizza (~10.6k low-poly models) | Free API key | "about 69% of the Poly Pizza catalogue is CC-BY, which *requires* you to credit the creator". The search tool can filter `licence="CC0"` | [README](https://github.com/ahujasid/mcp-for-blender#poly-pizza) |
| Sketchfab | API key | Licence varies per model. Not researched model by model **(unverified)** | README |
| Hyper3D Rodin | The add-on ships a "Set Free Trial API Key" button (`RODIN_FREE_TRIAL_KEY` in addon.py). With your own account, the free plan is "pay by result" at $1.5 per credit, and "Unlimited export and any use" is a paid-plan row | [addon.py](https://github.com/ahujasid/mcp-for-blender/blob/main/addon.py), [hyper3d.ai/pricing](https://hyper3d.ai/pricing) |
| Hunyuan3D | Tencent Cloud SecretId/SecretKey (a cloud API account) or a local server | See §3 for the licence territory clause | README |
| Tripo | API key or the project's paid "Premium" | Free Tripo output is "Non-Commercial Use" (§3) | README "Premium", [tripo3d.ai/pricing](https://www.tripo3d.ai/pricing) |

### 1.4 What it is good and bad at

What the docs say:
- The README's example prompts are almost all low-poly or scene-assembly work: "low poly scene in a dungeon", "beach vibe using HDRIs, textures, and models … from Poly Haven", "make this car red and metallic", "make the lighting like a studio" ([README examples](https://github.com/ahujasid/mcp-for-blender#example-commands)).
- Limits the README states itself: "Complex operations might need to be broken down into smaller steps". Timeouts: "Try simplifying your requests". "`execute_blender_code` … can be powerful but potentially dangerous … ALWAYS save your work before using it" ([Limitations](https://github.com/ahujasid/mcp-for-blender#limitations--security-considerations)).
- The Lab project describes its purpose as analysis, debugging and batch scripting, not modelling ([Lab page](https://www.blender.org/lab/mcp-server/)).

**(analysis)** Both servers work by having the LLM write `bpy` Python. That favours:
- **Hard-surface and stylised work:** primitives, modifiers (bevel, subdivision, mirror, boolean), geometry nodes, materials, lights, cameras.
- **Rigging by script:** armatures and bone parenting can be built in code. Blender's bundled Rigify "only automates the creation of the rig controls and bones. It does not attach the rig to a mesh, so you still have to do skinning etc. yourself" ([Rigify intro](https://docs.blender.org/manual/en/latest/addons/rigify/introduction.html)).
- **Keyframed animation:** any property can be keyframed in code.

It does not suit organic sculpting (brush strokes), clean character topology, or weight painting that needs a human eye. The loop depends on viewport screenshots for feedback, so the result is only as good as the model's visual judgement. I found no primary benchmark of character or rig quality through either MCP **(unverified)**.

### 1.5 Getting an asset out of Blender for the web (Blender 5.2 LTS manual)

Source for this whole subsection: [glTF 2.0 add-on page, Blender 5.2 LTS manual](https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html).
- **Format.** "glTF Binary (.glb) … a single .glb file with all mesh data, image textures, and related information packed into a single binary file." The other option is glTF Separate (.gltf + .bin + textures). Quads and n-gons are triangulated. Curves must be converted to meshes.
- **Mesh compression, built into the exporter.** *Draco* ("Compression Level", quantization for position, normal, texcoord, color and generic) and, new in the current manual, *Meshopt* ("Choose between EXT_meshopt_compression and KHR_meshopt_compression").
  - **Pitfall:** drei's `useGLTF` loads through `three-stdlib`, whose GLTFLoader (npm 2.36.1, 2025-11-10) supports `EXT_meshopt_compression` but **not** `KHR_meshopt_compression`. three.js r186's own GLTFLoader supports both ([three-stdlib GLTFLoader](https://github.com/pmndrs/three-stdlib/blob/main/src/loaders/GLTFLoader.js), [three r186 GLTFLoader](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/loaders/GLTFLoader.js)). So pick **EXT** if the model is loaded through drei.
- **Materials.** "The exporter supports Metal/Rough PBR (core glTF) and Shadeless (KHR_materials_unlit)". It builds the glTF material "based on the nodes it recognizes". Images: PNG/JPEG, or WebP ("all textures will be saved as WebP, without any png/jpg fallback"), with "Image Quality" for JPEG/WebP. Also exported: `KHR_materials_emissive_strength`, `…transmission`, `…clearcoat`, `…sheen`, `…specular`, `…ior`, `…volume`, `…anisotropy`, `…dispersion`, `…variants`, `KHR_texture_transform`, `EXT_mesh_gpu_instancing`. "Blender's Area light type and World lighting are not supported by glTF."
- **Animation.**
  - Modes: Actions (default), Active Actions merged, NLA Tracks, Scene. In Actions mode an action is exported if it is active or stashed on an NLA track: "If you have multiple actions you want to export, make sure they are stashed!"
  - Only "Object transform (location, rotation, scale), Pose bones, Shape key values" animate. "Animation of other properties, like physics, lights, or materials, will be ignored."
  - Useful options: Sampling Rate, Optimize Animation Size, "Set all glTF Animation starting at 0" (for loops), "Export Deformation Bones only" (drops Rigify control bones), and Bone influences ("Models may appear incorrectly in many viewers with value different to 4 or 8").
- **Other.** Y Up (glTF convention), Apply Modifiers, Custom Properties → glTF extras, Punctual Lights (`KHR_lights_punctual`), "Remember Export Settings".

---

## 2. Procedural in code

### 2.1 Compatibility with this repo
- "@react-three/fiber@8 pairs with react@18, @react-three/fiber@9 pairs with react@19" ([R3F installation](https://github.com/pmndrs/react-three-fiber/blob/master/docs/getting-started/installation.mdx)). R3F 9.8.1 peers `react >=19 <19.4`, and the repo is on 19.2.4 ✓. drei 10.x peers `@react-three/fiber ^9` ✓ ([npm](https://registry.npmjs.org/@react-three/drei)).
- For Next.js, R3F says it "should work out of the box but you will encounter untranspiled add-ons in the three.js ecosystem". The fix is `transpilePackages: ['three']` in `next.config` (same installation page).
- R3F v10 / drei v11 are alpha only. WebGPU is where they are heading, but it is not the stable line **(analysis from npm dist-tags)**.

### 2.2 The App Router pattern
- WebGL cannot run on the server, so the canvas lives in a `"use client"` component loaded with `next/dynamic(..., { ssr: false })`. The Next 16.2.4 docs say "`ssr: false` option is not supported in Server Components … Please move it into a Client Component" ([lazy-loading guide](https://nextjs.org/docs/app/guides/lazy-loading); local copy `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`). Deferring the import until after first paint is covered in §4.3.
- R3F's `<Canvas>` creates a WebGLRenderer with "antialias=true, alpha=true, powerPreference="high-performance"", sRGB output and ACES tone mapping. `dpr` defaults to `[1, 2]`. `frameloop` defaults to `always` ([Canvas docs](https://github.com/pmndrs/react-three-fiber/blob/master/docs/API/canvas.mdx)). A transparent overlay is therefore the default.
- drei's `useGLTF` pulls the Draco decoder from `https://www.gstatic.com/draco/versioned/decoders/1.5.5/` unless you pass a path ([drei Gltf.tsx](https://github.com/pmndrs/drei/blob/master/src/core/Gltf.tsx)). That is a third-party runtime request. Self-hosting means copying `three/examples/jsm/libs/draco/gltf/` into `public/`.

### 2.3 three.js directly vs React Three Fiber (+ drei)

| | three.js directly | R3F + drei |
|---|---|---|
| What you write | Renderer, resize, DPR, render loop, raycasting and disposal, all by hand inside a `useEffect` **(analysis)** | Declarative scene. Resize, DPR range, pointer-event raycasting and loader caching come built in ([events](https://github.com/pmndrs/react-three-fiber/blob/master/docs/API/events.mdx), [pitfalls: useLoader caching](https://github.com/pmndrs/react-three-fiber/blob/master/docs/advanced/pitfalls.mdx)) |
| React integration | Manual bridge from the chat store to scene state | Components read React state directly. Suspense covers loading |
| Helpers | three addons (GLTFLoader, KTX2Loader, MeshoptDecoder) | `useGLTF` (Draco and Meshopt on by default), `useAnimations`, `<Html>` (DOM pinned to a 3D point), `<View>` (several scissored views on one canvas), `PerformanceMonitor` ([drei docs](https://github.com/pmndrs/drei/tree/master/docs)) |
| Bundle (indicative) | three r186 prebuilt WebGL build via jsDelivr's minifier: `three.core` 416 KB raw / 104 KB gzip plus `three.module` 393 KB / 90 KB, about **194 KB gzip** before tree-shaking (measured) | three, plus R3F's bundled reconciler chunk `events-*.esm.js` at 710 KB unminified, 417 KB minified, 125 KB gzip. That is an upper bound, because a production build drops dev branches (measured). Measure the real Next build before trusting either number |
| Caveat | None | R3F's own docs recommend "lerp + useFrame" or **react-spring** for animation ([pitfalls](https://github.com/pmndrs/react-three-fiber/blob/master/docs/advanced/pitfalls.mdx)). Both clash with the GSAP-only rule and have to be designed out (§2.5) |

### 2.4 Geometry, shaders, particles, instancing
- **Draw calls.** R3F guidance: "Each mesh is a draw call … no more than 1000 as the very maximum, and optimally a few hundred or less … instancing … hundreds of thousands of objects in a single draw call" ([scaling-performance](https://github.com/pmndrs/react-three-fiber/blob/master/docs/advanced/scaling-performance.mdx)). A single bot is a handful of draw calls **(analysis)**.
- **Reference examples in three r186:** instancing (`webgl_instancing_dynamic`, `_performance`, `_raycast`, `_scatter`), points and particles (`webgl_points_sprites`, `_waves`, `_dynamic`), morph targets (`webgl_morphtargets_*`), skinning (`webgl_animation_skinning_blending`, `_additive_blending`, `_morph`, `_ik`), and an OffscreenCanvas worker (`webgl_worker_offscreencanvas`) ([examples tree at r186](https://github.com/mrdoob/three.js/tree/r186/examples)).
- **Worker rendering.** OffscreenCanvas is supported in Safari 16.4+, Chrome 69+ and Firefox 105+ ([MDN BCD](https://github.com/mdn/browser-compat-data/blob/main/api/OffscreenCanvas.json)). The R3F wrapper `@react-three/offscreen` was last published 2023-05-11 (0.0.8) ([npm](https://registry.npmjs.org/@react-three/offscreen)), so it is stale.

### 2.5 GSAP as the only animation driver
- GSAP tweens "generic object[s]", not only DOM ([gsap.to](https://gsap.com/docs/v3/GSAP/gsap.to())). That covers `mesh.position`, `mesh.rotation`, `material.uniforms.uTime` (tween `.value`), and an `AnimationAction`'s weight or timeScale. `gsap.quickTo()` is the fast path for a value that is re-targeted often, such as a head following the pointer ([quickTo](https://gsap.com/docs/v3/GSAP/gsap.quickTo())). MotionPathPlugin can "animate any object along a defined path … arrays of x and y coordinates" ([MotionPathPlugin](https://gsap.com/docs/v3/Plugins/MotionPathPlugin)).
- **gsap.ticker** is "driven by `requestAnimationFrame`". Listeners run "after the core GSAP engine updates" and receive `(time [s], deltaTime [ms], frame)`. When the tab is hidden, updates "get throttled down significantly" ([gsap.ticker](https://gsap.com/docs/v3/GSAP/gsap.ticker)). `gsap.ticker.fps(n)` limits the whole ticker, which means every GSAP animation on the page (same page).
- Three ways to wire it:
  1. **R3F `frameloop="never"`, rendered from the GSAP ticker.** In R3F 9.8.1's [loop.ts](https://github.com/pmndrs/react-three-fiber/blob/master/packages/fiber/src/core/loop.ts), `advance(timestamp)` runs every `useFrame` subscriber and then renders. With `frameloop='never'` the timestamp becomes `clock.elapsedTime` directly, which is seconds, so it lines up with the ticker's `time` **(analysis from source)**. The result is one loop: GSAP updates first, then the frame renders.
  2. **`frameloop="demand"` with `invalidate()` in tween `onUpdate`.** Frames render only while something moves ([scaling-performance](https://github.com/pmndrs/react-three-fiber/blob/master/docs/advanced/scaling-performance.mdx)). This does nothing for a bot that never stops moving.
  3. **Default `always`.** R3F's rAF and GSAP's rAF run side by side. Order within a frame is not guaranteed, so a one-frame lag is possible **(analysis)**.
- **Where `useFrame` still sits.** drei's `useAnimations` advances the mixer inside `useFrame((state, delta) => mixer.update(delta))` ([source](https://github.com/pmndrs/drei/blob/master/src/core/useAnimations.tsx)). That keeps working under option 1, because `advance()` calls the subscribers.
- **Open question for the verdict:** does playing baked glTF clips through `AnimationMixer` count as "an animation library"? GSAP can own the clock (`mixer.update(dt)` from the ticker, or tweening `action.time` and `action.weight`), but the keyframes come from the clip.

---

## 3. AI-generated models

| Generator | Free tier | Licence on free output | On a public portfolio? | Source |
|---|---|---|---|---|
| **Meshy** | 100 credits/month. Download limit "10 Meshy 6 Lite models / month". 1 concurrent task | "Meshy owns all right, title, and interest … in and to the Customer Output and makes such rights available to free plan customers under the … CC BY 4.0 License … as long as the free plan customer provides appropriate credit to Meshy" (Terms, updated 2026-09-19). Pricing: "CC BY 4.0 license (commercial use with attribution)". Paid plans: the customer owns the output | **Yes, with credit to Meshy** | [terms-of-use](https://www.meshy.ai/terms-of-use), [pricing](https://www.meshy.ai/pricing) |
| **Tripo** | 200 credits/month (≈13 models) | Pricing page Free column: "Public Models · Non-Commercial Use". Pro and up: "Private Models · Commercial Use". The Terms page sits behind a Cloudflare bot check and could not be read | **Only if a personal portfolio counts as non-commercial. Ambiguous for a job-seeking site; ask or pay** | [pricing](https://www.tripo3d.ai/pricing) |
| **Hyper3D Rodin** | "Generate for free before confirmation". Direct credits $1.5 each. 10 private assets | "Unlimited export and any use" and "Commercial license included" appear only in paid tiers | **Not free in practice: exporting costs credits** | [pricing](https://hyper3d.ai/pricing) |
| **Hunyuan3D 2.1** (open weights, run locally or through the cloud API) | Free weights | "Tencent claims no rights in Outputs". **But:** "THIS LICENSE AGREEMENT DOES NOT APPLY IN THE EUROPEAN UNION, UNITED KINGDOM AND SOUTH KOREA", and "You must not use, reproduce, modify, distribute, or display the … Output … outside the Territory". There is also a clause for services over 1M MAU | **Risky: a public site displays output to EU, UK and KR visitors** | [LICENSE](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1/blob/main/LICENSE) |
| **TRELLIS.2** (Microsoft, 4B, image→3D) | Free weights plus an HF Space demo | MIT | **Yes**, but it needs "an NVIDIA GPU with at least 24GB of memory", so this Mac can only use the hosted demo | [README](https://github.com/microsoft/TRELLIS.2), [HF Space](https://huggingface.co/spaces/microsoft/TRELLIS.2) |
| **Stable Fast 3D** (Stability) | Free weights | Stability AI Community License: free for commercial use under US$1M revenue, with registration. "You own any outputs". You must display "Powered by Stability AI" | Yes, with conditions | [LICENSE.md](https://github.com/Stability-AI/stable-fast-3d/blob/main/LICENSE.md) |
| TripoSR / TripoSG (VAST, open) | Free weights | MIT | Yes. Older and lower fidelity **(unverified quality claim)** | [TripoSR](https://github.com/VAST-AI-Research/TripoSR) |

**Output quality and cleanup, per the vendors' own docs:**
- **Meshy API:** the default `topology` is `"triangle"` ("a decimated triangle mesh"). `"quad"` is available only through remesh. `target_polycount` defaults to 30,000 (range 100–300,000), or 4,000 with Smart Topology ([text-to-3d API](https://docs.meshy.ai/en/api/text-to-3d)).
- **TRELLIS.2:** the sample export uses `decimation_target = 1000000` and `texture_size = 4096`. The GLB is "exported in `OPAQUE` mode by default … manually connect the texture's alpha channel" ([README](https://github.com/microsoft/TRELLIS.2)). A web mascot needs heavy decimation from there **(analysis)**.
- **Tripo:** retopology is part of the free "Essential Production Toolkit". "Smart Mesh" and "Ultra Mesh Quality" are Pro ([pricing](https://www.tripo3d.ai/pricing)).
- **(analysis)** Expect dense triangulated meshes with baked-looking textures. Plan on decimation or retopology, re-UV and texture downsizing (Blender, or `gltf-transform simplify` / `resize`) before rigging or shipping. Rigging needs a clean humanoid anyway (§5.2).

---

## 4. Web pipeline

### 4.1 Mesh compression
- **Draco vs Meshopt** (glTF-Transform CLI help text, [cli.ts](https://github.com/donmccurdy/glTF-Transform/blob/main/packages/cli/src/cli.ts)):
  - Draco "affects only geometry data — animation and textures are not compressed".
  - Meshopt compresses "geometry, morph targets, and animation tracks", "decodes very quickly, and is best used in combination with … brotli or gzip".
  - meshoptimizer's README: its decoders run at "3-6 GB/s" (vertex) and "7-10 GB/s" (index) on desktop CPUs. It also says Draco-style compressors trade decode speed and vertex order for ratio ([meshoptimizer README](https://github.com/zeux/meshoptimizer)).
- **Decoder weight in three r186** (bytes on disk, uncompressed; [libs dir](https://github.com/mrdoob/three.js/tree/r186/examples/jsm/libs)):
  - `meshopt_decoder.module.js`: **29,256**
  - Draco glTF decoder: `draco_decoder.wasm` **192,420** + `draco_wasm_wrapper.js` 58,456
  - Basis/KTX2 transcoder: `basis_transcoder.wasm` **527,333** + `.js` 57,529
- **`gltf-transform optimize` defaults** ([cli.ts](https://github.com/donmccurdy/glTF-Transform/blob/main/packages/cli/src/cli.ts)):
  - `--compress meshopt` (the alternatives are `draco` and `quantize`) and `--meshopt-level high`
  - `--texture-compress auto` ("KTX2 optimizes VRAM usage and performance; AVIF and WebP optimize transmission size. Auto recompresses in original format") with `--texture-size 2048`
  - `--simplify true`, `--instance true`, `--palette true`, `--flatten`, `--join`, `--prune`, `--resample` (animation keyframe dedupe)
  - The `meshopt()` function writes `EXT_meshopt_compression` ([meshopt.ts](https://github.com/donmccurdy/glTF-Transform/blob/main/packages/functions/src/meshopt.ts)), which drei/three-stdlib can read.
  - KTX2 encoding needs KTX-Software installed ("Dependencies: KTX-Software").
- **`npx gltfjsx model.glb --transform`** does "draco-compressed, texture-resized (1024x1024), webp compressed, deduped, instanced and pruned", "70%-90%" smaller, and can also emit a typed JSX component (`--types`) ([gltfjsx README](https://github.com/pmndrs/gltfjsx)). Last release 6.5.3 on 2024-11-04 ([npm](https://registry.npmjs.org/gltfjsx)).
- **gltfpack** (meshoptimizer): `-cc` for meshopt, `-tc` for KTX2/BasisU, `-tw` for WebP. It does not support Draco ([gltfpack README](https://github.com/zeux/meshoptimizer/blob/master/gltf/README.md)).

### 4.2 Textures
- MDN: "GPU compressed texture formats are smaller … in GPU memory, and are faster to sample from … (This reduces texture memory bandwidth, which is precious on mobile)". Basis Universal gives "a single compressed texture file" that is transcoded at load time ([WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)). glTF-Transform says the same: PNG and JPEG "are fully uncompressed in GPU memory" (cli.ts).
- **(analysis) Memory arithmetic.**
  - One 2048² RGBA8 texture is 16 MiB in VRAM, about 21 MiB with mipmaps. At 1024² it is 4 MiB, about 5.3 MiB with mipmaps.
  - A stylised bot with vertex colours or a single 512–1024 px atlas stays small. For that case WebP (small download, no 527 KB transcoder) may beat KTX2. KTX2 pays off when there are many or large textures.
- three: `KTX2Loader().setTranscoderPath(...).detectSupport(renderer)` then `gltfLoader.setKTX2Loader(...)`, and `setMeshoptDecoder(MeshoptDecoder)` ([three compressed-glTF example](https://threejs.org/examples/webgl_loader_gltf_compressed.html)).

### 4.3 Lazy loading after first paint
- LCP candidates are `<img>`, `<image>` in SVG, `<video>`, `url()` backgrounds and "block-level elements containing text". A canvas is not a candidate. "Good" means ≤ 2.5 s at p75, split by mobile and desktop ([web.dev LCP](https://web.dev/articles/lcp)). The 3D layer therefore cannot be the LCP element. It can still delay LCP by competing for bandwidth and the main thread **(analysis)**.
- Pattern **(analysis)**:
  1. Render the HTML (State 2 or the chat) first.
  2. After `load` or idle, `import()` the client canvas component (`next/dynamic`, `ssr: false`).
  3. Load the `.glb`, then fade it in.
- `requestIdleCallback` is still preview-only in Safari ([MDN BCD Window.json](https://github.com/mdn/browser-compat-data/blob/main/api/Window.json)). A `setTimeout` or `load` fallback is required on iOS.
- `useGLTF.preload(url)` warms the cache ahead of mount ([drei useGLTF docs](https://github.com/pmndrs/drei/blob/master/docs/loaders/gltf-use-gltf.mdx)).

### 4.4 A transparent, full-viewport overlay canvas
- **Pointer events.** `pointer-events: none` makes events "go 'through' the element and target whatever is 'underneath'", and a child can opt back in with `auto` ([MDN pointer-events](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/pointer-events)). A full-viewport canvas must be `none`, or it blocks the page. Clicks on the bot then need one of:
  1. R3F `eventSource` set to a parent or the document, so raycasting runs on pointer events there. "This is usually done to have events on a shared parent, which allows both the canvas, and dom overlays to receive events" ([R3F events](https://github.com/pmndrs/react-three-fiber/blob/master/docs/API/events.mdx)). The page underneath still receives the same click, so you must decide who handles it.
  2. A **real DOM `<button>`** that follows the bot's projected screen position. drei `<Html>` does this projection, with `occlude`, `center`, `zIndexRange` and so on ([Html docs](https://github.com/pmndrs/drei/blob/master/docs/misc/html.mdx)). The button is also the keyboard and screen-reader hook (§5.6).
- **Nuance for a moving target.** "By default Fiber will only raycast when the user is interacting with the canvas. If … the camera moves a hoverable object underneath the cursor it will not trigger a hover event", unless you call `update()` (R3F events).
- **Cost (analysis).**
  - A full-viewport canvas draws and composites every pixel of the viewport on each frame it renders:
    - 1440×900 laptop at DPR 2: 5.18 M px
    - 390×844 phone at DPR 3: 2.96 M px
    - the same phone capped at DPR 1.5: 0.74 M px
  - A **small canvas that moves with the bot** (for example 160×160 CSS at DPR 2, about 0.1 M px), repositioned with a GSAP transform, costs about 2% of the laptop case. It also makes its own box the hit target.
  - The trade-off: no bot effects that span the whole screen, and perspective has to be faked per position.
  - Frame budget: 16.7 ms at 60 Hz, 8.3 ms at 120 Hz. "The frequency of calls … will generally match the display refresh rate … 120hz, and 144hz are also widely used" ([MDN rAF](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)).
- **Pausing.**
  - "`requestAnimationFrame()` calls are paused in most browsers when running in background tabs or hidden `<iframe>`s" (MDN rAF), so hidden tabs cost nothing already.
  - Use `visibilitychange` / `document.visibilityState` to also pause GSAP-side work and audio ([Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)).
  - IntersectionObserver only helps for a canvas in normal flow. A fixed overlay is always "visible". What matters is the app pausing it on its own states: bot parked, chat drawer covering it, reduced motion **(analysis)**.
  - R3F `frameloop="demand"` renders only on change, but an always-wandering bot always changes (§2.5).

### 4.5 Mobile GPU limits and DPR
- MDN's "effectively all systems support at least" list: `MAX_TEXTURE_SIZE 4096`, `MAX_VERTEX_ATTRIBS 16`, `MAX_TEXTURE_IMAGE_UNITS 8`, `MAX_VARYING_VECTORS 8`, `MAX_FRAGMENT_UNIFORM_VECTORS 64`. The compressed formats split by platform: S3TC on desktop, ETC on mobile. Also suggested: a per-pixel VRAM budget, `(innerWidth·dpr)·(innerHeight·dpr)` ([WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)).
- R3F `dpr` is a `[min, max]` range, default `[1, 2]` ([Canvas](https://github.com/pmndrs/react-three-fiber/blob/master/docs/API/canvas.mdx)). drei `PerformanceMonitor` watches average fps and fires `onIncline`/`onDecline`/`onFallback` so you can step DPR down (`flipflops` bounds oscillation). `performance.regress()` gives temporary "movement regression" ([scaling-performance](https://github.com/pmndrs/react-three-fiber/blob/master/docs/advanced/scaling-performance.mdx)).

---

## 5. Feasibility of the seed idea: a roaming bot as the AI entrypoint

### 5.1 Modelling options
1. **Built in Blender through MCP.** A hard-surface, stylised bot is squarely what the tool surface is good at (§1.4). Export as GLB with EXT meshopt (§1.5).
2. **Procedural in code.** Primitives (capsule body, sphere head, emissive-free eyes) with a node hierarchy. Weighs almost nothing, and GSAP animates it directly **(analysis)**.
3. **A CC0 starting point.** three.js ships `RobotExpressive.glb` (463,988 B). Its README says: "Model by Tomás Laulhé … CC0 1.0", with "three facial expression morph targets" added by Don McCurdy ([README at r186](https://github.com/mrdoob/three.js/blob/r186/examples/models/gltf/RobotExpressive/README.md)). Clips: `Idle, Walking, Running, Dance, Death, Sitting, Standing` plus emotes `Jump, Yes, No, Wave, Punch, ThumbsUp` ([live example](https://threejs.org/examples/webgl_animation_skinning_morph.html)). Quaternius's own "Animated Robot Pack" page says "CC0 … free to use in personal and commercial projects" ([pack page](https://quaternius.com/packs/animatedrobot.html)). **However**, quaternius.com now publishes the "Quaternius Asset License (QAL) v1.0, last updated 8/28/2026": free commercial use, no credit, but no redistribution "as a standalone asset". It states that changes "will not apply retroactively" ([license page](https://quaternius.com/license.html)). The three.js copy was obtained under CC0.
4. **AI-generated, then cleaned up** (§3). Watch the licence.

### 5.2 Animation: skeletal clips vs procedural
- **Skeletal clips.** `AnimationMixer` plus `clipAction(...).play()`, with `crossFadeTo` / `fadeIn` / `setEffectiveWeight` for blending. The mixer needs `update(deltaSeconds)` every frame ([three manual: animation system](https://threejs.org/manual/#en/animation-system), [skinning blending example](https://threejs.org/examples/webgl_animation_skinning_additive_blending.html)). With GSAP owning the clock, see §2.5.
- **Procedural.** Look-at, idle bob, hover, blink and tilt are GSAP tweens on node transforms or morph weights (`quickTo` for pointer look-at). **(analysis)** A **non-humanoid hover bot** (floating body, no legs) needs **no skeleton at all**. It is a node hierarchy of body, head and eyes, which removes rigging, skinning and walk cycles, and it sidesteps the "is AnimationMixer allowed" question. A walking humanoid needs a walk cycle synced to its movement speed along the path, or the feet slide.
- **Free rigging and animation sources:**

| Source | Terms | Constraint | Source |
|---|---|---|---|
| Mixamo (Adobe) | "available free for anyone with an Adobe ID … You can use both characters and animations royalty free for personal, commercial, and non-profit projects" | "the auto-rigger and animation libraries are for bipedal humanoids only". Needs neutral pose, no props or extra limbs, mesh parts not separated. Export is FBX (convert in Blender) | [Mixamo FAQ, archived 2026-09-24](http://web.archive.org/web/20260924203626/https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html). The live page blocks automated fetches. The snapshot's page date is "Sep 14, 2021" |
| Meshy Rigging API | 5 credits per task in the example response. Free-plan output is CC BY 4.0 (§3) | "standard humanoid (bipedal) assets". Not for "Untextured meshes, Non-humanoid assets". ≤300k faces. Face toward +Z. Returns GLB/FBX plus basic walk/run | [Meshy rigging docs](https://docs.meshy.ai/en/api/rigging) |
| Blender Rigify (bundled) | GPL tool. What you make with it is yours **(analysis)** | Builds controls and bones only, "does not attach the rig to a mesh". Export deform bones only (§1.5) | [Rigify intro](https://docs.blender.org/manual/en/latest/addons/rigify/introduction.html) |
| RobotExpressive / Quaternius | CC0 (three.js copy) / QAL for new downloads | Already rigged and animated | §5.1 |

### 5.3 Pathing along the viewport edges, avoiding content (analysis unless cited)
- **Coordinate space.** With an orthographic camera sized to the viewport, 1 world unit is 1 CSS px, which makes edge paths trivial. With perspective, R3F gives `viewport` "in three.js units" and `getCurrentViewport(camera, target, size)` for a given depth ([hooks](https://github.com/pmndrs/react-three-fiber/blob/master/docs/API/hooks.mdx)).
- **Path.** A rounded-rectangle loop inset from the edges, driven by GSAP MotionPathPlugin from an array of `{x, y}` points onto a plain object that the bot reads ([MotionPathPlugin](https://gsap.com/docs/v3/Plugins/MotionPathPlugin)). The alternative is wandering between "rest spots" such as corners and gutters.
- **Avoiding content.** Recompute the no-go zones (`getBoundingClientRect` of chat bar, nav, CTAs, focused element) on resize and scroll, and choose stops outside them. At 390 px there is almost no free gutter, so the mobile tier likely parks the bot or docks it into the chat bar (a question for the concept ticket).
- **Precedent for the mechanics:** oneko.js (below) uses a `position: fixed` element in CSS-px space.

### 5.4 Hit-testing and interaction
- Raycasting against a **SkinnedMesh** is expensive and can be stale. In r186, `computeBoundingSphere()` skins every vertex on the CPU, the sphere is computed once (`if (this.boundingSphere === null)`), and triangle tests go through skinned `getVertexPosition` ([SkinnedMesh.js](https://github.com/mrdoob/three.js/blob/r186/src/objects/SkinnedMesh.js)). **(analysis)** Hit-test an invisible proxy (sphere or box) parented to the bot, or skip raycasting and use the DOM-button proxy (§4.4), which also clears WCAG 2.5.8's 24×24 CSS px minimum ([Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)).
- R3F events give `stopPropagation` semantics that stop delivery to objects behind, and `onPointerMissed` ([events](https://github.com/pmndrs/react-three-fiber/blob/master/docs/API/events.mdx)).

### 5.5 Performance budget of an always-on loop (analysis)
- **Per frame:** GSAP update, `mixer.update` if skeletal, one render of a few draw calls, and compositing a transparent layer. The GPU draw is trivial. The fixed costs are the **canvas pixel count** (§4.4) and the **refresh rate** (120 Hz doubles the work).
- **Levers:**
  - Keep the canvas small and moving, or cap DPR (1–1.5 on mobile).
  - Render every other tick on 120 Hz, throttled inside the ticker listener rather than with `gsap.ticker.fps`, which would slow every GSAP animation.
  - When parked, render once and stop.
  - Pause on `visibilitychange`.
  - Use `PerformanceMonitor` to step down.
  - oneko.js runs its sprite at 10 fps (`timestamp - lastFrameTimestamp > 100`).
- **Download:** three (~194 KB gzip, indicative) plus R3F/drei if used, plus the model (RobotExpressive is 464 KB raw before meshopt) plus a decoder (meshopt 29 KB). All of it loads after first paint (§4.3).
- **The 60 fps laptop target** has to be verified with the real page and real content. Nothing here measures it.

### 5.6 Accessibility and reduced motion
- **WCAG 2.2.2 Pause, Stop, Hide (Level A):** "For any moving … information that (1) starts automatically, (2) lasts more than five seconds, and (3) is presented in parallel with other content, there is a mechanism for the user to pause, stop, or hide it" ([Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)). A bot that roams the edges forever meets all three conditions, so the site needs a visible pause/park control. Stopping on hover or focus alone is not a mechanism the user controls **(analysis)**.
- **Reduced motion:** `gsap.matchMedia()` with `reduceMotion: "(prefers-reduced-motion: reduce)"` reverts everything created inside it when the condition flips, and `gsap.matchMediaRefresh()` handles an in-page toggle ([matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia())). The map's rule is that the bot parks.
- **Keyboard and screen reader (analysis):** the AI entrypoint must be a static, always-present HTML control (chat bar, skip link or header button) that works before the model loads (≤ 1 s rule) and without chasing a moving target. If the bot is focusable at all, it is a DOM `<button>` with an accessible name. Otherwise the canvas is `aria-hidden` and purely decorative, which is what oneko.js does (`ariaHidden = true`, `pointerEvents = "none"`).
- **Returning visitors with an open conversation:** the bot state can reflect AI SDK `chat.status` (`'submitted' | 'streaming' | 'ready' | 'error'`, from `node_modules/ai` 6.0.168 types) for listening, thinking and speaking poses **(analysis)**.

### 5.7 Precedents
- **oneko.js**, MIT, 1.3k★: a cat that follows the cursor over any page. Fixed-position 32×32 element, `pointerEvents = "none"`, `ariaHidden = true`, max `zIndex`. Disabled entirely under `prefers-reduced-motion`. Position persisted across pages. Sprite ticks at 10 fps ([source](https://github.com/adryd325/oneko.js/blob/main/oneko.js)). 2D, decorative only, not an entrypoint.
- **three.js `webgl_animation_skinning_morph`** with the CC0 RobotExpressive: "a character looping in one of several base animation states, then transitioning smoothly to one-time actions. Facial expressions are controlled independently with morph targets". This is the clip vocabulary a roaming bot would need ([example](https://threejs.org/examples/webgl_animation_skinning_morph.html)).
- **Duolingo "Video Call" with Lily** (Rive, 2D), where the character *is* the AI entrypoint. Separate head and body artboards. "eight head animations and eight body animations that combine to generate over 64 variations of neutral idle". "Event-triggered expressions" synced to the AI. Under 1 MB ([Rive blog, 2025-03-20](https://rive.app/blog/duolingo-s-ai-powered-video-call-brings-lily-to-life)). The lesson is that modular idle plus AI-state events keeps a character alive without long clips.
- **Microsoft Copilot's Mico** is a cautionary example: an animated character in Copilot Voice that Microsoft is now removing from that surface. "Mico, the animated character in Copilot Voice, is moving to Learn Live … starts in August and will roll out in waves". Microsoft's reason: "Learn is where the character has the most room to grow" ([Microsoft support FAQ](https://support.microsoft.com/en-us/microsoft-365-copilot/frequently-asked-questions-about-retired-copilot-features)). The launch details are not verifiable at the source, because the 2025-10-23 blog URL now redirects **(unverified)**.
- **For contrast:** Bruno Simon's folio-2025 is a whole-page WebGL game world, MIT ([repo](https://github.com/brunosimon/folio-2025)). It is the opposite of "text stays HTML". Community "3D robot + AI chat" portfolios on the three.js forum exist (for example [Prompt3D, 2023](https://discourse.threejs.org/t/prompt3d-3d-character-which-responds-to-the-questions-using-chatgpt/54510), where the author reported long waits and a hanging UI on longer answers and blamed a free-tier backend). They show the idea is common, not that it is good.

---

## Install checklist — Blender MCP

For ticket [09 — Set up Blender MCP](../issues/09-set-up-blender-mcp.md). It follows the community project's own docs ([README](https://github.com/ahujasid/mcp-for-blender)) and the [Claude Code MCP docs](https://code.claude.com/docs/en/mcp). Steps marked **(not in docs)** are my additions.

1. **Blender.** 5.2.2 is already installed, which meets the README's "Blender 3.0 or newer". **Launch it once and quit.** `~/Library/Application Support/Blender/5.2/` does not exist yet, and the add-on installer only discovers folders that exist (`discover_blender_addon_dirs()` in [addon_manager.py](https://github.com/ahujasid/mcp-for-blender/blob/main/src/blender_mcp/addon_manager.py)). The fallback is `BLENDERMCP_ADDONS_DIR=…`.
2. **uv.** Already at `/opt/homebrew/bin/uvx`. The README warns: "Use the official installer — *not* `pip install uv`". Homebrew is the README's macOS route.
3. **Install the add-on file:** `uvx mcp-for-blender install-addon`. It copies `blender_mcp.py` into the addons folder and keeps a `.bak`. `uvx mcp-for-blender addon-paths` lists the detected folders.
4. **Enable it in Blender:** Edit → Preferences → Add-ons → search "MCP for Blender" → tick **Interface: MCP for Blender**. The README says "Install…" for the manual path, but in Blender 5.2 the menu item is **Install from Disk** (legacy `.py` add-ons are still accepted; [manual](https://docs.blender.org/manual/en/latest/editors/preferences/addons.html)).
5. **Start the socket.** In the 3D viewport press `N`, open the **MCP for Blender** tab, and click the connect button. On `main` it is labelled **"Connect to MCP server"** in [addon.py](https://github.com/ahujasid/mcp-for-blender/blob/main/addon.py). The README calls it "Start MCP Server" or "Connect to Claude". "Auto-Start Server" defaults to on. The panel should read "Connected on port 9876".
6. **Register the server with Claude Code, at user scope** (**(not in docs)**: this keeps the config in `~/.claude.json` rather than a git-tracked `.mcp.json`; scopes per the Claude Code docs):
   ```bash
   claude mcp add --env DISABLE_TELEMETRY=true --transport stdio --scope user blender -- uvx mcp-for-blender
   ```
   - The README's own line is `claude mcp add blender uvx mcp-for-blender`.
   - `--` and the `--env` placement follow the Claude Code docs: "Place at least one other option … between `--env` and the server name".
   - `DISABLE_TELEMETRY=true` is optional. Without it the server sends "a minimal anonymous usage record" (README "Telemetry Control").
   - If uv picks a bad Python (conda or pyenv), pin it: `-- uvx --python 3.11 mcp-for-blender` plus `--env UV_PYTHON_PREFERENCE=only-managed` (README "Pin the Python version").
7. **Verify.**
   1. Run `claude mcp list` and confirm `blender` shows ✔ Connected.
   2. In a new session, run `/mcp` and confirm the blender tools are listed.
   3. Ask the agent to run `get_scene_info`, create a cube with `execute_blender_code`, and call `get_viewport_screenshot`. This is ticket 09's resolution condition.
   4. Optionally test the web path: `export_scene` to a `.glb` in the scratchpad.
   5. Record Blender 5.2.2, `mcp-for-blender` version, add-on `bl_info` version 1.7 and protocol 11 (current `main`).
8. **Known pitfalls, from the README:**
   - "Only run **one** instance of the MCP server". Whether two Claude Code sessions can share one Blender socket is not stated **(unverified)**.
   - "**Do not** run the `uvx` command in the terminal" (the client spawns it). "Sometimes the first command won't go through". Restart both sides if the connection sticks.
   - Poly Haven downloads run on Blender's main thread and freeze the UI. Ask for 1k or 2k.
   - `execute_blender_code` runs arbitrary Python, so save first. `BLENDER_MCP_SAFE_MODE=1` validates scripts before they run.
   - The socket "has no authentication or encryption". Keep it on localhost.
9. **Do not enable the Blender Lab add-on at the same time.** Both default to port 9876 (§1.1). **(analysis)**

**Alternative: the official Blender Lab server.** Needs Blender 5.1+ (5.2.2 is fine).
- Add the Lab extensions repository `https://lab.blender.org/` in Preferences → Get Extensions → Repositories. Install and enable **MCP**. The add-on refuses to start unless Blender's online access is enabled: "Online access must be enabled in the system preferences" ([add-on `__init__.py`](https://projects.blender.org/lab/blender_mcp/src/branch/main/addon/blender_mcp_addon/__init__.py)).
- Install the server with `pip install git+https://projects.blender.org/lab/blender_mcp.git#subdirectory=mcp`. Its console script is also named `blender-mcp`, the same as the community project's legacy PyPI name ([mcp/pyproject.toml](https://projects.blender.org/lab/blender_mcp/src/branch/main/mcp/pyproject.toml)). Keep them apart.
- The Lab docs give **no Claude Code command**, only an `.mcpb` bundle (for Claude Desktop) or a source install. A likely Claude Code form is `claude mcp add --transport stdio --scope user blender-lab -- uvx --from "git+https://projects.blender.org/lab/blender_mcp.git#subdirectory=mcp" blender-mcp` **(not in docs, untested)**.
- Its warning: "The MCP server will execute LLM generated code in Blender without any guards in place" ([Lab page](https://www.blender.org/lab/mcp-server/)).

---

## Open questions for the verdict

1. **Which Blender MCP?** Community (modelling tools, asset search, `export_scene`, MIT) or official Lab (analysis and scripting, GPL, Blender-maintained)? Ticket 09 needs one.
2. **Is `AnimationMixer` clip playback allowed under "GSAP only"** if GSAP owns the clock? Or must bot motion be pure GSAP transforms (which argues for a hover bot)?
3. **Bot body plan.** A non-humanoid hover bot (no rig, pure GSAP) or a walking humanoid (needs a rig and walk cycle; Mixamo and Meshy rigging are humanoid-only)?
4. **Canvas shape.** A full-viewport transparent overlay (free movement and effects, highest fill cost, pointer-events plumbing) or a small canvas that travels with the bot (cheap, and its box is the hit target)?
5. **R3F + drei or three.js directly?** R3F brings React/Suspense and helpers, but its docs recommend react-spring/lerp (to be designed out) and it adds bundle weight.
6. **Asset licences the brief accepts.** CC0 only? CC BY with credit (Meshy free, Poly Pizza CC-BY)? QAL (Quaternius)? Hunyuan's territory clause and Tripo's "Non-Commercial" look incompatible with a public portfolio, pending Janriz's call.
7. **Texture route for the test asset.** Vertex colours or a WebP atlas (small, no transcoder) vs KTX2 (VRAM-friendly, +527 KB transcoder)? And Meshopt (EXT) vs Draco for the `.glb`?
8. **How the WCAG 2.2.2 pause mechanism looks** and where it lives, and what the 390 px tier does (park or dock the bot?). This overlaps with *Pick the creative concept*.
9. **Frame-cost measurement** for the comparison page: which device, which tool, and the pass line (60 fps laptop, 120 Hz handling).

## Unverified or flagged

- The link between Anthropic's "Blender connector" and the Lab repo is inferred from the organisation and dates.
- Community MCP compatibility with Blender 5.2 is only stated as "3.0 or newer". Confirm in ticket 09.
- Whether two MCP clients can share one Blender socket.
- Tripo's Terms page (Cloudflare-blocked). Only the pricing page's "Non-Commercial Use" line was read.
- Whether a job-seeking personal portfolio is "commercial" under Tripo's free tier. This is a legal judgement, not researched.
- Hunyuan's "display … outside the Territory" applied to a globally reachable site. This is a legal reading, not advice.
- Licence terms for outputs made with the Blender MCP add-on's built-in Rodin free-trial key: not stated anywhere I found.
- The live Mixamo FAQ blocks automated fetches. The Wayback snapshot of 2026-09-24 was used. A search excerpt of the live page also mentions a no-redistribution-of-raw-files clause, which is absent from the snapshot.
- Microsoft Mico launch details: the original blog URL redirects. The retirement is confirmed by Microsoft Support.
- The bundle sizes in §2.3 were measured with jsDelivr's on-the-fly minifier, not a Next production build. Treat them as indicative.
- TRELLIS.2's third-party dependencies (for example nvdiffrast) may carry their own licences. Not checked.
- No primary benchmark exists for hard-surface vs organic or character quality through either Blender MCP.
