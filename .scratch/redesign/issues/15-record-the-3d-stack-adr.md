# Record the 3D stack ADR

Type: task
Labels: wayfinder:task
Status: resolved
Blocked by: 10

## Question

Write the ADR for the 3D stack decided in *3D route verdict* ([10-3d-route-verdict.md](10-3d-route-verdict.md)). Write it in `docs/adr/`, which is local-only in this repo, via `/domain-modeling`. AFK. It records:

- plain three.js, not R3F, and why (+102 KB gzip);
- GSAP authors all motion; glTF clips only for skinned or shape-key deformation, on a `gsap.ticker` clock;
- asset routes:
  - authored assets from Blender MCP: `.glb` with named nodes, `gltf-transform optimize` with meshopt EXT, `--flatten false --join false`;
  - generative 3D in code;
  - AI models never ship;
  - CC0-first library assets (never NC) for supporting roles only, never the bot.

It also records **the colour-fidelity rule for 3D**, settled by *Prototype the visual language* (2026-09-29):
- lit surfaces use Khronos PBR Neutral tone mapping;
- any colour that carries meaning (energy, the bot's eyes, a lit star) is drawn unlit and not tone mapped (`MeshBasicMaterial`, `toneMapped: false`), and is written as a display value.

The measurements behind it (ΔE in OKLab ×100 on the stand-in bot and three swatches) are in that ticket's Answer and in `prototypes/deep-field-sky/fidelity.html`:

| Set-up | ΔE |
|---|---|
| AgX | 8–11 |
| Neutral | 3–4 |
| Neutral with meaningful colours unlit | 0 |

`docs/adr/0001` is taken by the one-page universe (*Pick the creative concept*), so this ADR takes the next number.

Resolved when the ADR exists and `CONTEXT.md` has any terms it introduces.

## Answer

Done 2026-09-29: [`docs/adr/0002-3d-stack.md`](../../../docs/adr/0002-3d-stack.md) (local-only, like 0001).
- It records everything the Question lists: plain three.js over R3F (+102 KB gzip), GSAP-authored motion with clips only for skinned or shape-key deformation on the `gsap.ticker` clock, the asset routes with the export and optimise defaults, and the colour-fidelity rule with its ΔE table.
- It also carries two build findings from *Prototype the visual language* that fit a stack decision: procedural surfaces are baked once at load, and 3D loads after first paint.
- The ADR is self-contained. It cites no tracker or prototype paths, so it reads the same once the tracker is gone.
- **No new terms for `CONTEXT.md`.** Everything the ADR introduces (tone mapping, authored vs generative assets, unlit materials) is implementation, and the glossary holds only domain language.

## Comments

- 2026-09-29 — *Prototype the visual language* resolved. Its colour-fidelity rule was to be an addendum to this ADR, but the ADR isn't written yet, so the rule goes into the ADR itself (Question updated).
