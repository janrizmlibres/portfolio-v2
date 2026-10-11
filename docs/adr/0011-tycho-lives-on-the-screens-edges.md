# Tycho lives on the screen's edges, not in the film

Status: accepted (2026-10-04)

Tycho is placed relative to the screen. He isn't part of the voyage's 3D world. He stays on the frame's edges in every scene, as he did in *See the bot in the viewport*. He doesn't ride the film as its guide.

*Finalize Tycho in the film* built a guide on the real site:
- between blocks he flew to a spot beside each block's subject and pointed at it while it was read;
- twice he dove ahead into the picture, into Janriz's star and upstream into the crawler.

Janriz turned it down: "He is placed relative to the screen. He's not part of the 3D world so having him guide through the journey makes it awkward." A figure on the front layer standing beside a ring or a planet reads as stuck on, not as being there.

## Decision

**Where he is:** on spots along the frame's edges, the same in every scene. His home starts in the bottom-right corner. Until the visitor picks a spot, home is wherever his wander last took him.

**How he moves:** direct, on a shallow arc, never along the edges' track.
- A flight takes 0.45–1.5 s.
- Before a long flight he crouches (`anticipate`). He leans into the travel and settles when he lands.
- Moves the visitor causes fly faster: a shoo, a flick, or text coming under him.

**The wander is lively.**
- A hop every 7–12 s, to a free edge spot 240–900 px away.
- No wander:
  - on phones;
  - under reduced motion;
  - while the pointer rests on him;
  - while a picked spot holds him;
  - while his bubble is open.

**He keeps clear.** His body keeps 10 px clear of:
- the text being read, and the plates of labels (the portrait's card);
- the route map;
- the sound toggle.

Text that comes under him sends him to the free edge spot nearest home: a block arriving, a riding title, a label. Whatever the visitor focuses, clicks or selects counts as text for 20 s.

**Home base.**
- A drop or a flick snaps him to the nearest free edge spot, and that spot becomes his home base. It holds him 30 s before he wanders again.
- Once a scroll settles, he goes back to his home base if it's free.
- Shake-to-shoo moves him at least 240 px away. The spot he left stays off-limits (120 px round it) for the session.
- The keyboard's "Move Tycho" takes him round the four corners and announces where he went.

**Talking doesn't move him.** Clicking him opens his bubble where he is, and he holds still while it's open. The card comes to him:
- **Above him when there's room.** This is the settled place in his corner:
  - lined up with his right side when he's in the right half of the frame, with his left side otherwise;
  - its bottom 26 px above his canvas.
- **Otherwise beside him,** towards the frame's middle, its top level with his.
- **Otherwise below him.**
- **On a phone** it spans the width, 6 px above him, or below him when he's been moved to the top.
- **Its size:** never more than half the frame, never past the frame's edge (16 px in).
- **The leader:** from his head to the card's nearest edge, or from his base to a card below him.
- **The unfold:** from the card's edge nearest him.

**The warp:** he leaves from his spot and lands back on it. Where he flies in between is the warp's rebuild.

**Unchanged from ADR 0007:**
- on phones he doesn't wander, though drag and flick still move him;
- under reduced motion every move is a fade (0.15 s out, 0.15 s in), and he doesn't emote.

## Considered options

- **The guide, beside each subject.**
  - **For:** he'd ride the voyage with the visitor, pointing at what each block is about.
  - **Against:** he's drawn on his own canvas over the page, so beside a 3D subject he never belongs to its world.
  - Rejected by Janriz.
- **Dives into the picture at two beats.** Rejected for the same reason.
- **His corner, guiding from there** (pointing at and watching each block's subject). He'd still be acting as the film's guide. Rejected with the guide.
- **A wander paced to reading** (holding still while a block is read). Janriz picked lively.
- **Flying back to his corner to talk,** so the bubble keeps one place. Rejected: clicking him doesn't move him.

## Consequences

- **The bubble's place** follows Tycho instead of a fixed corner. *Build the bubble* builds it from `lib/tycho/card.ts`.
- **No film input:** his placement reads only the screen, never the film's time. What's on the screen includes the 3D subjects (amended below).
- **The rig** gains `lean(vx, vy)`, for leaning into travel.
- **Reference build:**
  - `lib/tycho/roam.ts` (behaviour);
  - `lib/tycho/spots.ts` (clearance, edge spots, the shake, the flick), tested;
  - `lib/tycho/card.ts` (the bubble's place), tested.

## Amendment (2026-10-04): clear of the subjects, not only the text

Janriz tightened the rule while *Build Tycho in the film* was built: Tycho keeps clear of the 3D subjects on screen as well as the text. That covers the ship, the monoliths, the gates and their CubeSats, Athena, the crawler and its shaft, the ribbon, and his star burning at Contact.
- **Where he parks and every hop** keep 10 px clear of each subject's footprint, as of the text. A subject sliding under him moves him on.
- **His flight** bows to whichever side of the straight line keeps clearer. A wander hop only goes where it can fly clear.
- **No spot clear:** he takes the one the subjects cover least, never one on the text if any is off it, and shrinks there (0.7). He grows back once his spot clears.
- **The footprints come from one shared registry** (`lib/film/footprints.ts`). The stage adds each scene's bodies to it (`lib/voyage/bodies.ts`), and Tycho reads only the registry, never a scene.
  - A footprint is one screen box per drawn part (each mesh's bounding box, projected).
  - It leaves out lines laid as meshes (the orbit, the route), parts behind the camera or reaching past it, and anything filling over half the frame, which is the setting rather than a subject.
  - The boxes are worked out only when read, at most once a frame. Tycho reads them four times a second.

