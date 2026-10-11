# Trionn case study — working notes

Started 2026-09-27 20:07 PST (wall clock). Agent: case-study subagent.

## Runs
- **01-recon** (20:09): renderer ANGLE Metal OK. Clip 01-cold-load median 16.7 / p95 21.1 ms (OK; capturedFps 38.8 = frame gaps during load, not contention). Stills 02–04.
  - Loader: grey #C3C3C3 screen, logo draws in inside a bracket frame, "INSPIRE · INNOVATE · IMPACT", counter to 100, then black, shards assemble, headline scrambles in. Headline word rotates ("mean something." → "mean depth.").
  - Scroll check: sent 900 wheel → scrollY 270 after 1.5 s idle; +2400 → 990. Lenis (html.lenis). Ratio ~0.3 → investigate lenis options (wheelMultiplier?) before planning stops.
  - Page height 25497 px @900 vh. 3 canvases: hero (fixed, 2160x1350 = DPR 1.5), one at y=18708 inside `bg-[#C3C3C3]` section (2880x1800), footer canvas at 24562.
  - Stack: Next.js (Turbopack chunks, RSC), React, Three r128 (`__THREE__`), GSAP (`gsapVersions`), Lenis (`lenisVersion`), gtag, reCAPTCHA v3 (loads Roboto from gstatic).
  - Fonts: NeueHaasDisplay Roman, PP Editorial New Ultralight, Martian Mono Light, Familjen Grotesk Variable (self-hosted via next/font).
  - Audio found: /audio/thunder.mp3 (<audio loop>), /assets/hero-spark.mp3, /assets/hover-beep.mp3 (fetched at ~9 s). Bundle also names /assets/glass-shatter.mp3, join-zoom.mp3, woosh-loop.mp3 (lazy, on first use) + a synthesized brown-noise rumble.
  - 371 webp frames /images/stone/frame_NNNN.webp (image sequence), 9 /images/orbit/*.jpg, 6 mp4 videos (awards card, team/rushi, services).
- JS saved to logs/src/, pretty in logs/src/pretty/. Hero = `_next_static_chunks_1233qowaitufq.js` (TrionnSymbolAnimation + useTrionnSymbolAudio). 404 page reuses it (04srvx.z7_jun.js, `err-404-hold`).

## Hero mechanics (from 1233qowaitufq.js)
- Logo mark = 3 bezier Shapes → ExtrudeGeometry depth .42 bevel → split by face normal into separate "shard" meshes; MeshPhysicalMaterial 0x3A3D42 metal 1 rough .08 transmission .35 ior 2.4 clearcoat 1, envMap = CubeCamera 256 (updated every 6th frame only while blasting/dragging/holding). Edge LineSegments 0x363E4D op .08/.05.
- Explode amount p = max(scrollProgress, clickBurst (if scroll<.15), introAmt); shard pos = explodeDir*5.5*max(0,p-delay[0..0.25]). introAmt 1 → *0.975/frame (assembly intro).
- Scroll map (n = scroll/vh): ≤.1 → 0; .1–1 ramp to 1 (explode); 1–1.2 hold; 1.2–1.8 back to 0 (reassemble). lerp .06. ScrollTrigger pins wrap +=400% (touch 300%), suspends loop at progress ≥ .8.
- Hover: raycast shards (only when scrollProgress<.08) → newly hovered shard flashes (envMapIntensity+1.6, transmission .35→.67, opacity .88→.72, decays *.92/frame) + hover-beep.mp3 gain .7.
- HOLD TO BLAST: window mousedown (button 0) inside #hero-section, not on a/button/#sound-toggle/#keyfacts-section, scrollProgress<.15 and #s3-text not visible → event "trionn-blast:start", holding. Hold 0–0.5 s: vibrate (DOM ids shake ±2.5/1.5 px, shards jitter), synth brown-noise → lowpass 80 Hz → gain .18. At 0.5 s: stop rumble, glass-shatter.mp3 (.9), woosh-loop.mp3 loop ramps to .7/0.8 s; clickBurst +.02/frame (≈0.83 s to full). ≥0.7 s: DOM elements float in 3D (perspective 600, rotX ≤25°, rotY ≤20°, rotZ ≤15°, translate ≤30/20 px). Release: DOM springs back .6 s cubic-bezier(.25,.46,.45,.94); shatter fades .1 s; if clickBurst ≥ .98 → join-zoom.mp3 (.7); clickBurst −.025/frame (≈0.67 s) → reassembles.
- Woosh loop gain follows 0.07 + 0.93*max(scrollProgress, clickBurst) (ambient bed at .07, swells on scroll/blast); autostarts on first gesture if sound on.
- LINES ("dare to touch the lines"): 2D canvas → CanvasTexture on an ortho full-screen quad over the scene. 3 quadratic curves from screen bottom-left to 3 anchors on the logo, sine wobble; draw-in +.0205/frame; undraw with scroll .08–.52 vh. Pulses travel (orange→blue gradient), node dots with rings at midpoints. Pointer within 14 px of a line → "weld": 5–6 bursts of 3D lightning bolts (5 bolts, additive lines + 6 glow tubes, travelling point light) from touch point to the other lines; hero-spark.mp3 gain .16 once per touch.
- Drag-rotate on canvas mousedown exists but wrap is pointer-events-none (check whether it ever fires).
- `isHovered` is dead code (0 > sqrt).
- **02-hero-play** (20:16): all clips 60 fps (median 16.7–16.8, p95 ≤ 18.8). wheelScale 3.333 (=2/0.6) → scrollToY lands exactly (verified 450/900/1080/1620). Stills 05, 11, 14, 15; clips 06–10, 12, 13, 16.
  - GOTCHA: capture.js `label` only changes on h.* helpers; raw page.mouse calls keep the previous label ("sweep logo"). Use h.mark() + my __mixLabel together from now on.
  - Sound on (#sound-toggle) → loads woosh-loop.mp3 AND all 8 robotic voice clips /audio/voice/*.mp3 (primeRoboticSpeech). Woosh bed fades to .07.
  - Mix measured (probe-mix-hero.json): woosh .07 idle → ~1.0 at blast/scroll-explode; rumble = ScriptProcessor .18 for 0.5 s; shatter .9; join-zoom .7 on release; hover-beep .7 per shard entered (128 in the sweep); hero-spark .16 per weld.
  - Pointer probe: canvas + wrap pointer-events none → the canvas mousedown drag-rotate never fires on desktop (blast-drag clip shows no rotation from drag; confirm).
  - Crops: logs/08-lines-weld-detail.png (blue lightning at cursor), logs/07-logo-sweep-detail.png (shard faces flash white).
- Awwwards (logs/awwwards-page.txt): SOTD 27 Jul 2026 7.42, Dev award 7.05. Elements list names "interactive lion", "draggable team section", "floating project gallery", "404 page typography", "3D curved Dribbble showcase" → visit /about, /work, a 404 in scenario 04.
- 03-journey queued ~20:19 behind 4 other agents' runs (both slots taken). Did audio.sh meanwhile (logs/audio-probe.md).
- 20:39 journey still waiting: slots.js polls every 1 s with no queue, so newer runs from other agents keep winning the free slot (lost ≥3 races in 20 min). Report: wish for a FIFO ticket queue in slots.js.
- While waiting: fetched /about /work /services /trionn-story /404 chunks with Playwright request (logs/src/page_*.html + new chunks). About = lion (WebGL shader) behind a 2D "curtain" canvas (cursor ns-resize, press-drag bends strings; curtain.mp3 loop 0.1–1.5 s; lion-growl.mp3 after ≥0.5 s of a >15 px bend) + draggable floating team cards. Work = work-listing.mp3 loop (<audio> .6). Services = orbit canvas with /services-orbit/spark.mp3 + woosh.mp3. Story = galaxy bg, line canvas, mascot (Narasimha), name-story(.spark).mp3.
- Footer = SVG hairlines → hover plucks synthesized sine note (G-major pentatonic 196–494 Hz, vibrato 4.9 Hz, 2nd/3rd harmonics, LP 1.8–2.6 kHz, peaking 700 Hz, 0.14 s feedback delay) + AnalyserNode (fft 64) drives a raw-WebGL fbm smoke shader in the footer.
- First blast of a session: glass-shatter/join-zoom fetched lazily → shatter ~1 s late, join ~0.8 s late.
- README: §1, §2, §6 (hero), §7 (hero), §8 (hero mix) drafted.
- **03-journey** (ran 20:41–20:46 after a 22 min slot wait): clips 17–33, stills 18–32. Medians OK (16.6–17.1) but p95 high on 21-work-track (49), 23-services (35.8), 25-services-to-testimonials (50); 17/19/27 p95 ≤ 20.8 but capturedFps 44–51. Reshooting 21/23/25 inside 04-pages with page-side rAF timing to tell site jank from contention.
  - Max scroll is 23697 (footer overlaps last pin via marginTop -100dvh), not 24597.
  - Thunder <audio>: fades in y 8139→9238 (0.01→0.97), holds through services, fades out 15088→16286. Loop cut at 14 s of a 17.45 s file.
  - Woosh bed stops at y≈2700 (hero pin suspend at 80 %).
  - Footer harp: 350 path elements (175 visible strokes + transparent 12–18 px hit clones) forming giant "TRIONN" letters; 508 oscillator starts in one sweep; crop logs/31-footer-harp-detail.png shows sine-wave string wobble.
  - Capture hook logs oscillator freq as 440 (setValueAtTime doesn't change .value) → notes come from the bundle, not the log.
- Perf gotcha: resource timing buffer caps at 250 entries (probe-perf-journey count 250) → use the run log's network list for totals. Home journey: 504 responses; stone sequence 371 WebP = 12.9 MB fetched eagerly 9.9–28.7 s after load (while still on the hero); mp4 ≈ 4.8 MB (desktop + _m encodes); jpg 1.6 MB; mp3 0.6 MB; JS ≈ 0.87 MB transfer / 2.6 MB decoded + reCAPTCHA 0.35 MB. ≈ 21 MB total. CLS in the journey probe = 9.86 (pins + scroll; meaningless) — use recon's 0.18 at landing.
- 04-pages queued at 20:49.
- README: §5, §7 (all), §8 (all but questions) drafted.
- **04-pages** (20:50–20:55, after a 3 min wait). Results:
  - Reshoots of 21/23/25 (34–36) got the same clip p95 (47/38/49 ms) while the **page's own rAF was steady: median 16.7, p95 18.3, max 18.8, 0 frames > 33 ms**. So the high clip p95 is screencast idling (no compositor damage during the 1.1 s scroll pauses in sections whose canvases are paused), not contention or site jank. Kept 21/23/25, deleted 34–36 as duplicates.
  - FAILED: to-about (menu link text is doubled by HoverBlur: "AboutAbout", so /^about$/ never matched) and contact (button text "let's talklet's talk"). The team drag then ran on the HOME keyfacts cards: renamed 38 → 38-keyfacts-cards-mid-scrub.png, 39 → 39-keyfacts-lion-video-card.mp4 (the awards card video: lion roars, lifts trophy). Deleted 40 (logo click on home = no-op).
  - OK: 37 menu open/hover/close, 41 /work gallery + 42 still, 43/44 404 (404 digits as shards; blast works). 44 has capturedFps 29 / p95 123 ms — includes the 404 intro load; reshoot in 07 with rAF probe.
  - Readiness (probe-ready-desktop.json): loader hands over (html[data-trionn-ready]) at **8.40 s**; headline visible 8.18 s; the header sound button is hit-testable from 1.29 s only because the loader overlay has pointer-events none (visually covered).
- **07-about-contact** (21:00–21:02): 45 transition home→about, 46 about top, 47/48 lion curtain (strips part to reveal the lion; curtain.mp3 loop gain ~0.93 while dragging, lion-growl 0.6 s into the drag, release tail 0.4), 49–51 team (drags went to corners: MISSED the scanner drop box "DRAG A MEMBER TO IDENTIFY" → redo in 06), 52 transition about→home, 53/54 404 settled (page rAF p95 17.6 → 44's bad stats were the intro load; 44 superseded by 54).
  - Contact FAILED again: HoverBlur maps spaces to U+00A0, so /let.s talk/ misses; use /let.s.talk/.
  - Team scanner = drag a lion-masked portrait (.vcard) onto the centre box → speakRobotic("identifying") → "detected", scan grid, glitch, brackets, typewriter name/role. Touch: "TAP A MEMBER TO IDENTIFY".
  - Mix-sampler gotcha: sources from a closed AudioContext never fire 'ended', so the home woosh shows as "live" on /about. Ignore stale entries after a client navigation.
- 21:05 queued 05-mobile then 06-reduced-motion (06 now also does contact + team scanner under reduce).
- **05-mobile** (21:04–21:06): clips 55, 57, 59, 60; stills 56, 58, 59, 61–64, 69 (deleted 65–68: stops stuck at the bottom y 14290, duplicates of 64). All clips median ≤16.7; 55 cold-load p95 25.2 (loading), others ≤ 22.2.
  - 4 swipes of 350 px moved 1752 px each stop (touchMultiplier 1.2 + syncTouch inertia). Doc height 15618 at 390×664.
  - Readiness: ready 8.54 s, headline 8.18 s, FCP 1.86 s, **LCP 13.46 s** (a `div.chars` paragraph), CLS 0.19. All 371 stone frames + both encodes of every video load on mobile too.
  - Long press: no blast. Touch sends compat mousedown/mouseup only at touchend → each tap/long-press = a 1-frame hold: rumble ScriptProcessor starts+stops (4 created for 1 long press + 3 taps), no shatter. Shard hover-beeps DO fire on touch (pointerdown sets the ray). "Hold to blast" hint hidden (<1024 px). Hero DPR 1, particles hidden.
  - Mobile keyfacts = pinned horizontal card carousel; numbers count up on slot reels (00+ → 50+).
- **06-reduced-motion** (21:06–21:08): 70 rm cold load (loader identical), 71, 72 rm hold-to-blast (tremor + blast unchanged), 73 rm hero scroll (burst unchanged), 74; contact popup 75 (plain side-panel form "Let's build something great.", no voice played); team scanner 76–78 (drop → identifying.mp3, +3.7 s 2 oscillators + detected.mp3, then member video lifting the lion mask: prabhat.mp4, gaurav.mp4). Crop logs/77-team-scanner-detail.png. ready-rm 8.40 s.
  - GOTCHA: _style.js skipped one-character spans (split text), so 05/06 type probes missed headlines. Fixed (resolve to line owner) and re-running as 08-type-colour.js (desktop + MOBILE=1). Old files renamed superseded-probe-type-colour-*.json.
- **08-type-colour** desktop + MOBILE=1 (21:09–21:12): fixed probe. Findings: display/headings/labels are **Familjen Grotesk** (not Haas); Haas = body 16.2 px only; Martian Mono = CTAs; PP Editorial preloaded but unused on home/about/work. Root font-size fluid (14.4 px @1440).
- Remaining clips over threshold, all explained: 21/23/25 (screencast idle, page rAF steady), 41 (/work page load inside the clip), 55 (mobile cold load inside the clip).
- audio.sh re-run for curtain / lion-growl / work-listing.
- README complete (11 sections + media index). Finished ~21:15.
