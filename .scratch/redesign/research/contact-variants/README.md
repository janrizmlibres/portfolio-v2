# Finalize Contact, round 1: the takes, on the real site

Scene 14 (the pull-out, his star as the beacon, Contact's lines, "Back to the start"), made for real on the real site from Janriz's round-1 answers (2026-10-03). Measured on the `redesign` branch, uncommitted, on 2026-10-03 (M5, headless Chromium with the GPU on, ANGLE on Metal). The camera path, the timings, the text and its manners are the storyboard's (round 3).

## Janriz's pick (2026-10-03), now the site's pull-out

He took my recommendation ("go for your pick"): **the whole route** stays drawn as the camera pulls out. The `pullout` take and its switcher entry are gone; the fade take's code was a single timeline line (fade the route with the bodies at G1 + 0.6). The rest of this README is round 1, when both takes were on the site.

## See them (round 1)

The dev server on :3000, then the "Takes" chip top left (development only), or the address: `?pullout=route` (default) · `?pullout=fade`. Land on Contact with `#sec-contact`.

## What's built

- **The pull-out** (`lib/voyage/stage.ts`, scene 14):
  - **route:** the bodies fade by their size as before, but the trajectory (with its ticks and the gates' burns) and the spur stay drawn, brightened a little, and are no longer dimmed by distance (`route.far`, `lib/voyage/road.ts`). The camera looks away from them for most of the pull-out, so the whole route shows near the end: one small curve springing from his star (41.7–42.0), thinning away (41.85–42.3) as Contact writes in. At the reading spot only stars are left.
  - **fade:** every body and the trajectory fade together (G1 + 0.6), as storyboarded; only stars are left from about 41.0.
- **The beacon:** the sky's Flare, lit and heated as today (Q2: unchanged).
- **The clock** (Q3): "It's 9:43 PM in Cebu." is now a `<time>` (its `datetime` the instant, in ISO), prerendered as `--:--` instead of the build's time, set at once and again as each minute turns (it was every 20 s). DM Mono is monospaced, so its digits never jump.
- **"Back to the start"** (Q4, Q6; `lib/film/replay.ts`, tested): Edolus's replay. The frame fades to black (0.6 s, `power2.in`), the page lands on the film's exact first frame under the black, holds (0.4 s) and fades back in (1 s, `power2.out`). The address becomes `#sec-hero`, and browser Back returns to Contact's exact place. Under reduced motion it only crossfades (0.25 s, 0.4 s). The plain page scrolls as any in-page link does. It used to glide 42 screens in 3.4 s, playing the film back.
- **Phones:** Contact's lines sit higher (0.66 of the frame, was 0.72), so "Back to the start", which wraps to its own row at 390, clears the chat sheet.

## Evidence

- `now/`: today's Contact before this round (1440, 390, every 0.4 screens from 39.4, and the first frame).
- `r1/route/`, `r1/fade/`: the pull-out's end every 0.1 screens (41.3–42.3) at 1440 and 390. Sheets: `route-sheet-1440.png`, `fade-sheet-1440.png`, `compare-390.png` (route on top, fade below), `compare-1440-t41.90.png` (route left, fade right).
- `r1/replay/1440/`, `r1/replay/1440-reduced/`: the replay as it plays (200 ms to 3 s after the click); sheet `r1/replay/sheet-1440.png`. Check log from `replay-check.js`: lands at t 0 with `#sec-hero`, the veil back at 0; browser Back returns to y 38046, t 42.25, `#sec-contact`.
- `r1/still/`, `r1/still2/`: reduced-motion stills at the reading spot (390 before and after the lift).

## Tests

- **TDD:** `createReplay` (`lib/film/replay.test.ts`, 5 tests), red (no module) then green. **Refactor:** candidates were the `KEY` alias left in `deep-links.ts` after exporting `DEEP_LINK_KEY` (done: the alias is gone, the deep links use the export), and the plain-left-click guard repeated in `deep-links.ts` and `replay.ts` (kept: two call sites, a shared helper adds a coupling for one line). `takes.test.ts` covers the `pullout` choice.
- **Results:** `lib/film` and `lib/scroll` and the takes test pass (my files); the run's two failures are other sessions' tests in progress (`lib/film/hand.test.ts`, the pointer layer's red) and the frozen prototype under `.scratch`. `tsc` shows only errors in other sessions' red tests (`hand.test.ts`, `lib/routemap/chart.test.ts`). `pnpm build` and the e2e suite weren't run: five sessions are editing the tree at once.
