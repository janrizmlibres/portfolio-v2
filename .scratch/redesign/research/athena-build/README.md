# Build Athena: evidence

Scene 11 on the real site (`redesign`, uncommitted, 2026-10-04), headless Chromium with the GPU on (ANGLE on Metal, M5), on a machine shared with six other build sessions.

## Look at

- `out/athena-1440.mp4`, `out/athena-390.mp4` (and their `.sheet.png`): from the spur's end, the cursor resting on her (the peek), both reading spots, her closing and the records joining her ring, a hard scroll back up to her opening (the moons and records thrown), then a hard scroll on up the stream.
- Reading spots: `shots/1440-t22.53-e.png`, `shots/1440-t23.00-f.png`, `shots/390-t22.53-e.png`, `shots/390-t23.00-e.png`. Reduced motion: `shots/*-still.png`.
- In between: `shots/sheet-f.png` (20.7 the spur, 21.6 her arrival, 23.0 opened, 24.3 the close pass), `shots/sheet-close-a.png` (her closing, seams dark), `shots/s-2500.png` (the records upstream, read as slabs).
- Her light, before and after: `shots/cmp-onekey.png` (left, every star's key as round 1 had it; right, her own star's alone).
- Her ring's shadow: `shots/cmp-ring.png` (ring hidden / ring before the fix) against `shots/1440-t24.10-d.png` (after).

## Scripts

- `heavy.sh cmd…`: runs one command under the machine-wide heavy lock.
- `probe.js`: one browser, one viewport. `FAST=1` paired fast sweeps (her shown, then hidden, twice); `T=…` stills (with `CROP`, `FLING`, `EVAL`, `PRINT`); `SPOT=t STATES=name=js;… ROUNDS=8` alternating paired GPU medians at a reading spot.
- `record-athena.js` (`MODE=phone` for 390), `aa-athena.js` (contrast), `times.ts` (the script's scene times).

## Numbers

See the ticket's Answer; raw runs are in `evidence/`.
