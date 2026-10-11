# Audio stack: research findings

Ticket: [11 — Audio stack](../issues/11-audio-stack.md) · researched 2026-09-27 · facts, not a verdict (the verdict comes from a grilling session with Janriz).

**Method.** Every claim is cited to the source that owns it: specs (W3C Web Audio, WHATWG HTML, W3C Audio Session, WCAG), MDN and its browser-compat-data, browser vendor docs, library source code at the published version, and licence texts. Sizes, decode behaviour and render cost that I measured myself give the command and the result. Anything I worked out myself is marked **(analysis)**. Anything I could not confirm at a primary source is marked **(unverified)** and collected at the end. Library API facts came through Context7 first, then the published package source. Case-study evidence is cited as `case-studies/<site>/README.md §8`.

**Measurement setup.** Apple M5 (10 cores), macOS 26. Node 24.15.0, esbuild 0.28.2, Apple gzip 479 (`gzip -9`), brotli 1.2.0, ffmpeg 9.0.1. Headless Chromium 147.0.7727.15 (Playwright 1.59.1, the repo's version), Chromium 153.0.8010.12 and WebKit 26.6 (Playwright 1.63.0), Google Chrome 153.0.8010.53, and WebKit 26.4 (Playwright), all headless. Measurements by the three research sub-runs keep their scripts under `audio-research/agent-*/`. Scratch work lives in the session scratchpad under `audio-research/`, never in the repo. Playwright's WebKit is a WebKit build, not Safari; codec and decode results from it are indicative for Safari, not proof.

**Version snapshot (2026-09-27).**

| Thing | Version / date | Source |
|---|---|---|
| This repo | Next 16.2.4, React 19.2.4, gsap 3.15.0, @gsap/react ^2.1.2, ai 6.0.168, no audio library yet | `package.json`, `node_modules/*/package.json` |
| howler | 2.2.4, published 2023-09-19. Last commit on `master` 2025-11-23 (README edit). 418 open issues, 25.4k stars | [npm](https://registry.npmjs.org/howler), `gh api repos/goldfire/howler.js` |
| tone | `latest` 15.1.22 (2025-04-27). `next` 15.5.42 (2026-09-16), released from `dev` several times a month. 58 open issues, 14.7k stars | [npm](https://registry.npmjs.org/tone), `gh api repos/Tonejs/Tone.js` |
| standardized-audio-context | 25.3.77 (2024-08-31); repo commits to 2026-09-01. Tone's only runtime dependency besides `tslib` | [npm](https://registry.npmjs.org/standardized-audio-context) |
| zzfx | 1.3.2 (2025-09-17); repo commits to 2026-09-11 | [npm](https://registry.npmjs.org/zzfx), [repo](https://github.com/KilledByAPixel/ZzFX) |
| use-sound | 5.0.0 (2025-02-18), a React hook over Howler | [npm](https://registry.npmjs.org/use-sound) |
| @strudel/web | 1.3.0 (2026-01-18), AGPL-3.0-or-later | [npm](https://registry.npmjs.org/@strudel/web) |

---

## 0. What the case studies already show

| Site | Engine | Default | Bed | SFX | Worth knowing | Source |
|---|---|---|---|---|---|---|
| Edolus | Web Audio buffers | Silent until "Initiate system", then on | Three synced 61.2 s stereo Vorbis stems (615 KB, 618 KB, 890 KB at 80–116 kbit/s, measured with `ffprobe` on the capture); per-section mix table, levels eased over 1.2 s, 2 s start envelope, 1 s toggle fade | 12 one-shots and loops, 9–103 KB each; the quantum loop's pitch follows scroll speed (1.00–1.61) | Each stem is one 30.6 s phrase played twice | `case-studies/edolus/README.md §8` |
| Hashgraph Ventures | Howler 2.2.4 | Off; chosen at a gate ("Enter with audio") plus a header toggle | 126 s music bed plus four section loops crossfaded by scroll position on a Theatre.js timeline | Hover and click blips, pointer-speed-driven loops | Master volume is a GSAP tween of Howler's volume. Turning sound on later left the current section's loop silent. The first team-morph SFX played 1.6 s late (loaded on first use). 23 files, `.webm` Opus with `.mp3` fallbacks, 1.3 MB for the webm set | `case-studies/hashgraph-ventures/README.md §8` |
| Trionn | Web Audio, partly synthesised | Off, never persisted | 4.58 s MP3 loop whose gain is re-aimed every frame; a thunder `<audio>` whose `volume` is set every frame | Brown-noise rumble from a `ScriptProcessor`, a synthesised pentatonic harp (508 oscillators in one sweep), sample SFX | Lazily fetched SFX made the first blast ~1 s late. Hover beeps ran in a second `AudioContext` | `case-studies/trionn/README.md §8` |
| US Avionix | Web Audio buffers | Effectively on, but only after a flight key | Four looping stems whose levels chase key-driven targets every frame; engine `playbackRate` 0.85 → 1.25 | — | Per-frame ramps run twice as fast at 120 Hz. Loop seams audible (9 dB step, sample jump) | `case-studies/usavionix/README.md §8` |
| Produx | `<video>` and `new Audio()` | Silent; sound only in the reel and the 404 game | — | `cloneNode().play()` overlaps at full volume | Slash SFX peak above 0 dBFS; one starts with 0.25 s of silence | `case-studies/produx/README.md §8` |
| Izanami | none | Silent | — | — | Janriz felt the silence as something missing | `case-studies/izanami/README.md §8` |

---

## 1. Libraries

### 1.1 Candidates

| | Raw Web Audio API | Howler.js | Tone.js | ZzFX | Others considered |
|---|---|---|---|---|---|
| What it is | The browser API: an `AudioContext`, nodes, `AudioParam` automation | A playback library: "defaults to Web Audio API and falls back to HTML5 Audio" ([README](https://github.com/goldfire/howler.js#description)) | "A Web Audio framework for making interactive music in the browser": synths, effects, a musical Transport ([README](https://github.com/Tonejs/Tone.js)) | A 1 KB sound-effect synthesiser driven by a 20-number parameter array ([repo](https://github.com/KilledByAPixel/ZzFX)) | use-sound (React hook over Howler), standardized-audio-context (a spec-conformant `AudioContext` wrapper), Strudel (live-coding pattern music), smplr (sampler) |
| Licence | — | MIT | MIT | MIT | use-sound MIT, s-a-c MIT, smplr MIT (npm), **Strudel AGPL-3.0-or-later** |
| Maintenance (2026-09-27) | Living spec: Web Audio API 1.1 Editor's Draft dated 9 September 2026 ([ED](https://webaudio.github.io/web-audio-api/)) | Last release 2023-09-19; one README commit since; 418 open issues. Dormant, not archived | Active on the `next` channel (15.5.x, 2026-09-16); `latest` is 15.1.22 from 2025-04-27 | Active (commits 2026-09) | — |

### 1.2 Size (measured)

Command, per entry file: `npx esbuild <entry> --bundle --minify --format=esm --platform=browser --define:process.env.NODE_ENV='"production"' --outfile=out.js`, then `gzip -9 -c out.js | wc -c` and `brotli -c out.js | wc -c`. Each entry imports the named symbols and assigns them to `window` so nothing is dropped.

| Entry (what is imported) | Min | gzip | brotli |
|---|---|---|---|
| Raw Web Audio | 0 | 0 | 0 |
| `zzfx` → `{ zzfx }` | 1.9 KB | **1.1 KB** | 1.0 KB |
| `howler` → `{ Howl, Howler }` (package `main` = core + spatial plugin) | 37.3 KB | **10.2 KB** | 9.1 KB |
| `howler/dist/howler.core.min.js` (core only) | 27.5 KB | 8.3 KB | 7.4 KB |
| `use-sound` (default export; Howler is loaded by `import('howler')` at runtime, bundled here) | 39.0 KB | 10.9 KB | 9.8 KB |
| `smplr` → `{ Soundfont }` | 64.1 KB | 21.3 KB | 18.7 KB |
| `standardized-audio-context` → `{ AudioContext }` | 128.4 KB | 36.4 KB | 29.2 KB |
| `tone@15.1.22` → `{ Synth, start }` | 261.7 KB | **68.8 KB** | 57.0 KB |
| `tone@15.1.22` → `{ Player, Players, Gain, Filter, CrossFade, start, getContext }` | 268.2 KB | 70.1 KB | 58.0 KB |
| `tone@15.1.22` → a score kit (`Players, Gain, Filter, PolySynth, Synth, FMSynth, NoiseSynth, Noise, Reverb, FeedbackDelay, LFO, Transport, start, getContext`) | 286.6 KB | 73.9 KB | 61.3 KB |
| `tone@15.1.22` → `import * as Tone` | 373.5 KB | **91.1 KB** | 75.0 KB |
| `tone@15.5.42` (`next`), same four entries | 269–383 KB | 71.0 / 72.3 / 76.3 / 94.0 KB | — |
| `@strudel/web@1.3.0` → `{ initStrudel }` | 648.2 KB | 211.3 KB | — |

**Tree-shaking.**
- Tone tree-shakes poorly. Its minimum (one `Synth`) is 76% of the whole library. An esbuild metafile of the `Synth` entry attributes **119 KB of the 262 KB** minified output to `standardized-audio-context`, 72 KB to Tone's `core/`, and 32 KB to `source/` (measured). Neither `tone` nor `standardized-audio-context` declares `"sideEffects": false` in `package.json`, and Tone's `index.js` runs code at module top level (next bullet), so bundlers must keep it **(analysis from source)**.
- Howler ships as one UMD file with no ESM build, so there is nothing to shake. Importing the core file directly saves 1.9 KB gzip over the default entry.
- Raw Web Audio and ZzFX add nothing or almost nothing.

For scale: the *3D route verdict* puts three.js at ≈ 172 KB gzip after first paint (`map.md`, Loading and the Facade).

### 1.3 Capability matrix

| | Raw Web Audio | Howler 2.2.4 | Tone.js 15.1 | ZzFX 1.3 |
|---|---|---|---|---|
| **Start latency** | `source.start()` with no time starts at the next render quantum (128 frames = 2.7 ms at 48 kHz), plus the device's output latency (§6.5) | Web Audio mode calls `bufferSource.start(0, seek, duration)`, so the same as raw (`howler.js` line 870). HTML5 mode waits on the media element | **Adds 100 ms by default.** `now()` returns `currentTime + lookAhead`, and `lookAhead` defaults to 0.1 s ([`Context.js`](https://github.com/Tonejs/Tone.js/blob/dev/Tone/core/context/Context.ts); [wiki: Performance](https://github.com/tonejs/tone.js/wiki/Performance) says it "can be reduced or set to 0, or `Tone.immediate()` … can be used") | Plays on `start()`; same as raw |
| **Sprites** | `start(when, offset, duration)` on one decoded buffer is a sprite **(analysis)** | Named sprites `{ key: [offsetMs, durationMs, loop?] }` ([README: sprite](https://github.com/goldfire/howler.js#sprite-object)). In Web Audio mode a looping sprite sets `loopStart`/`loopEnd` on the source (lines 1471–1474) | `Player.start(time, offset, duration)`; no named sprite map **(analysis)** | Not applicable (no files) |
| **Gapless loop** | `AudioBufferSourceNode.loop` loops a decoded buffer sample-accurately (§4.5) | Yes in Web Audio mode (buffer `loop`). **Not in `html5: true` mode**, which uses the media element's `loop` (§4.5) | Yes (`Player` wraps a buffer source with `loop`, `loopStart`, `loopEnd`) | `playSamples(..., loop)` sets `source.loop` |
| **Stems in sample-accurate sync** | Yes: call `start(t)` on every stem with the same context time `t` (§4.5) | **No shared start time in the API.** `play()` always calls `start(0, …)` ("now"), and a sound that is still loading starts when its own load finishes (lines 791–805 queue a `play` until the file loads; lines 868–870 start it). Sync holds only if every stem is loaded and played in the same task **(analysis from source)**. HTML5 mode cannot sync | Yes: `player.start(time)` with one shared `time`, or `.sync().start(0)` on the Transport ([example: daw.html](https://github.com/tonejs/tone.js/blob/dev/examples/daw.html)) | — |
| **Per-stem gain, filters, effects** | Any node graph | Per-sound volume, rate, stereo pan and 3D panner (spatial plugin). No filters or effects API. `Howler.ctx` and `Howler.masterGain` are exposed "for plugins or advanced usage" (line 2548), so custom nodes are possible but outside the API | Full: filters, EQ, reverb, delay, compressor, LFOs, crossfades, all as nodes with ramps | Its own gain and pan only; **connects straight to `destination`** (source, lines 83–90) |
| **Synthesis** | Oscillators, noise buffers, filters, convolution, delay, AudioWorklet (§3.1) | None | Synths, FM/AM, noise, polyphony, envelopes, sequencing, `Tone.Offline` | SFX synthesis only (one-shot envelopes, pitch slides, noise, bit-crush) |
| **How fades/automation are driven** | `AudioParam` automation on the audio thread (§6) | `fade()` schedules `setValueAtTime(from)` + `linearRampToValueAtTime(to)` natively **and** runs a `setInterval` in JS to track the volume (lines 1336–1368). `volume(v)` is `setValueAtTime(v, currentTime)`, an instant step (line 1271). In HTML5 mode fades are `setInterval` steps on `element.volume` | Every `Param` has `rampTo`, `linearRampTo`, `exponentialRampTo`, `targetRampTo`, `setTargetAtTime`, and keeps its own event timeline so it can emulate `cancelAndHoldAtTime` (`Param.js` lines 338–377) | — |
| **Own clock?** | The audio clock (`currentTime`) only | `setTimeout` timers for `end` events | **Yes: a Transport scheduler ticked by a Web Worker timer every 50 ms** (`clockSource: "worker"`, `updateInterval: 0.05`; `Ticker.js`, `Context.js` lines 65–81) | No |
| **Mobile** | See §2 (unlock, iOS silent switch, interruptions) | Auto-unlock on the first `touchstart`/`touchend`/`click`/`keydown` by playing a 1-sample silent buffer and calling `ctx.resume()` (lines 301–412). **`autoSuspend` suspends the context after 30 s with nothing playing** (lines 461–505; README: "to decrease processing and energy usage"). If the context's `sampleRate` is not 44100 it unloads and recreates the context on first unlock (lines 315–318). Open report of silence on iOS 26 with the silent switch on, fixed by users with `navigator.audioSession.type = "playback"` ([#1767](https://github.com/goldfire/howler.js/issues/1767), community, not a primary source) | `Tone.start()` must run in a gesture handler ([wiki: Autoplay](https://github.com/tonejs/tone.js/wiki/Autoplay)); no automatic unlock | Creates its own `AudioContext` at import; no unlock logic |
| **SSR / Next.js** | Touch `AudioContext` only in client code after a gesture | Imports in Node without throwing (tested: `require('howler')` in Node 24). On the server it writes `global.Howler`, `global.Howl` (lines 2576–2581). In the browser, importing creates no `AudioContext`, but `new Howl()` does (line 577) | Imports in Node without throwing (tested with 15.1.22; it falls back to a `DummyContext`). **In the browser, importing `tone` creates the global `AudioContext` at once**, because `index.js` runs `export const Transport = getContext().transport` at top level, and it logs a version banner unless `window.TONE_SILENCE_LOGGING` is set (`index.js`, `core/Global.js` lines 19–24, 65). Old Next import failures ([#1077](https://github.com/Tonejs/Tone.js/issues/1077), open) came from ESM paths in 14.8; they do not reproduce in Node 24 with 15.1.22 (tested) | **Throws on the server**: `import('zzfx')` in Node fails with `AudioContext is not defined`, because `ZZFX.audioContext: new AudioContext` runs at module evaluation (tested). Its pure generator `ZZFX.buildSamples(...)` returns sample arrays and can feed your own context or run at build time **(analysis from source)** |

### 1.4 Notes

- **Next.js pattern for all of them (analysis).** Keep audio code out of the initial bundle: a `"use client"` module loaded with `import()` from the sound toggle's handler or after idle (the Next 16 lazy-loading guide shows `import()` of a library inside an event handler: `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`, "Loading External Libraries"). Create or resume the `AudioContext` synchronously inside the gesture handler, before any `await` (§2.1).
- **One context.** Trionn ran its hover beep in a second `AudioContext`, and ZzFX creates its own. Separate contexts cannot share a master gain, a limiter or the toggle's fade **(analysis)**. ZzFX's generator can instead feed buffers into the site's own context (`ZZFX.buildSamples` → `AudioBuffer`).
- **Tone's weight is mostly its ponyfill.** `standardized-audio-context` exists to paper over old browser differences ([README](https://github.com/chrisguttandin/standardized-audio-context)). It is 36 KB gzip on its own and cannot be removed from Tone.
- **Strudel** makes generative pattern music in the browser, but it is 211 KB gzip and AGPL-3.0-or-later, whose network-use clause applies to code served to visitors ([AGPL-3.0 §13](https://www.gnu.org/licenses/agpl-3.0.html#section13)). It is listed here only because it is the obvious "code-made score" tool.
- **Voice (later experiment).** `speechSynthesis` output is not a Web Audio node, so it cannot be filtered, mixed or ducked by the graph **(analysis; unverified at a spec)**. Pre-rendered voice clips, or non-verbal synthesised chirps, go through the graph like any SFX.

### 1.5 GSAP and the audio clock

- **Two clocks exist whatever library is chosen.** `gsap.ticker` runs on `requestAnimationFrame` and "gets throttled down significantly" in hidden tabs ([gsap.ticker](https://gsap.com/docs/v3/GSAP/gsap.ticker)). Audio renders on its own thread against `AudioContext.currentTime`. The canonical scheduling article: timer callbacks "can easily be skewed by tens of milliseconds or more by layout, rendering, garbage collection", so musical events are scheduled ahead on the audio clock, while rAF drives the visuals ([web.dev, "A Tale of Two Clocks", Chris Wilson, 2013-01-09](https://web.dev/articles/audio-scheduling)).
- **So there is no conflict with a single `gsap.ticker` for visuals (analysis).** GSAP can decide *what* the mix should be each frame (ScrollTrigger progress, velocity, chat state). The audio thread decides *how* to get there (automation). A conflict appears only if GSAP writes `AudioParam.value` directly every frame (§6: steps, and stalls in hidden tabs).
- GSAP tweens "generic object[s]" ([gsap.to](https://gsap.com/docs/v3/GSAP/gsap.to())), so a tween of a plain `mix` object with an `onUpdate` that schedules automation is possible. ScrollTrigger's `onUpdate` receives `progress`, `direction` and `getVelocity()` "in pixels-per-second" ([ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger), [getVelocity](https://gsap.com/docs/v3/Plugins/ScrollTrigger/getVelocity())).
- Tone adds a third clock: its Transport's worker ticker (50 ms). It exists for musical sequencing and does not interfere with rAF **(analysis)**.
- Local evidence of the per-frame approach: Hashgraph tweens Howler's master volume with GSAP (each step becomes `setValueAtTime`, per the Howler source above). Trionn and US Avionix lerp levels every frame, and US Avionix's ramps run "twice as fast" at 120 Hz (`case-studies/usavionix/README.md §8`).

---

## 2. Autoplay and unlock

Browser-support numbers in §2 and §5 come from raw MDN browser-compat-data (BCD) at commit `6089fa7` (2026-09-25). Engine source was read on `main` of the Chromium, WebKit and Firefox GitHub mirrors on 2026-09-27. Readings of engine source are marked **(analysis)**.

### 2.1 What the spec allows

- "An AudioContext is said to be allowed to start if the user agent allows the context state to transition from "suspended" to "running". A user agent may disallow this initial transition, and to allow it only when the AudioContext's relevant global object has sticky activation" ([Web Audio ED, allowed to start](https://webaudio.github.io/web-audio-api/#allowed-to-start)). `resume()` stays pending while the context is not allowed to start. Calling `start()` on a source node can also start the context.
- **Activation-triggering events (HTML).** "any event whose isTrusted attribute is true and whose type is one of":
  - "keydown", provided the key is neither Esc nor a shortcut key reserved by the user agent;
  - "mousedown";
  - "pointerdown", provided the event's pointerType is "mouse";
  - "pointerup", provided the event's pointerType is not "mouse"; or
  - "touchend"

  ([HTML, activation-triggering input event](https://html.spec.whatwg.org/multipage/interaction.html#activation-triggering-input-event)).
- **What does not count.** The list is closed, so **scroll, wheel, mousemove, pointermove, touchstart, focus and hover do not activate**. Chromium says of scrolling directly: "Any click on the document itself (this excludes scrolling) will count" ([chromium.org autoplay](https://www.chromium.org/audio-video/autoplay/)).
  - Consequence **(analysis)**: a visitor who only scrolls never unlocks audio. The score cannot start "on scroll". It needs a click, tap or key.
- **Sticky vs transient activation.**
  - Sticky activation "starts false, then changes to true (and never changes back to false)" on the first activation. It survives navigation only "as long as the same Document gets reused" (bfcache).
  - Transient activation lasts a UA-defined time, "expected be at most a few seconds" ([HTML, sticky activation](https://html.spec.whatwg.org/multipage/interaction.html#sticky-activation)).
  - In source, transient activation lasts 5 s in Chromium (`kActivationLifespan`, [user_activation_state.h](https://github.com/chromium/chromium/blob/main/third_party/blink/public/common/frame/user_activation_state.h)), in Firefox (`dom.user_activation.transient.timeout` 5000) and in WebKit (`defaultTransientActivationDuration { 5_s }`, [LocalDOMWindow.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/LocalDOMWindow.cpp)).
- `navigator.userActivation` is supported in Chrome 72, Firefox 120 and Safari 16.4 ([BCD UserActivation.json](https://github.com/mdn/browser-compat-data/blob/main/api/UserActivation.json)).

### 2.2 Per browser

| | What unlocks Web Audio | Notes | Source |
|---|---|---|---|
| **Chrome** | **Sticky** activation. Or, on desktop only, a high Media Engagement Index (MEI) for the origin. Or an installed PWA / home-screen site | "If an AudioContext is created before the document receives a user gesture, it will be created in the 'suspended' state, and you will need to call resume() after the user gesture." "The Web Audio API has been covered by autoplay since Chrome 71." MEI is "a ratio of visits to significant media playback events per origin", and "When it is high enough, media is allowed to autoplay on desktop only." In source, `AudioContext::AreAutoplayRequirementsFulfilled()` → `IsDocumentAllowedToPlay()` accepts sticky activation or the high-MEI bypass, so MEI applies to Web Audio too **(analysis)** | [Chrome autoplay policy](https://developer.chrome.com/blog/autoplay) (updated 2017-09-13), [audio_context.cc](https://github.com/chromium/chromium/blob/main/third_party/blink/renderer/modules/webaudio/audio_context.cc), [autoplay_policy.cc](https://github.com/chromium/chromium/blob/main/third_party/blink/renderer/core/html/media/autoplay_policy.cc) |
| **Safari / WebKit** | **Transient** activation at the moment of `resume()`/`start()`, i.e. inside the handler or within 5 s of it. Safari 16.4: "Fixed only requiring a transient user activation for Web Audio rendering" | The gate applies only if `requiresUserGestureForAudioPlayback()`. A per-site policy of Allow removes it. That setting defaults to `true` on iOS and is set by Safari elsewhere **(analysis)**. macOS Safari has a per-site Auto-Play setting: "Allow All Auto-Play", "Stop Media with Sound", "Never Auto-Play". How those map to WebKit's enum is inferred **(unverified)** | [WebKit 16.4](https://webkit.org/blog/13966/webkit-features-in-safari-16-4/), [AudioContext.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/webaudio/AudioContext.cpp), [Page.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/Page.cpp), [Apple: Websites settings](https://support.apple.com/guide/safari/websites-ibrwe2159f50/mac) |
| **Firefox** | **Sticky** activation, unless the site permission or the global default is "Allow Audio and Video" | "By default, Firefox blocks media with sound from playing automatically" (options: Block Audio, Block Audio and Video, Allow Audio and Video). `AutoplayPolicy::IsAllowedToPlay(const AudioContext&)` applies the same block to Web Audio. In source, `media.autoplay.default` is `1` (Blocked). MDN's `media.autoplay.block-webaudio` pref and its stated default of 0 look stale **(analysis)** | [Mozilla support](https://support.mozilla.org/en-US/kb/block-autoplay) (read via [Wayback 2026-06-09](https://web.archive.org/web/20260609174655/https://support.mozilla.org/en-US/kb/block-autoplay)), [AutoplayPolicy.cpp](https://github.com/mozilla-firefox/firefox/blob/main/dom/media/autoplay/AutoplayPolicy.cpp), [StaticPrefList.yaml](https://github.com/mozilla-firefox/firefox/blob/main/modules/libpref/init/StaticPrefList.yaml), [MDN Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) |

**The "silent buffer" unlock trick.** Howler still plays a 1-sample buffer on `touchstart`/`touchend`/`click`/`keydown` (§1.3). No primary source still requires this. The spec, Chrome and MDN prescribe calling `resume()` (or `start()`) from the gesture: "Create or resume context from inside a user gesture" ([MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)). WebKit gates on `hasTransientActivation()`, and `touchstart` is not an activation event while `touchend` is **(analysis)**.

**`navigator.getAutoplayPolicy()`.**
- Defined in the W3C Autoplay Policy Detection WD (4 Sep 2025) ([TR](https://www.w3.org/TR/autoplay-detection/), [ED](https://w3c.github.io/autoplay/)).
- It accepts `"audiocontext"` or an `AudioContext` instance. For audio contexts it returns only `"allowed"` or `"disallowed"`; `"allowed-muted"` is for media elements.
- **Support: Firefox 112 only.** Chrome, Edge and Safari (desktop and iOS) do not support it ([BCD Navigator.json](https://github.com/mdn/browser-compat-data/blob/main/api/Navigator.json)).
- Everywhere else, the only way to know is to create the context and read `state` ("running" = allowed, "suspended" = blocked, per the [Chrome policy page](https://developer.chrome.com/blog/autoplay)).

### 2.3 iOS specifics

- **The Silent switch mutes Web Audio but not `<audio>`/`<video>`.**
  - [WebKit bug 237322](https://bugs.webkit.org/show_bug.cgi?id=237322): with the phone on silent, media elements are audible and Web Audio is not. An Apple WebKit engineer wrote there (2024-09-25): "Since iOS 17, you can set the audio session type to "playback"… By default the type is `ambient` and so audio will be muted if the phone is muted."
  - Apple's Ambient category: "Screen locking and the Silent switch (on iPhone, the Ring/Silent switch) silence your audio" ([AVAudioSession ambient](https://developer.apple.com/documentation/avfaudio/avaudiosession/category-swift.struct/ambient)).
  - The Action button toggles the same Silent mode by default on the iPhone 15 Pro, 16e and 17e ([Apple](https://support.apple.com/en-us/105103)).
  - In source, `MediaSessionManagerCocoa::updateSessionState()` picks `MediaPlayback` for an audible media element and `AmbientSound` for Web Audio. A `navigator.audioSession` override wins ([MediaSessionManagerCocoa.mm](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/audio/cocoa/MediaSessionManagerCocoa.mm)) **(analysis)**.
  - The field report in [Howler #1767](https://github.com/goldfire/howler.js/issues/1767) matches: no sound on iOS 26 with Silent mode on, fixed by `navigator.audioSession.type = "playback"`.
  - [WebKit bug 262781](https://bugs.webkit.org/show_bug.cgi?id=262781) (NEW): Web Audio from a decoded buffer goes silent in Silent mode, while an `<audio>` routed through a `MediaElementAudioSourceNode` keeps playing. A WebKit reviewer called it "actually by design".
- **`navigator.audioSession` (Audio Session API).**
  - W3C WD 13 Nov 2024 ([TR](https://www.w3.org/TR/audio-session/), [ED](https://w3c.github.io/audio-session/)).
  - Types: `auto` (default), `playback`, `transient`, `transient-solo`, `ambient`, `play-and-record`. An AudioContext's "default type is ambient".
  - Support: `navigator.audioSession` and `type` in Safari 16.4 (iOS mirrors). The 16.4 notes say "Support for a subset of the AudioSession Web API". Firefox has it in Nightly only. Chrome does not support it ([BCD AudioSession.json](https://github.com/mdn/browser-compat-data/blob/main/api/AudioSession.json)).
  - `state`/`statechange` are unsupported in Safari: they sit behind `DOMAudioSessionFullEnabled`, which defaults to `false` ([DOMAudioSession.idl](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/audiosession/DOMAudioSession.idl)).
  - WebKit maps `playback` to `AVAudioSessionCategoryPlayback` with no mix-with-others option ([AudioSessionIOS.mm](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/audio/ios/AudioSessionIOS.mm)).
  - Apple's Playback category: "your app audio continues with the Silent switch set to silent or when the screen locks… activating your session will interrupt any other audio sessions which are also nonmixable" ([AVAudioSession playback](https://developer.apple.com/documentation/avfaudio/avaudiosession/category-swift.struct/playback)).
  - **(analysis)** So `playback` makes the score audible in Silent mode, but it also stops the visitor's Music or podcast, and keeps audio going in the background (next bullet). `ambient` respects Silent mode and mixes with other apps.
- **`"interrupted"` state.**
  - Now in the spec: `enum AudioContextState { "suspended", "running", "closed", "interrupted" }`, "currently interrupted and cannot process audio until the interruption ends". `resume()` during an interruption is rejected with `InvalidStateError`. "If the AudioContext is suspended a statechange event is not fired for privacy reasons" ([Web Audio ED §2.7](https://webaudio.github.io/web-audio-api/); the TR shortname now resolves to the Web Audio 1.1 WD of 22 Sep 2026).
  - Support: Safari 9 (iOS mirrors), Chrome 136, Firefox no ([BCD BaseAudioContext.json](https://github.com/mdn/browser-compat-data/blob/main/api/BaseAudioContext.json), [chromestatus](https://chromestatus.com/feature/5172068166139904): "exclusive audio access (VoIP) or when a laptop lid is closed").
  - Phone calls: "System alerts, such as receiving an incoming phone call, interrupt the active audio session" ([Apple](https://developer.apple.com/documentation/avfaudio/handling-audio-interruptions)).
- **Backgrounding and the lock screen.**
  - iOS: WebKit interrupts Web Audio when the app enters the background and ends the interruption with `MayResumePlaying` on return, so the context resumes without a new gesture unless the page suspended it itself ([MediaSessionManagerIOS.mm](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/audio/ios/MediaSessionManagerIOS.mm)) **(analysis)**.
  - With `audioSession.type = "playback"`, the context keeps playing in the background ([WebKit bug 261554](https://bugs.webkit.org/show_bug.cgi?id=261554), fixed 2024-03).
  - Resume is not reliable: open [WebKit bug 263627](https://bugs.webkit.org/show_bug.cgi?id=263627), "[iOS] AudioContext is not consistently resumed when page is brought to foreground". Reporters see `state === "running"` while `currentTime` is frozen.
  - macOS WebKit and Chrome do not suspend Web Audio for hidden tabs by default **(analysis from source)**.
  - Android Chrome with the app backgrounded or the screen locked **(unverified)**.

### 2.4 What this means for the default and for remembering the choice (analysis, from the facts above)

- **A new visit always starts without activation.** Sticky activation does not survive a new page load, only bfcache. Chromium: "The user interaction requirement only applies to contiguous navigations" ([chromium.org](https://www.chromium.org/audio-video/autoplay/)).
- **A stored "sound on" cannot auto-resume on a return visit** in Safari (transient activation needed), in Firefox (sticky needed, default policy), or in Chrome Android. Chrome desktop is the exception once the origin has a high MEI.
- **What a stored "on" *can* do** is arm the page:
  - show the toggle as on;
  - start the context on the visitor's first click, tap or key anywhere (a document-level `pointerup`/`keydown`/`touchend` listener, as Howler does);
  - on Chrome, resume later without a handler once sticky activation exists (`IsDocumentAllowedToPlay` checks sticky).
  - Scrolling alone will never start it.
- **WCAG angle.** A score that starts from a stored preference on the visitor's first unrelated click is arguably "not started … as a direct result of a user's intentional activation" (§5.2). The 1.4.2 control requirement then applies, which the toggle satisfies.
- **The Edolus pattern** (the "Initiate" click is the gesture, then sound is on) and **the Hashgraph pattern** (a gate with "Enter with audio" / "Enter without audio") both make the first gesture an explicit sound choice. The Facade/State 1 rules say no gating preloader, so the choice would have to live in a non-blocking control rather than a gate (`map.md`, standing constraint 3).

---

## 3. Sources within the free/self-made rule

### 3.1 Code synthesis: what is realistic, and what it costs (measured)

**Building blocks, all native nodes in the Web Audio 1.1 ED (9 September 2026):** [`OscillatorNode`](https://webaudio.github.io/web-audio-api/#OscillatorNode) (sine, square, sawtooth, triangle, or a custom [`PeriodicWave`](https://webaudio.github.io/web-audio-api/#PeriodicWave) for additive timbres), [`BiquadFilterNode`](https://webaudio.github.io/web-audio-api/#BiquadFilterNode), [`ConvolverNode`](https://webaudio.github.io/web-audio-api/#ConvolverNode) (reverb from an impulse response, which can itself be generated noise), [`DelayNode`](https://webaudio.github.io/web-audio-api/#DelayNode), [`ConstantSourceNode`](https://webaudio.github.io/web-audio-api/#ConstantSourceNode), [`DynamicsCompressorNode`](https://webaudio.github.io/web-audio-api/#DynamicsCompressorNode), and [`AudioWorklet`](https://webaudio.github.io/web-audio-api/#AudioWorklet) for custom DSP. Connecting an oscillator through a gain into another node's `AudioParam` gives audio-rate modulation (LFOs, vibrato) with no JavaScript per frame.

| Target | Technique **(analysis unless cited)** | Precedent |
|---|---|---|
| **Atmospheric bed** | A detuned-oscillator pad through a low-pass whose cutoff an LFO sweeps slowly; a sub/bass layer; looped filtered noise for air; a generated-IR convolver for space. Layers map to "stems" whose gains follow the page, just as Edolus's files do. Chords and phrases can be scheduled on the audio clock (§1.5) or pre-rendered (§3.2) | Edolus's stems are pad, bass and melody layers with a filter sweep per phrase (`case-studies/edolus/README.md §8`, stem structure) |
| **Noise** | A few seconds of random samples in an `AudioBuffer`, looped. This replaces `ScriptProcessorNode`, which the spec keeps only as deprecated (§4.5) | Trionn generated brown noise in a `ScriptProcessor` (`case-studies/trionn/README.md §8`) |
| **UI SFX** | Short envelopes on oscillators and noise (clicks, blips, sweeps, impacts, a sub "boom" as a pitch-dropping sine plus filtered noise). ZzFX packs this into 20 parameters and a pure generator (`ZZFX.buildSamples`) that returns sample arrays | Edolus's map boom is a 20–300 Hz impact decaying over ~4 s (`case-studies/edolus/README.md §8`) |
| **Pentatonic instrument** | One voice per note: sine plus 2nd and 3rd harmonics, a slight vibrato, an exponential envelope, high- and low-pass, and a shared filtered feedback delay | Trionn's footer harp, fully specified in `case-studies/trionn/README.md §8` (G-major pentatonic G3–B4, 0.14 s delay, 100 ms per-string rate limit) |
| **Plucked strings (Karplus–Strong)** | A delay line with filtered feedback. Natively, "If DelayNode is part of a cycle, then the value of the delayTime attribute is clamped to a minimum of one render quantum" ([spec, DelayNode](https://webaudio.github.io/web-audio-api/#DelayNode)). At 128 frames and 48 kHz that is 2.67 ms, so a native feedback string cannot sound above ~375 Hz **(analysis)**. Higher notes need an `AudioWorklet` | — |

**CPU cost, measured.** `OfflineAudioContext` (48 kHz stereo) render time in headless browsers on this M5, with `performance.now()` around `startRendering()`. Script: `audio-research/bench/bench.js`. "Share of one core" is render time divided by audio duration. It is a proxy for real-time load, and offline rendering skips real-time overheads **(analysis)**. A mid-range phone core will be several times slower than an M5 core **(unverified: no phone measured)**.

| Graph | Chromium 147 | Chromium 153 (3 runs) | WebKit 26.6 |
|---|---|---|---|
| A. Three decoded 60 s stems, per-stem gain driven by `setTargetAtTime` once per 60 Hz frame (10,800 events) | 40 ms / 60 s = **0.07%** | 40 ms (0.07%) | 64 ms (0.11%) |
| A2. The same with two linear ramps per stem | 24 ms (0.04%) | 24–26 ms | 19 ms (0.03%) |
| B. Synth bed: 9 oscillators, 3 biquads, 1 LFO, looped noise, compressor, **3 s stereo convolver** | 605 ms / 60 s = **1.0%** | 1,428–1,472 ms = **2.4%** | 612 ms = 1.0% |
| B2. The same bed without the convolver | 120 ms = **0.2%** | 119–120 ms | 123 ms = 0.2% |
| C. Harp burst: 30 plucks/s for 10 s, 3 oscillators + biquad + envelope per pluck, shared feedback delay (900 oscillators started, ~270 sounding at once) | 1,246 ms / 10 s = **12.5%** | 1,195–1,215 ms = 12.2% | 944 ms = 9.4% |
| D. One 5 s stereo convolver alone | 242 ms / 30 s = 0.8% | 1,016–1,060 ms = **3.4%** | 249 ms = 0.8% |

**Per-node cost, second benchmark.** 20 s at 48 kHz stereo offline, best of 2, as a percentage of the real-time budget. Headless Google Chrome 153.0.8010.53 and Playwright WebKit 26.4. Script: `audio-research/agent-c/pw/bench.cjs`.

| Graph | Chrome 153 | WebKit 26.4 |
|---|---|---|
| 8 looping buffer sources + 8 gains (static / with gain ramps) | 0.07% / 0.07% | 0.04% / 0.08% |
| 32 sawtooth oscillators | 0.46% | 0.58% |
| 32 biquads, static | 0.83% | 0.79% |
| 32 biquads, **frequency ramps, a-rate** | **3.89%** | **3.45%** |
| 32 biquads, frequency ramps, k-rate | 1.25% | 1.42% |
| 1 convolver, 1 s / 4 s stereo impulse | 0.77% / 2.60% | 0.38% / 0.72% |
| 8 HRTF panners | 0.40% | 1.03% |
| 8 compressors | 0.83% | 0.56% |

- Chromium recomputes biquad coefficients for every sample while an a-rate filter parameter is automating, and once per block when it is constant ([biquad_filter_handler.cc](https://github.com/chromium/chromium/blob/b6cc280b7aee27dfd63b4c8327ee1e8a4b610c9b/third_party/blink/renderer/modules/webaudio/biquad_filter_handler.cc#L268-L345)). That explains the a-rate row.
- Paul Adenot's Web Audio performance notes rate nodes qualitatively ([padenot.github.io/web-audio-perf](https://padenot.github.io/web-audio-perf/), last updated 2020):
  - ConvolverNode: "Very expensive, and depending on the duration of the convolution impulse… multiple FFT are computed for each block".
  - BiquadFilterNode: "relatively cheap".
  - HRTF panning: "Very expensive".
  - A fixed-gain GainNode: "essentially free".
  - They suggest delay-line reverbs as a cheaper alternative (#cheaper-reverb) and pre-rendering with an OfflineAudioContext (#track-or-asset-freezing).
- Chrome DevTools' WebAudio panel shows "Render Capacity" ([DevTools WebAudio](https://developer.chrome.com/docs/devtools/webaudio)). web.dev's advice when it nears 100%: "Reduce the workload… by using fewer AudioNode instances… Increase the base latency" ([profiling Web Audio](https://web.dev/articles/profiling-web-audio-apps-in-chrome)).
- No primary source gives a node-count limit.

Readings:
- Per-frame automation on decoded stems is effectively free. Playback of decoded stems is the cheapest bed.
- A synthesised bed without reverb costs about as much as the stems. **The convolver dominates**, and its offline cost rose about 4× between Chromium 147 and 153 (repeatable). Real-time Chromium may process long convolutions differently **(unverified)**.
- Polyphony is the real cost of a code-made instrument. Trionn's sweep started 508 oscillators (`case-studies/trionn/README.md §8`). A voice cap, per-string rate limit and short releases bound it **(analysis)**.

### 3.2 Rendering code-made sound to files

- **In the browser engine, headless.** `OfflineAudioContext` renders a graph into an `AudioBuffer` faster than real time (spec text below). The benchmark above is exactly this path, run by Playwright in headless Chromium and WebKit. A build script could render the same graph code, write WAV, and encode with ffmpeg **(analysis)**.
- **Tone.Offline** "renders a chunk of Tone.js code into an AudioBuffer. An offline instance of Tone.Transport is passed into the callback" ([example: offline.html](https://github.com/tonejs/tone.js/blob/dev/examples/offline.html)).
- **In Node** without a browser (npm, 2026-09-27):
  - `node-web-audio-api` 2.2.0 (2026-08-09, IRCAM ircam-ismm, Rust-based, BSD-3-Clause) implements `OfflineAudioContext` with `startRendering`, `suspend` and `resume`. Its decoders (Symphonia via `web-audio-api-rs`) omit Opus.
  - `web-audio-api` 1.5.6 (2026-09-06, audiojs) is a "Pure JavaScript Web Audio API for Node" with `OfflineAudioContext`. Its "AudioWorklet runs synchronously".
  - Neither has been tested here.
- **Spec semantics.** An `OfflineAudioContext` "renders as quickly as possible, fulfilling the returned promise with the rendered result as an AudioBuffer" ([spec](https://webaudio.github.io/web-audio-api/#OfflineAudioContext)). BCD: Chrome 35, Firefox 25, Safari 14.1 unprefixed.
- **ZzFX** SFX are parameter arrays. `ZZFX.buildSamples(...params)` is a pure function (source) that could emit WAV at build time, or run in the browser after the gesture (it is 1 KB).
- **Seamless loops from a render (analysis).** Render the phrase plus its reverb tail, then fold the tail back over the head so the wrap is continuous. Edolus's stems show the result to aim for: "None of the stems fades at its start or end, so they are built to loop seamlessly" (`case-studies/edolus/README.md §8`).
- **Why pre-render at all (analysis).** Synthesis in the page costs CPU every frame (above) and code size, but no download. Pre-rendered stems cost bytes (§4.3) and decoded memory (§4.4), but nearly no CPU, and they make the bed's sound identical in every browser. A mix is possible: a pre-rendered bed with live-synthesised SFX and instrument.

### 3.3 Sound libraries: licences read at the source (2026-09-27)

Each licence text was read directly. Pixabay, Sonniss, BBC, Mixkit, Uppbeat, Zapsplat, Suno and Udio were read as rendered in headless Chromium, because curl got Cloudflare 403s or JavaScript-only pages. Raw captures are in `audio-research/agent-b/`. "Public repo" asks whether committing the unmodified files to this public GitHub repo is allowed, since several licences ban standalone redistribution. Readings of licence text are **(analysis)**, not legal advice.

| Source | Licence | Commercial web use | Raw files in a public repo | Credit | Source |
|---|---|---|---|---|---|
| **Freesound, CC0 items** | CC0 1.0, set per sound | Yes | Yes (no conditions) | No | [FAQ](https://freesound.org/help/faq/) |
| Freesound, CC BY items | CC BY 4.0 | Yes | Yes, with the notice kept **(analysis)** | Yes | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode.en) |
| Freesound, CC BY-NC and Sampling+ | Non-commercial | **No** (NC) | — | Yes | FAQ |
| **Kenney audio packs** | CC0 1.0 | Yes | Yes | No (logo reserved) | [kenney.nl/support](https://www.kenney.nl/support), `License.txt` in the Interface Sounds pack |
| **OpenGameArt** | Set per asset: CC0, CC-BY 3/4, CC-BY-SA 3/4, OGA-BY 3/4, GPL 2/3 | Yes ("Even in commercial projects") | CC0 yes; others on their terms | Everything except CC0 | [FAQ](https://opengameart.org/content/faq) |
| **Sonniss #GameAudioGDC** (all years) | Proprietary royalty-free EULA v2.0, effective 27 Aug 2026. **Not CC0** | Allowed in "projects" (games, films, videos, podcasts, apps, "interactive projects"); "website" is never named | **No**: may not "supply the sound effects as sound effects to any other person… whether… unmodified, modified or re-designed" | No | [gdc-bundle-license](https://sonniss.com/gdc-bundle-license/) |
| Pixabay (music, SFX) | Pixabay Content License. CC0 only for items published before 9 Jan 2019 | Yes, unless the item shows trademarks | **Likely no**: "You cannot sell or distribute the Content… on a Standalone basis", where Standalone means "in substantially the same form" **(analysis)** | No | [terms](https://pixabay.com/service/terms/) (updated 18 Nov 2024) |
| BBC Sound Effects (RemArc) | BBC RemArc licence | **No**: "For non-commercial, personal or research purposes… For formal education purposes"; commercial use goes through Pro Sound Effects | No ("Sharing our content") | Yes | [licensing](https://sound-effects.bbcrewind.co.uk/licensing) |
| Zapsplat (free) | Standard License (8 May 2026) | Yes ("Blogs, websites") | No ("Redistribute our sounds in any form") | **Required** for free users | [licence](https://www.zapsplat.com/license-type/standard-license/) |
| Mixkit SFX / music | Mixkit free licences | Yes on the web | No ("on its own… or with source files") **(analysis)** | Not stated | [mixkit.co/license](https://mixkit.co/license/#sfxFree) |
| Uppbeat (free) | Basic License | **Likely no**: excludes a "Solo Professional… using the Content on behalf of your own business" **(analysis)** | No | Required | [licence](https://uppbeat.io/uppbeat-basic-license) |
| YouTube Audio Library | Studio-only licence | Framed as "in your videos". Website use not granted on the public page **(unverified)** | — | CC tracks | [help](https://support.google.com/youtube/answer/3376882) |
| Free Music Archive | CC per track, many NC/ND | Only CC0/BY/BY-SA tracks. NC excludes "promoting a product or service" | Per track | Per track | [License Guide](https://freemusicarchive.org/License_Guide) |
| FreePD | **Closed** ("2008-2025") | — | — | — | [freepd.com](https://freepd.com/) |
| Incompetech | CC BY 4.0 (or paid) | Yes, with credit that must be findable | Yes, with notice **(analysis)** | **Visible credit required** | [FAQ](https://incompetech.com/music/royalty-free/faq.html) |
| 99Sounds, Soundly Free | Proprietary royalty-free | Yes | **No** ("even for free"; "on a standalone basis") | No | [99sounds](https://99sounds.org/license/), [Soundly EULA](https://getsoundly.com/assets/Soundly-EULA.pdf) |

Notes:
- **CC0 1.0** waives rights "for any purpose whatsoever, including without limitation commercial, advertising or promotional purposes". But "No trademark or patent rights held by Affirmer are waived" (§4a), and the Affirmer "disclaims responsibility for clearing rights of other persons" (§4c) ([legal code](https://creativecommons.org/publicdomain/zero/1.0/legalcode.en)).
- **Freesound provenance is the uploader's word.** "the User warrants… that he/she has all necessary rights in the sound", and Freesound does "not actively review or moderate this content" ([ToS](https://freesound.org/help/tos_web/)).
  - The CC0 search filter is `f=license:"Creative Commons 0"`, for example `https://freesound.org/search/?q=click&f=license%3A%22Creative+Commons+0%22`.
  - The FAQ warns that raw Freesound sounds used inside songs registered with YouTube Content ID can trigger claims.
- **Pixabay music can carry Content ID claims**: "some contributors or their distributors may choose to register their tracks with Content ID… Tracks displaying a shield icon are registered" ([FAQ](https://pixabay.com/service/faq/)).
- **CC BY 4.0 credit on a website.** Conditions can be met "in any reasonable manner based on the medium… it may be reasonable to satisfy the conditions by providing a URI or hyperlink to a resource that includes the required information" (§3(a)(2)). A credits page is Freesound's own suggested form.
- **Kenney pack licence text:** "This content is free to use in personal, educational and commercial projects… (this is not mandatory)".
- **OpenGameArt's CC0 sound search:** `https://opengameart.org/art-search-advanced?keys=&field_art_type_tid[]=13&field_art_licenses_tid[]=4` (type 13 = Sound Effect, 12 = Music; licence 4 = CC0). "Preview audio clips may not fall under the same license".
- **Sonniss previously allowed redistribution.** The pre-28 Jan 2024 version said "Licensee may freely distribute the licensed sound effects". The licence is versioned by download date. It also bans AI training.

### 3.4 Tools for making licence-clean sound yourself

| Tool | Code licence / what its terms say about output | Output usable on the site, and in the repo? | Source |
|---|---|---|---|
| **ZzFX / ZzFXM** | MIT. Nothing is said about output; ZzFXM's song format has a `license` field (example `"CC0"`) | Yes, self-made **(analysis)** | [ZzFX](https://github.com/KilledByAPixel/ZzFX), [ZzFXM](https://github.com/keithclark/ZzFXM) |
| **jsfxr / sfxr.me** | Unlicense. The site says "Unrestricted commercial use" | Yes | [sfxr.me](https://sfxr.me/) |
| **ChipTone** | "All sounds created using ChipTone are FREE to use for any purpose, commercial or otherwise, under the CC0 licence" | Yes | [itch.io](https://sfbgames.itch.io/chiptone) |
| Bfxr / Bfxr2 | Apache-2.0 / MIT; no statement on output | Not stated | [bfxr2](https://github.com/increpare/bfxr2) |
| **BeepBox / JummBox** | MIT. "BeepBox does not claim ownership over songs created with it, so original songs belong to their authors" | Yes **(analysis)** | [beepbox.co](https://www.beepbox.co/) |
| Bosca Ceoil Blue | MIT; no statement on songs | Not stated | [repo](https://github.com/YuriSizov/boscaceoil-blue) |
| **Surge XT** (synth) | GPL-3. "If you make songs, samples, sounds… using Surge XT, you own it… regardless if you started a patch from scratch or used one of the factory presets" | Yes | [FAQ](https://surge-synthesizer.github.io/faq/) |
| **Helm** (synth) | GPL-3. "Any sound that comes out of Helm belongs to the person who played it" | Yes | [FAQ](https://tytel.org/helm/faq/) |
| **Vital** (free) | EULA (29 Feb 2024): usable "for commercial or non-commercial music and audio productions"; "You are not permitted to redistribute presets, samples, wavetables… created from any unaltered VITAL AUDIO content" | Renders: yes; unaltered factory content: no | [EULA](https://vital.audio/eula/) |
| LMMS | GPL-2.0; no official statement on rendered audio or bundled samples | **(unverified)** | [repo](https://github.com/LMMS/lmms) |
| **Sonic Pi** | Bundled samples "individually licensed under a CC0 1.0 Universal Public Domain Dedication… obtained from freesound.org" | Yes | `LICENSE.md` in [sonic-pi](https://github.com/sonic-pi-net/sonic-pi) |
| Strudel | AGPL-3.0 code. Default sample banks are mixed: VCSL is CC0, the Salamander piano is CC BY 3.0, mridangam is CC BY-SA 4.0. Dirt-Samples, tidal-drum-machines and EmuSP12 **state no licence** | Depends on the samples | [dough-samples](https://github.com/felixroos/dough-samples) |
| GarageBand Apple Loops | Royalty-free "to create your own original soundtracks", but they "may not be… distributed on a standalone basis, nor… repackaged… as audio samples, sound libraries, sound effects or music beds" | Own compositions yes; raw loops as UI SFX no **(analysis)** | [GarageBand SLA](https://www.apple.com/legal/sla/docs/GarageBand.pdf) |
| Suno (free/basic) | "you will only use such Outputs for your lawful, personal and non-commercial purposes" (terms effective 3 Sep 2026) | **No** | [terms](https://suno.com/terms) |
| Udio | The Company owns Output; use "solely for your personal and non-commercial purposes… may not download any copies" | **No** | [terms](https://www.udio.com/terms-of-service) |
| Stable Audio Open 1.0 | Stability AI Community License: "You own any outputs… to the extent permitted by applicable law"; commercial use needs registration and under US$1M revenue. Training set included 11,454 CC Sampling+ recordings, not only CC0/BY | Yes, with registration **(analysis)** | [licence](https://stability.ai/community-license-agreement) |

- **(analysis)** These fit the owner's rule with no conditions attached:
  - sound Janriz makes himself: code synthesis (§3.1); ZzFX, jsfxr or ChipTone SFX; BeepBox or a GPL synth (Surge XT, Helm) for music;
  - CC0 material: Kenney, Freesound CC0 items, Sonic Pi's bundled samples.
- **(analysis)** Every licence with a "no standalone redistribution" clause (Sonniss, Pixabay, Mixkit, Zapsplat, 99Sounds, Soundly) collides with committing raw files to a public repo, even where on-site playback would be allowed. That is the same constraint the map records for Fontshare fonts (`map.md`, Assets → Fonts).

---

## 4. Formats, sizes, loading

### 4.1 Codec and container support (2026)

MDN's "Web audio codec guide" is stale for Safari: it still says Opus plays "only when packaged in a CAF file". MDN's "Media container formats" page is current: "Safari 18.4+ (on macOS 15.4+, iOS 18.4+…) added support for Opus and Vorbis codecs in Ogg containers" ([MDN containers#ogg](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Containers#ogg)). Where sources disagree, the table follows Apple's release notes.

| Codec / container | Chrome, Edge | Firefox | Safari macOS | Safari iOS |
|---|---|---|---|---|
| **Opus / WebM** | 33 | 15 | 15 ("Added support for the Opus audio codec in WebM containers"; caniuse says 17.4) | **17.4** ("Added support for VP8/VP9 and WebM on iOS and iPadOS") |
| **Opus / Ogg** | yes (first version unknown) | 15 | **18.4**, macOS 15.4+ | **18.4** |
| Opus / MP4 | yes | yes | 17 (Sonoma), stereo only. Safari 27.0: "Fixed an issue where MP4 files containing Opus audio tracks could not be decoded with decodeAudioData" | unknown |
| Opus / CAF | no (measured `EncodingError`) | unknown | 11 | 11 |
| Vorbis / Ogg | 4 | 3.5 | **18.4** ("Added support for Ogg Opus and Ogg Vorbis on macOS Sequoia 15.4, iOS 18.4…", [WebKit 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/)) | **18.4** |
| AAC / MP4 (M4A) | 12 | OS decoder | 4 | 4 |
| **MP3** | 4 | 22 | 3.1 | 4 |
| FLAC | 56 | 51 | 11 partial, 13 full | 11 |

- **`decodeAudioData` support can differ from `<audio>` support.**
  - [WebKit bug 226922](https://bugs.webkit.org/show_bug.cgi?id=226922): Safari 15 shipped WebM Opus for `<audio>` while `decodeAudioData` "still fails to decode WebM Opus". It was fixed in r279103 (2021-06). The same bug notes: "there is no API to feature detect which audio formats are supported by Web Audio specifically".
  - iPadOS 15.4 had the reverse problem ([bug 238546](https://bugs.webkit.org/show_bug.cgi?id=238546), NEW).
- **Measured `decodeAudioData` acceptance:**
  - Chrome 153 decodes Opus in WebM, Ogg and MP4, plus Vorbis/Ogg, AAC/M4A, MP3 and FLAC. It rejects Opus/CAF.
  - WebKit 26.4 decodes all of those, including Opus/CAF.
  - Source: `audio-research/agent-c/pw/probe.cjs`.
- **(analysis)** Opus/WebM is decodable by every engine on this list except Safari before 15 (macOS) and 17.4 (iOS). An MP3 fallback covers that gap (Howler's README: "default to `webm` and fallback to `mp3`"). Ogg is now universal only from Safari 18.4.

### 4.2 Gapless decode (measured)

Neither the spec nor the engines guarantee that encoder delay and padding are trimmed. Spec issue [#1091](https://github.com/WebAudio/web-audio-api/issues/1091) was closed in 2019 with "Should be handled by web codec". Opus stores a pre-skip that "SHOULD be skipped (decoded but discarded)" ([RFC 7845 §4.2](https://www.rfc-editor.org/rfc/rfc7845#section-4.2)). AAC has a default encoder delay of 2112 frames ([Mozilla bug 1321249](https://bugzilla.mozilla.org/show_bug.cgi?id=1321249#c0)). MP3 relies on the LAME/Xing header ([Chrome: MSE for audio](https://developer.chrome.com/blog/media-source-extensions-for-audio)). [WebKit bug 223519](https://bugs.webkit.org/show_bug.cgi?id=223519), "decodeAudioData chops off beginning portion of audio file" (MP3), is still NEW.

**Two independent measurements.**

*A. 60 s stereo 48 kHz source (2,880,000 frames).* Δ = decoded frames − 2,880,000; "start" = sample offset against the source. Script: `audio-research/agent-c/pw/probe.cjs`.

| File | ffmpeg decode | Chrome 153 | WebKit 26.4 | Chromium 147 |
|---|---|---|---|---|
| Opus / WebM (libopus) | Δ0 | Δ0, start 0 | Δ0, start 0 | Δ0, start 0 |
| Opus / Ogg | Δ0 | Δ0 | Δ0 | **Δ−312, start −312** |
| Opus / MP4 (ffmpeg) | Δ+648 | Δ+336, start −312 | Δ0 | Δ+336, start −312 |
| Opus / CAF (afconvert) | Δ0, start +321 (the file itself) | EncodingError | Δ0, start +321 | EncodingError |
| Vorbis / Ogg (ffmpeg native encoder) | Δ0 | Δ0 | Δ0, **start −128** | Δ+512 |
| AAC / M4A (ffmpeg `aac`) | Δ0 | Δ0 | **Δ+512** | Δ0 |
| AAC / M4A (afconvert) | Δ0 | Δ0 | Δ0 | Δ+448 |
| AAC / M4A (ffmpeg `aac_at`) | Δ+512 (the file) | Δ+512 | Δ+1472 | Δ+511 |
| MP3 CBR 128/192, VBR V4 (libmp3lame) | Δ0 | Δ0 | Δ0 | Δ0 |
| FLAC, WAV | Δ0 | Δ0 | Δ0 | Δ0 |

*B. 10 s marker file (a 440 Hz onset at exactly 100 ms).* Test file: 10.000 s stereo at 48 kHz (480,000 samples), silent for 100 ms, then a 440 Hz sine that runs to the last sample. `ffmpeg -f lavfi -i "sine=f=440:d=9.9:r=48000" -af "adelay=100|100,aformat=channel_layouts=stereo,atrim=end_sample=480000"`, then encoded with ffmpeg 9.0.1: `libopus -b:a 96k` to `.webm` and `.ogg`, `libmp3lame -b:a 160k`, `aac_at -b:a 128k` (Apple AudioToolbox) and `aac -b:a 128k` (ffmpeg's own). Each file was decoded in an `OfflineAudioContext` at 48 kHz. The table reports decoded length minus 480,000, and onset shift against the WAV (the WAV's own onset reads at sample 4,811 because of the 0.05 threshold). Script: `audio-research/bench/gapless.js`.

| File | Chromium 147 | Chromium 153 | WebKit 26.6 |
|---|---|---|---|
| Opus in WebM | length ±0, onset ±0 | ±0, ±0 | ±0, ±0 |
| Opus in Ogg | **−312 samples, onset −301** (content shifted early and shortened) | ±0, ±0 | ±0, ±0 |
| MP3 (LAME, with its gapless header) | ±0, onset +1 | ±0, +1 | ±0, +1 |
| AAC in M4A, Apple encoder (`aac_at`) | **+255 samples** at the end | **+256** | **+1,216** |
| AAC in M4A, ffmpeg encoder (`aac`) | ±0 | ±0 | **+256** |

Readings from both:
- **Only Opus/WebM, MP3 with a LAME/Info header, FLAC and WAV came back sample-exact in every engine tested.** A looped buffer from these has no gap from encoding.
- AAC kept trailing padding in most engine/encoder pairs: 5 ms to 30 ms of near-silence at the end. That is heard as a gap on every loop wrap unless `loopEnd` trims it **(analysis)**. Firefox 115 added edit-list trimming for AAC, and Mozilla's engineer notes this "matters for looping precisely with AudioBufferSourceNode" ([bug 1703812](https://bugzilla.mozilla.org/show_bug.cgi?id=1703812)).
- Ogg Opus was exact except in Chromium 147, which is the Chromium that Playwright 1.59 (the repo's version) ships. **Results for the same file changed between Chromium 147 and 153**, so loop exactness has to be checked per release, not assumed.
- `canPlayType` in WebKit 26.6 returned "probably" for WebM Opus, Ogg Opus, Ogg Vorbis and M4A AAC, "maybe" for `audio/mpeg`, and "" for `audio/mp4; codecs="opus"`.

### 4.3 File sizes (measured)

60 s stereo 48 kHz sources, encoded with ffmpeg 9.0.1 and macOS `afconvert`. The full commands are in `audio-research/agent-c/enc/run.sh`.
- "pad" = pink noise plus an A-major chord with tremolo and echo, a tonal bed.
- "dense" = FM/AM sines plus white noise.

| Encode (target) | pad | dense |
|---|---|---|
| **Opus 48k .webm** | 337 KB (44.8 kbit/s) | 406 KB (54.2) |
| **Opus 64k .webm** | 362 KB (48.2) | 521 KB (69.5) |
| Opus 96k .webm | 502 KB (66.9) | 748 KB (99.7) |
| Opus 64k .ogg | 348 KB | 504 KB |
| Vorbis q2 / q4 .ogg (ffmpeg native encoder; libvorbis not in this build) | 630 / 1,093 KB | 541 / 946 KB |
| AAC 96k / 128k .m4a | 735 / 975 KB | 734 / 974 KB |
| **MP3 128k CBR** | 962 KB | 961 KB |
| MP3 VBR V4 | 630 KB | 886 KB |
| FLAC | 3.3 MB | 5.1 MB |
| WAV 16-bit (reference) | 11.5 MB | 11.5 MB |

- Opus is VBR by default and ran under target on the tonal bed. AAC and MP3 CBR track their targets.
- Bitrate arithmetic for 60 s: 48k → 360 KB, 64k → 480 KB, 96k → 720 KB, 128k → 960 KB.
- Real reference: Edolus's three 61.2 s Vorbis stems are 615, 618 and 890 KB (2.12 MB total), and its 12 SFX are 9–103 KB each (`ls -l case-studies/edolus/audio`).
- **(analysis)** Three 60 s stems at Opus 48–64k cost about 1–1.5 MB. The same three as a 30.6 s phrase (Edolus repeats one phrase twice per file) cost half. MP3 fallbacks at 128k cost about 2.9 MB.

### 4.4 Memory: decoded PCM

- Decoded audio is resampled "to the sample-rate of the BaseAudioContext if it is different", and an AudioBuffer holds "32-bit floating-point linear PCM" ([spec, decodeAudioData](https://webaudio.github.io/web-audio-api/#dom-baseaudiocontext-decodeaudiodata), [AudioBuffer](https://webaudio.github.io/web-audio-api/#AudioBuffer)). The input ArrayBuffer is detached. MDN: decoding "only works on complete file data, not fragments".
- **Stereo per minute: 23,040,000 B ≈ 22.0 MiB at 48 kHz, 21,168,000 B ≈ 20.2 MiB at 44.1 kHz.** Mono is half. So memory follows the *context's* rate, not the file's.
- Measured: every 60.06 s stereo decode above returned 23,063,040 bytes of Float32, whatever the codec (`audio-research/bench/bench.js`).
- Examples **(analysis)**:
  - Edolus's three 61.2 s stems ≈ 65 MB decoded.
  - Six 60 s stereo stems at 48 kHz ≈ 132 MiB.
  - Three 30.6 s mono stems ≈ 17 MB.
- `decodeAudioData` time on the M5 for a 60 s stereo stem:
  - Chromium 147: 46–66 ms.
  - Chromium 153: 33–55 ms.
  - WebKit 26.6: 52 ms (MP3), 84 ms (Opus), 222 ms (AAC).

### 4.5 Streaming (media element) vs decoded buffers

| | `<audio>` + `MediaElementAudioSourceNode` | `AudioBufferSourceNode` |
|---|---|---|
| Memory | Streams | Full Float32 PCM (§4.4) |
| Start | Plays once enough is buffered | After the full fetch and decode |
| Gapless loop | Not required by HTML ("If the media element has a loop attribute specified, then seek to the earliest possible position", [HTML](https://html.spec.whatwg.org/multipage/media.html#reaches-the-end)). [WebKit bug 230553](https://bugs.webkit.org/show_bug.cgi?id=230553) (NEW): "MediaElementAudioSources with loop: true do not loop seamlessly" ("I definitely hear a pause between the loops now"). Firefox fixed seamless looping in 59 | Specified: "The playback of a looped buffer should behave identically to an unlooped buffer containing consecutive occurrences of the looped audio content"; "Loop endpoints have subsample accuracy" ([spec, looping](https://webaudio.github.io/web-audio-api/#looping-AudioBufferSourceNode)) |
| Multi-stem sync | Not guaranteed. Jer Noble (WebKit): "There's no requirement that two `<audio>` elements remain in sync… If you want sample accurate playback, you really need a BufferSource" ([bug 301824#c6](https://bugs.webkit.org/show_bug.cgi?id=301824#c6)). `MediaController`/`mediagroup` left HTML in 2016 | The same `when` on one context clock. The spec lists "Sample-accurate scheduled sound playback" |
| Rate / pitch | `playbackRate`, with `preservesPitch` true by default | `computedPlaybackRate(t) = playbackRate(t) * pow(2, detune(t) / 1200)`, which changes pitch (§6.5) |
| Cross-origin | Outputs silence unless served with CORS ([spec](https://webaudio.github.io/web-audio-api/#MediaElementAudioSourceOptions-security)) | `fetch()` follows normal CORS |
| iOS | Open WebKit bugs on `MediaElementAudioSourceNode`: volume cannot be changed (151589, 244667 reopened; a 2026-09-15 comment on 276813 says it "still reproduces… in Safari 27"), `currentTime` drift (204228), stuck after backgrounding (287624), HLS silence (180696, 306493) | See §2.3 Silent mode |
| Re-use | — | "The start() method may not be issued multiple times". Sources are one-shot and "very inexpensive to create", and the buffer is reused ([spec](https://webaudio.github.io/web-audio-api/#dom-audiobuffersourcenode-start), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode)) |

- **The spec's own guidance leans toward streaming for music:** buffers are "Typically… fairly short (usually somewhat less than a minute). For longer sounds, such as music soundtracks, streaming should be used with the audio element and MediaElementAudioSourceNode" ([spec, AudioBuffer](https://webaudio.github.io/web-audio-api/#AudioBuffer)). **(analysis)** That guidance conflicts with gapless, synced stems: streaming gives low memory but no sync and no guaranteed gapless loop.
- Old iOS Safari limits on HTML audio (for context, from Apple's archived guide): "The `volume` property is not settable in JavaScript. Reading the `volume` property always returns 1" ([Apple, archived](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html)). Whether that still holds on iOS 26 **(unverified)**. It would break Howler's `html5: true` fades on iOS (they step `element.volume`, §1.3).
- **`ScriptProcessorNode` is deprecated:** "This node type is deprecated, to be replaced by the AudioWorkletNode" ([spec](https://webaudio.github.io/web-audio-api/#ScriptProcessorNode)). It is still supported everywhere. AudioWorklet: Chrome 66, Firefox 76, Safari 14.1 (BCD).

### 4.6 Loading after first paint, preloading on intent, caching

- **`requestIdleCallback`**: Chrome 47, Firefox 55. **Safari has not shipped it**; it is preview-only, behind a pref. WebKit `main` (2026-09-26) has `RequestIdleCallbackEnabled … defaultValue: false` ([UnifiedWebPreferences.yaml](https://raw.githubusercontent.com/WebKit/WebKit/main/Source/WTF/Scripts/Preferences/UnifiedWebPreferences.yaml)). It is absent from the Safari 26.x and 27.0 release notes. iOS therefore needs a `load` + `setTimeout` fallback, as the 3D research already found (`research/3d-routes.md` §4.3).
- **`<link rel=preload as="audio">` is not valid.** "A preload destination is "fetch", "font", "image", "script", "style", or "track"" ([HTML](https://html.spec.whatwg.org/multipage/links.html#preload-destination)). Chromium treats `audio` as "valid but unsupported" and warns in the console. The usable form is `as="fetch"`, which MDN says "requires the crossorigin attribute" ([MDN preload](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload#cors-enabled_fetches)). **(analysis)** Without it, the preload's mode does not match the later `fetch()`, and the file downloads twice.
- `fetchpriority` / `fetch(url, { priority })`: Chrome 101, Firefox 132, Safari 17.2 (BCD).
- **Preload on intent (analysis, from §2 and §4.4).**
  - Start fetching on `pointerenter`/`focus` of the sound toggle, or on idle after load.
  - `decodeAudioData` needs no running context (spec steps check only that the Document is fully active), and "An AudioBuffer may be used by one or more AudioContexts, and can be shared between an OfflineAudioContext and an AudioContext" ([spec, AudioBuffer](https://webaudio.github.io/web-audio-api/#AudioBuffer)). So SFX can be decoded before the gesture, for example in an `OfflineAudioContext`, and played the moment the real context resumes.
  - That removes Trionn's silent first blast and Hashgraph's 1.6 s late morph (`case-studies/trionn/README.md §8`, `case-studies/hashgraph-ventures/README.md §8`).
  - The context itself must still be created or resumed synchronously inside the gesture handler (§2.1).
- **Caching.**
  - MDN: `max-age=31536000, immutable` for cache-busted assets ([MDN Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control#immutable)). web.dev adds that `immutable` "will be ignored in some browsers" ([web.dev](https://web.dev/articles/http-cache#versioned-urls)).
  - **Next.js 16.2.4 serves `public/` with `Cache-Control: public, max-age=0`**: "Next.js cannot safely cache assets in the `public` folder because they may change" (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/public-folder.md`). `/_next/static` gets `public, max-age=31536000, immutable`, which "cannot be overridden". Other paths can be given headers with `async headers()` (`…/05-config/01-next-config-js/headers.md`).
  - **Vercel**: the default is `cache-control: public, max-age=0, must-revalidate`, and "Static files are automatically cached on Vercel's global network for the lifetime of the deployment" ([Vercel cache-control](https://vercel.com/docs/caching/cache-control-headers#default-cache-control-value), [CDN cache](https://vercel.com/docs/caching/cdn-cache#static-files-caching)).
  - A `Range: bytes=0-99` request to this project's deployed `/llms.txt` returned 206 with `accept-ranges: bytes` (measured 2026-09-27).
  - **(analysis)** Audio in `public/` is revalidated on every visit unless it gets content-hashed file names and a `headers()` rule. Whether Next/Turbopack emits hashed URLs for imported audio files is undocumented **(unverified)**.
  - `send` (used by `next start`) maps `.opus` to `application/octet-stream`. Whether Vercel serves `.opus`/`.webm` audio with the right MIME type **(unverified)**.

---

## 5. Preferences and accessibility

### 5.1 No standard audio preference

- **No sound or audio preference exists in Media Queries 5** (WD 29 Jun 2026, [drafts.csswg.org/mediaqueries-5](https://drafts.csswg.org/mediaqueries-5/)). `prefers-reduced-motion` covers "non-essential motion" only. No `prefers-reduced-sound`/`-audio` proposal turned up in `w3c/csswg-drafts`.
- **Reduced motion therefore does not imply reduced sound (analysis).** Whether the reduced-motion tier also mutes or thins audio is a design decision, not a platform signal.
- **`prefers-reduced-data`** (`no-preference | reduce`) is specified, with an inline fingerprinting issue ([#10076](https://github.com/w3c/csswg-drafts/issues/10076)). It ships only in Chrome 85+ behind `#enable-experimental-web-platform-features`; Firefox and Safari do not have it ([BCD media.json](https://github.com/mdn/browser-compat-data/blob/main/css/at-rules/media.json)).
- **`Save-Data`** (request header) is Chrome 49+ only. **`navigator.connection.saveData`** is Chrome 65+ only. Firefox and Safari have neither, and Safari has no `navigator.connection` at all ([BCD Save-Data.json](https://github.com/mdn/browser-compat-data/blob/main/http/headers/Save-Data.json), [NetworkInformation.json](https://github.com/mdn/browser-compat-data/blob/main/api/NetworkInformation.json)).
  - So a data-saver skip reaches Chromium users only. On iOS it would need a heuristic or the visitor's own choice **(analysis)**.

### 5.2 WCAG

- **1.4.2 Audio Control (A):** "If any audio on a web page plays automatically for more than 3 seconds, either a mechanism is available to pause or stop the audio, or a mechanism is available to control audio volume independently from the overall system volume level."
  - The Understanding doc: "'plays automatically' broadly refers to audio that is not started/played as a direct result of a user's intentional activation. For example, selecting a link or button with clear labelling or context that it will start an experience where audio will play is an example of starting in response to a user's intended action."
  - Also: "Muting the system volume is not 'pausing or stopping' the autoplay audio."
  - Sufficient techniques include G170 (a control near the start of the page) and G171 ("Playing sounds only on user request").
  - The rationale is screen-reader interference ([Understanding 1.4.2](https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html)).
- **2.2.2 Pause, Stop, Hide** does not cover audio: "This success criterion is specifically concerned with moving, blinking, scrolling, and auto-updating visual content. For audio content that starts automatically, refer to 1.4.2 Audio Control" ([Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)).
- **Toggle semantics (ARIA APG).**
  - A toggle button uses `aria-pressed`, and "it is critical the label on a toggle does not change when its state changes". If the label flips "Mute"/"Unmute", `aria-pressed` is not used ([APG button](https://www.w3.org/WAI/ARIA/apg/patterns/button/)).
  - The Switch pattern (`role="switch"`, `aria-checked`) is the alternative ([APG switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/)).
  - Trionn's toggle uses `aria-pressed` with a changing label ("Enable sound" / "Mute sound"), which is the combination the APG warns against (`case-studies/trionn/README.md §8`) **(analysis)**.

### 5.3 Hidden tabs, other media, screen readers

- **Page Visibility.**
  - `visibilitychange` is supported in Chrome 62, Firefox 56 and Safari 14.1. Older Safari fired no event on navigating away, so also listen for `pagehide` ([BCD Document.json](https://github.com/mdn/browser-compat-data/blob/main/api/Document.json)).
  - MDN shows "Pausing audio on page hide", and notes "Tabs which are playing audio are considered foreground and aren't throttled" ([MDN Page Visibility](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)).
  - Chrome keeps timers less throttled if "The page has made noises in the past 30 seconds" ([timer throttling](https://developer.chrome.com/blog/timer-throttling-in-chrome-88)), and pages "Playing audio" while hidden "won't be discarded unless under extreme resource constraints" ([Page Lifecycle](https://developer.chrome.com/docs/web-platform/page-lifecycle-api)).
  - **(analysis)** A score left running in a hidden tab keeps the tab "foreground" in Chrome, costing battery. Hashgraph and Trionn both mute on hidden and restore on return (`case-studies/*/README.md §8`). Because rAF, and with it `gsap.ticker`, stops in hidden tabs, a hide-fade must be a native `AudioParam` ramp or a `suspend()`, not a GSAP tween.
- **bfcache.** An open `AudioContext` does not block bfcache in Chromium (no WebAudio entry in the scheduler's tracked features; the destination pauses on freeze) or Firefox **(analysis from source)**. The [web.dev bfcache article](https://web.dev/articles/bfcache) does not mention audio.
- **Other media playing.**
  - Media Session support: Chrome 73, Chrome Android 57, Firefox 82, Safari 15 ([BCD MediaSession.json](https://github.com/mdn/browser-compat-data/blob/main/api/MediaSession.json)).
  - Chromium registers an audible AudioContext as an **ambient** player: "can be mixed with other types of audio, having no effect on other holders of audio focus", "completely ignored for Android audio focus", "we never force-pause ambient players" ([media_content_type.h](https://github.com/chromium/chromium/blob/main/media/base/media_content_type.h), [media_session_impl.cc](https://github.com/chromium/chromium/blob/main/content/browser/media/session/media_session_impl.cc)).
  - **(analysis)** So Chrome will neither pause the score when another tab or app plays, nor pause them.
  - On iOS the default Ambient category mixes. `playback` interrupts other nonmixable audio (§2.3).
  - No spec exposes whether another tab or app is playing. A page only sees its own context go `"interrupted"` (Chrome 136+, Safari).
- **Screen readers are not detectable by design.** W3C TAG Design Principles: "Make sure that your API doesn't provide a way for authors to detect that a user is using assistive technology" ([Design Principles §2.11](https://www.w3.org/TR/design-principles/), 14 Sep 2026). `forced-colors`, `prefers-contrast` and `prefers-reduced-transparency` reflect display preferences, not assistive-technology use **(analysis)**. Automatic ducking under a screen reader is therefore not possible. The only lever is the visitor's own toggle, plus keeping sound off until they ask.

---

## 6. Driving the score from page state

Spec quotes are from the Web Audio 1.1 Editor's Draft of 9 September 2026 ([ED](https://webaudio.github.io/web-audio-api/)). They read the same in the 1.0 Recommendation (17 June 2021) unless marked "1.1 only". [w3.org/TR/webaudio](https://www.w3.org/TR/webaudio/) now serves the 1.1 Working Draft of 22 September 2026.

### 6.1 AudioParam automation: what the spec says

- **Setting `.value`** "has the effect of assigning the requested value to the [[current value]] slot, and calling the setValueAtTime() method with the current AudioContext's currentTime and [[current value]]" ([#dom-audioparam-value](https://webaudio.github.io/web-audio-api/#dom-audioparam-value)).
  - So every `.value` write adds a step event. Chromium, WebKit and Gecko implement it exactly so ([audio_param.cc](https://github.com/chromium/chromium/blob/fe9ea66dac77774d3142fe26d5ef244dfb1decc1/third_party/blink/renderer/modules/webaudio/audio_param.cc#L116-L128), [AudioParam.cpp](https://github.com/WebKit/WebKit/blob/a6cba35ff79643c658df2a37937d0450525b5aa7/Source/WebCore/Modules/webaudio/AudioParam.cpp#L101-L115), [AudioParam.h](https://github.com/mozilla-firefox/firefox/blob/9eb1a31a98493915dc324021054e5817cbef2444/dom/media/webaudio/AudioParam.h#L70-L72)).
  - Older Firefox differed: "Before Firefox 134, setting `value` was ignored when done at the same time as scheduled automation events" ([BCD AudioParam.json](https://github.com/mdn/browser-compat-data/blob/main/api/AudioParam.json)).
  - Setting `.value` while a ramp is pending inserts a step at `currentTime`. The pending ramp then runs from that new value to its original end **(analysis from the ordering rules)**.
- **No implicit smoothing.** "While no automatic smoothing is done when directly setting the value attribute of an AudioParam, for certain parameters, smooth transition are preferable… Using the setTargetAtTime() method with a low timeConstant allows authors to perform a smooth transition" ([#audioparam-transitions](https://webaudio.github.io/web-audio-api/#audioparam-transitions)).
  - Chrome removed its old smoothing in Chrome 66. Before, "an exponential smoother was applied with a time constant of about 10 ms". Now "the value is changed immediately when set". The recommended replacement is `setTargetAtTime()` ([Chrome 66 deprecations](https://developer.chrome.com/blog/chrome-66-deprecations), "WebAudio: dezippering removed").
- **Ramps start from the previous event's time, not from "now".**
  - `linearRampToValueAtTime`: v(t) = V0 + (V1 − V0)(t − T0)/(T1 − T0), "where T0 is the time of the previous event." Only with no preceding event does it behave "as if setValueAtTime(value, currentTime) were called" ([#dom-audioparam-linearramptovalueattime](https://webaudio.github.io/web-audio-api/#dom-audioparam-linearramptovalueattime)).
  - Engines keep at least one past event ("Always leave at least one event in the event list!" in Chromium and WebKit), so a late ramp usually starts from an old event.
  - Measured (offline, identical in Chrome 153, Chromium 147 and WebKit 26.4): after `setValueAtTime(0,0); linearRampToValueAtTime(1,1)`, a `linearRampToValueAtTime(0,4)` issued at t = 3 **jumped from 1 to 0.333** at t = 3. Adding `setValueAtTime(gain.value, currentTime)` first removed the jump (`audio-research/agent-c/pw/probe.cjs`, test A).
- **`exponentialRampToValueAtTime`**: "A RangeError exception MUST be thrown if this value is equal to 0… an exponential ramp to 0 is not possible. A good approximation can be achieved using setTargetAtTime()." "Parameters representing filter frequencies and playback rate are best changed exponentially because of the way humans perceive sound" ([#dom-audioparam-exponentialramptovalueattime](https://webaudio.github.io/web-audio-api/#dom-audioparam-exponentialramptovalueattime)).
- **`setTargetAtTime(target, T0, τ)`**: v(t) = V1 + (V0 − V1)·e^(−(t − T0)/τ), with V0 the value at T0. τ is the time to reach "1 − 1/e (around 63.2%)" ([#dom-audioparam-settargetattime](https://webaudio.github.io/web-audio-api/#dom-audioparam-settargetattime)). MDN: 86.5% after 2τ, 95.0% after 3τ, 99.3% after 5τ; "you could set timeConstant to one third of the desired duration" ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime)). It starts from the curve's value at T0, so it is continuous whenever it is called.
- **`cancelScheduledValues(t)`**: the method text says cancellation "may cause discontinuities because the original value (from before such automation) is restored immediately". The computation-of-value section says the value "will remain unchanged and stay at its previous value" ([#dom-audioparam-cancelscheduledvalues](https://webaudio.github.io/web-audio-api/#dom-audioparam-cancelscheduledvalues)).
  - **Measured, the engines diverge:** a 0→1 ramp over 2 s cancelled at t = 1 held 0.5 in Chrome 153 and Chromium 147, but **dropped to 0 in WebKit 26.4** (`probe.cjs`, test C).
- **`cancelAndHoldAtTime(t)`** holds the value the curve would have had at t ([#dom-audioparam-cancelandholdattime](https://webaudio.github.io/web-audio-api/#dom-audioparam-cancelandholdattime)).
  - Support: Chrome 57, Safari 14.1. **Firefox does not support it**; [Mozilla bug 1308431](https://bugzilla.mozilla.org/show_bug.cgi?id=1308431) is still NEW (BCD).
  - Tone.js emulates it on its own event timeline (§1.3).
- **Firefox ramp bug.** BCD marks Firefox `linearRampToValueAtTime` and `exponentialRampToValueAtTime` as partial: "Sometimes jumps to value immediately" ([bug 2011524](https://bugzilla.mozilla.org/show_bug.cgi?id=2011524), NEW, filed 2026-01-20; the case is a ramp to 0, a wait, then a ramp to 1).
- **a-rate vs k-rate.** "a-rate parameters MUST be sampled for each sample-frame of the block", while k-rate values hold for the whole 128-frame block ([#AudioParam](https://webaudio.github.io/web-audio-api/#AudioParam)).
  - `AudioBufferSourceNode.playbackRate` and `detune` "MUST be 'k-rate'".
  - `automationRate` is supported in Chrome 68 and Safari 14; **Firefox does not support it** (BCD).
  - The render quantum is 128 frames by default. `renderSizeHint` is 1.1 only and shipped in Chrome 153 ([Chrome 153 notes](https://developer.chrome.com/release-notes/153)).
- **Event-list growth.** The spec does not say when past events are removed. Chromium ("Prune old events to prevent memory leaks…"), WebKit ("Drop outdated events that we skipped") and Gecko (`CleanupEventsOlderThan`) all prune them ([audio_param_handler.cc](https://github.com/chromium/chromium/blob/5ca9cfcf1488fc816e86e4cbcd741b1aaf9c5993/third_party/blink/renderer/modules/webaudio/audio_param_handler.cc#L863-L885), [AudioParamTimeline.cpp](https://github.com/WebKit/WebKit/blob/c5b0051e172e0ea5bab5188bddc403bbd03a09b0/Source/WebCore/Modules/webaudio/AudioParamTimeline.cpp#L331-L339), [AudioEventTimeline.cpp](https://github.com/mozilla-firefox/firefox/blob/5bd2bdf968454ec2081bf23488eec90eb699f27b/dom/media/webaudio/AudioEventTimeline.cpp#L277-L300)).
  - One `setTargetAtTime` per frame on three stems for 60 s (10,800 events) rendered in 40–64 ms (§3.1, row A). Events scheduled into the future still accumulate until they pass **(analysis)**.

### 6.2 Measured: per-frame control strategies

A gain moved from 0 to 1 over 0.5 s in 30 per-frame updates (60 Hz), applied to a `ConstantSourceNode` (DC = 1) so the rendered output *is* the gain curve. Rendered offline at 48 kHz in Chromium 153 and WebKit 26.6, which gave identical results. Script: `audio-research/bench/zipper.js`. A `.value` write each frame is modelled as `setValueAtTime(v, frameTime)`, which is what the spec says the setter does (§6.1).

| Strategy (one call per frame) | Largest sample-to-sample jump | Value at 250 / 500 / 750 ms (target 0.5 / 1 / 1) |
|---|---|---|
| `.value = v` (step per frame) | **0.0333**, a hard step every 16.7 ms | 0.5 / 1 / 1 |
| `setTargetAtTime(v, t, 0.05)` | 0.00005 | 0.383 / 0.882 / 0.999 (lags by ≈ τ) |
| `setTargetAtTime(v, t, 0.015)` | 0.00007 | 0.450 / 0.950 / 1 |
| `linearRampToValueAtTime(v, nextFrameTime)` | 0.00004 | 0.5 / 1 / 1 |
| One `linearRampToValueAtTime(1, 0.5)` | 0.00004 | 0.5 / 1 / 1 |

- Stepping `.value` per frame makes jumps about 700× larger than any smoothed method. On a loud bed those steps are audible as zipper noise, and at 120 Hz there are twice as many, smaller steps **(analysis)**.
- `setTargetAtTime` gives smooth, frame-rate-independent chasing of a moving target at the cost of a lag of about one time constant. Edolus's exponential ease with `stemFadeDur` 1.2 s behaves the same way (`case-studies/edolus/README.md §8`) **(analysis)**.
- A per-frame linear ramp needs the next frame's time, which real time does not know in advance. This offline model is exact only because frame times were known **(analysis)**.
- **A second, independent run agrees.** 31 ticks at 16 ms, identical in Chrome 153, Chromium 147 and WebKit 26.4 to within 3e-9 (`audio-research/agent-c/pw/probe.cjs`, test B):
  - `gain.value = v`: largest step 3.23e-2, 31 steps above 1e-3.
  - `setTargetAtTime(v, currentTime, 0.015)`: 6.8e-5.
  - `linearRampToValueAtTime(v, currentTime + 0.016)`: 4.2e-5.

  If a tick arrives late, a per-tick linear ramp starts from the previous ramp's end time, which is already past, so it partly jumps (§6.1). `setTargetAtTime` stays continuous whenever it is called **(analysis from the spec)**. Real rAF jitter was not modelled in either run.

### 6.3 Where GSAP fits (facts, then analysis)

- **Facts.**
  - GSAP "can animate any property of any object" ([Tween](https://gsap.com/docs/v3/GSAP/Tween)), and `gsap.quickTo()` exists for repeated retargeting.
  - The ticker "updates the globalTimeline on every requestAnimationFrame event". In hidden tabs "the ticker's updates get throttled down significantly… because the browser itself throttles down requestAnimationFrame" ([gsap.ticker](https://gsap.com/docs/v3/GSAP/gsap.ticker)). `lagSmoothing` defaults to (500, 33).
  - `gsap.updateRoot(time)` can drive GSAP from another clock after `gsap.ticker.remove(gsap.updateRoot)` ([updateRoot](https://gsap.com/docs/v3/GSAP/gsap.updateRoot())).
  - ScrollTrigger's `onUpdate` gets `progress`, `direction` and `getVelocity()` in px/s (§1.5).
- **Three ways to wire it (analysis).**
  1. **GSAP tweens `param.value` directly.** One `setValueAtTime` step per tick (§6.2, row 1). It freezes in a hidden tab while audio keeps rendering. It frame-rate-couples the sound: US Avionix's per-frame ramps run "twice as fast" at 120 Hz (`case-studies/usavionix/README.md §8`). This is what Hashgraph does with Howler's master volume.
  2. **GSAP computes targets; the audio thread smooths.** A ScrollTrigger `onUpdate` or `gsap.ticker` callback maps progress to a per-stem target (a mix table like Edolus's), then calls `param.setTargetAtTime(target, ctx.currentTime, τ)` only when the target changes. It is smooth, independent of frame rate, and holds its last level when rAF stops. A GSAP tween of a plain `mix` object whose `onUpdate` does the same is equivalent.
  3. **Discrete transitions are scheduled natively.** The toggle's fade, a hide-fade, and chat-state layers use `setValueAtTime(current, now)` followed by `linearRampToValueAtTime`, or `setTargetAtTime` alone, on the audio clock. These complete even when the tab is hidden. Edolus's 1 s toggle fade is this shape.
- **Either way, one GSAP clock for visuals stays intact.** Audio has its own clock regardless (§1.5). The choice is only whether GSAP writes values (1) or intentions (2, 3).

### 6.4 Pitch and filter following input

- **`AudioBufferSourceNode`**: `computedPlaybackRate(t) = playbackRate(t) * pow(2, detune(t) / 1200)`. Both parameters are k-rate by requirement. "Loop endpoints … independent of the node's playbackRate" ([#computedplaybackrate](https://webaudio.github.io/web-audio-api/#computedplaybackrate)). Changing the rate changes pitch and tempo together. There is no pitch preservation on buffer sources **(analysis)**.
  - Edolus's quantum loop and US Avionix's engine both do this: pitch 1.00–1.61 following scroll speed, and 0.85–1.25 following throttle (`case-studies/edolus/README.md §8`, `case-studies/usavionix/README.md §8`).
  - `detune` support: Chrome 44, Firefox 40, Safari 14.1 (BCD).
- **`BiquadFilterNode.frequency`, `Q`, `gain` and `detune` are a-rate** (frequency defaults to 350 Hz, range 0 to Nyquist) ([#dom-biquadfilternode-frequency](https://webaudio.github.io/web-audio-api/#dom-biquadfilternode-frequency)). Automating them costs more than static values (§3.1: 32 biquads with a-rate ramps 3.5–3.9%, k-rate 1.3–1.4%). The spec advises exponential changes for frequency and playback rate (§6.1).
- **`OscillatorNode.frequency`** (a-rate, default 440) and `detune` suit synthesised layers that follow input.
- **Media elements** keep pitch when `playbackRate` changes: `preservesPitch` "must be in effect" by default ([HTML](https://html.spec.whatwg.org/multipage/media.html#dom-media-preservespitch)). BCD: Chrome 86, Firefox 101, Safari 17.2.

### 6.5 Clocks and latency

- **`currentTime`** is "the time in seconds of the sample frame immediately following the last sample-frame in the block of audio most recently processed". It "may not be synchronized with other clocks in the system" ([#dom-baseaudiocontext-currenttime](https://webaudio.github.io/web-audio-api/#dom-baseaudiocontext-currenttime)). It advances per render quantum, about 2.7 ms at 48 kHz. Firefox with `privacy.resistFingerprinting` rounds it to ≥ 16.667 ms ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/currentTime)).
- **`getOutputTimestamp()`** returns `{contextTime, performanceTime}` in `performance.now()` units, for mapping audio time to frame time (Chrome 57, Firefox 70, Safari 14.1).
- **`baseLatency`** is supported in Chrome 58, Firefox 70 and Safari 14.1. **`outputLatency`** in Chrome 102, Firefox 70 and **Safari 18.4**. The spec: "It is useful to query this value frequently when accurate synchronization is required" ([#dom-audiocontext-outputlatency](https://webaudio.github.io/web-audio-api/#dom-audiocontext-outputlatency)).
- **`latencyHint`**:
  - `"interactive"` (the default) is the lowest latency "without glitching".
  - `"balanced"` sits between.
  - `"playback"` means "Prioritize sustained playback… Lowest power consumption".
  - A number of seconds is interpreted "at the browser's discretion".
  - BCD: Chrome 58, Safari 14.1; Firefox is listed as unsupported ([#enumdef-audiocontextlatencycategory](https://webaudio.github.io/web-audio-api/#enumdef-audiocontextlatencycategory)).
  - **(analysis)** A score plus UI SFX pulls both ways: hover and click SFX want `interactive`, and battery wants `playback`. Tone's wiki suggests `"playback"` for sustained playback (§1.3).
- **Library-added latency.** Tone schedules 100 ms ahead by default (`lookAhead` 0.1). Howler and raw Web Audio start at the next render quantum (§1.3).
- **Real output latency on phones** was not measured here **(unverified)**.

### 6.6 Reacting to chat state (repo facts)

- The AI SDK exposes `chat.status` as `'submitted' | 'streaming' | 'ready' | 'error'` (`node_modules/ai/dist/index.d.ts` line 3680, ai 6.0.168). That is "sent, waiting" (thinking), "tokens arriving" (answering), idle and failure.
- Tool effects travel on a typed bus, `lib/tool-effects/event-bus.ts`, with events `scrollTo` and `highlightProject` today. An audio module can subscribe to the same bus (`on(event, fn)`) the way `components/effects/` does **(analysis)**.
- **(analysis)** Status changes are discrete, so each maps to one scheduled transition on the audio clock (for example a thinking layer ramped in over 0.5 s on `submitted`, crossfaded to an answering layer on `streaming`). Streaming text can drive granular ticks like Edolus's text-data SFX family (`case-studies/edolus/README.md §8`), rate-limited as Trionn rate-limits its strings.

---

## What this means for the choice (trade-offs, not a verdict)

**Library.**

| | Raw Web Audio (+ ZzFX's generator, optional) | Howler | Tone.js |
|---|---|---|---|
| Bytes (gzip) | 0 (ZzFX +1.1 KB) | 10.2 KB | 69 KB minimum, 91 KB full |
| Stem sync, gapless loops | Yes, native | Loops yes; sync only by calling `play()` together; no shared start time | Yes |
| Filters, effects, synthesis | Native nodes, hand-wired | None; drop to `Howler.ctx` for anything beyond volume, rate and pan, so two layers | Built in |
| Unlock, formats, sprites | Hand-written (a few lines, §2) | Built in (auto-unlock, `webm`/`mp3` fallback, named sprites) | `Tone.start()`; no sprites |
| Automation | Native, with Firefox gaps (no `cancelAndHoldAtTime`, ramp bug) | Instant `volume()` steps; `fade()` = native ramp + JS interval | Own timeline; emulates cancel-and-hold |
| Gotchas | Everything is yours to build | Dormant since 2023; `autoSuspend` after 30 s; recreates the context if not 44.1 kHz | Creates the AudioContext at import; +100 ms `lookAhead`; its own worker clock; stable line from 2025-04, active `next` line |

**Source of the bed.**
- *Pre-rendered stems* cost about 0.35–0.5 MB per 60 s stem at Opus 48–64k, plus ≈ 22 MiB decoded per stereo minute, and almost no CPU. They sound identical in every browser.
- *Live synthesis* costs no download and some code, 0.2% of an M5 core without reverb and 1–2.4% with a convolver. It can react continuously, but cost varies by engine and version (§3.1).
- *Hybrid*: rendered bed, live SFX and instrument.

**Formats.**
- Opus/WebM is small and decoded sample-exact everywhere tested. It needs a fallback only for iOS Safari before 17.4 (MP3 with a LAME header is also exact).
- AAC keeps loop padding in most engines.
- Ogg works in Safari only from 18.4.

**Mobile tier levers.** Mono stems, a 30 s phrase instead of 60 s, fewer stems, no convolver, a voice cap on the instrument, or a synthesised bed instead of decoded stems.

**Default and persistence.**
- No browser lets a stored "on" resume sound on a new visit without a new gesture (Chrome desktop with high MEI aside).
- The choices:
  - require the toggle on every visit; or
  - arm on the first click, tap or key anywhere. Scrolling never counts.
- The first option is squarely "user-started" under WCAG 1.4.2. The second relies on the always-visible toggle as the 1.4.2 mechanism.

**iOS Silent mode.**
- Default Web Audio (`ambient`) is muted by the Silent switch, mixes with the visitor's music, and stops in the background.
- `navigator.audioSession.type = "playback"` makes the score audible in Silent mode, but it interrupts Music or podcasts and keeps playing in the background.
- It is Safari-only; Chrome has no equivalent.

**Driving from page state.** GSAP computes targets (scroll progress, velocity, chat status) and the audio thread smooths them (`setTargetAtTime`). Discrete transitions are scheduled as native ramps. Writing `.value` from GSAP every frame produces measurable steps and freezes in hidden tabs.

## Open questions for the decision

1. Raw Web Audio, Howler or Tone.js? If raw, is ZzFX's generator in or out?
2. Bed: pre-rendered stems (who composes, in which tool: BeepBox, Surge XT, code rendered offline?), live synthesis, or hybrid?
3. Returning visitors with "on" stored: arm on the first gesture anywhere, or wait for the toggle?
4. First visit: toggle only, or a non-gating sound invite (Edolus's "Experience with headphones", Hashgraph's "Enter with audio") that respects the no-gate rule?
5. iOS: set `audioSession.type = "playback"` (heard in Silent mode, stops the visitor's music) or leave the default (respects Silent mode)?
6. With no audio preference standard: does the reduced-motion tier change sound (for example no scroll-pitch or hover SFX), and does the mobile tier start with less (mono, fewer stems, synthesised bed) or with sound off?
7. Hidden tab: suspend, duck, or keep playing? (Chrome keeps a playing tab "foreground" and less throttled.)
8. Is CC BY acceptable with a credits page, or is it CC0 and self-made only? (Kenney, Freesound CC0, Sonic Pi samples and self-made tools all fit a CC0-only rule.)
9. Audio byte budget, and when to fetch: on toggle hover/focus, on idle after load, or only once sound is on?
10. Hosting: content-hashed names under `public/audio/` plus a `headers()` rule for long caching, since `public/` defaults to `max-age=0`?

## Unverified or flagged

- **Nothing was measured in real Safari (macOS or iOS), Firefox, Android Chrome, or on a phone.** Engine results come from headless Playwright Chromium 147/153, Google Chrome 153 and Playwright WebKit 26.4/26.6 on an M5 Mac. CPU shares are offline-render proxies.
- The iOS 26 Silent-mode behaviour and the `playback` fix rest on a WebKit engineer's bug comment (237322), WebKit source and a Howler field report, not on a WebKit release note. When iOS Safari gained `navigator.audioSession`: 16.4 per BCD and the release note ("a subset"), 17 per that bug comment.
- Android Chrome: whether an AudioContext is suspended when the app is backgrounded or the screen locks, and whether it resumes without a gesture. Also whether switching tabs *inside* iOS Safari interrupts a context.
- How Safari's per-site Auto-Play options map to WebKit's policy enum, whether iOS has a per-site Auto-Play setting, and whether Safari's macOS inference engine ever unlocks Web Audio.
- Whether Web Audio playback raises Chrome's MEI.
- MDN's Firefox autoplay pref text (`media.autoplay.block-webaudio`, default 0) disagrees with current Firefox source (`blocking_policy`, default 1).
- The Firefox and WebKit bfcache findings with a running AudioContext are source reading only.
- No primary source says the silent-buffer unlock trick is obsolete; that conclusion is analysis.
- Why Chromium 147 trimmed Ogg Opus by 312 frames and 153 did not, and why AAC padding differs per engine and file.
- Which reading of `cancelScheduledValues` the spec intends; Chrome and WebKit disagree (measured).
- Firefox behaviour for per-frame `setTargetAtTime`, and Firefox's `latencyHint` support (BCD says none).
- Real-time Chromium convolver cost vs its offline cost (a 4× jump between Chromium 147 and 153 offline).
- Whether iOS still makes `HTMLMediaElement.volume` read-only (Apple's archived guide says so).
- Whether Next/Turbopack emits hashed URLs for imported audio, and whether Vercel serves `.opus`/`.webm` audio with correct MIME types and Range responses from edge cache.
- Licences: the YouTube Audio Library text (Studio-only), LMMS rendered-audio and sample licences, Bfxr/ZzFX/Bosca output statements, Strudel's Dirt-Samples/tidal-drum-machines/EmuSP12 licences, whether the Apple SLA PDFs are the current in-app versions, and Zapsplat's "CC0" contributor items. "Raw file in a public repo = standalone distribution" (Pixabay, Mixkit, Sonniss) and "website = project" (Sonniss) are readings, not rulings.
- `speechSynthesis` not being routable through Web Audio is analysis, not checked against a spec.
- Tone.js issue #1077 (Next import failure) is still open. The Node 24 import test with 15.1.22 passed, but a real `next build` with Tone or Howler was not run.
