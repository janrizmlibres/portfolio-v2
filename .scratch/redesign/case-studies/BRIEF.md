# Case-study brief (parallel runs)

This is the prompt for each case-study subagent. It was written from the Edolus pilot ([edolus/logs/pilot-log.md](edolus/logs/pilot-log.md)). The coordinator fills in the `{placeholders}` from the ticket and sends everything below the line. Up to five agents run at once, one per site.

Budget per site, from the pilot: about 60 minutes, about 17 of them capturing, and about 0.6 M tokens. Expect one or two context compactions.

---

You are resolving the research ticket **Case study — {Site}** for a portfolio-site redesign. Other agents are studying other sites **at the same time**, on the same machine. You share its GPU and the capture scripts with them, so follow the shared-resource rules exactly.

All paths are under `/Users/janlibs/dev/portfolio-v2/.scratch/redesign/` unless absolute. This folder is untracked scratch; never commit anything, and never touch git.

## Read first
1. `issues/{NN}-case-study-{slug}.md`: your ticket. The coordinator has claimed it. Don't change its Status and don't write its Answer.
2. `case-studies/FORMAT.md`: the deliverable shape and how to study a site. §9 asks for exact values.
3. `research/capture-setup.md`: the capture recipe, **except step 2** (the Chrome look). Skip that step, see Rules.
4. The header of `research/capture/capture.js` (the first ~30 lines): helpers, options and the checklist.
5. `map.md` Notes: the five standing constraints and the effects rule that "Ideas worth taking" weighs ideas against.
6. **The worked example, `case-studies/edolus/`.**
   - Skim its README §1, §6 and §11 to see the depth expected.
   - Its `scenarios/` are templates to copy and adapt: `_probe.js` (JSON probes), `02-journey-a.js` (a journey with sweeps), `04-mobile.js`, `05-reduced-motion.js`, `07-text-map.js` and `08-type-colour.js`.
   - Edolus runs on PlayCanvas, so adapt its engine-specific probes to whatever your site uses.

## Deliverable
`case-studies/{slug}/`, exactly as FORMAT.md describes: README.md with all 11 sections, plus `screenshots/`, `motion/`, `audio/`, `scenarios/` and `logs/`. Every scenario sets `out: ".."`, so its output lands in your folder and nowhere else.

{site-specific asks from the ticket, e.g. Trionn: try "Hold to blast" and anything that rewards holding or dragging.}

## Rules

**Shared-resource rules** (other agents depend on these):
- **Don't edit `research/capture/capture.js`, `slots.js` or `audio.sh`.** Other agents run them while you work. If you need a helper they lack, write it inside your own scenario (scenarios get the raw `page` and `context`), and report the need at the end.
- **Capture slots.** capture.js lets only 2 runs capture at once on this machine; above that, clips drop to ~30 fps (`research/concurrency-test/README.md`). A run that finds both slots taken prints "waiting for a capture slot" and waits. So:
  - **Run capture.js with a 600000 ms Bash timeout**, because waiting counts towards it.
  - Never launch capture runs in parallel yourself.
  - A killed run frees its slot automatically.
- **Check every clip's frame rate.** After each run, read the clip stats in `logs/run-*.json`. A clip whose median frame interval is above ~17.5 ms, or whose p95 is above ~25 ms, was shot under contention: reshoot it.
- **Write only in `case-studies/{slug}/`.** Never touch `map.md`, other tickets or other sites' folders.

**Browser rules:**
- **Headless only, and no Claude in Chrome.** In the pilot, the Chrome tab was hidden behind other windows, so it never animated. Several agents would also fight over one window. Headless with the GPU matches real Chrome (capture-setup §2), so it is the reference.
- **If the site blocks headless** (a blank page, a challenge, "unsupported browser"), stop and report back. You cannot ask Janriz questions mid-run. Never spoof the user agent, solve a challenge or run a headed browser. Don't install anything.

## Method (lessons from the pilot)
1. **Recon first.** Run one short scenario: a landing still, a network log and JSON probes of the DOM, the runtime globals and resource timing. Then **fetch the site's own JS** with Playwright `request` into `logs/src/` and pretty-print it:
   ```bash
   /Users/janlibs/dev/portfolio-v2/node_modules/.bin/esbuild <in> --outfile=<out>
   ```
   Then grep it. **Never print a line of a minified file**: one line can be 1 MB and floods your context.
2. **Check the scroll with a probe.** After the first scroll, compare how far the page or its progress value moved with what you sent. If it moved half as far, the site drives its own scroll from wheel deltas: set `wheelScale: 2`.
3. **Map the effect windows before planning stops.** From the bundle or a config probe, list each effect's start/end window, its snap points and its pinned sections. Put stops at the hero poses *inside* each window, and name clips after what is actually on screen at that point.
4. **Sweep rule.** For every 3D object or visual that looks interactive:
   - stop at its hero pose
   - run `h.sweep([x, y, w, h], {cols, rows, pause, name})` over it inside a clip
   - grep the bundle for `mouseenter|pointerenter|mousedown|click|raycast|screenToWorld|cursor`
   - list each hotspot with its element, trigger and visibility window
   - crop a frame grid of anything found

   A single hover path misses hotspot-bound reveals. That is how the pilot missed Edolus's chip reveal until Janriz spotted it.
5. **Sound.**
   - Hook the engine: `audioEvents` in the run log.
   - Sample the mix every 200 ms across the journey with `page.evaluate`: volumes, what is playing, pitch.
   - Run `audio.sh`.
   - Check loops for repeats with an envelope autocorrelation.

   Describe the *mix design* (tracks, stems or a mix table), not only the files. Read spectrograms only for the music and the 3–5 SFX that matter; use `audio-probe.md` stats for the rest. End §8 with **"Questions for Janriz"**: what a human should listen for (you cannot hear).
6. **§9 needs exact values.**
   - Type and colour: probe computed styles for each text role at every stop, on desktop and mobile (`08-type-colour.js`).
   - Fonts: list requests by family, each with its licence; for a paid font, name the nearest free alternative.
   - WebGL colours: read them from declared material, uniform or script values. Eyedrop only video or baked textures, and label those.
7. **Readiness:** on canvas sites, measure time to first action by polling for the first real control, not with LCP, which can pick a hidden element. Also map which text is HTML and which is canvas at each stop (`07-text-map.js`).
8. **Mobile and reduced motion** are their own runs (`mobile: true`, `reducedMotion: "reduce"`). On mobile, swipe in strokes of 350 px or less and check progress after each stop.
9. **Save context.**
   - Look at each run's stills grid (`logs/shots-<stamp>.jpg`) first, not the full PNGs.
   - Read one contact sheet per transition.
   - Summarise JSON probes with `node -e`; never `cat` them.
   - Write the README section by section as you go.
10. **Keep `logs/notes.md` as you go.** Record each capture run, what was redone and why, and every gotcha. It is your memory across a compaction.
11. **Housekeeping.**
    - Delete superseded media, and rename their run log `superseded-*`.
    - In zsh an unmatched glob aborts the whole command, so don't use bare globs in `rm`.

## Report back (concise)
1. Status: complete, or partial with what is missing.
2. A proposed **Answer** for the ticket, 4–6 lines: what the site is, the most memorable thing, the top 3 ideas worth taking (with the constraint each strains), and what to avoid.
3. Anything that needs Janriz: the §8 questions, licences, a headless block.
4. Any helper you wished capture.js had.
5. Wall-clock time, and how many times you compacted.
