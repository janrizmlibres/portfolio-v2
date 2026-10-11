# Finalize the pipeline and its climax: the takes, on the real site

## Janriz's pick (2026-10-04), now the site's pipeline

He took round 2's recommendations ("agree", "yes"):
- **The rings:** each bulkhead carries its stage's fixture. The plain take is off the site: the `pipeRings` take is gone (`takes.test.ts` checks it), and the fixtures always show.
- **The climax:** the light is pushed, with the prototype's camera kept.
  - The crest is wider (`uW` 0.7 SP) and brighter (×24).
  - Each ring flashes up to 1.4 as the crest reaches it.
  - The front's light is ×5, and the rush has 90 records with a warmer trail (×0.24).
  - The front now runs on past the report's deck, so Report's ring lights too.
- **The pages:** kept pale.
- **The text zone and the phone titles in the column:** kept.

Measured after the push ([`evidence/cost-r2-climax.txt`](evidence/cost-r2-climax.txt), 32.2 to 34.3): 60 fps at 1440 and 390, no frame over 20 ms. Unit 296/296; tsc and ESLint clean. The final walkthrough is [`out/pipeline-final-1440.mp4`](out/pipeline-final-1440.mp4); the climax's stills are `look/1440-t*-r2*.png`.

The rest of this README is round 1 as it was shown.

## Round 1 (2026-10-04)

Scene 12's second half built for real on the real site, as Janriz answered round 1's ten questions (my pick on each). Measured on the `redesign` branch, uncommitted (M5, headless Chromium with the GPU on, ANGLE on Metal).

## See it

Use the dev server on :3000, then the "Takes" chip top left (development only), or the address:

| Choice | Takes (the first is the default) |
|---|---|
| The pipeline's rings | `?pipeRings=fixtures` · `plain` |

- **Where to look:**
  - The fall starts after the crawler opens (about 26.3).
  - The stages' reading spots are Start 26.83, Search 27.59, Extract 28.35, Dedup 1 29.11, Enrich 29.87, Dedup 2 30.63, Save 31.39 and Report 32.15.
  - The front leaves at 32.50 and lands at about 33.35, and "Paid for once" is read at about 33.6.
- **What's unchanged:** the camera path, timings, composition and text manners are the storyboard's (round 3). Only the bodies, their light, and what the film sets on them are new.

## What's built

- **The parts, authored in Blender by script** ([`pipeline.py`](pipeline.py), [`build.sh`](build.sh)).
  - **The bulkhead:** one machined ring per stage (`ring0–7`), the same for every stage. It's flanged, with twelve joints on its outer face, a bolt circle top and bottom, the stage's tag engraved on its top face, three longeron fittings with a gold-foil junction box and cable run beside each, and the recessed channel (material `channel`).
  - **Each stage's fixture** (`fix0–7`):
    - Start and Save: a magazine, a cage of six posts and three hoops on a base, its slabs drawn by the site.
    - Search: ten small dishes on arms, facing outward (none where the longerons meet).
    - Extract: a square die inscribed in the bore (four jaws, platens and corner blocks).
    - Dedup 1 and 2: a twin ring close below, on six posts.
    - Enrich: ten hairpin heater elements round the bore (material `heater`).
    - Report: a curved deck under the bars, with four slots.
  - Occlusion is baked per part (512 px). `public/voyage/pipeline/pipeline.glb`: 68k triangles, 868 KB (meshopt, WebP).
