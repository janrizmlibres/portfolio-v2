# The pipeline is made real, each ring fitted out for its stage's work

Status: accepted (2026-10-13).

The AI Web Crawler's shaft was the film's least real hardware. The rings were glossy black tori with a flat glowing
band, the heaters peach tubes, the mast white rods and hairlines, and the records grey slabs. Janriz (2026-10-12): "the
slabs right look like gray placeholders and it's not quite clear that they represent data … is the realism factor
alright, the same that we did for the ship, relay, and Tycho?" A design round put three record looks and one rebuilt
ring (Enrich's) behind the take switcher. He picked the glass slate and the real ring, then asked that "each ring has
variations, according to their purpose".

## Decision

- **Every stage's ring is built to the station's standard** (`scripts/models/pipeline.py`, one model,
  `public/voyage/pipeline/pipeline.glb`). The station's materials and maps, occlusion baked per part.
- **One family, fitted out by purpose.** Every ring keeps what makes the shaft one machine: the machined frame, the
  bolted lips, the clevis fittings where the longerons meet it, the handrails, and the stage's colour as a run of opal
  diffusers in a channel round its outer face (lit by the site). Its height, cladding and equipment follow its job:

  | stage | fitted out as | ring | outer face | on its top face |
  |---|---|---|---|---|
  | Start, Save | the database | standard | drive bays, a status light each (Save's both bands, Start's one) | storage controllers on a bus |
  | Search | the antenna | lighter | blankets | a waveguide round it, a branch to each dish; RF amplifiers |
  | Extract | the press | taller, ribbed lip to lip | blankets between the ribs | accumulators and a pump, hoses to the press's manifolds |
  | Dedup ×2 | compute | standard | close-fitting machined panels | processors under finned heat sinks, a fibre bundle |
  | Enrich | power | standard | blankets under white radiator fins, a coolant loop | power conditioners, cables to the heaters |
  | Report | the instruments | standard | gold foil, a connector panel for the deck's harness | data recorders |

  The two dedups share one ring and one comparator, as Start and Save share their store: the same job. The site gives
  each stage its own copy, dressed in its own light (`pipeline.ts`).
- **Each fixture is its stage's work, made real:** the store (a racked magazine on a turntable), the search's dish
  antennas (reflector, ribs, a feed horn at the focus, coax), the die press (jaws, ground platens, hydraulic rams with
  tie rods, guide bars), the comparator (a twin ring: races, ring gear and pinion, an encoder read by two heads),
  Enrich's infrared heaters (the design round's sample), and the report's deck (beams and ribs, black panels on top,
  gold foil under, cantilever brackets with knee braces and tie rods).
- **The report's bars are telescoping masts:** five nested sections, the base on the deck, the others sliding out as
  the bars rise, each lit at its top in the colour of the stage it counts (Found, the search's; Merged, the dedups';
  Enriched, Enrich's; Saved, Save's). They were scaled grey boxes.
- **The mast is a deployable truss** (as NuSTAR's): dark longerons hinged at mid-bay, batten frames, X-braced cable
  with turnbuckles, instanced along every bay. Dark, so it never reads as the white hairlines it replaced.
- **The records are glass slates** (`record.ts`): satin aluminium round black glass, the screen lit under it. A web page
  at Search, a dark record of fields once pressed, the missing fields lighting warm as it's enriched, dark when merged
  or stored. The stream to Athena and the ribbon's backs show the same face.
- **The crawler's key light follows the fall** with a tight shadow box round the stage being passed, so the hardware
  shades itself and the records falling through it.

## Considered options

- **Records:** the engraved slab (the placeholder), e-paper (reads as a document, not data), and etched quartz (as
  Project Silica stores data: original, but its dots are faint from across the shaft). Glass reads as data at a glance.
- **Rings:** the same bulkhead on every stage, the stages differing by colour and fixture alone (the design round's
  pick). Janriz wanted each ring's own purpose to show.
- **Bars:** panels sliding up out of the deck (needs a well as deep as the bar under a deck seen from below), lit
  bar-graph columns standing all film (visible structure before the report means anything). Telescoping masts rise
  from the deck and are real hardware.

## Consequences

- A stage added to `PIPELINE` needs its row in `STAGES` (`pipeline.py`) and in `RING_OF` / `FIX_OF` (`pipeline.ts`).
- The model is larger: 232k triangles of its own (68k before), 3.8 MB compressed (0.87 MB before), loaded after the
  wake. Most of it is geometry (bolts, bevels); its maps are about 0.7 MB.
- It draws in 5 to 10 ms a frame at 1440×900 (the old shaft 5.5 to 7), heaviest where the bars are held at the climax,
  and 3 to 6.5 ms on a phone (measured 2026-10-13, one session, the governor at the same pixel ratio throughout).
- Held lit at the climax, a ring shows its colour in its diffusers alone. Tinting its metal too (as the old rings
  were) read as painted plastic from below.
