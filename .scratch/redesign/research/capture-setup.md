# Capture setup for case studies

Resolves [issues/01-capture-setup.md](../issues/01-capture-setup.md). Researched 2026-09-27 on the working machine: Apple M5, macOS, Chrome 153, Playwright 1.59.1 (repo `node_modules`), ffmpeg/ffprobe 9.0.1 (`/opt/homebrew/bin`).

**Smoke test:** only the landing view of **edolus.com**, which draws its hero into one full-viewport WebGL2 canvas (checked in the extension tab: `canvas.getContext('webgl2')` returned the page's live context). Captures are in [`capture-smoke/`](capture-smoke/). No other site was visited, and nothing was clicked on Edolus.

## Verdicts

| Question | Answer |
|---|---|
| Can Claude in Chrome save to disk? | Only as a side channel. Screenshots save as downscaled JPEG to a temp folder. GIF export goes to `~/Downloads` and holds one frame per tool action. It cannot save video or audio, so it is a way to look at the site, not a way to capture it. |
| Does headless WebGL look right? | **With `--enable-gpu` it matches the real browser** (ANGLE on Metal, 60 fps). **Playwright's default headless is degraded** (SwiftShader software rendering: the still matches only after about 40 s, and motion runs at 5 fps). |
| Is the MP4 good enough to read a transition? | **Yes, with `capture.js`:** 60 fps from browser-timestamped compositor frames, encoded with x264 at CRF 16. The template's own recorder is weaker: 25 fps, VP8 at 1 Mbit/s, and a page that paces at 30 fps. |
| Can we get the audio? | **Yes.** Playwright saves every audio response. `audio.sh` produces an ffprobe/loudness table plus a spectrogram and waveform PNG per file. An init-script hook logs which sound played and on which action. |
| Does anything need a headed browser? | **No, in this smoke test.** A headed browser would only be needed if a site blocks headless browsers. In that case, stop and ask Janriz (see below). |

## 1. Claude in Chrome: what it can and cannot write to disk

I tested each of these on the Edolus landing view in a new tab, which I closed afterwards.

- **Screenshots:** `computer {action: "screenshot", save_to_disk: true}` returns a path such as `/var/folders/…/T/claude-chrome-screenshots-<random>/screenshot-<epoch>-<n>.jpg`. The file is a **JPEG downscaled to the image the tool returns**. On a 1710×896 CSS-px, DPR 2 tab that came out as 1459×812 or 1512×792 (ffprobe: `mjpeg,1459,812`), so it has less resolution than the real 3420×1792. `zoom` with `save_to_disk` writes a **PNG** of the region (a 910×400 region became 1568×688). Copies are in `capture-smoke/ext-01-landing.jpg` and `ext-02-landing-zoom.png`.
- **GIF:** `gif_creator` export with `download: true` wrote `~/Downloads/<filename>.gif` (verified with `ls`; moved to `capture-smoke/ext-03-gif-export-test.gif`). The recorder captures **one frame per `computer`/`navigate` action**: a start, screenshot, hover, screenshot, stop sequence produced "Captured 1 frame". It is a slideshow, not a recording, and GIFs are not a deliverable anyway.
- **Video / MP4: none.** No extension tool records video.
- **Network:** `read_network_requests` only sees requests made *after its first call* (the tool says so, and it returned nothing for a page that had already loaded). A reliable list comes from `javascript_tool`: `performance.getEntriesByType('resource').map(e => e.name)`. It listed every `.ogg`, `.glb`, `.basis` and `.mp4` the landing view loaded.
- **Quirk:** the extension filters `javascript_tool` output. A `window.gsap && window.gsap.version` probe came back as `"[BLOCKED: JWT token]"`. Run library-version probes through Playwright's `page.evaluate` instead.

**Use of the extension:** Janriz's real GPU Chrome is the fidelity reference. Look at a site there once, then compare it with the first headless still. Everything saved to disk comes from Playwright.

## 2. Headless WebGL fidelity

**Probe** (`capture/probe-gpu.js`): a fill-rate-heavy shader on a routed `https://probe.test` page. The https origin makes `navigator.gpu` available, and no website is visited. It reads the unmasked WebGL renderer and the requestAnimationFrame (rAF) rate:

| Launch | WebGL renderer | rAF fps | WebGPU |
|---|---|---|---|
| `headless: true` (Playwright default = chrome-headless-shell 147) | **SwiftShader** (software) | 43 | no adapter |
| default + `--enable-gpu` (or `--use-angle=metal`) | **ANGLE Metal, Apple M5** | **61** | Metal |
| `channel: "chromium"` (new headless, full Chrome for Testing) | ANGLE Metal | **30** | Metal |
| installed Chrome `channel: "chrome"`, or the template's `executablePath` (CfT 153) | ANGLE Metal | **30** | Metal |
| any of the above + `--disable-frame-rate-limit --disable-gpu-vsync` | Metal | 1640–1794 (uncapped, useless) | — |

**Why:**
- Playwright's default headless launches `chromium-headless-shell` (`playwright-core/lib/server/chromium/chromium.js:326`) and always adds `--enable-unsafe-swiftshader`, plus `--headless --hide-scrollbars --mute-audio` in headless mode (`chromium.js:286–293`).
- Chromium's own `headless/public/switches.h` documents `--enable-gpu` this way: *"Headless uses swiftshader by default … This flag just turns forcing of swiftshader off"*. It notes that `--use-gl` / `--use-angle` also force a driver.
- Playwright's docs (Context7, `browsers.md`) say `channel: 'chromium'` opts into "new headless", which is the real Chrome. On this machine that build gets Metal for free but paces rAF at 30 fps. That is a measured result; I found no documentation for it.
- All three builds decode H.264, AAC, HEVC, Vorbis and Opus (`capture/codec-probe.js`). Video textures and `.mp4` backgrounds therefore play in headless.

**Comparison on the real site** (1710×896 CSS px @2x, to match the extension tab, which reported `innerWidth 1710`, `innerHeight 896`, `devicePixelRatio 2` and an ANGLE Metal M5 renderer):

| Capture | Result |
|---|---|
| Extension (real Chrome) `ext-01-landing.jpg` | Earth hero, star field, headline, "Initiate system" CTA, headphones hint |
| Headless + `--enable-gpu`: `gpu/screenshots/02-landing.png` (3420×1792) | **Faithful.** Same composition, type, colour and grade. Detail is sharper than the extension's JPEG. The page's own rAF measured **60 fps**. The only difference is a different moment of the looping background video. |
| Default headless (SwiftShader): `swiftshader/screenshots/01-landing.png` | **Degraded.** After `networkidle` plus 4 s the loader was still at 86 %. The landing appeared about 30 s later (`02-landing-after-30s-more.png`) and looks the same as a still. The page's rAF ran at **5 fps**, so motion, frame feel and any performance reading would be wrong. |

## 3. Motion (MP4)

I started from `~/.claude/templates/record-walkthrough.js`, kept its humanized pointer, cursor overlay and checklist, and ran it **unchanged** on the landing view as a baseline (`capture/template-run.js` → `capture-smoke/template-recordvideo/`). In Playwright 1.59.1 its recorder (`recordVideo`) is fixed at 25 fps. It encodes VP8 at `-b:v 1M` (`lib/server/videoRecorder.js:41,108`) from JPEG q90 screencast frames (`lib/server/screencast.js:85`). A `recordVideo.fps` option appears only in newer Playwright docs (Context7) and is not in 1.59.1's types. The template's `chromiumPath()` also picks the full Chrome for Testing, which renders at 30 fps (§2). The result: 0.57 Mbit/s WebM, with visible macroblocking in the cloud texture (`capture-smoke/compare-video-crop-template-vs-cdp.png`, top half).

`capture.js` swaps the recorder and keeps the rest of the template:
- **Frames:** CDP `Page.startScreencast` (JPEG q92), with each frame stamped by the browser's own presentation `metadata.timestamp`.
- **Encoding:** an ffconcat list with real per-frame durations, run through `fps=60, libx264 -preset slow -crf 16, yuv420p, +faststart`. The clip therefore plays at real speed, with no dropped or duplicated timing.

Measured on the smoke clips (stats printed per clip and kept in `logs/run-*.json`):

| Clip | Frames | Median frame interval | p95 | Bitrate |
|---|---|---|---|---|
| `01-cold-load.mp4` (loader → reveal, 11.7 s) | 673 | 16.6 ms | 18.5 ms | 2.2 Mbit/s |
| `03-landing-hover-scroll.mp4` (8.2 s) | 490 | 16.7 ms | 17.5 ms | 5.2 Mbit/s |

**Readable?** Yes. The 16-frame contact sheet (`01-cold-load.sheet.png`) shows the loader counting up, then a letterbox wipe opening onto the Earth, then the headline scrambling in. A cropped 5 fps frame grid (`capture-smoke/hover-crop-sheet.png`) shows the CTA's corner brackets closing in on hover and springing back on leave, which is too subtle to see at contact-sheet scale. The landing view itself does not scroll; it is a gate.

**Settings that worked:** viewport 1710×896 (use 1440×900 for case studies), `deviceScaleFactor: 2` for stills, and clips at CSS-pixel size. Screencast frames are capped at CSS px whatever the DPR: I tested DPR 2 with `maxWidth` 2× and still got 800×500. The MP4 runs at 60 fps. Scrolls are paced by the wall clock: the first version, which sent one wheel step every 16 ms, stretched a 1.5 s scroll to about 5 s because a busy WebGL page acknowledges input slowly. Use `settle()` (network idle, capped at 30 s, plus a pause) before shooting: waiting only for the CTA's *visibility* fired while the loader still covered it.

**Mobile preset** (checked on a routed local page, `capture/mobile-test.js`): 390×664, DPR 3, touch, and `prefers-reduced-motion: reduce` all took effect. `h.scroll()` synthesizes a touch swipe (`scrollY` went from 0 to 803 for 800 requested).

## 4. Audio

- **Listing and saving:** `capture.js` listens to every response and saves bodies whose `content-type` is `audio/*` or whose URL ends in mp3, ogg, oga, wav, m4a, aac, opus, flac or weba into `audio/`. Partial (206) media responses are fetched again whole through `context.request`. On the Edolus landing view, **all 15 `.ogg` files arrived without any click**, 1.7–1.9 s into the load: twelve short SFX, plus three 61.2 s music stems named bass, instruments and melody. The full request list (106 responses: URL, status, type, MIME, bytes) is in `logs/run-*.json`, which also serves the Tech and Performance sections.
- **Which sound plays when:** an init script wraps `fetch`/XHR ArrayBuffers → `decodeAudioData` → `AudioBufferSourceNode.start`, plus `OscillatorNode.start` and `HTMLMediaElement.play`. It logs each play with the source URL and the scenario action running at that moment (`during: "click #b"`). I verified it on a routed local page (`capture/hook-test.js`) that loads one file by fetch and one by XHR and, on click, plays both, an oscillator and an `<audio>`. The result was 4 of 4 events logged, each buffer mapped to its URL, all labelled `click #b`. On Edolus without a click, it logged only the two muted, looping background `<video>`s.
- **Analysis:** `audio.sh <case-study-dir>` writes `logs/audio-probe.md` (codec, channels, Hz, duration, kbps, KB, peak/RMS dBFS and crest dB from `astats`). It also writes `<file>.spectrogram.png` (log frequency axis, legend with time, Hz and dBFS) and `<file>.waveform.png` (per-channel, with 1/5/10/30 s ticks) next to each file. Example reading, without hearing anything:
  - `BTNclick2.ogg`: 0.25 s, crest 27.9 dB, a short rising sweep from low hundreds of Hz to above 12 kHz within about 60 ms, so a transient UI click.
  - `bass_stemAUDITION30.ogg`: 61.2 s, crest 14.2 dB, energy mostly below about 300 Hz, and the same high streak at about 5 s and 35 s, so a bed that repeats about every 30 s.
- **Gotchas:**
  - Headless Playwright always passes `--mute-audio`. Decoding and the play log still work, and nothing sounds on the laptop, which is the intent.
  - Web Audio stays suspended until a trusted gesture. Playwright's mouse clicks count as one, so a scenario's single click on a sound toggle unlocks and logs the sounds.
  - Some sites only fetch audio after that toggle.
  - If `audio/` is empty but the log shows `oscillator` events, the sound is synthesized and there are no files to save.

## 5. What would force a headed browser

Nothing in this smoke test. GPU, WebGL2, WebGPU, video codecs, hover, wheel, touch emulation and audio decode all worked headless. The known exceptions:
- **Bot walls.** A site that serves a challenge or a blank page to `HeadlessChrome` would need a headed run. Do **not** spoof the user agent or solve challenges. Stop and ask Janriz, saying why, per the global Playwright rule.
- **Not tested:** pointer-lock or fullscreen experiences, and real device-orientation (gyro) input. If a site depends on one of them, note it rather than force it.
- **Refresh rate.** Janriz's display may run above 60 Hz. Time-based animation looks the same in headless; purely frame-counted animation would run slower here.

## The recipe

Every case-study session follows these steps. Paths are relative to the repo root; everything stays in `.scratch/` (never committed).

1. **Preflight** (once per session):
   ```bash
   which ffmpeg ffprobe && ls ~/Library/Caches/ms-playwright | grep chromium_headless_shell
   ```
   If the headless shell is missing, ask before installing anything.

2. **Look in the real browser** (the fidelity reference). *Skip this step in background case-study runs.* In the Edolus pilot the extension tab sat hidden behind other windows, so it never animated, and parallel agents would share one Chrome window. Headless with `--enable-gpu` is the reference there (see `case-studies/BRIEF.md`). With Claude in Chrome: `tabs_context_mcp` → `tabs_create_mcp` (your own tab) → `navigate` → `computer screenshot`. Then `javascript_tool` with:
   ```js
   ({ vw: [innerWidth, innerHeight, devicePixelRatio], canvases: document.querySelectorAll('canvas').length, res: performance.getEntriesByType('resource').map(e => e.name).filter(n => /\.(mp3|ogg|wav|m4a|aac|opus|glb|gltf|hdr|ktx2|basis|mp4|webm)(\?|$)/i.test(n)) })
   ```
   Then `tabs_close_mcp`. This is for looking only: extension saves are downscaled JPEGs.

3. **Write a scenario** at `.scratch/redesign/case-studies/<site>/scenarios/NN-<topic>.js`:
   ```js
   module.exports = {
     url: "https://example.com/",
     out: "..",                       // the case-study folder (resolved from this file)
     // viewport: { width: 1440, height: 900 }, dsf: 2   (defaults)
     // mobile: true, reducedMotion: "reduce", cursor: false (site draws its own), localStorage: { consentKey: "…" }
     autoGoto: false,                 // record the cold load inside a clip
     run: async (h) => {
       await h.clip("intro", async () => { await h.goto(); await h.settle(4000); });
       await h.shot("hero");
       await h.clip("scroll-slow", async () => { await h.scroll(2400, 6000); await h.idle(800); });
       await h.clip("cta-hover", async () => { await h.hover("text=Get in touch", 1500); });
       await h.clip("hold", async () => { await h.hold("text=Hold to blast", 2500); await h.idle(1500); });
       await h.clip("sound-on", async () => { await h.click("[aria-label*=sound i]"); await h.idle(3000); });
     },
   };
   ```
   Helpers: `goto, settle, shot, clip, scroll, hover, click, hold, dragPath, glide, idle, wait, mark(label), renderer`, plus raw `page`/`context`. A target is a CSS/text selector, a Locator, or `[x, y]`. For mobile or reduced-motion tiers, write a second scenario with `mobile: true` or `reducedMotion: "reduce"`.

4. **Run it** (headless, about 30 s for a short scenario). At most 2 runs capture at once on this machine (`CAPTURE_SLOTS`, see `research/concurrency-test/README.md`), and a third waits for a slot. Give the command a long timeout:
   ```bash
   node .scratch/redesign/research/capture/capture.js .scratch/redesign/case-studies/<site>/scenarios/01-landing.js
   ```
   The first line must say `ANGLE (Apple, ANGLE Metal Renderer …)`. `SwiftShader` means stop: the stills and motion would be software-rendered. Outputs land in `screenshots/NN-*.png`, `motion/NN-*.mp4` (with `.sheet.png`), `audio/*` and `logs/run-*.json`. NN continues across runs.

5. **Check before describing anything.** Read each still, and compare the first one with the extension view from step 2. Read each clip's `.sheet.png`. For a micro-interaction, crop and grid the frames around it:
   ```bash
   ffmpeg -ss <start> -t <secs> -i motion/NN-x.mp4 -vf "fps=5,crop=<w>:<h>:<x>:<y>,tile=3x4:padding=4:color=white" -frames:v 1 logs/NN-x-detail.png
   ```
   Coordinates are in CSS px.

6. **Analyse audio:**
   ```bash
   .scratch/redesign/research/capture/audio.sh .scratch/redesign/case-studies/<site>
   ```
   Read `logs/audio-probe.md` and each spectrogram and waveform PNG. Take the triggers from `audioEvents` in `logs/run-*.json`, where each has `t`, `during`, `src` and `loop`. If there are no files, look at the log: oscillator events mean synthesized sound, and no events means sound needs a toggle click in a scenario.

7. **If a site refuses headless** (blank page, challenge, "unsupported browser"), stop and ask Janriz before any headed run. Never spoof the user agent or solve a challenge.

## Files

- `research/capture/capture.js`: the capture runner (stills, MP4 clips, audio files, network log, audio trigger log).
- `research/capture/slots.js` (+ `slots.test.js`): the capture-slot lock capture.js takes before launching a browser.
- `research/capture/audio.sh`: ffprobe and loudness table, spectrogram and waveform PNGs.
- `research/capture/probe-gpu.js` and `codec-probe.js`: rerun them if Playwright or Chrome changes.
- `research/capture/template-run.js`: the unchanged template recorder baseline.
- `research/capture/hook-test.js` and `mobile-test.js`: self-checks on routed local pages, with no site visited.
- `research/capture/smoke-edolus.js`: the smoke scenario (landing view only; `GPU=0` gives the SwiftShader run).
- `research/capture-smoke/`: all smoke-test evidence referenced above.
