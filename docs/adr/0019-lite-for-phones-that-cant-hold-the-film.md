# Lite, for phones that can't hold the film

Status: accepted (2026-10-14). It builds on ADR 0017 (one quality level a visit).

Janriz opened the deployed site in Chrome on a Poco X7 Pro and found it very laggy, after the quality levels (ADR 0017)
and the whole voyage loading under the loader (ADR 0018). By its published specs (not measured) the phone is
mid-range: a Dimensity 8400, a Mali-G720, 8 to 12 GB of RAM and a 120 Hz display at a DPR of about 2.75. Today's
signals start it at `mid`, and nothing marks it weak. Two things were wrong for it. The film drew on every display
frame, so on a 120 Hz display a GPU that can almost hold 60 swung between 120, 60 and 40 fps. And there was no lighter
way to see the site short of reduced motion or a device without WebGL.

## Decision

- **The film draws at 60 fps at most.** On a display faster than about 75 Hz the film, the sky, Tycho's canvas and the
  warp draw on every Nth display frame, the step nearest 60 fps that isn't under it: every other frame at 120 Hz and
  144 Hz, every fourth at 240 Hz (`lib/film/pace.ts`). Nothing heavy runs on the frames between. Motion keeps to real
  time: whatever draws reads the time since the last drawn frame (`drawnMs`), never one display frame's. The display's
  interval is measured as the governor measures its own frames: the median of each 30 frames, the steadiest kept. A
  frame is drawn once it's within half a display frame of its turn, so a late frame is drawn at once and a window
  moved to a 60 Hz screen draws every frame. The governor's frames are the sky's, so it judges missed frames against
  the drawn interval. `?perf` reads the frames drawn too, and its head gives both rates.
- **Lite is the `still` tier, with Tycho flat.** The same scenes, one still per reading spot, crossfaded, with nothing
  drawing between spots; Tycho is his flat drawing, so no canvas of his draws on, through the wake-up too, whose count
  doesn't wait on his 3D there. `<html data-lite>` marks it beside `data-film="still"` (`lib/film/lite.ts`). Reduced
  motion keeps its stills exactly as before. They aren't lite, and it gets no switch or offer: its stills are the only
  way it plays.
- **Who starts in lite is decided before first paint**, in the head script (`TIER_SCRIPT`, `lib/film/tier.ts`), by
  the rule `startVersion` states. A test runs the script against the rule on 384 combinations (`tier.test.ts`). The
  weak-device signals come from `lib/universe/tier.ts` (`WEAK_GPU`, `LEAN`), which the quality level also reads.

  | In this order | Version |
  |---|---|
  | No WebGL, or `?film=plain` | plain |
  | Reduced motion | still (not lite) |
  | `?film=still` | lite |
  | `?film=film` | film |
  | The visitor chose lite / full (kept) | lite / film |
  | An earlier visit's verdict was `slow` (kept) | lite |
  | A GPU from a weak family, or `deviceMemory` ≤ 4 with `hardwareConcurrency` ≤ 4 | lite |
  | Anything else | film |

  The Poco X7 Pro starts in the film on its signals alone. Its first visit plays the film at 60 fps.
- **The switch.** `[ LITE ]` in the film and `[ FULL ]` in lite: a bracketed chip beside the sound toggle, in its
  style, shown and hidden with it (so not during the wake-up), and not on the plain page or under reduced motion.
  A click keeps the choice under `jrz-film-v1` (`{"choice":"lite"}` or `{"choice":"full"}`) and loads the page again
  at the section the visitor is in, by its deep link (`#sec-…`, `sectionHere`). It drops any `?film=` from the address.
  Where storage is blocked, the address carries the choice instead.
- **The verdict and the offer.** When the governor is at `low`, its pixel ratio at its floor, and frames are still
  missed, the visit is judged too slow for the film (`noteSlow`, from the sky's `lower`). The verdict is kept as
  `{"verdict":"slow"}`, merged beside any choice, which still wins. Once a visit, a line above the switch offers
  "Running slow? Switch to lite" and fades after 8 s. Not clicking it is the dismissal. It's not offered to a visitor
  who chose the film, who knows where the switch is. Nothing ever switches mid-visit; the next visit starts in lite.
- **`?film=film|still|plain` plays that version, in production too,** so Janriz can compare on his phone. It wins over
  the choice and the rule, never over reduced motion or a device without WebGL.

## Considered

- **A reduced-3D film** (fewer scenes, no shadows, simpler models). Most of the cost is redrawing the scroll-driven
  frame, not one effect, and a second film to keep finished is a large, lasting cost (the coordinator's call, in the
  ticket).
- **Plain as the lite look.** Janriz accepted `still`, which still looks like the site.
- **Switching to lite mid-visit** when the governor bottoms out. A page that changes under the visitor reads as a
  fault, and the stills want the scroll at a reading spot. It offers instead.
- **Starting the Poco in lite** with a stricter rule (any phone, or any 120 Hz display). The cap may be enough for it,
  and a capable phone should get the film. The verdict catches a phone that still can't hold it.
- **GSAP's own `ticker.fps(60)`.** It keeps a fixed 16.7 ms grid against the clock, so on a 120 Hz display a frame
  that lands a fraction of a millisecond before its slot is skipped and drawn a display frame later, mixing 16.7 and
  25 ms frames: judder of its own. Counting whole display frames doesn't drift.
- **Skipping the wake-up in lite.** The loader is what builds the stage the stills are taken from, and the wake is what
  lets the sound start. With Tycho flat, his drawing stands on the charge-up's stage.

## Measured (2026-10-14, Apple M5, headless Chrome on Metal, the dev server)

- **The cap, on a faked cadence** (`.scratch/redesign/research/lite/cadence-probe.mjs`, 3 runs each, every run alike).
  DevTools' animation playback rate slows the frames' own clock, which the pacer reads the display by, so the 60 Hz
  vsync reads as 120 Hz (rate 1/2) or 240 Hz (rate 1/4). GSAP ticked 60 a second in every run. At rate 1 the pacer
  read 16.7 ms and drew all 60 (sky renders 60, Tycho's clears 120: his shadow pass and his frame). At 1/2 it read
  8.3 ms and drew every other frame (30, 30, 60). At 1/4 it read 4.2 ms and drew every fourth (15, 15, 30). The sky's
  clock-driven turn was 0.0350 rad a second in all nine runs, so motion stays on real time.
- **An unlimited frame rate didn't stand in for a fast display** on this machine (`cap-probe.mjs`, `tick-probe.mjs`).
  With `--disable-gpu-vsync --disable-frame-rate-limit`, rAF ran about 100 a second but in pairs, 2 to 4 ms and then
  18 ms apart, at any quality and size. GSAP doesn't tick on a frame under 4.2 ms after the last (its own 240 fps
  limit), so it ticked about 50 a second, and the film drew on every tick, as it should under 60.
- **Not measured on the phone.** The Poco's own numbers (`?perf` gives the display rate, the drawn rate and each late
  frame) are Janriz's to take.

## Amendment (2026-10-14): a switch skips the wake-up

The reload a `[ LITE ]` / `[ FULL ]` click makes is marked once in `sessionStorage` (`jrz-switched`, `markSwitched` in
`lib/wake/script.ts`), and the head script reads and clears it: the loader still builds the whole voyage (ADR 0018), then
the page is the visitor's at once, at the section the switch was made in, Tycho in his corner, with no charge-up, no
button and no greeting. The sound is woken outside a gesture, so where the browser holds it the toggle offers its
restore. A plain reload or a new visit plays the whole wake-up; where `sessionStorage` is blocked, so does a switch.
