# The record as a data slate: variants (2026-10-12)

Janriz, on the pipeline: "the slabs right look like gray placeholders and it's not quite clear that they represent
data". He agreed that the record becomes one object you can follow, a slate whose face shows what it is at each
stage. This round has three finishes of that slate, live behind the take switcher (`?rec=…`). The default (`slab`) is
unchanged.

## What each one is

All three share the same object and the same story:
- **The plate** is 1 × 0.06 × 1.6, with rounded corners and a chamfered rim.
- **Its face** comes from one atlas of four layouts. A web page (a landing page, an article, a results list or a
  profile with a table) becomes a record (a kind chip, an id, a status light, and seven fields, two or three of them
  empty).
- **Per instance** it carries `aS` = (extracted, enriched, powered, layout).
- **At Search:** a web page.
- **At the press (Extract):** the face is wiped from its top edge into the record, with a light line where the press
  passes.
- **At Dedup:** the duplicate's screen goes dark, then it slides into its twin.
- **At Enrich:** the empty fields fill in, flaring warm in the heaters.
- **At Save:** it dims as it sinks into the magazine, and the magazine's stack is dim slates.
- **On the stream to Athena:** finished records (every field filled, lit).
- **Unlike the slab,** a slate keeps one size and shape all the way down: no bent, thin or odd-sized pages, and no
  thickening at Enrich. The face does the telling.

| take | finish | reads as |
|---|---|---|
| `glass` | Satin aluminium edge and back, with black glass over the whole face and the screen lit under it. The page is white with dark ink and coloured pictures. The record is in dark mode, its fields in cool light; enriched fields turn warm. | A screen showing data. The page → record change is readable from across the shaft. |
| `eink` | E-paper: a matte paper face in a dark anodised frame, lit only by the scene. Its warm front light comes on as it's enriched. The press's pass is the paper's redraw flash. | Printed documents. Very real, but a page and a record look alike from a distance, and it reads as paper more than data. |
| `silica` | Etched fused quartz (as Microsoft's Project Silica stores data): frameless dark glass whose edges carry light. Data is a voxel dot-matrix, loose and dim for a page, in crisp rows for a record, warm once enriched. Seen from either side. | Data storage. Distinctive, but the dots are fine and dimmer at a distance. |

## Frames

- `sheet-compare.png`: a row per look (slab, glass, eink, silica) at Search, Extract, Enrich and Save, at 1440×900.
- `sheet-<look>.png`: every reading spot per look: stream 24.6, Start 26.59, Search 27.35, Extract 28.11, Dedup 1
  28.87, Enrich 29.63, Dedup 2 30.39, Save 31.15. Raw frames are in `<look>/`.
- `sheet-glass-phone.png`: the pick on a phone (390×844), same spots. Raw frames are in `glass-phone/`.
- `glass-closeups.png`: the pick at the press and at the heaters, full resolution.

## Pick: `glass`

- **It answers his complaint most directly.** Bright white web pages go in and dark records with rows of fields come
  out, so it reads as data at a glance. The fields that light warm at Enrich are the one stage that was hard to show
  before.
- **It matches the hardware standard.** It's the same satin aluminium as Tycho's metal finish, with real glass
  reflections.
- **It carries to the stream.** The lit slates read as finished records flowing into Athena.

`silica` is the more original idea and a fine second choice. `eink` is the most physically plain, but it says
"document", not "data".

## Open questions

- **The stream** (24.6, and the new Athena→crawler flight): at the current scale (`SLAB = ATH.r × 0.035`) a record on
  the stream is a speck from most of the camera's path. If the new move flies beside the stream, the records need to
  be bigger there, or the camera closer.
- **Shadows:** the swarm doesn't receive shadows. Under the ring fork's `pring=real` the crawler key's shadow box
  follows the fall, so `receiveShadow` on the swarm would let the rings shade the slates. Untried.
- **Search's hairlines** (dish to page) are unchanged. They still cross the frame with slates too.
- **Size:** the swarm's records are `REC` = 0.0011 wide. A slate's face reads well at the reading spots on desktop.
  On a phone the layouts are tiny but the white → dark change still reads.
