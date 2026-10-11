# Tycho in the film

**Settled 2026-10-04 (ADR 0011):** Janriz turned down the guide. Tycho is placed relative to the screen, on the frame's edges in every scene, with a lively wander. Clicking him doesn't move him: his bubble opens where he is. Round 1 below is kept as the record of what was turned down. Its takes and `lib/tycho/film.ts` are gone, and the reference build is `lib/tycho/roam.ts`, `spots.ts` and `card.ts`.

**Round 2 evidence (the settled behaviour):**
- `out/r2-edges.mp4`: the wander along the edges at Tolstoy's gate; a click opening the card beside him at the top edge; a flick to the top left, and the card opening beside him there.
- `out/r2-phone.mp4`: dragged to the top at 390, then tapped; the card hangs below him.

## Round 1 (turned down)

For *Finalize Tycho in the film*. The variants run on the real site at `http://localhost:3000`. Pick them on the take switcher (top left, the three "Tycho, …" rows) or by address:

| Take | Variants (default first) |
|---|---|
| `tyguide` | `beside`: between blocks he flies to a spot beside each block's subject, on the side away from its text, and points at it while it's read. `corner`: he keeps to his corner, and points at and watches each subject from there. |
| `tydive` | `on`: twice he goes ahead into the picture, into Janriz's star on the dive and upstream into the crawler as Athena's lines go, then comes back out of the next subject. `off`: he stays on the front layer throughout. |
| `tywander` | `paced`: he holds still while a block is read, and hops only once there's been time to read it (words ÷ 3.5 a second, at least 8 s) and the scroll has rested 4 s. `lively`: a short hop every 7–12 s, as the viewport prototype did. |

**In every take:**
- His body keeps 10 px clear of the text being read, of label plates (the portrait card), of the route map, of the sound chip and of the dev chrome.
- Text that slides under him (a riding title, a label) moves him to the nearest free spot.
- Between blocks he stays where he is.
- **Drag and flick:** a drop becomes his home base, which holds him 30 s.
- **Shake to shoo:** notice, apologise, glance, scoot, all good. The spot he was shooed from stays off-limits for the session.
- He moves off whatever the visitor focuses, clicks or selects.
- **"Move Tycho"** (Tab to it) takes him round the corners.
- **To talk,** he flies back to his corner, where the bubble opens.
- **Phones:** his corner, no wander, but drag and flick still work.
- **Reduced motion:** he stays home and moves by fading.

## Evidence

- `out/r1-opening-beside.mp4`: the star dive, then About through the first two monoliths, with `beside`.
- `out/r1-opening-corner.mp4`: the same stretch with `corner`.
- `out/r1-crawler-beside.mp4`: Athena, the dive upstream, then the crawler and the first stage.
- `out/r1-hands-beside.mp4`: shoo at Tolstoy's gate, then a flick to the top left, which holds into the next monolith.
- `r1-beside/`: one still per reading spot at 1440 (`beside`), with the text-clearance count in `r1-beside.log`.
- `r1-phone/`: one still per reading spot at 390.
- `survey/`: the site before this round, for comparison.
- **Scripts:** `survey.js` takes the stills, `record.js` makes the MP4s (from the recording template; `SCENE=opening|crawler|hands`).

## Code

| File | What it holds |
|---|---|
| `lib/tycho/spots.ts` | Pure placement logic, tested: body box, clearance, free spots, spots beside a subject, edge spots, the shake, the flick's throw. |
| `lib/tycho/film.ts` | His behaviour in the film, reading the film's time, the script's blocks and the stage's view. |
| `lib/tycho/rig.ts` | Gains `pointAt(dx, dy)`, `lean(vx, vy)` and `gaze(fn)`. |
| `components/bubble/Tycho.tsx` | Starts it, opens the bubble only once he's back in his corner, and adds the "Move Tycho" button. |
| `components/voyage/Voyage.tsx` | Hands Tycho the film and the script. |