- **The code** (`lib/voyage/pipeline.ts`, with `lib/voyage/climax.ts`, which is tested):
  - **The mast:** three longerons on the rings' outer edge with a diagonal cable across each face of each bay. It stretches as the rings drop, so the crawler's fold is the mast collapsed.
  - **The swarm** (44), on the prototype's paths:
    - At Search, pages tumble in from all round: thin, bare, bent and odd-sized. A hairline runs from the dish nearest each page while it's fetched.
    - At Extract each page squares up, pulled into the die, and its engraving is cut in from its leading edge.
    - At each Dedup a duplicate slides into its twin and is gone.
    - At Enrich the records thicken in the heaters' warm light.
    - At Save they sink into the magazine, which fills slab by slab.
    - Start's magazine gives up its queries (5) as they leave.
  - **A burning ring:** as the swarm passes, its channel flares, its metal turns glossier and cools back, and its light falls on the records in its colour. That light is two point lights that only the pipeline's surfaces see, so the rest of the film pays nothing for it.
  - **The report's bars:** four standing plates (Found, Merged, Enriched, Saved) on the deck, named on leader lines. Their heights are a pattern only, and they rise to 0.6 at Report.
    - The deck turns so the bars stand to the right of the shaft as Report is read, clear of the text column.
    - Report's deck is now just under Save (`world.ts`), as the prototype has the bars standing round Save's database.
  - **The climax** (`climax.ts`):
    - A warm-white crest runs down the longerons, launching fast and slowing (1 − (1 − x)^2.6), as bright as it's fast.
    - Each ring flashes warm white as it reaches it, then holds its colour, its metal tinted with it, while "Paid for once" is read.
    - 56 records rush behind the crest, each stretched up to 120× its thickness by the crest's speed, with a fading warm trail (a long exposure). There is no post pass and no bloom.
    - The bars shoot up as it lands (back.out), and a hairline outline of the Enriched bar stands at Found's height, labelled "−70% / enrichment costs". The pattern carries the figure: Enriched is 0.3 of Found.
  - **A text zone:** while the fall is on, the pipeline's bodies dim where the stage's text is read (the left 30–40% on a wide screen, the bottom 30–44% on a portrait one), and the search's hairlines all but go there. On a phone the shaft fills the top half and falls away into the dark below it.
  - **On a portrait screen** each stage's title heads its lines across the bottom (`portSide: "column"`) instead of riding its ring, since the hardware fills the top half.
  - **Warm-up:** everything is drawn once off screen as it loads.
  - **The fling:** a hard scroll throws the swarm and the rush outward.
- **The crawler** now holds the pipeline's own rings folded and drops them (the boom and spokes are gone). Its 40 falling records hand over to the swarm as the pipeline drops.

## Measured

- **Contrast** ([`evidence/aa-r1c.json`](evidence/aa-r1c.json), and [`aa-r1d-crawl.json`](evidence/aa-r1d-crawl.json) for Search after the zone was widened): every reading spot passes at 1440 and 390.
  - **At 1440:** the worst title is 11.4, text 7.8 (outcome), small print 5.5 (outcome), labels 7.7.
  - **At 390:** Report's title is 3.2 (needs 3) and the outcome's 10.0; every other title is 7.8–12.5. Text is 11.1 or more, and small print 6.4 or more.
- **Frame rate** ([`evidence/cost-r1.txt`](evidence/cost-r1.txt), 26.6 to 34.3 played in 10 s, then 90 frames at each reading spot): 60 fps at both sizes, no frame over 20 ms. The pipeline adds about 2.5–3 ms of GPU at 1440 and about 1.5 ms at 390. Those are paired runs on a GPU other sessions share, so a quiet re-run is due.
- **Tests:** unit 296/296 outside `.scratch`. `climax.test.ts` covers the front, its crest, a ring held lit and the bars' 70%; `takes.test.ts` covers the take. ESLint is clean on the touched files. tsc is clean on them; its only errors are in `lib/wake/` (another session's work in progress).

## Evidence

- **Walkthroughs:** [`out/pipeline-1440.mp4`](out/pipeline-1440.mp4) and [`out/pipeline-390.mp4`](out/pipeline-390.mp4) (37 s each, 60 fps), from the crawler's opening down every stage to "Paid for once", each with a contact sheet.
- **Stills** in `look/`:
  - `1440-t*-r1.png`: every reading spot plus the front at 32.60, 32.75 and 32.90;
  - `1440-t*-r1-plain.png`: the plain take at the five fixture stages;
  - `390-t*-r1.png`: the phone;
  - `1440-t*-r1-still.png`: reduced motion.
- **Blender previews:** `out/preview-*.png`.

## Found and fixed along the way

- The compressor stores each part's offset and scale in its node, and the loader was zeroing the node's position, so every fixture was drawn at the ring's centre. The site now keeps each node's own transform.
- The report's title, anchored to the deck (now just under Save), landed on its own lines, so it rides higher (`ay` 2.4).

## For Build the pipeline and its climax

- The climax is seen from the prototype's drawn-back camera (0.15–0.2 away), where the crest and rush are small. Judge it in the MP4 and in place. Light strengths are the knobs (the crest ×14, the held rings ×5, the rush's trail ×0.15).
- `pipeline.ts` is about 540 lines. The build may split the swarm and the report into their own modules.
- `?pipeRings=plain` goes once Janriz picks.
