# PROTOTYPE — Storyboard the voyage, round 3 (throwaway)

For [Storyboard the voyage](../../issues/30-storyboard-the-voyage.md). Round 2 is frozen in [`../voyage-storyboard-2/`](../voyage-storyboard-2/README.md), and round 1 in [`../voyage-storyboard/`](../voyage-storyboard/README.md).

**Where this round comes from:**
- Janriz was satisfied with round 2 (2026-10-01): "this is so much better. i'm actually satisfied with this one."
- He then asked for a review of all six case studies and a list of improvements.
- He picked items 1, 2, 4–15 from that list. Item 7 was already decided in *Pick the creative concept*.
- Item 3 (one angle for all motion) stays out.
- Item 16 (Pip as the film's guide) is saved in the map's Not yet specified, to workshop later.

**What's in it:** round 2's film, one take with no holds and no snapping, with the picks built on top. It is still grey blocks inside the real sky.

The scene-by-scene shot list is in [SHOTLIST.md](SHOTLIST.md). The walkthrough is at [recording/out/voyage-round-3.mp4](recording/out/voyage-round-3.mp4) and lasts about 3½ minutes:
- the film is scrolled natively at reading pace, with the chrome hidden;
- it stops four times to use the pointer: a star, then a drag of the sky; a monolith; Athena; the crawler's lens.

`node recording/record.js` re-records it.

## Run

```sh
.scratch/redesign/prototypes/voyage-storyboard-3/serve.sh        # then open http://127.0.0.1:4180/
LAN=1 .scratch/redesign/prototypes/voyage-storyboard-3/serve.sh  # reachable from a phone on the network
```

Static files only. three.js, GSAP, the stars, the topic labels, the stand-in bot and the portrait are links into `deep-field-sky/`. Round 2 still runs on :4179.

The yellow chrome is the prototype, never the design. It works as in round 2: the scene card (C), the film strip, the shot list (L), ⚙, J / K for the next and previous scene, and H to hide the chrome. Pip's bubble carries one yellow line, because this prototype has no chat: it shows what would be asked.

## What changed, item by item

Numbered as in the list Janriz picked from.

| # | What it does in the film | From |
|---|---|---|
| 1 | **The slab is the film's one object.** One shape, 1.6 to 1, with corners rounded at 6% of its short side. Standing, it's his portrait's plate (the film's first slab, replacing round 2's disc) and every monolith. Lying down, it's every record in the stream and the crawler, the record that flies out, and every screenshot in the ribbon. | Produx: one moss rock carries the hero, the middle and the footer |
| 2 | **One climax, at "Paid for once".** The camera draws back until the whole shaft is in view, then the whole run happens again at once. A front of light runs down the shaft, lighting each stage's ring in its colour in turn, with a rush of records falling behind it into the database. The report's bars shoot up as it lands, and every ring stays lit while the outcome is read. | Edolus's quantum climax; Trionn's one value that drives the burst |
| 4 | **Text arrives the way its scene moves.** <ul><li>About's lines come out of the stars they're written from, and go back into them.</li><li>Each monolith's inscription is cut into the stone left to right, and eroded the same way as you pass.</li><li>Each crawler stage's words do what the stage does to a record: rise out of the database (Start), fly in from all round (Search), square up from tilted and skewed (Extract), arrive with a duplicate that slides into them (each Dedup), fill out from thin to heavier type (Enrich), drop in and sink out (Save), and grow up from the baseline like bars (Report).</li></ul> It's all real HTML, moved by transforms. | Izanami's headings surfacing through water. The Produx study calls plain word-by-word fills generic. |
| 5 | **Words write in tinted by the scene's light, then settle to white.** Each scene uses its own tint (violet for About, cyan on the road, amber in the crawler, green for the personal work). Each crawler stage uses its own colour from his diagram. | US Avionix: every heading enters red-orange and settles to white |
| 6 | **Leader lines.** A dot on the object and a line out to its label, drawn in as the label arrives. Labels sit out along the line from their parent's centre and are pushed apart if they'd overlap. On phones a block's labels become a list under its lines. Athena's three patterns keep riding, so they don't land on her lines. | US Avionix's drawn spec callouts; Produx's phone lists |
| 7 | **The stars are interactive where they're the subject:** the whole sky (the hero and Contact), the stars round home, and his university's stars at the road's start. <ul><li>Hovering a star shows its topic and how many stars share it.</li><li>Clicking it asks Pip.</li><li>Where the sky is seen whole, dragging turns it, and it coasts when you let go.</li></ul> | Decided in *Pick the creative concept*. The drag is Edolus's drag-to-rotate. |
| 8 | **Anything in the film can be asked about.** Over home, the plate, a gate, a monolith, a world, a moon, a pipeline stage or a screenshot, a chip such as `[ ASK ABOUT ATHENA ]` follows the pointer, and a click asks Pip. Each block also carries a real "Ask Pip about …" button, shown when it has keyboard focus. | Produx's cursor chips that name the action |
| 9 | **The crawler shows its insides before the dive.** The world holds its pipeline in miniature: its stages top to bottom, each ring in its colour, with a pulse of light running down them. A lens round the pointer cuts the shell away to show it. Athena's nearest wedge parts towards the pointer, showing her core. In both, the scroll still does the full opening. | Edolus's x-ray onto the chip; Hashgraph's rock opening round the pointer |
| 10 | **A hard scroll is felt.** Loose things are flung outwards and close up again as you slow down: the crawler's swarm, the stream's records, the beads on the gates, the moons. Light streaks are kept for the warp. | Edolus's quantum loop, pitched by scroll speed |
| 11 | **About 42 screens, down from 48.8.** <ul><li>The road went from 14.1 to 11.2 screens, by cutting the pace between stops, never the reading stretches.</li><li>The crawler went from 11.8 to 10.0, with each stage at 0.76 screens instead of 0.95, and room for the climax.</li><li>The opening runs at 85%.</li><li>The ribbon and the look back are a little shorter.</li></ul> | The Trionn study says its 14.5-screen pin outstays its welcome |
| 12 | **Monoliths rise as you near them and sink once you've passed.** <ul><li>They rise tipped back, out of the dark below the road.</li><li>The road is bare at the peel, and only the next monolith is rising ahead.</li><li>For the look back down the whole road, every one stands again.</li><li>This also cleared the slabs that crowded round 2's company shots.</li></ul> | Trionn's work cards rising into place |
| 13 | **Each screenshot turns flat to face you** as it comes round to the front, lifted off the column and a little larger, then curls back into the ribbon. | Trionn's ribbon settling into a flat grid |
| 14 | **The two thin frames are filled.** <ul><li>The road's start: his university's three stars, which sit just beyond the last ring, light up and the ring frames them. The line reads "Where it starts, out by my university's stars."</li><li>The stream: the camera rides close enough that its records read as slabs streaming past.</li></ul> | Hashgraph and Edolus keep a subject centred through every seam |
| 15 | **Contact ends with his time in Cebu, live** ("It's 7:05 pm in Cebu."), and a "Back to the start" that rewinds the whole film to its first frame in about three seconds. | Izanami's live clocks; Edolus's honest ending and replay |

## The hand, at a glance

| Where | Pointer | Touch | Keyboard |
|---|---|---|---|
| The hero, the stars round home, the road's start, Contact | hover a star for its topic, click to ask Pip; drag turns the sky (hero and Contact only) | tap a star to ask | the "Ask Pip about …" buttons; stars aren't in the tab order here |
| Every subject in the film | a chip names it, click to ask | tap it to ask | the block's "Ask Pip about …" button |
| The AI Web Crawler, before it opens | a lens shows the pipeline inside | — (the scroll opens it) | — |
| Athena, before she opens | the nearest wedge parts towards you | — | — |
| Anywhere | a hard scroll flings loose things outwards | the same | the same |

## Length

42.4 screens. The scenes, in screens:

| Hero | Home | Around home | Peel | Road | Look back | Athena | Crawler | Own time | Contact |
|---|---|---|---|---|---|---|---|---|---|
| 2.2 | 1.6 | 1.8 | 1.5 | 11.2 | 2.9 | 3.5 | 10.0 | 5.9 | 2.6 |

The road includes its four company scenes. Athena and the crawler overlap the scenes either side by about half a screen, so the column doesn't sum to the total.

To get under 40, the next places to cut are the opening (7.1 screens before the road starts), then the ribbon.

## Tiers

- **390 px:**
  - Riding labels become lists, except Athena's patterns, which ride on leader lines.
  - On the road the camera hangs back and swings out from each monolith while it reads it. It still moves forward, only slower, so the whole slab fits the narrow frame.
  - There's no lens, no Athena push and no drag.
  - Tapping a star or a subject asks Pip.
- **Reduced motion:**
  - As in round 2, one still per reading spot, crossfaded. Each still shows the monoliths standing, the screenshot flat and every ring lit.
  - Words show in their settled colour and weight, and leader lines are drawn.
  - There's no fling, lens, push or drag, and the rewind jumps instead of playing.
- **Plain** (the no-WebGL fallback): every block flows as a page, with its "Ask Pip about …" button visible.

## Case studies used

All six, per the map's standing rule:
- **Edolus:** the quantum climax, the x-ray, drag-to-rotate, speed-reactive sound (here, motion), the honest ending and replay.
- **Trionn:** the ribbon settling flat, work cards rising into place, one energy value, and the warning about overlong pins.
- **Produx:** one material story, cursor chips, phone lists, and the warning against generic word fills.
- **US Avionix:** accent-then-settle text and drawn callouts.
- **Izanami:** text that arrives in the site's own material, and the live clocks.
- **Hashgraph Ventures:** the object that opens round the pointer, and a subject kept centred through every cut.

## Not in this prototype

- Pip as the film's guide: saved to workshop.
- The warp (the build's "Back to the start" should be the warp).
- The route map.
- Sound.
- The chat: Pip's bubble only shows the question.
- Type: round 4's Logbook still stands in.
- Final copy: every sentence is a stand-in.
- Frame cost: not measured.

## Files

As in round 2. What's new in each:
- `stage.js`:
  - the slab geometry, and the lens in the block shader;
  - the plate as a slab, and the rising monoliths;
  - the crawler's miniature pipeline, and Athena's pointer push;
  - the climax's front and rush, fling, and the flat-turning cards.
- `film.js`:
  - the pacing cuts and the climax;
  - the monoliths' rise, and the tail framing his university's stars;
  - each block's text mode and tint, the subjects you can ask about, and where stars and drag are live.
- `main.js`:
  - the word modes and the tint settle, leader lines and phone lists;
  - the stars' buttons and labels, the drag, the chip, the lens and push;
  - fling, the clock, Pip's bubble, and GSAP-driven scrolling (ScrollToPlugin) for jumps and the rewind.
- `content.js`: his university's topics, the local-time line and the way back.
- `labels.js` → `deep-field-sky/labels.js`: the stand-in topic labels and what clicking a star asks.
