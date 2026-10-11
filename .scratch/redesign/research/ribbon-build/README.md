# Build the record's flight and the ribbon: evidence

Scene 13 and the pull-out on the real site, measured headless with the GPU (ANGLE on Metal) on a shared machine.

**Look here first:**
- `rec/ribbon-1440.mp4` and `rec/ribbon-390.mp4`: from the climax's end, by wheel at a reading pace, a beat at each project, through the pull-out to Contact. Contact sheets sit beside them.
- `after2/sheet-1440.png`, `after2/sheet-390.png`: the reading spots (own, Mercado, FlowStack, PulseVR) after the build. Compare `before/`.
- `pullout/sheet-1440.png`, `pullout/sheet-390.png`: the pull-out every 0.15 screens from G1−0.4 to the end. Only the ribbon folding, then stars.
- `rm/`: the reduced-motion stills at each reading spot.

**Measured:**
- `before.log` / `final*.log` (`measure.js`): a 3 s and a 1.5 s scroll from F0−0.4 to the film's end, from a fresh load: 60 fps, no frame over 20 ms, first pass included, at 1440 and 390, before and after. The 180–233 ms pull-out hitch is gone (the light rig fixed it; nothing recompiles: 89 programs, steady).
- GPU at the reading spots (`after2.log`, one quiet run): 1440 went from 8.9–12.7 ms to 3.7–6.8 ms; 390 from 4.1–4.6 to 2.6–3.0. Draw calls 43/64/114/70 → 30/44/94/50. Later runs on a busier machine read higher; `ablate2.log` interleaves them: the ribbon costs ~1.6 ms at 1440 now (`ablate1.log`: ~4.3 ms before).
- `probe1.log` / `probe2.log` (`probe-cards.js`): the card square to you at each spot, in px. At 390 FlowStack's sat at −114..231 and PulseVR's at 154..498; now 16..372 and 15..371 (centred, the width filled).
- `pullout-before.log` / `pullout-after.log` (`probe-pullout.js`): bodies in frame, frame by frame. Before: the crawler in frame from G1+0.65 to G1+1.15. After: nothing but the ribbon (and his star's own billboard, the beacon).
- `aa.log` / `aa.json`: contrast at the spots, all pass (lowest: PulseVR's title at 390, 10.6).
- `red.txt`, `green.txt`, `tests.txt`, `tsc3.txt`, `eslint.txt`: the tests.

`heavy.sh` wraps each run in the machine-wide heavy lock.
