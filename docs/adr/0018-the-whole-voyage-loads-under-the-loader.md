# The whole voyage loads under the loader

Status: accepted (2026-10-13). It amends ADR 0005 ("Everything past the first scene loads after the wake") and the
consequence of its 2026-10-04 amendment ("only the first scene loads before it").

Janriz saw the hero → About stretch lag every time he refreshed, woke Tycho and scrolled, at every quality level. The
wake-up waited on the first scene alone. Every later scene's models were fetched only at the wake, then parsed, built,
compiled and warmed one idle job at a time from 1.2 s after Tycho landed: exactly while the visitor makes their first
scroll. The motion probe (`.scratch/redesign/research/motion/scroll.mjs`, which wakes him and scrolls with real input,
with the page's `?perf` frame meter on) put every such drop on those jobs: idle callbacks of 50 to 60 ms (a scene's
warm-up draw, its texture uploads), a model built in a worker's message (about 40 ms), and the warp's and Tycho's
flight modules evaluated (16 to 40 ms), each over a 16.7 ms frame. Static audits seek to a film time on a page whose
stage is already whole, so they never saw it.

## Decision

- **Everything loads under the name loader, before the wake button.** Every scene's models are fetched as soon as the
  stage is made (no fetch waits on the wake), decoded in workers, and built, compiled, uploaded and warmed (every
  shadow map's first pass included) one job a turn (`inTurn`, `lib/film/turns.ts`; `voyageLoader`, `warmInTurn` and
  `uploadTextures`, `lib/voyage/loading.ts`). The warp's hole, fire, debris and Tycho's flight rig are made the same
  way. The ribbon's screenshots come in with them.
- **The count waits on it all.** Each later scene, and the warp, marks itself built (`lib/wake/built.ts`), and the
  count (`lib/wake/count.ts`) has a milestone for each, and for the score's hero layers, without the old 3 s cap past
  the first scene. The charge-up, the wake and the film build nothing: their frames carry only Tycho, the hero's sky
  and the film.
- **The charge-up is a show of fixed length.** It starts once the count is in, and waits on nothing.
- **A slow link is waited for while it's still bringing the voyage in.** The 3D still gives way to the plain page if it
  fails, or if the first scene isn't in after 10 s of the loader, as before. The rest gives way only once nothing new
  has come in (a milestone, or any file) for 10 s; a score that alone keeps the loader waiting that long is counted in
  and joins after the wake.

## Considered

- **Keeping the after-wake load, with smaller jobs.** Each job would still land in the first scroll, and a phone's
  slower main thread stretches every one of them. Janriz chose to wait longer at the loader instead.
- **Calibrating quality under the loader** (ADR 0017's "Considered"): now possible, since the heavy scenes are drawn
  once under it; not done here.

## Measured (2026-10-13, Apple M5, headless Chrome on Metal, the dev server; `.scratch/redesign/research/motion/`)

- **Hero → About, woken and scrolled at once** (n=3 a condition; `scroll.mjs`, `summarize.mjs`). Before, every
  condition dropped frames on the loading jobs: on the M5 at 1×, 4 to 6 frames of about 700 (median), on a 390 phone
  under a 4× CPU throttle 14 to 57, under 6× 10 to 89. After, none: no frame in any run, at any speed, throttle, level
  or cache, was late with a load, build, compile or upload in it, and on the M5 at 1× no frame was late at all (0 of
  about 700 in every run, cold and warm). From the loader's end to the end of that scroll, no shader compiled and no
  texture or geometry went up in any frame, late or not.
- **What's left under a throttle** is the film's own frame: 2 to 4 late frames of about 300 at 4×, 9 to 24 at 6×,
  half of them where the ship comes in (film time 1.25 to 1.75: home goes from 5 draw calls to about 360, its fade
  drawn twice while it's see-through and double-sided, and its 115 casters into its shadow map); the trace puts each on
  the frame's own tick (17 to 20 ms at 6×), with no GC, compile or upload in it.
- **The wake takes longer.** The loader's count reaches 100 at 3.2 s on the M5 (was 1.0 s), and at 11.0 s on a 390
  phone over 4G (9 Mbps down, 85 ms round trip; was 4.7 s), the median of 3. The difference is the bytes: 7.47 MB of
  models before the wake (was 1.33 MB) and 0.39 MB of the ribbon's screenshots, on 4G about 5.6 s at 9 Mbps. The
  charge-up after it is unchanged.
- **The loader's own frames** while it builds: on the M5 one frame a load is late on a build job (48 ms), besides the
  first scene's own long task (about 320 ms, as before); on a phone under a 4× throttle about ten jobs of 50 to 200 ms
  pause the count (the scenes' compile passes and the warp's), each warm-up's draws now one a turn.

## Amendment (2026-10-13): a cap of 15 s

The loader waits 15 s at most, in its frame time (`CAP_S`, `lib/wake/count.ts`). Once the cap is reached with the first
scene in, the count is in and the button shows; any later scene, the warp or the score still missing keeps being built
in its turn after the wake, never dropped. The plain page is now only for 3D that fails or a first scene not in after
10 s: a load gone quiet no longer stalls it, and the score is no longer counted in after 10 s of quiet, only at the cap.
