# Finalize the hero and home, round 9: back to the original, with a ship for home

Janriz, on round 8 (2026-10-03): "Scrap everything. Go back to the original with the single celestial object, but instead of a planet let's make it a spaceship. Freeze this as a prototype tho so we can go back to it in the future." Asked which ship: "Show me variants". Asked what survives the reset: only the word-by-word text. Mid-round: "the pfp frame is still a placeholder. Add variants for the frame as well either it's just a pic with the text above or in the ring or something else", then "Don't keep it as a gray placeholder."

Measured on the `redesign` branch, uncommitted, on 2026-10-03 (M5, headless Chromium with the GPU on, ANGLE on Metal).

## Janriz's picks (2026-10-03), now on the site

1. **The ship: truss,** "but save the ring because i might change back". The truss is the default. The ring stays on the take switcher (`?ship=ring`). The hull is gone from the site; its Blender script stays here.
2. **His portrait: the callout card.** A card on a leader line from the ship's edge, with his name and Cebu.
   - The round gold-framed portrait, the print under the lines and the portrait choice on the switcher are gone.
   - On a phone the card is a row in the list under the lines: a small print beside his name, clear of the chat bar.
   - The plain page shows the same list.
3. **The ring ship's turn:** kept as it is.
4. **"Home" and "Around home":** asked for a recommendation. I'd keep both, since the ship is his home in the film's language and "Around home" is about the stars round it. Not changed; his call.

Evidence for the picks: [`picks/`](picks/) (made by [`picks/evidence.sh`](picks/evidence.sh)):
- reading spots at 1440, 390 and 844, and the ring's at 1440 and 390;
- walkthroughs `picks/out/opening-truss-{1440,390}.mp4`;
- contrast and frame cost.

- **Contrast:** unchanged, every reading spot passes (worst title 5.8:1, worst text 7.5:1, worst small print 6.4:1). The card sits on its own dark backing.
- **Frame cost** (GPU mean / p95; the bar is 4.66 / 7.21), at 60 fps:
  - the stretch from the hero to the peel: 3.86 / 6.74 ms at 1440, and 1.94 / 4.08 at 390;
  - About: 3.93 / 6.41 at 1440.
- **Tests:**
  - **TDD:** the takes, now the truss and the ring (red then green).
  - **Results:**
    - unit 179/179;
    - `voyage.spec` and `smooth-scroll.spec` 18/18;
    - tsc passes;
    - eslint flags only the pre-existing `app/page.tsx` error.
- **Refactor verdicts:**
  - **With nothing riding the orbit,** its laying is back to one cached pass. The portrait plate, its timeline tweens and its driver are gone from home and the stage, as is the world's `RECORD`. Done.
  - **The label's photo** is the only page-side portrait left: `Block.photo` and the print's CSS are gone, and so is the CSS that switched by take. Done.

## The truss, finished (2026-10-03)

Janriz: "Im actually happy with it. Go ahead with the proper finish." Same proportions and pose as the pass he picked; every part rebuilt in [`truss.py`](truss.py) (the first pass is kept as [`truss-v1.py`](truss-v1.py)):
- **The crew section:**
  - a node with seam rings and a berthing port on top;
  - side modules ending in berthing mechanisms (ring, hatch, latches) where the first pass had crumpled silver discs;
  - the main hab in three shells with seam rings and foil bands, with round framed portholes and handrails;
  - a glazed six-sided cupola with framed mullions and a round top window, where the first pass had a flat octagon;
  - a docking adapter in machined metal, with its ring and guide petals;
  - a parabolic high-gain dish with its feed on struts, on a gimballed boom.
