# Build the warp: evidence

- `record-warp.js`: scripted headless recordings (MODE=phone for 390 × 844; SCEN=about-work | hero-projects | hurry | chat).
- `perf.js`: frame cost through four route-map warps in a row (rAF deltas, the sky's GPU timer, the long frames with their warp time).
  `perf-3.log` is the clean run. `perf-2.log` overlapped another browser on the machine.
- `rec/`: the MP4s and contact sheets.
