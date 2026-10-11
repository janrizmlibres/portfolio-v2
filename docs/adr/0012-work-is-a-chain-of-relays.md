# Work is a chain of relays, with a buoy for each breakthrough

Status: accepted (2026-10-10, amended 2026-10-11). It replaces Work's road: its gates, monoliths and look back.

Work was a winding road through the career lobe, with a gate (a ring) at each company, a monolith beside the road for each AI breakthrough, and a look back over the whole route at the end. Janriz, 2026-10-10: "Lots of swerving left and right it me dizzy the entire sequence … the dock thingys … look out of place … It would be nice if they're like 'jump points' … Think Mass Effect. And I hate the look back. Why do we even have this in the first place."

Measured, the road's view turned 460° with 18 left-right reversals. Its winding accounted for 281° of that; the rest came from the glances at the monoliths and the swings out at the gates.

## Decision

- **A chain of jump relays, one a company, run oldest first as a loop** (`lib/voyage/chain.ts`).
  - The newest company's relay stands by home. Leaving from it throws you back to August 2023, out by his university's stars.
  - From there each relay throws you on to the next. The last one, LogoLife's, brings you home, and Projects branch off it (the spur).
- **Straight lanes between relays.** The view turns only at a relay, and slowly.
- **Variety by rule, not by hand.**
  - **Grades:** the relays grow with his career: a scaffold still being built, then compact, full, and the flagship by home.
  - **Beats:** each stop plays a different beat:
    - `inside`: the oldest. The camera goes in over its gimbal and is thrown down the barrel, so the first throw shows how a relay works.
    - `through` and `outside`, alternating: fly straight through it, or watch from off its side as it fires its beam and ride the beam out.
    - `home`: the newest. Held from in front, with no throw.
  - **Pace:** the lanes quicken lane by lane, as AI did.
  - Adding a company is adding its role and its breakthroughs to `lib/content/voyage.ts`; nothing else (AGENTS.md, "Work: adding a company").
- **The look back is cut.**
- **A throw is streaks and a flash, never the warp's wormhole** (`jump.ts`).
  - The streaks belong to the throws alone. Camera speed only stretches them; it never turns them on. Driven by speed alone, they showed in the hero's dive and on every zoom (2026-10-11).
- **Each breakthrough is a comm buoy beside its lane, with its card hung on a leader line above it** (amended 2026-10-11).
  - Janriz on the monoliths: "They look like shadows that bob up and down."
  - The buoy (`buoys.ts`) is a small satellite in the relays' metal: a gold-foil drum, solar wings with nav lights, a dish facing back down the lane, and a strobe.
  - It stands still. A buoy under 10 px across isn't drawn. Its strobe's glow is its own size, so far buoys don't blink as points: "we can see the other buoys twinkling in the distance".
  - The card (date, name, why) is the page's own text, placed by `placeCard` in `lib/film/place.ts`: above the buoy and reaching left, else left, right or below.
- **Each buoy is the nearest one ahead when its card is read.**
  - The camera flies one line per lane (`laneLine`), and the buoys stand beside it, so every buoy is passed the same way.
  - Each is read from close (0.012 back on a desktop, 0.018 on a phone), spread down the lane far enough apart that the one before has been passed.
  - The eye looks down the line while the buoys pass, and turns onto the relay after the last one.
- **No sound for a buoy.** A radio blip was tried and removed (Janriz: "remove the blips i hate them"). The monolith's "slide" one-shot went with the monoliths.

## Considered options

- **Keep the road and tame its camera.** Rejected: the swerving came from the road's shape, and the gates still looked out of place.
- **Relays, newest first from home.** Rejected: the career reads forward in time, and the loop lets Work start and end by home.
- **The same beat at every relay.** Rejected: "it might get repetitive having relays one after another". The grades, beats and pace vary by rule instead.
- **For the breakthroughs:**
  - **Words passing by on their own**, with no body. Rejected: the breakthroughs would become text only.
  - **An incoming signal on the screen's edge.** Rejected: the screen's edges are Tycho's (ADR 0011).
  - **Comm buoys.** Chosen: real infrastructure a relay lane would have, in the relays' own look.

## Consequences

- `chain-camera.test.ts` guards the camera through Work:
  - the turn rate, and how often the view turns back the other way;
  - every buoy framed, and each the nearest when it's read;
  - the camera never passing through a gimbal;
  - only going forward into each throw.
- The relay and buoy models are built by `scripts/models/` (`relay.py`, `buoy.py`) from the station's own materials and helpers.
- In code, a lane's `beacons` (`plan.beacons`, `W.beacons`) are where its buoys stand. In the glossary, **Beacon** is his star at Contact; the code name predates the buoys.
