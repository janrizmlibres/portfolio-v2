# Capture setup for case studies

Type: research
Labels: wayfinder:research
Status: resolved
Blocked by: —

## Question

How will the case studies save **stills, motion (MP4) and a site's audio** to disk, at WebGL fidelity?

- Can the Claude in Chrome tools write screenshots or recordings to disk (and where do they land)? If not, what is the route — e.g. a Playwright script driven alongside?
- Does headless Chromium render these sites' WebGL faithfully? Compare a headless Playwright screenshot of one site's landing view against the Chrome-extension screenshot of the same view (the user's real, GPU-backed browser). Only the landing view — this is a smoke test, not a case study.
- MP4 capture of an interaction (scroll, hover, press-and-hold) — start from `~/.claude/templates/record-walkthrough.js` (read its header). Frame rate and quality good enough to read a transition?
- Audio: how to list a site's sound files (network requests), download them, and produce ffprobe metadata + spectrogram/waveform PNGs (ffmpeg).

Answer with a short, repeatable recipe every case-study session follows, plus any script it needs (saved under `research/`).

## Answer

Capture with **headless Playwright plus `--enable-gpu`**. Playwright's default headless renders WebGL with SwiftShader (software), which is degraded: Edolus took about 40 s to show its landing view and ran at 5 fps. With the flag, the chrome-headless-shell uses ANGLE on Metal at 60 fps, and its 3420×1792 still of Edolus's landing view matched Janriz's real Chrome. Claude in Chrome is only for looking. Its screenshots are downscaled JPEGs saved to `$TMPDIR/claude-chrome-screenshots-*`. Its GIF export lands in `~/Downloads` with one frame per action. It cannot save video or audio.

Recipe: write a scenario and run `node research/capture/capture.js <scenario.js>`. The run checks that the renderer line says Metal and writes:
- `screenshots/NN-*.png` at 2× resolution
- `motion/NN-*.mp4`: 60 fps from browser-timestamped CDP screencast frames, x264 CRF 16, plus a contact sheet per clip. It replaces the template's recorder, which is 25 fps VP8 at 1 Mbit/s.
- every audio file the page loads, saved to `audio/`
- a log of which sound played during which action

Then run `research/capture/audio.sh <case-study-dir>` for the ffprobe/loudness table and a spectrogram and waveform PNG per file. Stop and ask Janriz before any headed run; only a bot wall would need one.

Details, evidence and the numbered recipe: [../research/capture-setup.md](../research/capture-setup.md).