- **The spine:** the lattice, with a cable tray and avionics boxes along it.
- **The wings:** each a pair of blankets either side of a deployable lattice mast, a blanket box at the root and a tip bar.
- **The radiators:** ribbed panels in frames, on hinged arms.
- **The tanks:** capsules in gold foil (a finer crinkle than the first pass's hammered look), white tape straps, feed lines to the drive.
- **The drive:** a hexagonal thrust frame and three ion thrusters with glowing grids, their cathodes and gimbal rings.
- **Windows:** dark glass that reflects his star, with only a hint of warm light inside.
- **Where parts meet:** ambient occlusion baked in Blender (Cycles, a 2048 map on the model's own second UV set), carried in the model as glTF's occlusion. three only lets that darken indirect light, so the site also lets it soften his star's direct light by part where parts crowd each other (`ships.ts`). The shadow maps do the rest.
- **The shadowed side:** the ship's fill is most of the way to grey, so a white hull's shadow reads as dark slate touched by the region's hue.
- **Size:** 35,556 triangles (was 13,560); `public/voyage/ship/truss.glb` 731 KB (was 171 KB), most of it the occlusion map.

Evidence: [`finish/`](finish/) (made by [`finish/evidence.sh`](finish/evidence.sh)):
- reading spots at 1440, 390 and 844;
- close-ups at DPR 2 from the dive to About;
- the dive's in-betweens with contact sheets;
- walkthroughs `finish/out/opening-truss-{1440,390}.mp4`;
- contrast and frame cost.

- **Contrast:** unchanged, every reading spot passes (worst title 5.8:1, worst text 7.5:1, worst small print 6.4:1).
- **Frame cost** (GPU mean / p95; the bar is 4.66 / 7.21), at 60 fps:
  - the stretch from the hero to the peel: 3.29 / 4.15 ms at 1440, and 1.56 / 2.74 at 390;
  - About: 3.58 / 3.99 at 1440.

  The finish costs nothing measurable over the first pass: the machine's own drift between runs is larger.
- **Tests:**
  - **No new unit tests:** the finish is the model and its shading, checked in the frames above.
  - **Results:**
    - unit 179/179;
    - `voyage.spec` and `smooth-scroll.spec` 18/18;
    - tsc passes;
    - eslint flags only the pre-existing `app/page.tsx` error.
- **Refactor verdicts:**
  - **The bake** is a general helper in `shiplib.py` (`bake_ao`), so the ring can be finished the same way if he switches back. Kept.
  - **The truss's part helpers** (portholes, berthing mechanisms, handrails) stay in `truss.py`: only it uses them. Kept.
  - **Letting the occlusion reach direct light** (`occludeDirect`) stays in `ships.ts`: only the ships' models carry a baked map. Kept.
  - **The greyer fill** is the ship's own (`update` in `ships.ts`), not a change to the film's night-side rule for anything else. Kept.

**Left for finishing:**
- The ring, if he switches back: its first pass hasn't had this finish.
- The occlusion map could drop to 1024 if the model's 731 KB matters for first load. It loads after first paint and while the dive plays, so it doesn't now.

The round as it was shown, with every take:

## What was done

1. **Rounds 1–8 are frozen** as a prototype that runs: [`prototypes/opening-solar-system/`](../../prototypes/opening-solar-system/README.md) (`./serve.sh`, then `http://localhost:4185/`).
2. **The opening is the original again:** the ticket-35 build, exactly. That build was never committed, so its files were rebuilt from the session's transcript:
   - **The rounds' edits played backwards:** each edit's recorded replacements reversed, from today's files back to just before round 1.
   - **Checked by playing them forwards:** rounds 1–8 replayed from those rebuilt files land on today's files exactly. The checks also matched every full read the transcript made, and the copies round 2 saved of the files it removed.
   - **The scripts that cut text by position** were undone by hand: an ADR amendment, an appended test block, a reshaped storyboard table.
   - **Back, as they were:**
     - the hero (the Jost two-line lockup with its rule);
     - the dive at his star, its camera and timings;
     - the sun, the orbit and its peel;
     - the film at 42.45 screens.
3. **Kept from the rounds: the word-by-word text.** Round 4's change is laid on the original by hand where rounds 2–3 had reshaped the same code:
   - About is written in word by word (`rise`);
   - the light threads, the letter-by-letter title and their SVG layer are gone;
   - ADR 0004's word-by-word amendment stays.
4. **Home is a ship, in three takes,** modelled in Blender from scripts ([`shiplib.py`](shiplib.py), [`ring.py`](ring.py), [`hull.py`](hull.py), [`truss.py`](truss.py)):

   | Take | What it is | Triangles | `.glb` |
   |---|---|---|---|
   | **ring** (default) | A ring of twelve modules (habs with lit windows, stores in gold foil, engine pods with radiators) on four spokes round a docking hub. It turns on its axis, for gravity. | 10,032 | 131 KB |
   | **hull** | One long armoured hull: a cockpit at the nose, a crew deck's windows, turrets, thruster quads, radiator fins, a fusion drive's bell with its throat glowing, running lights. It rolls slowly. | 6,104 | 72 KB |
   | **truss** | A lattice spine: the crew's modules forward (a node, side modules, a cupola, a docking port), solar wings and radiators amidships, gold-foil tanks and three ion thrusters aft. It rolls slowly. | 13,560 | 171 KB |

   - **Materials:** each has painted hull panels, crinkled gold foil (a normal map), ribbed radiators and solar cells, all small tiling textures. Metals are only half metallic: with no environment to reflect, full metal goes black in three as in Blender.
   - **Lighting:** each is lit as the rest of the film is. Three's own lights are matched to his star and the region's fill (round 1's `matchLights`), it ends in PBR Neutral (`neutralOut`), and it casts soft shadows on itself.
   - **Pose:** each is stood to About's camera, so it shows its best side on every screen shape. Each also has its own size: a sparse or slender ship stands bigger, so it fills the frame about as the old world did.
5. **His portrait, in three takes,** in place of the stand-in's grey slab:
   - **ring** (default): round, threaded on the orbit, in a frame made like the Voyager record's cover. It's gold-anodised aluminium with fine machined grooves and 72 engraved ticks. The brushed highlight swings round it with the light, and a raised lip catches the light on the star's side (`frame.ts`). The orbit's hairline runs into the frame and out again from any side: it's cut where the camera's ray passes through the disc. Its light leans towards the camera, as round 3 did for Earth, so the gold reads with his star behind it.
   - **column:** a mounted print under About's lines (a dark mat and a gold hairline). It hangs below them without moving them. On a phone it sits small over the lines; held sideways, beside them. The plain page always shows it.
   - **callout:** a card on a leader line from the ship's edge, with his name and Cebu, as the film labels things. On a phone it's in the list under the lines, with a small photo.
6. **The take switcher is back** (the "Takes" chip, top left, development only), now with two choices: the ship and the portrait.

## See it

With the dev server on :3000: `http://localhost:3000/`, then the "Takes" chip. Or by address, e.g. `?ship=truss&photo=callout`.

## Evidence

All made by [`evidence/evidence.sh`](evidence/evidence.sh) with the scripts in [`../hero-and-home/`](../hero-and-home/README.md):
- the reading spots at 1440, 390 and 844:
  - each ship (`evidence/shots/ship-*`);
  - each page-side portrait (`evidence/shots/photo-*`);
- the in-betweens of the dive to About, every 0.1 screens, with contact sheets (`evidence/shots/in/`);
- walkthroughs:
  - `evidence/out/opening-{ring,hull,truss}-1440.mp4` and `opening-ring-390.mp4`;
  - the page-side portraits: `portrait-{column,callout}-1440.mp4`;
- contrast: `evidence/aa.txt`, and `aa-column.txt` with the print under the lines;
- frame cost: `evidence/frame-cost-{ring,hull,truss}.txt`;
- Blender previews: `preview/`.

## Results

### Contrast (`evidence/aa.txt`, `evidence/aa-column.txt`)

Every reading spot passes, with the print under About's lines too (the numbers are the same):
- worst title 5.8:1 (390, Around home);
- worst text 7.5:1 (390, Around home);
- worst small print 6.4:1 (1440, Around home).

### Frame cost (`evidence/frame-cost-*.txt`)

GPU time per frame, mean / p95 in ms (1440 at the tier's DPR 1.8; 390 at DPR 1.5). All at 60 fps.

| | Stretch, hero to the peel (0–6.45) | Hero | About | Around home |
|---|---|---|---|---|
| The bar | 4.66 / 7.21 | | | |
| ring, 1440 | 3.73 / 5.99 | 3.40 / 5.57 | 3.61 / 6.16 | 3.66 / 5.77 |
| ring, 390 | 2.50 / 4.52 | 2.89 / 4.02 | 2.78 / 4.78 | 3.00 / 5.08 |
| hull, 1440 | 3.28 / 5.78 | 3.17 / 5.41 | 3.30 / 5.15 | 3.38 / 5.52 |
| hull, 390 | 2.50 / 4.11 | 1.87 / 3.63 | 2.60 / 4.25 | 2.58 / 4.43 |
| truss, 1440 | 3.40 / 5.72 | 3.18 / 5.66 | 3.37 / 5.18 | 3.41 / 5.48 |
| truss, 390 | 2.24 / 4.28 | 1.92 / 3.86 | 2.72 / 4.35 | 2.78 / 4.53 |

- **All under the bar.** The ships' self-shadows are drawn only while a ship is on screen.
- **Each run has one long frame,** once (33–50 ms). Earlier rounds put a first-time React task as About comes in at the same place.
- **The walkthroughs** all ran at a median 16.7 ms a frame.

### The restore's checks

- **Replayed forward,** the rebuilt original lands on today's files, file for file, for every file that matters.
- **The stage, the camera's code, came out the same both ways:** forward from the session's first read of it, and backward from a later read.
- **lit.ts, its test and hairlines.ts** match the copies round 2 saved when it removed them.
- **The original's own tests pass on it:** the storyboard's 42.45 screens and every block's windows.
- **A shot every half screen** shows the opening as it was (the hero, the dive, About, Around home, the peel).

### Tests

- **TDD:**
  - **the takes** (`takes.ts`), red then green each time:
    - the ship;
    - then the portrait;
    - then dropping the grey slab;
  - **the light matched for three's materials** (`matchLights`): round 1's test brought back first, red, then its code, green.
  - The ships, the frame and the page-side portraits are drawing and layout. They're checked in the frames and walkthroughs above.
- **Results:**
  - unit 180/180;
  - `voyage.spec` and `smooth-scroll.spec` 18/18;
  - tsc passes;
  - eslint flags only the pre-existing `app/page.tsx` error.

### Refactor verdicts

- **The orbit's laying** is one function now, for the whole ring and the ring cut round the portrait. The slab's angle gap and its constants are gone. Done.
- **The frame's shader** takes PBR Neutral and the key light's strength from `lit.ts` rather than its own copies. Done.
- **Each ship's pose stays in code, not in the models,** because it's set against About's camera, which only the film knows. Kept.
- **The portrait's three images** (the print, the card, the phone's list) could share a component. Each is one line at its own size, so they stay inline. Kept.
- **`ships.ts` carries round 1's loader** (lights matched to his star, a warm-up draw). Its old home is gone, so nothing is duplicated. Kept.

## Left for finishing

- **The ships are first passes,** built to be chosen between. The one Janriz picks gets the finishing:
  - real panel and greeble detail;
  - baked ambient occlusion;
  - the drive and windows tuned in place;
  - a look at it from the dive's side.
- **The portrait's crop** is fixed by hand to the current photo (`CROP` in `home.ts`).
- From earlier rounds:
  - the road's start;
  - the shared noise GLSL.
