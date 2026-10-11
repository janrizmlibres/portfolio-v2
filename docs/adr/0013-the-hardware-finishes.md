# The hardware wears real finishes: metal on the relays and buoys, cloth on the ring ship

Status: accepted (2026-10-11).

The voyage's hardware (the ring ship at home, Work's relays and buoys) was drawn in the Blender builds' own materials, mostly diffuse. In black space a metal reflects black, which is why those metals were made mostly diffuse, and why they read flat, like a game asset. Tycho's finish, settled in his own work, was "more metallic … matching the UI": real metals reflecting clean studio softboxes. Janriz asked for the same on the relay and the ring ship.

## Decision

- **A finish is a table from material name to surface** (`lib/voyage/finish.ts`). A name the table doesn't list keeps its own material. Both finishes turn the structure and fittings to metal (`FITTINGS`): aluminium, titanium, anodised parts, gold and silver foil.
- **The metals reflect a studio, not space** (`studio()`):
  - a near-black dome, so the shadow side stays deep;
  - a broad softbox where the scene's key light is;
  - a tall strip off to one side and a dim box behind.

  A turning ring carries a strip of light round it, as Tycho's helmet does.
- **`metal`: the relays and the buoys.** Their blankets become satin aluminium hull panels under a clear coat.
- **`cloth`: the ring ship, its only finish.** It was chosen over `metal` and the in-between `accents` by eye, on the take switcher, then finalized and the take removed. Janriz liked metal on the fittings alone better than full metal, but asked for it "more realistic … without going full metal". So the rest is made real rather than metal:
  - **The blankets as beta cloth:**
    - their quilting puffed up (the normal map at ×3; ×4.5 looked crumpled);
    - a soft sheen;
    - each quilted panel its own white, from a table where no two neighbours match;
    - grime where the baked occlusion is deep, round hatches and fittings.

    The shader patch (`weave`) is applied after the film's own patches, which would otherwise replace it.
  - **The radiators** glossy white, keeping their ribs.
  - **The solar cells** under a thin film (iridescence) that shifts blue to violet as the ring turns.

## Considered options

- **The builds' own materials** (the old `matte`). Rejected: flat, a game asset.
- **`accents`:** metal on the fittings only, the blankets left as they were. Better, but not real enough.
- **`metal` on the ring too.** Rejected: a chrome station reads as a toy.
- **A harsher, photo-like sun** (deep shadow sides, blown highlights). Not tried: it changes the whole opening's light.

## Consequences

- A new piece of hardware takes a finish by naming its materials as the Blender builds do (`scripts/models/`), and wears `metal` unless it's the station.
- Cloth costs the GPU about 1–2 ms more a frame than `accents` at About, and holds 60 fps. Most of it is the physical shader and the studio reflection over the blankets' large area; dropping that reflection would save 0.4–1.4 ms if it's ever needed.
- **Soft shadows on thin geometry read as noise.** The radiators' dark blotches, in every finish, were the lattice's shadows smeared by the key light's soft-shadow blur (radius 3, which three samples with a noisy pattern). The station's key now uses radius 1, which gives crisp lattice shadows and suits a near-point sun. The older ships keep 3.
