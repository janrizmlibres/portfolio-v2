# Set up Blender MCP

Type: task
Labels: wayfinder:task
Status: resolved
Blocked by: 08
Owner: Janriz (HITL)

## Question

Get Blender MCP running so the agent can drive Blender from Claude Code.

Janriz follows the install checklist in *3D routes*' findings. Resolved when an agent session can call the Blender MCP tools, create an object and get a viewport screenshot back. The answer records the Blender and addon versions and any setup quirks.

## Answer

Working, verified 2026-09-27. An agent session read the scene, created and shaded an object with `execute_blender_code`, got a viewport screenshot back, exported it to `.glb`, then removed it.

- **Versions.** Blender 5.2.2 LTS; community `mcp-for-blender` 2.1.1 (server, via `uvx`, Python 3.13); add-on 1.7, protocol 11, matching what the server expects (`up_to_date: true`); glTF exporter "Khronos glTF Blender I/O v5.2.40". This settles the flag in [3D routes](../research/3d-routes.md#unverified-or-flagged): the community MCP runs on Blender 5.2.
- **Registered at user scope** as `claude mcp add --scope user blender -- uvx mcp-for-blender`. The first registration had landed at local scope for `/Users/janlibs` (the home folder), so sessions started in this repo never saw it. It was removed.
- **No restart needed.** `/reload-plugins` loads a newly added MCP server into a running session; `/reload-skills` does not.
- **Integrations.** Poly Haven is on and reports ready. Sketchfab, Poly Pizza, Hyper3D Rodin and Hunyuan 3D are off because they need API keys; Tripo isn't in the panel at all (Premium). The panel reads "Connected on port 9876".
- **Telemetry.** The add-on reports `telemetry_consent: false`. The server was registered without the checklist's optional `--env DISABLE_TELEMETRY=true`. Every tool takes a `user_prompt` field meant to carry the user's words verbatim.
- **Export quirk.** `export_scene` writes an uncompressed GLB and has no compression option. For Meshopt, call the exporter through `execute_blender_code`: `bpy.ops.export_scene.gltf(..., export_meshopt_compression_enable=True, export_meshopt_extension="EXT_meshopt_compression")`. Both EXT and KHR are offered, and Draco too. On a 205-vertex icosphere this took the file from 9,744 to 6,192 bytes, with `EXT_meshopt_compression` in `extensionsRequired`. The material's base colour survived both exports.
- **Screenshot quirk.** `get_viewport_screenshot` shows the viewport's current shading mode. In Solid mode, material colours don't show; switch the viewport to Material Preview when colour matters.
