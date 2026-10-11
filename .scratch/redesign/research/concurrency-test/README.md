# Concurrency test: parallel capture.js runs

**Verdict: two capture runs at once are fine. Three are not.** At three, clips drop to 30–53 fps with p95 frame gaps of 37–83 ms, and each run takes 2–5× the wall time. When the five case studies run in parallel, allow at most 2 capture runs at a time: the reading and writing can be parallel, but the capturing must queue.

## Setup

- **Scenario:** `landing.js`. It settles the edolus.com landing, then records one ~8 s clip: hover the "Initiate system" CTA, glide, idle, glide, idle.
- **Output folder:** set by the `OUT` env var, relative to this folder.
- **Machine:** Apple M5. Headless Chromium with `--enable-gpu --use-angle=metal`, 1440×900 at dsf 2.
- **Parallel launch:** each set was started from one Bash call, as `(cmd & cmd & wait)`.
- **Time of day:** 2026-09-27, 19:18–19:22 local.
- **Rerun:** `par3` was run a second time (`par3-rerun-*`) to check variance, because the first `par3` run gave mixed results.
- **Wall time** is `wallSeconds` from the run log. It runs from browser launch to the run log being written, so it includes the page load, the settle, the clip, and the x264 encode plus contact sheet.

## Results

| Run | Renderer | Frames | Clip s | Captured fps | Median frame ms | p95 frame ms | Wall s |
|---|---|---|---|---|---|---|---|
| solo | ANGLE Metal, Apple M5 | 466 | 7.77 | 60.1 | 16.7 | 17.5 | 24.5 |
| par2-a | ANGLE Metal, Apple M5 | 452 | 7.54 | 60.0 | 16.6 | 18.3 | 24.0 |
| par2-b | ANGLE Metal, Apple M5 | 418 | 7.68 | 55.0 | 16.6 | 18.6 | 28.1 |
| par3-a | ANGLE Metal, Apple M5 | 418 | 7.96 | 52.5 | 17.2 | 38.2 | 54.8 |
| par3-b | ANGLE Metal, Apple M5 | 425 | 8.05 | 53.0 | 17.2 | 37.3 | 55.5 |
| par3-c | ANGLE Metal, Apple M5 | 269 | 8.18 | 32.9 | 22.0 | 50.9 | 57.4 |
| par3-rerun-a | ANGLE Metal, Apple M5 | 253 | 8.27 | 31.0 | 21.4 | 82.6 | 118.1 |
| par3-rerun-b | ANGLE Metal, Apple M5 | 241 | 8.30 | 29.1 | 22.6 | 83.1 | 118.7 |
| par3-rerun-c | ANGLE Metal, Apple M5 | 238 | 7.79 | 30.1 | 20.9 | 81.0 | 117.4 |

## Notes

- **The GPU renderer was kept in every run.** No run fell back to SwiftShader, so the loss is contention, not a software fallback.
- **The network was not the bottleneck.** In every run the last response arrived 3–14 s after launch, before the clip started. Each copy fetches the full ~48 MB site on its own.
- **The x264 encode and contact sheet slow down under contention.**
  - Solo, the MP4 and the contact sheet were written in the same second.
  - In `par3-a`, the sheet came 5 s after the MP4. In `par3-rerun-a`, it came 13 s after.
  - My inference is that the CPU-bound encode also slowed down several-fold, and that this explains most of the extra wall time. The clips themselves stay ~8 s long.
- **Results varied between the two `par3` runs.** The first was mixed (two copies near 53 fps, one at 33). The rerun was uniformly bad (~30 fps, p95 over 80 ms). Other load on Janriz's machine (his apps, thermals) moves this number, which is one more reason to keep a margin.
