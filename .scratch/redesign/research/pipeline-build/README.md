# Build the pipeline and its climax: evidence

Scene 12's second half, finished from *Finalize the pipeline and its climax* (whose round-2 code was already on the site). Measured on the `redesign` branch, uncommitted (M5, headless Chromium, ANGLE on Metal, a GPU shared with other sessions).

## See it

- **Walkthroughs:** [`out/pipeline-1440.mp4`](out/pipeline-1440.mp4) and [`out/pipeline-390.mp4`](out/pipeline-390.mp4) (37 s, 60 fps): from the crawler's opening down every stage to "Paid for once", each with a contact sheet.
- **Stills** in `look/`, at the true reading spots (the middle of each hold): Start 26.89, Search 27.65, Extract 28.41, Dedup 1 29.17, Enrich 29.93, Dedup 2 30.69, Save 31.45, Report 32.21, the outcome 33.70.
  - `1440-t*-s.png`, `390-t*-s.png`: every spot, plus in-betweens (27.25, 32.60, 32.75);
  - `*-still.png`, `*-f.png`: reduced motion and the fixes' re-shoots;
  - `sheet-*.png`: contact sheets.

## Measured

- **Fast scroll** (26.3 → 34.5 in 3 s, then in 10 s; [`evidence/cost-before.txt`](evidence/cost-before.txt), [`evidence/cost-after.txt`](evidence/cost-after.txt)):

  | | 1440 (DPR 2) | 390 (DPR 3) |
  |---|---|---|
  | 3 s scroll | 60 fps, 0 frames over 20 ms, max 18.5 ms | 60 fps, 0 over 20 ms, max 18.7 ms |
  | 10 s scroll | 60 fps, 0 over 20 ms | 60 fps, 0 over 20 ms |
  | GPU mean / p95 (3 s) | 7.9 / 15.6 ms | 5.4 / 11.2 ms |

  The after-run's reading spots read 1–2 ms higher than the before-run all along the stretch, the outcome included, which the pipeline's changes don't touch: load from parallel sessions on the shared GPU.
- **What the pipeline costs** ([`evidence/probe-1440.txt`](evidence/probe-1440.txt), each part taken out in turn, 60 frames at five moments): 0.5–2.5 ms of GPU at 1440, heaviest at Save; no single part (rings, fixtures, mast, records, the crawler key's shadow pass) is over about 1 ms on its own.
- **Tests:** 402 pass in `lib/film`, `lib/voyage` and `components` (the one failure is a prototype copy under `.scratch`). New: `pipeline-cull.test.ts`, `text-occlusion.test.ts`, `label-times.test.ts`. ESLint clean on every touched file; tsc's only errors are in `lib/voyage/gates.ts` and `tests/e2e/wake.spec.ts` (other tickets' work in progress).

## Scripts

All take `.locks/heavy` through [`lockrun.sh`](lockrun.sh): [`measure.js`](measure.js) (fast scroll + spots), [`probe.js`](probe.js) (cost per part), [`look.js`](look.js) (stills), [`record-pipeline.js`](record-pipeline.js) (MP4), [`which-line.js`](which-line.js) (which hairline crosses a text), [`sheet.sh`](sheet.sh) (contact sheets), [`final.sh`](final.sh) (the closing chain).
