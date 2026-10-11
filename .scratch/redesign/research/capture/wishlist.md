# capture.js wishlist

These are helpers and fixes that the five parallel case-study agents asked for on 2026-09-27. None is built. They are only worth doing if more capture work comes (more case studies, or QA recordings of the redesign). The count shows how many of the five agents hit each one on their own.

## Asked for by several agents

| Need | Asked by | Why |
|---|---|---|
| **A per-clip page frame-timing recorder** (`h.raf(name)`): the page's own rAF intervals logged next to each clip's capture stats | US Avionix, Hashgraph, Trionn (plus Produx's fps probe) | It is the only way to tell capture contention from site jank. All four hand-rolled one; see `case-studies/usavionix/scenarios/` and `case-studies/trionn/scenarios/_probe.js`. |
| **A FIFO slot queue** in `slots.js`, with the queue position shown in the "waiting for a capture slot" line | Izanami, Produx, Hashgraph, Trionn | Slots go to whichever process polls first. Runs starved for 12, 21 and 22 minutes while newer runs got slots. |
| **Idle-aware frame stats** | Produx, US Avionix, Trionn | The screencast emits no frame while nothing changes, so any clip with a still moment fails the p95 > 25 ms rule even at a true 60 fps. The rule then asks for reshoots that cannot help. Judge p95 over moving spans only, or pair it with the rAF recorder above. |
| **Clean up temp frames after a failed clip** | Izanami, Hashgraph (204 MB), Trionn (860 MB, three folders) | A failed clip leaves `logs/.frames-*` behind. |
| **Save more audio formats** | Produx (HLS `.m3u8`/mp2t), Hashgraph (Howler served as `.webm` with `video/webm`) | Neither site's audio was saved automatically. The workaround was ffmpeg by hand, or `hashgraph-ventures/scenarios/_fetch-audio.js`. |
| **Keep the audio-log label current** | Hashgraph (`h.glide`), Trionn (raw `page.mouse` calls) | Sounds are logged under the previous helper's label, which misattributes triggers. |

## Asked for once

- **A GSAP/ScrollTrigger hook for bundled GSAP** (Turbopack/webpack module-factory hook). Modern bundles keep `gsap` off `window`. Source: Produx, `case-studies/produx/scenarios/_hooks.js`.
- **Built-in readiness timing and engine-neutral probes** for type/colour and for which text is HTML vs WebGL. Every agent rewrote these. Source: Izanami.
- **A scroll-to-position helper for smooth-scroll pages, and a matching mobile swipe helper.** Source: Izanami.
- **A frame-grid crop helper for a clip.** Source: Izanami.
- **A stills grid that handles mobile-sized shots**; the mobile grid rendered mostly blank. Source: Produx.
- **A per-scenario encoder preset.** CRF 16 at preset slow made 20–95 MB clips at about a minute of encoding each, which added load for the other agents. Source: US Avionix.
- **The real oscillator frequency in the audio hook.** It logs 440 because `setValueAtTime` leaves `.value` unchanged. Source: Trionn.
- **Network-log totals.** Resource timing caps at 250 entries. Source: Trionn.
- **A Web Audio mix sampler built in.** Source: Trionn.

## Findings about the setup

- **The two-slot cap did not prevent contention with five agents.** US Avionix and Hashgraph both shot clips at 22–45 fps in their first journeys while the page's own rAF held 60. Likely causes: ffmpeg encodes at preset slow, and probe runs outside the slot. The concurrency test (`research/concurrency-test/README.md`) measured capture runs only.
- **Piping `capture.js` through `grep` holds all output until the run exits.** Agents sent background runs to a file instead.
- **An easy way into three.js / R3F sites:** set `window.__THREE_DEVTOOLS__` in an init script, and it receives every Scene and WebGLRenderer. Source: US Avionix.
- **Agents rename clips after capture**, so a run log's `file` can differ from what is in `motion/`. Match by the run log, not the file name.
