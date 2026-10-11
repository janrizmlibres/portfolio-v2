# The voyage is one take: no holds, no settling, text tied to the scroll

Status: accepted (2026-10-01). It amends ADR 0001's 2026-09-29 amendment.

ADR 0001's amendment made the page a film of scenes that arrive, hold and leave. A hold was a composed, nearly still stretch. The stage settled onto a hold when the visitor stopped near one, and text arrived at its own pace once its threshold was crossed.

Built to the letter, that read as "you try to scroll, nothing is happening for a few seconds then it jumps to the next scene". The lesson from Edolus is the opposite: every scroll transforms something.

## Decision

- **One camera path through the whole film.**
  - Keys are poses at times, measured in screens of scroll.
  - Every value runs on a monotone cubic through the keys, so the camera's speed is continuous. It slows and speeds up, but it never stops dead.
  - Distance runs in log space, so a dive or a pull-out reads as one steady speed.
- **Reading stretches replace holds.** Where a block's text is fully in, the camera slows to about a fifth of its pace. It never stops, and the subject keeps turning with the scroll.
- **No settling and no snapping.** The picture eases a little behind the scroll, and that is all.
- **Text is tied to the scroll.**
  - Words write in and dissolve with it, backwards too.
  - Each scene's words arrive in that scene's manner, tinted by its light, and settle to white.
- **No cuts.** Every seam carries a thread into the next scene:
  - an anchor that stays centred;
  - a line or a stream the camera follows;
  - or the new subject growing out of the old one.
- **The reading spot** is the middle of a block's reading stretch. Deep links, warps and reduced-motion stills land there.
- **The promise for text:**
  - every word is readable, at AA, at its reading spot;
  - all text is in the document, in page order, all the time.

## Considered options

- **Holds with an Edolus-style settle** (round 1 of *Storyboard the voyage*). Rejected: the still stretches and the settle read as dead scroll followed by a jump.
- **A scene stepper** (US Avionix), which plays one scene per gesture. Rejected: you can't skim it, slow down inside it or stop in the middle of it, and it fights native scroll.
- **Text played at its own pace from a threshold** (Edolus's scrambles). Rejected: tying the words to the scroll keeps them in the visitor's hand and reversible.

## Consequences

- Every frame is part of the film, so the finish bar covers in-between frames, not just reading spots.
- The stage holds a camera path, a timeline of discrete states, and continuous drivers set from the scroll each frame (spins, orbits, falls). A block carries its in and out windows, and the camera's pace is integrated from the reading stretches.
- *Hold* leaves the vocabulary. *Reading stretch* and *reading spot* replace it in `CONTEXT.md`.
- Reduced motion is unchanged in spirit: a still per reading spot, crossfaded, with nothing moving.

## Amendment (2026-10-02, *Build the film engine*)

"The picture eases a little behind the scroll" is the film's own clock: its time follows the scroll with a 0.2 s time constant, as in the storyboard. In the film nothing on the page scrolls by (each block's text is fixed in the frame), so ScrollSmoother's moving content would add nothing but a second lag, and it would break the fixed text. ScrollSmoother now smooths only the plain reading layout, the no-WebGL page. GSAP is still the only animation library: the clock runs on its ticker.

## Amendment (2026-10-03, *Finalize Contact*)

"Back to the start" no longer plays the film back to its first frame, and doesn't warp. It replays, as Edolus's ending does: the frame fades to black (0.6 s), the page lands on the exact first frame under the black, holds (0.4 s), and fades back in (1 s); reduced motion only crossfades. Contact already shows the whole sky, so there's nowhere to travel, and playing 42 screens back reads as the film rewinding. It is the one nav link that doesn't warp. Back stays honest: the start's address is pushed, and browser Back returns to Contact's exact place.

Contact's pull-out keeps the whole trajectory drawn while the bodies fade: the voyage seen once in full, ending at his star, gone before Contact is read.

## Amendment (2026-10-11, *Work as relays*): keeping the one path smooth

The path eases each value of a key on its own: the target, the direction, the log of the distance. Every key can be right and the camera can still jolt between them. Janriz saw it as a view snapping from his star to the ship, as swerving, as a camera that "bumps into something before settling inside", and as "jagged" where it should be smooth. The causes, measured, and the rules they leave:

- **A target that moves with the camera keeps its distance.** If the eye leaps far ahead while the camera moves (a throw, a beam ride), the separately eased target and distance carry the camera on and back. Through a drop, a charge and a throw, the eye stays one distance off and only turns (`eyeOf` and `eye` in `chain-camera.ts`).
- **Two shots that look from far apart are bridged.** Easing a direction's components between two shots 159° apart whipped the view round at ~1,140° a screen. `bridge(a, b)` (`lib/film/path.ts`) keys a great-circle turn between them, with the light easing from one region's to the other's, and peaks at about 1.5× the average turn.
- **Neighbouring keys agree on what's looked at.** The dive's last key looked between his star and the ship; About's first, a twentieth of a screen later, looked at the hub, and the view snapped 24.5°. A stretch that takes over from another starts from where it was looking (`from.target` in `aboutHold`).
- **A curve is travelled by its length.** A Catmull–Rom curve taken by its own parameter swells and sags in speed from one stretch to the next (`byLength` in `chain-camera.ts`). A waypoint straight above the destination makes it run past and come back, so come in at an angle (`SPOT.down`).
- **Keys sit closer where the camera is close to things.** 0.02 screens apart through a relay's drop, charge and throw, against the usual 0.05, so the easing between keys doesn't ripple the speed.
- **Measure, don't eyeball.**
  - `scripts/film/turns.mjs` reads the live path (`window.__path`, development only) and lists every stretch turning faster than a limit.
  - `voyage.spec.ts` holds the hero to Work's end under it: 270° a screen on a desktop, 325 on a phone, outside the throws' flashes, whose cuts the flash hides.
  - Known and not yet bridged: Athena to the crawler (~755° a screen at 28.65) and the record's flight into the ribbon (~980 at 39.5).
