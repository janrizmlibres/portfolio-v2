# Voice in and out: research findings

Ticket: [18 — Voice in and out](../issues/18-voice-in-and-out.md) · researched 2026-09-27 · facts, not a verdict (the verdict is [20 — Voice verdict](../issues/20-voice-verdict.md)).

**Method.**
- Every claim is cited to the source that owns it:
  - specs (W3C/WHATWG, the Web Speech API CG report, WCAG 2.2, WAI-ARIA 1.2);
  - MDN and its browser-compat-data (BCD);
  - engine source on `main` of the Chromium, WebKit and Firefox GitHub mirrors, read 2026-09-27;
  - vendor pricing and API docs;
  - model cards and licence files;
  - npm registry data.
- **Every price was read on 2026-09-27** at the linked page. Prices change; re-read before any build.
- Library API facts came through Context7 first, then the installed package source in `node_modules` (read-only).
- Anything I worked out myself is marked **(analysis)**. Anything not confirmed at a primary source is marked **(unverified)** and collected at the end.
- Three research sub-runs did the vendor reading (TTS/STT, speech-to-speech, non-verbal voice) and the model benchmarks. Their scripts and raw page captures live in the session scratchpad under `voice-research/`, never in the repo.
- **No paid API was called and no repo key was used.** All browser runs were headless.

**Measurement setup.**
- Apple M5 (10 cores, 32 GB), macOS 26, Node 24.15.0.
- Headless browsers:
  - Google Chrome 153.0.8010.53 (Playwright channel `chrome`);
  - Chromium 147.0.7727.15 (Playwright 1.59.1, the repo's version);
  - WebKit 26.6 (Playwright 1.63.0) and WebKit 26.4 (Playwright 1.59.1).
- Playwright's WebKit is a WebKit build, not Safari; its results are indicative for Safari, not proof. No real iPhone, Android or Firefox was available.

**Standard sizes used for every cost figure (assumptions).**

| Unit | Characters | Words | Text tokens | Audio |
|---|---|---|---|---|
| Short reply (1 sentence) | ≈ 100 | ≈ 18 | ≈ 25 | ≈ 7 s |
| Long reply (4 sentences, the system prompt's maximum) | ≈ 400 | ≈ 70 | ≈ 100 | ≈ 28 s (≈ 150 words/min) |
| Spoken visitor question | — | — | — | ≈ 5 s (3–10 s) |
| Month | 1,000 voiced replies and 1,000 spoken questions | | | |

- One minute of speech is ≈ 857 characters.
- 1,000 long replies are ≈ 400,000 characters, or ≈ 467 min of audio.
- 1,000 questions are ≈ 83 min of audio.

**Version snapshot (2026-09-27).**

| Thing | Version / date | Source |
|---|---|---|
| This repo | Next 16.2.4, `ai` 6.0.168 (published 2026-04-16), `@ai-sdk/openai` 3.0.53, `@ai-sdk/react` ^3.0.170; no voice code yet | `package.json`, `node_modules` |
| `ai` on npm | `latest` 7.0.118 (7.0.0 published 2026-06-25); `ai-v6` 6.0.293 | `npm view ai dist-tags time` |
| Web Speech API | Draft Community Group Report, 18 September 2026; repo HEAD `ada61c6` (2026-09-18) | [spec](https://webaudio.github.io/web-speech-api/) |
| MDN BCD | commit `6089fa7` (2026-09-25) | [browser-compat-data](https://github.com/mdn/browser-compat-data) |

---

## 0. What the repo and the map already fix

- **Reply length.** "Keep replies brief — chat-style, 1–4 sentences" (`lib/ai/system-prompt.ts`). The agent speaks in first person as Janriz and must never mention two confidential companies. Both rules sit in the system prompt text itself.
- **Prompt size.** A sub-run bundled the real modules and measured:

  | Part | Characters |
  |---|---|
  | `SYSTEM_PROMPT` | 5,827 |
  | `PAGE_CONTEXT_BLOCK` | 4,717 |
  | Visitor-view line | 356 |
  | Total | 10,902 ≈ 2,726 tokens (chars/4) |

  The three tool schemas add ≈ 350 tokens **(estimate)**, so every model call starts with ≈ 3,076 tokens.
- **The chat route** (`app/api/chat/route.ts`):
  - a per-IP rate limit of 20 requests per hour, Upstash sliding window, failing open;
  - a monthly cost cap, `MONTHLY_COST_CAP_USD`, default $10;
  - `streamText` with `gpt-4o`, three tools and `stopWhen: stepCountIs(4)`;
  - LangSmith tracing;
  - `toUIMessageStreamResponse()`.
  - `search_wiki` runs on the server. `scroll_to` and `highlight_project` are no-ops on the server; the client runs their GSAP effects.
- **The cost cap prices only GPT-4o text tokens**, at `{ input: 2.5, output: 15 }` per 1M ("April 2026 reference") (`lib/limits/cost-cap.ts`).
  - OpenAI's list price for `gpt-4o` is **$2.50 input / $1.25 cached / $10.00 output**. $15 output is the price of the old `gpt-4o-2024-05-13` snapshot ([OpenAI pricing](https://developers.openai.com/api/docs/pricing), read 2026-09-27).
  - So the cap over-counts GPT-4o output by 50% **(analysis)**.
  - Any voice spend (characters, audio seconds, audio tokens) is invisible to it today.
- **What text chat already costs (analysis).** One factual reply is two model steps: a tool call, then the answer with ≈ 1,800 tokens of retrieved chunks. That costs ≈ $0.017 at list price with caching, and is recorded as ≈ $0.021. So **$10 covers about 480 replies a month as recorded, or about 600 at list price, before any voice**. The ticket's 1,000-voiced-replies scenario already exceeds the default cap on text alone.
- **Page facts that matter for voice.**
  - `<html lang="en">` (`app/layout.tsx`).
  - The message list is `aria-live="polite"` and its pending states are `role="status"` (`components/chat/MessageList.tsx`).
  - `next.config.ts` sets no headers, so there is no COOP/COEP cross-origin isolation.
  - **A reply appears all at once when it finishes.** `app/page.tsx` appends the assistant message only in `useChat`'s `onFinish`. Until then the list shows three animated dots (`TypingBubble`, `aria-label="Assistant is thinking"`). The streamed text exists inside `useChat` but is not rendered. Anything that speaks "while the reply streams" needs a progressive or paced reveal first (§2.3, §3.3).
- **Janriz's reactions** (`case-studies/trionn/README.md §8`, answer 6): "The spoken robot voice feels more like a gimmick. A voice for the agent is worth experimenting with. So are non-verbal sounds the agent makes, if it takes a creature persona (a cute robot, a cyber animal and so on; the persona is open)."
- **From *Audio stack*** ([audio-stack.md](audio-stack.md)):
  - Only a click, tap or key unlocks audio.
  - Raw Web Audio costs 0 KB, Howler 10.2 KB gzip, Tone.js 69–91 KB gzip, ZzFX 1.1 KB.
  - GSAP computes targets and `setTargetAtTime` smooths them.
  - On iOS the Silent switch mutes Web Audio unless `navigator.audioSession.type = "playback"`.
  - Chrome treats Web Audio as "ambient".
- **Map constraints that bind any voice.**
  - Assets are free by default, and a paid item needs its own case and Janriz's approval.
  - The chat backend (retrieval, rate limits, cost cap, database) is out of scope, so a voice route redraws that line.
  - The entrypoint "must work fully without" voice (*Pick the AI entrypoint*).
  - Every moment needs reduced-motion and mobile tiers.
  - Audio loads lazily after first paint.

---

## 1. Voice in (speech-to-text)

### 1.1 The browser's `SpeechRecognition`

Browser support is from BCD at commit `6089fa7`: [SpeechRecognition.json](https://github.com/mdn/browser-compat-data/blob/main/api/SpeechRecognition.json).

| Browser | `SpeechRecognition` | Where the audio goes by default | On-device option | Source |
|---|---|---|---|---|
| **Chrome desktop** | Unprefixed since 139; `webkitSpeechRecognition` since 33 | **Google's servers.** The cloud engine streams to `https://www.google.com/speech-api/full-duplex/v1` using Chrome's own Google API key | Since 139: `processLocally = true` plus static `available()` and `install()` for language packs | BCD; [network_speech_recognition_engine_impl.cc](https://github.com/chromium/chromium/blob/main/content/browser/speech/network_speech_recognition_engine_impl.cc); [chromestatus 6090916291674112](https://chromestatus.com/feature/6090916291674112); [New in Chrome 139](https://developer.chrome.com/blog/new-in-chrome-139) (2025-08-05) |
| **Chrome Android** | Yes (mirrors Chrome) | Android's `SpeechRecognizer` with a Google-provided recognition service (the Google app or Speech Services by Google). With no such service on the device, recognition is unavailable | `processLocally`, `available()`, `install()`: **not supported on Android.** `continuous` "can be set, but has no effect" | BCD; [SpeechRecognitionImpl.java](https://github.com/chromium/chromium/blob/main/content/public/android/java/src/org/chromium/content/browser/SpeechRecognitionImpl.java) |
| **Edge** | Yes (mirrors Chrome) | "The Microsoft Edge implementation of the Web Speech API uses Azure Cognitive Services, so voice data leaves the machine." | A local model only in Edge **Canary/Dev 150.0.4076+**, behind a flag, in six languages (en-US, de-DE, it-IT, pt-PT, es-ES, ko-KR) | [Edge policy SpeechRecognitionEnabled](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/speechrecognitionenabled) (2026-05-20); [Edge SpeechRecognition docs](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/speech-recognition-api) (2026-06-01) |
| **Safari macOS / iOS** | `webkitSpeechRecognition` only, since 14.1 | Apple's Speech framework (`SFSpeechRecognizer`). WebKit sets `requiresOnDeviceRecognition = YES` whenever the recognizer supports on-device recognition for the language; otherwise the audio goes to Apple's servers | Automatic, per language. No `processLocally`, `available()` or `install()` | BCD; [WebSpeechRecognizerTask.mm](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/speech/cocoa/WebSpeechRecognizerTask.mm); Apple: [SFSpeechRecognizer](https://developer.apple.com/documentation/speech/sfspeechrecognizer), [supportsOnDeviceRecognition](https://developer.apple.com/documentation/speech/sfspeechrecognizer/supportsondevicerecognition) |
| **Firefox** | **No, in any release build.** BCD: "preview". `media.webspeech.recognition.enable` is on for **Nightly desktop only**, and `false` on Android | Nightly runs a local model (the prefs name a "Parakeet" engine in an "HWInference" utility process) | — | BCD; [StaticPrefList.yaml](https://github.com/mozilla-firefox/firefox/blob/main/modules/libpref/init/StaticPrefList.yaml) |
| **Other iOS browsers and in-app browsers** | WebKit underneath | As Safari, **but** WebKit denies the speech service when the host app lacks a speech-recognition usage-description string **(analysis from source; unverified on a device)** | — | [SpeechRecognitionPermissionManager.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/UIProcess/SpeechRecognitionPermissionManager.cpp) |

**What the spec and vendors say about the audio.**
- **Spec.** When `processLocally` is false, "the user agent can choose between local and remote processing". User agents "must only start speech input sessions with explicit, informed user consent" and "must give the user an obvious indication when audio is being recorded" in the browser's own chrome ([spec](https://webaudio.github.io/web-speech-api/)).
- **MDN.** "By default, using speech recognition on a web page involves a server-based recognition engine. Your audio is sent to a web service for recognition processing, so it won't work offline" ([MDN, Using the Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API)).
- **Chrome's own feature entry.** "most implementers of the API perform speech recognition using a cloud service" ([chromestatus](https://chromestatus.com/feature/6090916291674112)).
- **Apple on its server path.** "Individual devices may be limited in the number of recognitions that can be performed per day, and each app may be throttled globally" and "Plan for a one-minute limit on audio duration" ([SFSpeechRecognizer](https://developer.apple.com/documentation/speech/sfspeechrecognizer)). WebKit asks for up to one hour through a private setter (`maximumRecognitionDuration = 60 * 60`), so whether the one-minute limit binds in Safari is **unverified**.
- **Cost.** None of these cost the site anything: recognition runs on the browser vendor's service. The site does not choose the vendor or see its terms.

**Features.**
- `interimResults` (partial transcripts while the visitor talks): Chrome 33, Safari 14.1.
- `continuous`: Chrome 33; Safari 17 (partial 14.1–17); no effect on Chrome Android.
- `lang` takes a BCP 47 tag and defaults to the root element's `lang`, which is `en` on this site.
- `phrases`, for contextual biasing (e.g. "Janriz", "LogoLife", "Mercado"): Chrome 142 desktop only.
- `maxAlternatives`: Chrome and Safari.
- Sources: [BCD](https://github.com/mdn/browser-compat-data/blob/main/api/SpeechRecognition.json), [spec](https://webaudio.github.io/web-speech-api/).
- **Chrome's endpointing** (from [speech_recognizer_impl.cc](https://github.com/chromium/chromium/blob/main/content/browser/speech/speech_recognizer_impl.cc) and [.h](https://github.com/chromium/chromium/blob/main/content/browser/speech/speech_recognizer_impl.h)):
  - In single-shot mode the session ends "after 0.5 seconds of silence if time < 3 seconds" and "1 seconds of silence if time >= 3 seconds".
  - In continuous mode it ends after 15 s of silence.
  - `no-speech` fires after 8 s (`kNoSpeechTimeoutMs = 8000`).
  - Audio is resampled to 16 kHz.
  - With hold-to-talk, `stop()` on release ends the session and returns the final result, so endpointing matters only for a tap-to-talk mode **(analysis)**.
- **Safari needs three yeses:** microphone access for the Safari app, the system "Speech Recognition" permission for the app, and the per-site prompt. A hidden page is refused with "Page is not visible to user" ([SpeechRecognitionPermissionManager.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/UIProcess/SpeechRecognitionPermissionManager.cpp)).
- **Chromium builds without Google's API keys** have no working cloud engine, because the key is sent with every request **(analysis from source)**. That covers the Playwright Chromium build, and by the same code path Brave and other re-builds. The Playwright build gave no recognition events at all (table below).

**Measured** (headless, this Mac; script `voice-research/browser/probe2.js`):

| | Chrome 153 | Chromium 147 | WebKit 26.6 |
|---|---|---|---|
| `SpeechRecognition` / `webkitSpeechRecognition` | both | both | prefixed only |
| `available({langs:['en-US'], processLocally:true})` | `"downloadable"` | hung past 15 s | not exposed |
| `available({langs:['en-US']})` (cloud allowed) | `"available"` | — | — |
| `available({langs:['fil-PH'], processLocally:true})` | `"unavailable"` (cloud: `"available"`) | — | — |
| `start()` without a gesture | `error: not-allowed` after 137 ms | no events in 6 s (fake mic) | no events in 6 s |
| `permissions.query({name:'microphone'})` | `denied` (headless default) | `prompt` | `prompt` |

Headless runs cannot grant a real microphone, so recognition accuracy and latency were **not** measured.

### 1.2 Paid transcription APIs

Per-question and per-1,000 columns are **(analysis)** at 5 s per question and 1,000 questions = 83.3 min.

| Option | Price (source) | Per minute | Per 5 s question | Per 1,000 questions | Billing minimum | Free tier | Live streaming | Accepts Chrome `webm/opus` / Safari `mp4/AAC` |
|---|---|---|---|---|---|---|---|---|
| OpenAI `gpt-4o-mini-transcribe` | $0.003/min ([pricing](https://developers.openai.com/api/docs/pricing)) | $0.003 | $0.00025 | $0.25 | none stated | none | file `stream=true`; live via a Realtime transcription session | yes / yes |
| OpenAI `gpt-transcribe` (new) | $0.0045/min ([model](https://developers.openai.com/api/docs/models/gpt-transcribe)) | $0.0045 | $0.00038 | $0.38 | none stated | none | file stream + Realtime sessions | yes / yes |
| OpenAI `gpt-4o-transcribe`, `whisper-1` | $0.006/min | $0.006 | $0.0005 | $0.50 | none stated | none | 4o yes; `whisper-1` no | yes / yes |
| OpenAI `gpt-live-transcribe` | $0.017/min | $0.017 | $0.0014 | $1.42 | **(unverified)** | none | Realtime (WebRTC/WS, 24 kHz PCM) | n/a (PCM) |
| Deepgram Nova-3 | $0.0043/min pre-recorded; $0.0048 streaming (promo; regular $0.0077) ([pricing](https://deepgram.com/pricing)) | $0.0043 | $0.00036 | $0.36 (stream $0.40–0.64) | per second (vendor blog) | $200 one-time credit | WebSocket | yes / yes |
| AssemblyAI Universal-2 | $0.15/hr ([pricing](https://www.assemblyai.com/pricing)) | $0.0025 | $0.00021 | $0.21 | per second (pre-recorded) | $50 credit | $0.15/hr, **billed for the whole time the WebSocket is open**; an unterminated session bills 3 hours ([FAQ](https://www.assemblyai.com/docs/faq/how-does-universal-streaming-session-based-pricing-work)) | yes / yes |
| ElevenLabs Scribe v2 | $0.22/hr; Realtime $0.39/hr ("~150ms") ([API pricing](https://elevenlabs.io/pricing/api)) | $0.0037 | $0.00031 | $0.31 | none stated | ≈ 30 min on the free plan | yes | yes / yes |
| Groq `whisper-large-v3-turbo` | $0.04/hr ([docs](https://console.groq.com/docs/speech-to-text)) | $0.00067 | $0.00011 | $0.11 | **10 s per request** | yes, limits **(unverified)** | no | yes / yes |

- **Scale against the cap.** Every paid transcription option costs **$0.11–1.42 per 1,000 questions**, which is 1–14% of the $10 cap **(analysis)**.
- **OpenAI uploads** ([STT guide](https://developers.openai.com/api/docs/guides/speech-to-text)):
  - "Files can be up to 25 MB. Supported input formats are `mp3`, `mp4`, `mpeg`, `mpga`, `m4a`, `wav`, and `webm`." Ogg is not listed.
  - `stream=true` works on the `gpt-*transcribe` models; "whisper-1 doesn't".
  - Prompts are accepted, and `whisper-1` prompts are capped at 224 tokens. A prompt can carry the proper nouns ("Janriz", "LogoLife", "Athena").
- **Retirements.** OpenAI's changelog lists `whisper-1`, `gpt-4o-transcribe` and `gpt-4o-mini-transcribe` for shutdown on **2027-02-26** ([changelog](https://developers.openai.com/api/docs/changelog)), so a build today would target `gpt-transcribe`.
- **Latency.** No vendor states time-to-text for a 5 s file. A round trip is the upload plus the model time **(unmeasured; it needs a paid call)**.

### 1.3 Speech-to-text inside the browser (free, open-source)

Measured by a sub-run in headless Chromium 147 with cross-origin isolation on the M5, transcribing an 11 s clip. Times include fetching and decoding the clip.

| Model | Licence | Download | Load | Transcribe 11 s |
|---|---|---|---|---|
| `whisper-tiny.en` q8 (transformers.js, WASM) | Apache-2.0 weights ([openai/whisper-base](https://huggingface.co/openai/whisper-base)), Apache-2.0 runtime | 40.8 MB | 4.3 s | 1.4–1.6 s |
| `whisper-base` q8 (WASM) | same | 76.9 MB | 6.0 s | 1.8–1.9 s |
| `moonshine-tiny` q8 (WASM) | MIT for English ([LICENSE](https://github.com/moonshine-ai/moonshine/blob/main/LICENSE)); legacy non-English models are non-commercial | 28.1 MB | 4.5 s | 1.1 s, punctuated and cased |
| `whisper-base` fp32 (WebGPU) | same as Whisper | ≈ 291 MB | 10.4 s | 1.4–1.8 s |
| Vosk small en-us (`vosk-browser`) | Apache-2.0 | 40 MB | not measured | not measured |

- **Runtimes.**
  - `@huggingface/transformers` 4.3.0 is Apache-2.0, published 2026-09-16.
  - `@moonshine-ai/moonshine-js` is archived in favour of `@moonshine-ai/moonshine-wasm` 0.1.5 (MIT, 2026-08-24).
  - `vosk-browser` 0.0.8 was last published in 2022.
- **Accuracy.** All four models produced the correct sentence on the test clip. Phone speed was **not** measured.
- **Download size.** Each model is 28–77 MB. That is 1–2 orders of magnitude more than the whole audio budget in *Audio stack*, so it could only load on intent, after first paint **(analysis)**.

### 1.4 Hold-to-talk mechanics

- **APIs.**
  - `getUserMedia` needs a secure context. Support: Chrome 53, Firefox 36, Safari 11, with iOS mirroring Safari ([BCD MediaDevices.json](https://github.com/mdn/browser-compat-data/blob/main/api/MediaDevices.json)).
  - `navigator.permissions.query({name: "microphone"})`: Chrome 64, Firefox 132, Safari 16 ([BCD Permissions.json](https://github.com/mdn/browser-compat-data/blob/main/api/Permissions.json)).
  - `SpeechRecognition.start()` asks for the microphone itself. A paid or in-browser model instead needs `getUserMedia` plus `MediaRecorder` (or raw PCM from Web Audio).
- **The permission prompt.**
  - **Chrome desktop** offers "Allow this time" and "Allow on every visit". A one-time grant expires after 5 minutes idle or 16 hours ([Chrome: one-time permissions](https://developer.chrome.com/blog/one-time-permissions)).
  - **Safari.** A WebKit engineer, 2021: "If capture is ongoing, prompt should not happen again until 24 hours. If capture is not ongoing, prompt should happen again after 1 minute of inactivity. This is the same behavior as Safari." In 2024 a report on the same bug says Safari on Mac asks again after a reload. The engineer points to Safari's per-site persistent setting as the way out ([WebKit bug 215884](https://bugs.webkit.org/show_bug.cgi?id=215884), comments 15, 24, 25).
  - So on Safari, a visitor who holds to talk, waits more than a minute, and holds again may see the prompt again, unless the page keeps the microphone track open with the recording indicator showing **(analysis; unverified on a device)**.
- **iOS audio session.** Capturing the microphone switches the page's audio session: the Audio Session spec's `auto` type resolves to `play-and-record` while capture is active ([Audio Session ED](https://w3c.github.io/audio-session/)).
  - On a report of Web Audio going quiet once the mic was granted, a WebKit engineer wrote: "When starting capturing, we are changing of audio category which might explain the issue" ([WebKit bug 218012](https://bugs.webkit.org/show_bug.cgi?id=218012); see also [bug 230902](https://bugs.webkit.org/show_bug.cgi?id=230902)). Reporters described output moving to the earpiece and the volume dropping.
  - Both bugs were closed as "configuration changed", so **whether the score and the voice change level or route on a 2026 iPhone during and after hold-to-talk is unverified**. It needs the iPhone pass in *Voice verdict*.
- **Recording formats.**
  - `MediaRecorder`: Chrome 47, Firefox 25, Safari 14.1, iOS 14 ([BCD MediaRecorder.json](https://github.com/mdn/browser-compat-data/blob/main/api/MediaRecorder.json)). Safari 18.4 added WebM with Opus to `MediaRecorder` ([WebKit features in Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/)).
  - Measured `isTypeSupported()`: `audio/webm;codecs=opus` and `audio/mp4` are true in Chrome 153, Chromium 147 and WebKit 26.6. `audio/ogg;codecs=opus`, `audio/wav` and `audio/mpeg` are false in all three.
  - Measured default type with no options: Chromium records `audio/webm;codecs=opus` and WebKit 26.4 records `audio/mp4; codecs=mp4a.40.2` (AAC). Every paid API in §1.2 accepts both.
  - Firefox's default was not measured. It is often reported as Ogg, which OpenAI does not accept **(unverified)**.
  - A 5 s clip is tens of KB.
- **WCAG and the gesture itself** ([WCAG 2.2](https://www.w3.org/TR/WCAG22/), Recommendation 12 December 2024):
  - **2.1.1 Keyboard (A).** "All functionality of the content is operable through a keyboard interface without requiring specific timings for individual keystrokes." A hold is a timing, so hold-to-talk needs a keyboard path, e.g. press to start and press to send **(analysis)**.
  - **2.5.2 Pointer Cancellation (A).** Starting on the down-event passes only with "Up Reversal" or "Abort or Undo", e.g. sliding off the control before release cancels the recording.
  - **2.1.4 Character Key Shortcuts (A).** A bare-key shortcut such as holding Space to talk must be switchable off, remappable, or "only active when that component has focus".
- **Hold to talk vs the audio unlock.** The press that starts talking is a `pointerdown`/`keydown`, and in the HTML list only `pointerup` for touch and `touchend` activate on touch devices (*Audio stack* §2.1). On a phone the release, not the press, unlocks audio and speech. That release is also the natural place to prime iOS `speechSynthesis` (§2.1) **(analysis)**.

### 1.5 What each voice-in route needs (analysis)

| Route | Server | Client | Keys | Recurring cost |
|---|---|---|---|---|
| `SpeechRecognition` | nothing | 0 KB; transcript goes into the existing `sendMessage({ text })` | none (the browser vendor's service) | $0 |
| Paid transcription, upload after release | a new route handler, e.g. `app/api/transcribe/route.ts`: receives the recorded blob, calls the vendor, returns text; needs its own rate limit and a seconds-based cost counter | `getUserMedia` + `MediaRecorder`, ≈ 0 KB of library | vendor key in a server env var | $0.11–0.50 per 1,000 questions |
| Paid streaming transcription | a token-minting route (Deepgram JWT 30 s default; ElevenLabs single-use token 15 min; OpenAI Realtime client secret) | WebSocket or WebRTC client code | minted per session | as above, plus session-time billing on some vendors |
| In-browser model | nothing | 28–77 MB model + runtime, loaded on intent; the WASM multi-thread path needs COOP/COEP headers | none | $0 |

---

## 2. Voice out (text-to-speech)

### 2.1 The browser's `speechSynthesis`

- **Support.** `speechSynthesis` and `SpeechSynthesisUtterance`: Chrome 33, Edge 14, Firefox 49 (Android 62), Safari 7 (iOS mirrors), Samsung Internet 3.0. **Not** in Android WebView. `voiceschanged` arrives in Safari only from 16 ([BCD SpeechSynthesis.json](https://github.com/mdn/browser-compat-data/blob/main/api/SpeechSynthesis.json), [SpeechSynthesisUtterance.json](https://github.com/mdn/browser-compat-data/blob/main/api/SpeechSynthesisUtterance.json)).
- **Cost and privacy.** Free to the site. Voices with `localService === true` synthesise on the device. The spec says `localService` "is false for voices supplied by a remote speech synthesizer service" ([spec](https://webaudio.github.io/web-speech-api/)).
  - **Branded Chrome desktop** ships a component extension, "Google Network Speech", with **19 remote voices**, e.g. "Google US English" and "Google UK English Female". It sends the text to `https://www.google.com/speech-api/v2/synthesize` ([manifest.json](https://github.com/chromium/chromium/blob/main/chrome/browser/resources/network_speech_synthesis/mv3/manifest.json), [tts_extension.js](https://github.com/chromium/chromium/blob/main/chrome/browser/resources/network_speech_synthesis/mv3/tts_extension.js)). Choosing one of these voices sends each reply's text to Google.
  - **Edge** exposes Microsoft "Online (Natural)" neural voices by name, e.g. "Microsoft Ana Online (Natural) - English (United States)" ([Readium's voice list](https://github.com/HadrienGardeur/web-speech-recommended-voices), CC0). That they are remote follows from the name **(unverified at a Microsoft page)**.
- **Voices differ per visitor.** The list is whatever the OS and browser provide. Measured on this Mac (macOS 26, headless):

  | | Voices | English | Remote | Reported `default` |
  |---|---|---|---|---|
  | Chrome 153 | 180 | 41 | 0 (the Google network voices do not load headless) | "Albert" (a macOS novelty voice) |
  | Chromium 147 | 180 | 41 | 0 | "Samantha" |
  | WebKit 26.6 | 0 on the first synchronous call; 68 after `voiceschanged` | 25 | 0 | 67 voices flagged `default` |

  - The English list includes the macOS novelty voices "Albert", "Bad News", "Bahh", "Bells", "Boing", "Bubbles", "Cellos", "Jester", "Organ", "Superstar", "Trinoids", "Whisper", "Wobble" and "Zarvox". So `default` cannot be trusted to pick a sensible voice. A page has to choose by name, with a fallback per OS **(analysis from the measurement)**.
  - Readium's CC0 list exists for the same reason: "With hundreds of voices available by default across various browsers and OS, it can be tricky for developers to provide sensible defaults". It keeps a filter list of "Novelty voices (Apple devices)" and names each platform's variants, e.g. "Samantha (Enhanced)" and "Ava (Premium)" ([web-speech-recommended-voices](https://github.com/HadrienGardeur/web-speech-recommended-voices), last commit 2026-01-20; the data now lives in [readium/speech](https://github.com/readium/speech)).
- **Time to first audio (measured, local voices, volume 0).**
  - `start` fired 6–8 ms after `speak()` in Chrome 153 and Chromium 147, and 49 ms after in WebKit 26.6.
  - "Hello there. This is a short test." (7 words) took 2.4 s with Samantha in Chromium and 2.5 s in WebKit, about 170–175 words per minute. It took 4.8 s with Chrome's default, "Albert".
- **Speaking while the text streams.**
  - `speak()` "appends the SpeechSynthesisUtterance object utterance to the end of the queue", and `cancel()` "removes all utterances from the queue. If an utterance is being spoken, speaking ceases immediately" ([spec](https://webaudio.github.io/web-speech-api/)). `cancel()` is the stop control.
  - So a client can cut the streamed reply at sentence ends and queue each sentence as it completes. `Intl.Segmenter` with `granularity: "sentence"` finds the ends; support is Chrome 87, Firefox 125, Safari 14.1 ([BCD Intl/Segmenter.json](https://github.com/mdn/browser-compat-data/blob/main/javascript/builtins/Intl/Segmenter.json)).
  - Each sentence becomes its own utterance, so there is a short gap and a prosody reset between sentences **(analysis)**.
- **Quirks.**
  - **iOS: the first `speak()` must happen inside a user gesture.** In WebKit on iOS, `speak()` outside a gesture returns silently, with no event, until one `speak()` has run inside a gesture. That one call removes the restriction for the document ([SpeechSynthesis.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/speech/SpeechSynthesis.cpp), `RequireUserGestureForSpeechStart`). A streamed reply arrives seconds after the Send tap, so the page would have to "prime" speech with an utterance inside the Send or hold-to-talk handler **(analysis)**.
  - **Chrome: long utterances stop.** Two Chromium issues: "speechSynthesis fails for long text without warning and blocks the API" ([41346274](https://issues.chromium.org/issues/41346274)) and the older "Speech Synthesis stops abruptly after about 15 seconds" ([679437](https://bugs.chromium.org/p/chromium/issues/detail?id=679437)). Whether these still reproduce with local voices in Chrome 153 is **unverified**. Sentence-sized utterances stay under either limit **(analysis)**.
  - **`boundary` events** (word and sentence positions) are marked partial in Chrome: "The `boundary` event does not fire as expected" ([BCD](https://github.com/mdn/browser-compat-data/blob/main/api/SpeechSynthesisUtterance.json), [crbug 40715888](https://issues.chromium.org/issues/40715888)). In headless macOS runs, word boundaries did fire in Chrome 153, Chromium 147 and WebKit 26.6.
  - **Android.** "`pause()` ends the current utterance. `pause()` behaves the same as `cancel()`" (BCD notes for Chrome Android, Firefox Android and Samsung Internet).
  - **No access to the audio.** The API never exposes the synthesised samples, so the audio cannot be routed into Web Audio, analysed, filtered, ducked by a node, pitched, or recorded. A spec issue asking for `SpeechSynthesis` output as a `MediaStreamTrack` has been open since 2019 ([web-speech-api #69](https://github.com/WebAudio/web-speech-api/issues/69)). The page gets only the `start`, `end`, `boundary`, `pause`, `resume` and `error` events.
  - **iOS Silent switch.** Whether `speechSynthesis` obeys the Silent switch the way Web Audio does (*Audio stack* §2.3) is **unverified**.

### 2.2 Paid neural TTS

Per-reply, per-minute and per-1,000 figures are **(analysis)** using the standard sizes.

| Option | Price (source) | Short reply | Long reply | Per min of audio | 1,000 long (1,000 short) | Free tier | First audio, as the vendor states it | Takes streamed text? | Output licence |
|---|---|---|---|---|---|---|---|---|---|
| OpenAI `tts-1` | $15 / 1M chars ([pricing](https://developers.openai.com/api/docs/pricing)) | $0.0015 | $0.0060 | $0.013 | $6.00 ($1.50) | none | not stated | **No** (whole text per request) | customer owns output; AI-voice disclosure required |
| OpenAI `tts-1-hd` | $30 / 1M chars | $0.0030 | $0.0120 | $0.026 | $12.00 ($3.00) | none | not stated | No | same |
| OpenAI `gpt-4o-mini-tts` | $0.60 / 1M text tokens + $12 / 1M audio tokens ([model](https://developers.openai.com/api/docs/models/gpt-4o-mini-tts)); ≈ $0.015/min **(unverified; not on current pages)** | ≈ $0.0018 | ≈ $0.0071 | ≈ $0.015 | ≈ $7.06 (≈ $1.77) | none | not stated | No | same; `instructions` steers delivery |
| ElevenLabs Flash v2.5 / Turbo | $0.05 / 1K chars ([API pricing](https://elevenlabs.io/pricing/api)) | $0.005 | $0.020 | $0.043 | $20.00 ($5.00); the Creator plan ($22/mo) includes 440K Flash chars | 20K Flash chars/mo, **non-commercial, attribution required** | "~75ms", "Excluding application & network latency" | **Yes** (WebSocket `stream-input`; first audio waits for 120 buffered chars by default, minimum 50) | commercial licence on paid plans (not Beta services) |
| ElevenLabs Multilingual v2 / v3 | $0.10 / 1K chars | $0.010 | $0.040 | $0.086 | $40.00 ($10.00) | 10K chars/mo | v3 Conversational "~280ms" | v2 yes; v3 **(unverified)** | same |
| Cartesia Sonic-3.6 | Pro $5/mo for 100K credits, overage $65 / 1M; 1 credit = 1 char ([pricing](https://cartesia.ai/pricing)) | $0.005–0.0065 | $0.020–0.026 | $0.049–0.056 | $24.50 on Pro ($5.00) | 20K credits/mo, no commercial licence | "sub-90ms" ([Sonic](https://cartesia.ai/sonic)) | Yes (WebSocket contexts) | commercial licence from Pro |
| Google Chirp 3: HD | **first 1M chars/month free**, then $30 / 1M ([pricing](https://cloud.google.com/text-to-speech/pricing)) | $0.003 | $0.012 | $0.026 | **$0 inside 1M chars/mo** (400K chars), $12 beyond | 1M chars/mo | not stated | Yes (bidirectional gRPC streaming, Chirp 3 HD only) | no attribution rule found **(unverified)** |
| Google Neural2 | 1M chars/mo free, then $16 / 1M | $0.0016 | $0.0064 | $0.014 | $0 in the free tier, $6.40 beyond | 1M chars/mo | not stated | No | same |
| Deepgram Aura-2 | $0.030 / 1K chars ([pricing](https://deepgram.com/pricing)) | $0.003 | $0.012 | $0.026 | $12.00 ($3.00) | $200 one-time credit | sub-200 ms, ~90 ms steady (vendor blog) | Yes (WebSocket) | **(unverified)** |

- **OpenAI details** ([TTS guide](https://developers.openai.com/api/docs/guides/text-to-speech), [API reference](https://developers.openai.com/api/reference/resources/audio/subresources/speech/methods/create)):
  - `input` is capped at 4,096 characters, and `gpt-4o-mini-tts` at 2,000 tokens. `speed` runs 0.25–4.0.
  - Formats are `mp3, opus, aac, flac, wav, pcm`, where PCM is raw 24 kHz 16-bit. "For the fastest response times, we recommend using `wav` or `pcm`."
  - "The Speech API provides support for realtime audio streaming using chunk transfer encoding." `stream_format: "sse"` is `gpt-4o-mini-tts` only.
  - There are 13 voices (`alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer, verse, marin, cedar`); `tts-1` has 9 of them. Custom voices need a consent recording and are sales-gated ([custom voices](https://developers.openai.com/api/docs/guides/custom-voices)).
  - `instructions`: "Does not work with tts-1 or tts-1-hd."
- **Scale against the cap (analysis).**
  - 1,000 long replies cost $6–7 on OpenAI's cheaper models, which is 60–71% of the $10 cap, on top of the chat itself.
  - The same volume costs $12 on Deepgram and Chirp 3 HD beyond the free tier, $20–40 on ElevenLabs, and $24.50 on Cartesia.
  - Google's 1M free characters a month cover 2,500 long replies. The free tier still sits inside a Google Cloud billing account, and the site would add a second cloud vendor.
- **Time to first audio.** No OpenAI or Google figure is published. ElevenLabs, Cartesia and Deepgram give model-only numbers of 75–280 ms that exclude the network. Real first audio for this site is **unmeasured**, because measuring it needs a paid call.

### 2.3 Speaking while the reply streams

- **Timing.** The reply arrives as a text stream from `/api/chat`. For factual answers it starts only after the `search_wiki` step. The first full sentence is ready long before the fourth **(analysis)**. Today the page shows none of it until the stream finishes (§0), so each option below also needs a visible reveal that keeps the text in step with the voice. Otherwise the speech would lead the text on screen.

  | Option | How speech can start before the reply ends | Source |
  |---|---|---|
  | `speechSynthesis` | Queue one utterance per finished sentence (§2.1). No network | spec |
  | OpenAI TTS | One request per finished sentence; audio streams back chunked. The API cannot take a text stream | [TTS guide](https://developers.openai.com/api/docs/guides/text-to-speech) |
  | ElevenLabs, Cartesia, Deepgram, Google Chirp 3 HD | Push text deltas into one WebSocket (or gRPC) session. The vendor buffers to its own chunk size and returns audio | vendor docs in §2.2 |
  | In-browser model (Kokoro) | Generate per sentence; each 100-char sentence takes 0.9–10 s (§2.4) | measured |
  | Babble | Schedule blips against a paced reveal of the text; no generation step and no network | §3.3 |
  | Speech-to-speech | The model speaks while it generates; no separate text stream | §4 |

- **Playback plumbing (analysis).**
  - Chunked MP3 or Opus from a route can play through an `<audio>` element pointed at the route URL, or be decoded per sentence with `decodeAudioData` into the same `AudioContext` as the score.
  - `MediaSource` plays progressive MP3 in Chrome and Firefox, but on iPhone it is not exposed: BCD notes "Exposed in Mobile Safari on iPad but not on iPhone". `ManagedMediaSource` exists in Safari 17 and iOS 17.1 only ([BCD MediaSource.json](https://github.com/mdn/browser-compat-data/blob/main/api/MediaSource.json), [ManagedMediaSource.json](https://github.com/mdn/browser-compat-data/blob/main/api/ManagedMediaSource.json)).
  - Per-sentence files avoid that split.

### 2.4 Neural TTS inside the browser, and prerendered clips

- **Kokoro-82M via `kokoro-js`.**
  - Weights are Apache-2.0 ([hexgrad/Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M)). `kokoro-js` 1.2.1 is Apache-2.0 and was last published 2025-05-03, and it exposes 28 English voices.
  - Download sizes ([onnx-community/Kokoro-82M-v1.0-ONNX](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX)): q8 92.4 MB, fp16 163 MB, fp32 325.5 MB. q4 is 305 MB, which is larger than q8. The bundle adds 2.1 MB, and each voice 0.5 MB.
  - Measured by a sub-run, headless Chromium 147 on the M5, for a 100-character sentence that makes 6.75 s of audio:

    | Setup | Model load | 100-char sentence | Faster than playback? |
    |---|---|---|---|
    | WASM q8, no cross-origin isolation | 4.4 s | 9.8–10.7 s | no, ≈ 1.45× real time |
    | WASM q8 with COOP/COEP | 4.1 s | 5.6–6.5 s | just, ≈ 0.85× |
    | WebGPU fp32 | 10.2 s (326 MB) | 0.87 s after a 3.2 s warm-up | yes, ≈ 0.13× |

    Phones will be slower **(analysis; not measured)**.
  - **Licence caveat.** `kokoro-js` depends on `phonemizer` 1.2.1, which is declared Apache-2.0 but is "Simple text to phones converter using eSpeak NG". It bundles eSpeak NG, which is GPL-3.0 ([COPYING](https://github.com/espeak-ng/espeak-ng/blob/master/COPYING)). Whether shipping that WASM puts GPL obligations on the site is **unverified** (a legal question).
- **Piper.**
  - The MIT engine `rhasspy/piper` was archived in 2025. Development moved to `OHF-Voice/piper1-gpl`, which is GPL-3.0, and phonemization is again eSpeak NG.
  - A voice is 63 MB (medium) or 114–137 MB (high).
  - Voice licences differ, per each `MODEL_CARD` in [rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices):
    - public domain: `ljspeech`, `kristin`, `john`, `norman`, `bryce`, `cori`;
    - CC0: `joe`, `mike`, `kathleen`;
    - CC BY: `libritts_r`, `vctk`, `alba`;
    - **non-commercial or research-only:** `lessac` (Blizzard 2013 licence, no "commercial purpose"), `ryan`, `hfc_male`, `hfc_female`, `l2arctic`, `semaine`.
- **Newer small models.**
  - Kitten TTS 0.8 is Apache-2.0 and 24–78 MB, but has no official browser runtime **(unverified)**.
  - Chatterbox (≥ 1.5 GB), Sesame CSM-1B (6.2 GB) and Orpheus 3B are server-sized.
  - Supertonic uses OpenRAIL, which carries use restrictions.
- **WebGPU in 2026** (BCD `api.GPU`, caniuse):
  - Chrome and Edge 144+ (Linux on Intel Gen12+ only); Android Chrome 121+.
  - Safari 26 on macOS 26 and iOS 26.
  - Firefox partial: Windows and Apple-silicon Macs only; no Intel Mac, Linux or Android.
  - caniuse puts it at 85.7% full plus 3.1% partial. Everything above also runs on WASM, only slower.
- **Prerendered clips.** The site can render a fixed set of phrases once, offline, and ship the audio files (analysis from the licences above):
  - A 7 s Opus clip at 32 kbit/s is ≈ 28 KB.
  - The clip is clean when the weights are permissive (Kokoro, Kitten: Apache-2.0) and the voice's training data is not NC or research-only: Kokoro's English voices, or Piper's PD/CC0 voices.
  - Rendering offline also keeps eSpeak NG out of the shipped bundle.
  - Paid-API renders are also allowed: OpenAI (customer owns the output; the disclosure rule still applies), ElevenLabs paid plans, and Cartesia Pro and above.
  - Clips only work for fixed lines, e.g. a greeting or the states "Listening…", "One sec…", "Here". Generated replies cannot be prerendered.

### 2.5 AI SDK v6 helpers (fact)

Read from the installed `node_modules` (read-only) and confirmed in the AI SDK docs via Context7 ([speech](https://ai-sdk.dev/docs/ai-sdk-core/speech), [transcription](https://ai-sdk.dev/docs/ai-sdk-core/transcription)).

- **Exports.** `ai` 6.0.168 exports `experimental_generateSpeech` and `experimental_transcribe`, under the experimental names only (`ai/dist/index.d.ts`).
- **Signatures.**
  - `generateSpeech({ model, text, voice?, outputFormat?, instructions?, speed?, language?, providerOptions?, maxRetries?, abortSignal?, headers? })` returns `{ audio, warnings, responses, providerMetadata }`.
  - `transcribe({ model, audio, providerOptions?, maxRetries?, abortSignal?, headers?, download? })` returns `{ text, segments, language, durationInSeconds, … }`.
- **`generateSpeech` does not stream.** The `SpeechModelV3` interface has only `doGenerate`, and the OpenAI provider reads a complete binary response. So a route that must stream audio would `fetch` the vendor directly and pipe the body.
- **Model IDs in `@ai-sdk/openai` 3.0.53.**
  - Speech: `openai.speech(…)` with `tts-1`, `tts-1-hd`, `gpt-4o-mini-tts`, and snapshots up to `-2025-12-15`.
  - Transcription: `openai.transcription(…)` with `whisper-1`, `gpt-4o-mini-transcribe`, `gpt-4o-transcribe` and `gpt-4o-transcribe-diarize`.
  - Newer IDs such as `gpt-transcribe` pass as plain strings.
- **Other providers on the v6 line.** Packages exist on the `ai-v6` tag: `@ai-sdk/elevenlabs` 2.0.61, `@ai-sdk/deepgram` 2.0.61, `@ai-sdk/assemblyai` 2.0.62 and `@ai-sdk/groq` 3.0.70. `@ai-sdk/cartesia` exists only for ai 7.
- **ai 7.** `ai` 7 makes the names stable and adds `experimental_streamTranscribe` and experimental realtime (§4.4). Moving to it is a major-version upgrade of the chat backend.

### 2.6 Disclosure, ownership and "a voice that says it is Janriz"

- **OpenAI.** "Our usage policies require you to provide a clear disclosure to end users that the TTS voice they are hearing is AI-generated and not a human voice" ([TTS guide](https://developers.openai.com/api/docs/guides/text-to-speech)). The usage-policies page itself returned 403 to the fetchers **(unverified at that page)**.
  - The Services Agreement §4.1 says the customer "owns all Output" ([Services Agreement](https://openai.com/policies/services-agreement/), effective 2026-01-01).
- **Why it matters here (analysis).** The system prompt makes the bot speak in first person as Janriz. A synthetic human voice saying "I built FlowStack" is the case the disclosure rule is written for. Babble and the browser's own voices are not OpenAI output, so the rule does not reach them; whether other vendors have a similar rule was not checked **(unverified)**.
- **ElevenLabs free plan.** "The free plan does not include a commercial license and cannot be used for any commercial purpose", and non-commercial sharing needs attribution ([help centre](https://elevenlabs.io/docs/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform)). Its paid plans include a commercial licence.
- **Cartesia.** The commercial licence starts at Pro, $5/mo ([pricing](https://cartesia.ai/pricing)).
- **The map's rule.** Every paid route is a paid item under the map's asset rule: it needs its own case and Janriz's approval.

---

## 3. Non-verbal voice (babble and beeps)

Non-verbal voice here means sound made in the browser while a reply appears: Animal Crossing's "Animalese", game text blips and R2-D2-style chirps. It uses no words, so no TTS, no vendor and no disclosure rule. It is framed against the stacks in [audio-stack.md](audio-stack.md).

### 3.1 How the reference sounds were made

- **Animal Crossing chose babble over TTS on purpose.** Taro Bando (sound effects), in a 2001 Nintendo Online Magazine interview, translated by shmuplations ([Animal Crossing – Developer Interviews](https://shmuplations.com/animalcrossing/)):
  - "At first, we planned to use voice synthesis techniques to make something more realistic. But this is a game where messages are also displayed in text when you talk to someone, and we couldn't get the timing right between the synthesized voices and the text subtitles—they would end up speaking too fast."
  - "maybe all the players needed was to know the feel and tone of what they were talking about. That's how we came up with their language. We actually used a unique technology that we filed a patent for!"
- **The patent.** JP2002073068A / JP4651168B2: inventor Taro Bando, assignees Nintendo and Fujitsu, filed 2000-08-23, status "Expired - Lifetime" ([Google Patents](https://patents.google.com/patent/JP2002073068A/en), read through its machine translation).
  - **The problem it solves.** Dialogue text draws at "one character per frame (that is, at a speed of 30 characters per second)". A per-character voice played that fast "is heard as, for example, a rapid sound of a firearm", and speeding recorded speech up raises its pitch.
  - **The method.** One stored waveform per kana. The second half of each character's waveform overlaps the first half of the next, which roughly halves the duration "without increasing the frequency". Consonant peaks are lowered or vowels raised, and part of the waveform is cut.
  - **Punctuation and emotion.** Emotion information changes each waveform's "volume and/or frequency". A "?" raises the last character's frequency; a "!" raises its volume.
  - **Animals.** Paragraphs [0099]–[0100] apply it to "'animal language' spoken by an animal character", where "a synthetic voice that has the mood of talking" matters more than being understood.
- **Third-party reverse engineering of the GameCube engine** ([kidGodzilla/animalese](https://github.com/kidGodzilla/animalese) `5a4b02b7`, from the CC0 decompilation [ACreTeam/ac-decomp](https://github.com/ACreTeam/ac-decomp)) reports:
  - one call per character at a 30 Hz cadence;
  - "?" bends pitch ×1.13–1.30 and "!" scales volume ×1.15;
  - two overlapping subtracks.

  This is **unverified**, but it agrees with the patent.
- **Celeste decouples babble from letters.** Kevin Regamey, 2021-07-17 ([thread](https://threadreaderapp.com/thread/1416483583053602816.html)):
  - "Simple synth sounds" were shaped by a parametric EQ to model "formants… spectral peaks in human vowel sounds".
  - Emotions were "performed" on a MIDI keyboard and sorted into "Quick passing syllables (20)", "Emphasized syllables (10)" and endings.
  - While the text draws, FMOD plays "a random sequence of syllables": "No syllable was allowed to play twice in a row, and emphasized syllables had a lower probability of playing." When the text-draw ends, an end syllable plays.
  - Celeste's FMOD audio is licensed for "educational or personal purposes only" ([FMOD docs, Appendix A](https://www.fmod.com/docs/2.03/studio/appendix-a-celeste.html)), so it is not usable here.
- **Simlish** is recorded human improvisation, not synthesis: two voice actors, thousands of voice events ([The Verge, 2020-02-07](https://www.theverge.com/2020/2/7/21126705/the-sims-simlish-language-history-20th-anniversary-game), secondary).
- **R2-D2.** Ben Burtt, NPR 2010 ([NPR](https://www.npr.org/2010/12/12/131968222/-the-sounds-of-star-wars-now-at-fans-fingertips)): "I went to synthesizers at first, but the results sounded too much like a machine, just something cold -- it didn't seem to have a soul." The final voice was "kind of 50 percent electronic and 50 percent human", from an ARP synthesizer blended with his own voice.
  - In code the building blocks are oscillators with fast `exponentialRampToValueAtTime` sweeps, FM for the warble, ZzFX's `slide`/`pitchJump`/`modulation` parameters, or jsfxr's `blipSelect` preset **(analysis)**.
- **Undertale, Banjo-Kazooie, Hollow Knight, Night in the Woods, Minecraft villagers.** No primary developer statement was found **(unverified)**.

### 3.2 Techniques, in code terms

| Technique | Per blip | Assets | Character | Licence situation |
|---|---|---|---|---|
| **Letter or syllable samples** (Animalese) | one `AudioBufferSourceNode` slice at a varied `playbackRate`/`detune` | a bank of 5 vowels to 26 letters | closest to Animal Crossing; pitch and formants shift together, giving a "chipmunk" at high rates **(analysis)** | only clean if the bank is self-recorded, self-synthesised or clean-licensed (§3.4) |
| **Formant synthesis** (vowel-like "gibberish") | a sawtooth or pulse → 2–3 bandpass `BiquadFilterNode`s at vowel formants → gain envelope | 0 KB | voice-like without samples; BlipTalk Studio builds its vowel bank this way | own code |
| **Oscillator chirps** (R2-D2, text blips) | 1–3 oscillators with pitch ramps and a short gain envelope; or a prebuilt ZzFX/jsfxr buffer | 0 KB | robotic or "beeping" | own code; ZzFX MIT, jsfxr Unlicense |
| **Vocal-tract / Klatt models** | Pink Trombone (MIT) or klatt-syn (MIT) driven by a phoneme or vowel sequence | 0 KB, 4–5 KB gzip of code | more speech-like | clean |

- **Vowel formants for synthesis.** Steady-state means computed from Hillenbrand et al. 1995 (JASA 97(5):3099–3111), from its data file ([archived vowdata.dat](https://web.archive.org/web/2016id_/http://homepages.wmich.edu/~hillenbr/voweldata/vowdata.dat)). Values are f0 / F1 / F2 in Hz:

  | Vowel | Men | Women | Children |
  |---|---|---|---|
  | /i/ | 139 / 343 / 2323 | 227 / 437 / 2761 | 246 / 444 / 3028 |
  | /ɑ/ | 127 / 756 / 1309 | 212 / 921 / 1526 | 234 / 959 / 1650 |
  | /u/ | 144 / 380 / 992 | 236 / 460 / 1106 | 247 / 493 / 1327 |

  Raising all formants together makes a voice sound smaller **(analysis)**.
- **A pitch trap.** `playbackRate` on an `<audio>` element keeps the pitch by default, because [`preservesPitch`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/preservesPitch) defaults to true. On an `AudioBufferSourceNode`, `playbackRate` "resamples the audio" and changes pitch ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/playbackRate)); `detune` is in cents ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/detune)).
  - So Howler's HTML5 mode and any `new Audio()` implementation change speed, not pitch. Howler's Web Audio mode does move pitch through `rate(r, id)`, range 0.5–4.0 ([README](https://github.com/goldfire/howler.js#raterate-id)) **(analysis from Howler source)**.

### 3.3 Pacing babble against the text

- **Rates on record.**

  | Source | Rate |
  |---|---|
  | Nintendo patent | 30 characters/s |
  | Acedio `animalese.js` | 75 ms per character (13.3/s) |
  | `@wheen/voices` | 55 ms per letter (18/s), capped at 24 letters |
  | BlipTalk Studio | "30–45 ms is brisk, 60–80 ms is relaxed" |
  | Read English speech | 6.19 syllables/s ([Pellegrino, Coupé & Marsico 2011, *Language* 87](http://www.ddl.cnrs.fr/fulltext/pellegrino/Pellegrino_2011_Language.pdf)) |
  | Silent reading | 238 words/min; reading aloud 183 words/min ([Brysbaert 2019](https://www.sciencedirect.com/science/article/abs/pii/S0749596X19300786)) |

- **Duration per reply (analysis)**, for ≈ 100 / 250 / 400 characters:

  | Strategy | Duration |
  |---|---|
  | Per character at 30/s (Animal Crossing pace) | 3.3 / 8.3 / 13.3 s |
  | Per character at 13.3/s | 7.5 / 18.8 / 30 s. Longer than reading 250 characters silently (≈ 11 s) |
  | Per word at ≈ 4/s | 4.5 / 11 / 18 s |
  | Capped at 24 blips | ≈ 1.3–1.6 s. A cue; the text keeps revealing silently |
  | Decoupled stream (Celeste) | As long as the reveal, then an end syllable |

- **The site does not reveal replies progressively today** (repo fact, 2026-09-27):
  - `app/page.tsx` appends the assistant message to the store only in `useChat`'s `onFinish`. While `status` is `submitted` or `streaming`, `MessageList` shows `TypingBubble` (three GSAP-animated dots, `role="status"`, `aria-label="Assistant is thinking"`), and then the whole reply appears at once.
  - `lib/gsap/use-typewriter.ts` cycles hero words; it is not a chat reveal.
  - So "babble as the reply streams" needs a reveal the site does not have yet: render the streaming text parts, or play a paced reveal of the finished text. The same applies to speaking sentence by sentence (§2.3) **(analysis)**.
- **Keeping sound and text in step (analysis).**
  - Text arrives much faster than any babble rate, so babble follows a paced reveal, not the network.
  - Schedule blips on the audio clock with a short lookahead: `animalese-web` ticks every 25 ms and schedules 100 ms ahead, the pattern in [web.dev, "A Tale of Two Clocks"](https://web.dev/articles/audio-scheduling).
  - Drive the text reveal from the same schedule, e.g. `animalese-web`'s `onLetter` callback, or a GSAP tween whose times come from the schedule.
  - Howler's `play()` starts "now", so Howler-timed blips depend on JS timers.
  - AI SDK `smoothStream` paces the stream in word chunks (default `delayInMs` 10 ms) on the server ([ai@6.0.0 docs](https://github.com/vercel/ai/blob/ai@6.0.0/content/docs/07-reference/01-ai-sdk-core/80-smooth-stream.mdx)).
- **Punctuation and identity (analysis, following the precedents).**
  - A rising bend on "?" and more volume on "!" (the patent); gaps at spaces and a longer pause at `, . ?` (Acedio, `@wheen/voices`).
  - A seed from the character code makes each letter sound the same every time (`@wheen/voices`), and a seed per word makes the same word always sound alike.
  - A per-bot base pitch gives the persona.
  - Tool-call steps have no text, so they have no babble.

### 3.4 Open-source implementations and licences

Sizes: `esbuild --bundle --minify --format=esm` then `gzip -9`, measured by the sub-run. Licences read from each LICENSE file at the commit or npm version named.

| Name | Version | Technique | Size gzip | Code licence | Sample licence | Usable here |
|---|---|---|---|---|---|---|
| [Acedio/animalese.js](https://github.com/Acedio/animalese.js) | `6f18a909` (2025-05-20) | 26 letter samples × 0.15 s, nearest-neighbour resample, rendered to a WAV data URI (outside Web Audio) | 1.2 KB | MIT (`LICENSE.md`) | `animalese.wav`: **CC BY 4.0** since 2025-05-20 ("Copyright © 2014 Josh Simmons") | code yes; samples with attribution |
| [animalese-web](https://www.npmjs.com/package/animalese-web) | 0.1.0 | Acedio's bank (byte-identical), Web Audio lookahead scheduler, `onLetter` callback, pause/resume/stop | **1.8 KB** | MIT | ships Acedio's wav, so CC BY 4.0 credit still applies | code yes; wav with credit |
| [animalese-tts](https://www.npmjs.com/package/animalese-tts) | 1.1.3 | EN/JA/KO phoneme slices from a sprite; streaming generator; Web Audio | 5.4 KB | MIT | sprite origin **not stated** | code yes, with own samples |
| [@wheen/voices](https://www.npmjs.com/package/@wheen/voices) | 0.1.0 | 1 sample, seeded rate per char, cap 24; plays via `<audio>` (pitch preserved) | 0.75 KB | MIT | origin not stated | code yes (small enough to rewrite) |
| [ZzFX](https://github.com/KilledByAPixel/ZzFX) | 1.3.2 | SFX synth with a "Blip" preset | ≈ 1 KB | MIT | none | yes; creates its own context at import, but `buildSamples` can feed the site's context |
| [jsfxr](https://github.com/chr15m/jsfxr) | 1.4.1 | sfxr, `blipSelect` preset | 6.7 KB | Unlicense | none | yes |
| [pink-trombone-mod](https://www.npmjs.com/package/pink-trombone-mod) | 0.1.0 (Pink Trombone v1.1 is MIT per [its page](https://dood.al/pinktrombone/)) | vocal-tract model | 4.7 KB | MIT | none | yes, needs a driver |
| [klatt-syn](https://github.com/chdh/klatt-syn) | 1.0.9 | Klatt formant synthesis | 4.2 KB | MIT | none | yes, needs a driver |
| [DevTarlow/bliptalk-studio](https://github.com/DevTarlow/bliptalk-studio) | `5b4eb468` (created 2026-09-26) | synthesised formant vowel bank → blips | app | README says MIT, **no LICENSE file** | none | reference only |
| [joshxviii/animalese-typing](https://github.com/joshxviii/animalese-typing) (300,000 Chrome users) and copies ([animalese-rs](https://github.com/rgbkrk/animalese-rs), [vscode-animalese](https://github.com/ESV-Sweetplum/vscode-animalese)) | — | per-key samples | — | MIT | **ripped from the game.** The developer: "They are from Animal Crossing: New Horizons" ([issue #4](https://github.com/joshxviii/animalese-typing/issues/4)) | **no** |
| [kidGodzilla/animalese](https://github.com/kidGodzilla/animalese) | `5a4b02b7` | C engine lifted from the decompilation | — | CC0, but its NOTICE says CC0 "says nothing about Nintendo's copyright in the software the decompilation reproduces" | CC BY 4.0 (Acedio's) | **flag**; reference only |
| [sam-js](https://github.com/discordier/sam) (SAM "Software Automatic Mouth") | 0.3.1 | 1982 speech synth port | 10 KB | **none**: "copyright holder is SoftVoice, Inc.… Abandonware… I cannot put my code under any specific open source software license" | — | **no** |
| meSpeak / [eSpeak NG](https://github.com/espeak-ng/espeak-ng) | 2.0.2 / — | formant TTS | 637 KB + | **GPL / GPL-3.0-or-later** | — | **no** for a site that wants to stay non-GPL |
| [DigiDuncan/animalese.py](https://github.com/DigiDuncan/animalese.py) | — | samples | — | GPL-3.0 | — | no |
| [usdivad/Animalese](https://github.com/usdivad/Animalese), [godot-voice-gen](https://github.com/Kibibibit/godot-voice-gen) | — | — | — | **no licence** (no reuse by default, per [GitHub](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)) | — | no |

- **Blip packs on itch.io.** The [dmochas bleeps pack](https://dmochas-assets.itch.io/dmochas-bleeps-pack) is CC BY 4.0 ("free and commercial use… please give attribution"). Other packs are commercial-game licences whose terms for a public website repo are unclear **(unverified)**.
- **Readings (analysis).**
  - Clean code: `animalese-web`, `animalese-tts`, `@wheen/voices`, Acedio's code, ZzFX, jsfxr, pink-trombone-mod, klatt-syn.
  - Clean samples: only Acedio's bank and dmochas, both CC BY 4.0, so a credit line is needed.
  - A self-recorded or self-synthesised bank carries no conditions and matches the map's "free and self-made" default.
  - A close copy of Animalese will read as an Animal Crossing reference.
- **Precedents on the web.** The web precedents are an extension, generators and demos: [Animalese Typing](https://chromewebstore.google.com/detail/animalese-typing/djbgadolfboockbofalipohdncimebic), [animalese.js demo](http://acedio.github.io/animalese.js/), [animalese-web demo](https://stefanlegg.github.io/animalese-web/), and [Animalese Generator](https://brsgr.github.io/animalese-generator/) (record your own 26 letters). The sub-run's searches (Awwwards tags, general web) found no portfolio or product site with a babbling assistant.

### 3.5 Cost on the *Audio stack* stacks

- **Per-blip work by stack.**

  | Stack | Per blip | Pitch per blip | Timing |
  |---|---|---|---|
  | Raw Web Audio (0 KB) | 1 buffer source on a shared bank (`start(when, offset, dur)`), or 1–3 oscillators (+ 1–2 biquads) + a gain envelope | `playbackRate`/`detune`, oscillator frequency ramps | audio clock, lookahead |
  | Howler 2.2.4 (10.2 KB) | `play('a')` on a 26-sprite Howl | `rate(r, id)` 0.5–4.0 (Web Audio mode only) | `play()` = now, so JS timers; `pool` default 5 |
  | Tone.js 15.1 (69–91 KB) | `Synth.triggerAttackRelease(note, dur, time)`, `PolySynth` (≤ 32 voices), `Sampler` | notes / Hz | audio clock, 0.1 s lookahead |
  | ZzFX (≈ 1 KB) | synthesises each blip in JS, ≈ 320 µs per 70 ms blip; prebuilding a few buffers avoids that | `frequency`, `randomness` | plays on call |

- **Measured render cost.** `OfflineAudioContext`, 48 kHz stereo, 30 s, median of 3 runs. The sub-run's script is `voice-research/babble/bench/bench.cjs`. "Just in time" suspends every 100 ms and schedules the next 100 ms, including JS time. Figures are % of one M5 core:

  | Voice | 25 blips/s, Chromium 147, just in time | 25/s, Chromium, all scheduled up front | 25/s, WebKit 26.6, up front |
  |---|---|---|---|
  | Sample slice, random `playbackRate`, per-blip gain | **0.21%** | 2.5% | 1.5% |
  | 2 oscillators + gain, gain disconnected on `ended` | **0.28%** | 3.9% | 2.1% |
  | 3 oscillators with a pitch glide | **0.50%** | 5.5% | 2.7% |
  | Sawtooth → 2 bandpass formants | **0.44%** | 9.7% | 5.8% |
  | 2 oscillators, **not** disconnected | 1.36% (0.62% at 10 s → 2.59% at 60 s) | 5.2% | 2.4% |

  - Two rules come out of it: **disconnect finished nodes**, and **schedule just in time, not the whole reply up front** (4–30× cheaper in Chromium).
  - WebKit's just-in-time numbers were swamped by `suspend()` overhead in the offline benchmark, so they are not usable.
  - Phones were not measured **(unverified)**.
  - For scale: *Audio stack* measured a 9-oscillator score bed at ≈ 0.2% of a core. Babble runs only while a reply appears.
- **Asset weight** (Acedio's 3.9 s, 26-letter bank re-encoded with ffmpeg):

  | Encoding | Size |
  |---|---|
  | Original 8-bit WAV | 172 KB |
  | Opus 24–32 kbit/s, one sprite | 12–17 KB |
  | MP3 / AAC 48 kbit/s (the Safari fallback) | ≈ 24–25 KB |
  | Five vowel slices, Opus 32 kbit/s | ≈ 4 KB |
  | Decoded bank in memory | ≈ 750 KB **(analysis)** |
  | Synthesis | 0 KB of assets |

### 3.6 Accessibility and control specific to babble

- **Babble carries no words, so the text carries all the meaning.** In Bando's words: "Maybe it wasn't so important to know exactly what they were saying."
- **WCAG 1.4.2.** Depending on pacing, one reply's babble runs ≈ 1–30 s (§3.3). A capped cue stays under 1.4.2's 3 s; longer babble needs the stop or volume control (§5.3) **(analysis)**.
- **Screen readers.** The list is `aria-live="polite"`, so a screen reader speaks the reply while its babble plays, and the page cannot detect screen readers.
  - For a character-by-character reveal, ARIA 1.2 says authors "MAY set aria-busy to true while the changes are being made and then set it to false when the changes are complete and ready to be spoken" ([ARIA 1.2 aria-busy](https://www.w3.org/TR/wai-aria-1.2/#aria-busy)). Without it, a reader may announce fragments.
- **Reduced motion.** Reduced motion is not reduced sound. If the reveal is skipped under reduced motion, babble tied to it has nothing to follow, which leaves a short cue or none **(analysis)**.

---

## 4. Speech-to-speech (realtime voice APIs)

All prices were read 2026-09-27. Per-reply figures are **(analysis)** from a sub-run's cost model (scratchpad `voice-research/realtime/costs.py`). The model assumes:
- two model passes per factual reply (call `search_wiki`, then answer);
- a ≈ 3,076-token prompt prefix and ≈ 1,800 tokens of retrieved chunks;
- the standard sizes above.

For OpenAI, user audio counts 10 tokens/s and assistant audio 20 tokens/s ("1 token per 100 ms … 1 token per 50ms", [voice latency and cost](https://developers.openai.com/api/docs/guides/voice-latency-cost)).

### 4.1 What exists

| Option | Model | Price (source) | Short / long reply | Per minute of conversation | 1,000 replies | How tools work | Browser connection | Captions |
|---|---|---|---|---|---|---|---|---|
| OpenAI Realtime | `gpt-realtime-2.1` (2026-07-06) | text $4 / cached $0.40 / out $24; **audio $32 / cached $0.40 / out $64** per 1M tokens ([pricing](https://developers.openai.com/api/docs/pricing)) | $0.033 / $0.061 (first turn) | ≈ $0.09–0.10 | $27–33 / $56–61 | Function calls arrive in the browser over the data channel; `search_wiki` would need a new server route, or an MCP server the API calls itself | WebRTC via a server SDP exchange (`POST /v1/realtime/calls`) or an ephemeral `ek_` secret (`POST /v1/realtime/client_secrets`, TTL 600 s default, 10–7,200 s) | `response.output_audio_transcript.delta`; input transcription optional and billed |
| OpenAI Realtime | `gpt-realtime-2.1-mini` | text $0.60 / $0.06 / $2.40; audio $10 / $0.30 / $20 | $0.0066 / $0.015 | ≈ $0.023–0.025 | $6–7 / $15 | same | same | same |
| OpenAI GPT-Live | `gpt-live-1` (GA 2026-09-10) | **$0.05 per minute of session, billed per second**; backend billed separately ([model](https://developers.openai.com/api/docs/models/gpt-live-1)) | with GPT-4o via `/api/chat`: $0.029 / $0.047 | ≈ $0.08–0.12, plus $0.05 per idle open minute | $29 / $47 + idle | "Client delegation": the app runs its own agent and sends back a result of at most 500 tokens, which GPT-Live speaks | Server posts SDP to `POST /v1/live/sessions`; key stays on the server | `session.input_transcript.delta`, `session.output_transcript.delta` |
| Google Gemini Live | `gemini-3.8-live` | audio in $3 (≈ $0.005/min), audio out $12 (≈ $0.018/min), text $0.75 / $4.50; **no caching** ([pricing](https://ai.google.dev/gemini-api/docs/pricing)) | $0.009 / $0.016 first turn; later turns grow ≈ 50% each | ≈ $0.03–0.04 + $0.0045 per listening minute | $9–16 and more | The client must answer tool calls itself | WebSocket with an ephemeral token (preview; 1 min to start, 30 min life; config can be locked server-side) | input and output transcription (billed) |
| ElevenLabs Agents | hosted STT/TTS + custom LLM | $0.08 per connection minute (95% off silences over 10 s); plans $0–990/mo with 15–12,375 min; LLM billed on top ([pricing](https://elevenlabs.io/pricing/agents)) | with GPT-4o: $0.037 / $0.066 | ≈ $0.11–0.14 | $37 / $66 | Client tools (DOM) fit `scroll_to`/`highlight_project`; a custom LLM must speak OpenAI Chat Completions or Responses SSE, which `/api/chat` does not | signed URL (15 min) or WebRTC token | `onMessage` transcripts |
| Deepgram Voice Agent | STT + LLM + TTS | $0.075/min Standard, $0.059/min bring-your-own LLM, billed on WebSocket connection time ([pricing](https://deepgram.com/pricing), via a fetch summary) | $0.019 / $0.046 | $0.075 | $19 / $46 | client or server functions | WebSocket + JWT (30 s default TTL) | not checked |

- **OpenAI billing rules** ([voice latency and cost](https://developers.openai.com/api/docs/guides/voice-latency-cost)):
  - Realtime cost accrues "when a Response is created"; "There is no cost currently for network bandwidth or connections"; and "The entire conversation is sent to the model for each Response". So each turn re-bills the whole history, at the cached rate where the cache holds.
  - GPT-Live is billed on active time, which "includes time when the user speaks, the assistant speaks, both are silent, or the backend is working".
  - `POST /v1/live/sessions` "bills 15 seconds of voice duration while the session initializes", credited once the session runs ([live conversations](https://developers.openai.com/api/docs/guides/live-conversations)).
- **Gemini.**
  - Gemini Live "charges you per turn for all tokens present in the session context window" ([best practices](https://ai.google.dev/gemini-api/docs/live-api/best-practices)). With caching "Not supported" for `gemini-3.8-live` ([model](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-live)), each turn re-bills the past audio at full price.
  - Its free tier is "Free of charge", but free-tier content is "Used to improve our products" ([pricing](https://ai.google.dev/gemini-api/docs/pricing)).
- **Session limits.**
  - "The maximum duration of a Realtime session is 60 minutes" ([realtime conversations](https://developers.openai.com/api/docs/guides/realtime-conversations)).
  - Gemini Live: audio sessions are limited to 15 minutes without context compression, connections to ≈ 10 minutes ([session management](https://ai.google.dev/gemini-api/docs/live-api/session-management)).
  - GPT-Live's limit is not stated **(unverified)**.
- **Latency.** No first-party doc gives a number. OpenAI calls the Realtime API the choice for "barge-in, low first-audio latency" ([realtime guide](https://developers.openai.com/api/docs/guides/realtime)). A secondary report quotes OpenAI's turn-taking figures: 0.80 s for GPT-Live, 1.41 s for `gpt-realtime-2.1` ([unite.ai](https://www.unite.ai/openais-gpt-live-1-arrives-in-the-api-at-0-05-per-minute/); openai.com returned 403, **unverified**).

### 4.2 Chained vs speech-to-speech, in OpenAI's own words

OpenAI's [voice agents guide](https://developers.openai.com/api/docs/guides/voice-agents) compares three architectures:

| Architecture | "Best for" | "Why choose it" |
|---|---|---|
| GPT-Live | "Full-duplex conversations with a separate backend" | "Keep your existing text workflow and choose its backend independently" |
| Realtime (speech-to-speech) | "Speech, reasoning, and tool use in one session" | "Use one model to interpret audio, decide what to do, and respond in speech" |
| Chained (STT → text agent → TTS) | "Control over each speech and text stage" | "Inspect or transform intermediate text and replace each component independently" |

- The chained pipeline lets you "run policy checks before the text agent responds … generate speech only after the workflow reaches an approved answer".
- Speech-to-speech works "without an intermediate text-to-speech or speech-to-text step. This enables lower latency".
- GPT-Live "delegates task work to your existing agent. For a chained pipeline, it replaces the separate speech-to-text and text-to-speech stages" ([live migration](https://developers.openai.com/api/docs/guides/live-migration)).
- GPT-Live also comes with a warning: "A text agent or chained pipeline can validate a complete reply before displaying or speaking it. With GPT-Live, conversation and backend work run at the same time" ([live migration](https://developers.openai.com/api/docs/guides/live-migration)).

### 4.3 What each would do to this site's chat backend (analysis)

| | Realtime S2S (`gpt-realtime-2.1[-mini]`) | GPT-Live + client delegation to `/api/chat` | Chained (STT → `/api/chat` → TTS) |
|---|---|---|---|
| Model call | **Replaces** `streamText` with GPT-4o for voice turns | Keeps it: each delegation POSTs to `/api/chat` | Keeps it |
| Retrieval | Duplicated: a new route wrapping `retrieveChunks`, called from the browser's tool handler (or an MCP server) | Kept | Kept |
| Tool effects (`scroll_to`, `highlight_project`) | Run in the browser from Realtime function calls | Kept (they arrive in the `/api/chat` stream) | Kept |
| Rate limit | Moves to session minting; **one minted session allows unlimited turns** for up to 60 min | New session route + existing per-request limit | Existing, plus limits on the new STT/TTS routes |
| Cost cap | Blind: Realtime `response.done` usage reaches the browser, not the server, unless a server "sideband" connection listens. Audio priced as text is under-counted ≈ 12.8× on input and ≈ 4.3× on output | Needs a voice-seconds counter next to the token counter | Needs per-character / per-second counters |
| System prompt | **Exposed.** `session.created` "will contain the default Session configuration", and the reference example includes `"instructions"` and `"tools"` ([server events](https://developers.openai.com/api/reference/resources/realtime/server-events)). Over browser WebRTC the full persona prompt, including the two confidential names, would be readable in devtools. A client can also send `session.update` or override the secret's config | Stays in `/api/chat`; GPT-Live gets only a short voice prompt | Stays |
| Replies checked before they are spoken | No | No (per OpenAI's warning above) | Yes, the text exists first |
| Server additions | minting route (+ search route) | session route (SDP exchange) | 1–2 routes |

- **Other pieces (analysis).**
  - OpenAI project hard spend limits (since 2026-07-22) return 429 when reached, a backstop outside the app ([spend limits](https://developers.openai.com/api/docs/guides/spend-limits)). "Enforcement is not instantaneous".
  - Realtime "prompts" referenced by ID (the `prompt` field in the session object) might keep the instruction text off the wire. Whether `session.created` then omits it is **unverified**.

### 4.4 SDKs and hosting

- **AI SDK.**
  - `ai` 6.0.168 has **no realtime support**; a grep of `dist/index.d.ts` for "realtime" finds nothing, and neither does the latest v6 (6.0.293).
  - Experimental realtime arrived in `ai` 7.0.0 (2026-06-25): `openai.experimental_realtime` (including `gpt-live-1`), an `experimental_useRealtime` hook, and `experimental_getRealtimeToolDefinitions`. "Realtime tool execution is client-driven" ([AI SDK realtime](https://ai-sdk.dev/docs/ai-sdk-core/realtime)). Adopting it means the v6 → v7 upgrade.
- **Browser bundle weight** (sub-run measurement; esbuild minify, react external, gzip -9):

  | Package | gzip |
  |---|---|
  | `@openai/agents-realtime` 0.18.0 (MIT) | ≈ 349 KB |
  | AI SDK 7 `useRealtime` + OpenAI model | ≈ 180 KB |
  | `@elevenlabs/client` | ≈ 164 KB |

  A hand-written WebRTC client needs no library **(analysis)**.
- **Vercel.**
  - Functions can serve WebSockets in public beta since 2026-06-22. Connections are "pinned to one Vercel Function instance" and "close when a Vercel Function reaches its maximum duration": 300 s on Hobby, up to 800 s (1,800 s beta) on Pro ([Vercel WebSockets](https://vercel.com/docs/functions/websockets), [limits](https://vercel.com/docs/functions/limitations)).
  - Token minting and SDP exchange are short HTTP calls. After them, audio flows browser ↔ provider directly **(analysis)**.
  - The site's Vercel plan is **unverified**.
- **Voices.** Realtime voices: alloy, ash, ballad, coral, echo, sage, shimmer, verse, marin, cedar. GPT-Live adds 12 more. One, `beacon`, is listed as English, "Regional influence" Filipino, masculine, source "Generated" ([live conversations](https://developers.openai.com/api/docs/guides/live-conversations)). The same AI-voice disclosure applies (§2.6).

---

## 5. Across all routes

### 5.1 What voice adds against the $10 cap (analysis)

- **Basis.** Prices are list prices read 2026-09-27. Today's text chat is ≈ $0.0167 per short and ≈ $0.0174 per long reply (§0). "Per $10" is how many replies the default cap covers when chat and voice share it. Voice-in adds ≤ $0.0004 per question on any paid option, so it barely moves these numbers.

| Route | Per reply, short / long | Replies per $10, short / long | 1,000 replies a month, short / long | Voice-only share of that |
|---|---|---|---|---|
| Text chat only (today) | $0.0167 / $0.0174 | 599 / 575 | $16.7 / $17.4 | — |
| + browser STT + `speechSynthesis` | same | 599 / 575 | $16.7 / $17.4 | $0 |
| + babble (§3) | same | 599 / 575 | $16.7 / $17.4 | $0 |
| + in-browser Whisper / Kokoro | same | 599 / 575 | $16.7 / $17.4 | $0, but 28–326 MB of downloads |
| + Google Chirp 3 HD inside the free 1M chars | same (+ $0.00025 STT) | ≈ 590 / 567 | ≈ $16.9 / $17.6 | ≈ $0.25 |
| + `gpt-4o-mini-transcribe` + `tts-1` | $0.0185 / $0.0236 | 542 / 423 | $18.5 / $23.6 | $1.75 / $6.25 |
| + `gpt-4o-mini-transcribe` + `gpt-4o-mini-tts` | $0.0187 / $0.0248 | 533 / 404 | $18.8 / $24.8 | $2.0 / $7.3 |
| + Deepgram Aura-2 (or Chirp 3 HD past the free tier) | $0.0199 / $0.0296 | 501 / 337 | $19.9 / $29.6 | $3.2 / $12.2 |
| + ElevenLabs Flash | $0.0220 / $0.0377 | 456 / 266 | $21.9 / $37.7 | $5.3 / $20.3 |
| Realtime `gpt-realtime-2.1` (replaces the chat call) | $0.033 / $0.061 | 303 / 164 | $33 / $61 | — |
| Realtime `gpt-realtime-2.1-mini` (replaces the chat call) | $0.0066 / $0.015 | ≈ 1,500 / 667 | $6.6 / $15 | — |
| GPT-Live + `/api/chat` | $0.029 / $0.047 + idle time | 345 / 213 | $29 / $47 + idle | ≈ $12 / $30 |
| Gemini 3.8 Live (first turns; later turns cost more) | $0.009 / $0.016 | ≈ 1,090 / 633 | $9 / $16 + | — |

- **Per minute of listening.** Measured in minutes of generated speech:
  - separate TTS: `tts-1` $0.013, `gpt-4o-mini-tts` ≈ $0.015, Chirp 3 HD and Aura-2 $0.026, ElevenLabs Flash $0.043, Cartesia $0.049–0.056;
  - speech-to-speech, per minute of conversation: `gpt-realtime-2.1` ≈ $0.09–0.10, GPT-Live ≈ $0.08–0.12, mini ≈ $0.024.
- **The current cap cannot count any of these.** It counts only GPT-4o tokens, at a stale $15 output price (§0). Each paid route needs its own counter, in characters, seconds or audio tokens. The speech-to-speech routes need usage from a server-side connection, because Realtime usage events reach the browser (§4.3).
- **The rate limit counts requests to `/api/chat`.** New voice routes, or a minted realtime session, are outside it unless they get their own limit.

### 5.2 Server and client footprint per route (analysis, from §1–§4)

| Route | New server code | Where keys live | Client weight | Permissions and prompts |
|---|---|---|---|---|
| Browser STT + `speechSynthesis` | none | none | 0 KB | mic prompt (+ Safari's Speech Recognition permission) |
| Babble | none | none | 0 KB (synthesis) to a few KB of samples + code | none |
| Paid STT (upload) | `app/api/transcribe` route | server env var | 0 KB (`MediaRecorder`) | mic prompt |
| Paid TTS (per sentence) | `app/api/speech` route streaming audio through | server env var | 0 KB (`<audio>` or `decodeAudioData`) | none; plays after the audio unlock |
| Paid streaming TTS (WebSocket) | a token-minting route | minted short-lived token | small client code | none |
| In-browser models | none; COOP/COEP headers for fast WASM | none | 28–326 MB models + 2 MB runtime | mic prompt for STT |
| Realtime S2S | minting or SDP route, a search route, a sideband for usage | server; ephemeral secret in the browser | 0–349 KB gzip | mic prompt |
| GPT-Live | SDP route, voice-seconds counter | server | 0–180 KB gzip | mic prompt |

### 5.3 Accessibility

Quotes are from [WCAG 2.2](https://www.w3.org/TR/WCAG22/) (Recommendation, 12 December 2024) and [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/) (Recommendation, 6 June 2023).

- **Captions: the text is already there.**
  - Every route here voices a reply that is also rendered as text, in a list that is `aria-live="polite"` (§0).
  - WCAG 1.2.1 (A) asks for a text alternative only for **prerecorded** audio-only content, and it exempts audio that "is a media alternative for text and is clearly labeled as such". So a spoken reply whose text is on screen already has its caption **(analysis)**.
  - What "captions" can add is timing: highlighting the sentence or word being spoken. The timing can come from `boundary` events, from per-sentence playback starts, from realtime transcript deltas, or from the babble schedule.
  - Speech-to-speech is the exception. Its text arrives as a transcript of the audio, not before it, so the caption lags or leads the voice by the transcript's timing (§4.1).
- **Never voice-only.**
  - 2.1.1 Keyboard (A) and 2.5.2 Pointer Cancellation (A) apply to hold-to-talk (§1.4).
  - Voice-in must stay an extra path next to typing, and voice-out an extra layer over the text. The entrypoint ticket already requires this ("The entrypoint must work fully without it").
- **A way to stop speech.**
  - 1.4.2 Audio Control (A): "If any audio on a web page plays automatically for more than 3 seconds, either a mechanism is available to pause or stop the audio, or a mechanism is available to control audio volume independently from the overall system volume level." A long reply is ≈ 28 s.
  - The Understanding doc treats audio started by "a link or button with clear labelling or context that it will start an experience where audio will play" as the user's intended action, not autoplay ([Understanding 1.4.2](https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html)).
  - A reply that is spoken because a stored "voice on" preference is set sits in the same grey zone as the score (*Audio stack* §2.4).
  - Stop hooks exist on every route:
    - `speechSynthesis.cancel()`;
    - pausing the `<audio>` element or stopping the source node;
    - `output_audio_buffer.clear` or a response cancel on Realtime;
    - stopping the blip scheduler for babble.
- **Screen readers.**
  - "Individuals who use screen reading software can find it hard to hear the speech output if there is other audio playing at the same time" ([Understanding 1.4.2](https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html)).
  - The list is `aria-live="polite"`, so a screen reader already reads each reply aloud. A spoken voice or babble would play on top of that reading.
  - Screen-reader use cannot be detected (*Audio stack* §5.1).
  - ARIA 1.2: `polite` means updates "should generally not interrupt the user". Authors "SHOULD" set `aria-busy` "when content is being updated, particularly for live regions".
- **Status messages.** 4.1.3 Status Messages (AA): states such as "Listening…", "Transcribing…" and "Speaking" have to be exposed through a role such as `status`, without moving focus.
- **The speaking cue.** 2.2.2 Pause, Stop, Hide (A) covers moving content that "starts automatically, lasts more than five seconds, and is presented in parallel with other content". A cue that animates for a 28 s reply falls under it unless stopping speech also stops the cue **(analysis)**. The map's standing constraint 4 adds a reduced-motion branch.
- **Hard of hearing.**
  - 1.4.7 Low or No Background Audio (AAA) covers only prerecorded speech. It gives a number: background sounds "at least 20 decibels lower than the foreground speech content", which is "approximately four times quieter".
  - The reason given: "People who are hard of hearing often have great difficulty separating speech from background sound" ([Understanding 1.4.7](https://www.w3.org/WAI/WCAG22/Understanding/low-or-no-background-audio.html)).
  - It is a reference level for ducking (§5.4), not a requirement here.

### 5.4 Lowering the score while the bot talks (ducking)

- **Routes whose voice can be a Web Audio node.** Paid TTS, in-browser TTS, babble and realtime audio can all play as nodes in the same `AudioContext` as the score.
  - Ducking is then a gain automation on the score bus: `setTargetAtTime` down when the voice starts and back up when it ends. *Audio stack* §6 already measured that pattern with GSAP-computed targets.
  - A continuous "sidechain", where the score follows the voice's loudness, needs an `AnalyserNode` or an `AudioWorklet` envelope follower. `DynamicsCompressorNode` has one input and no sidechain ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode): "Number of inputs 1").
  - Support: `AnalyserNode` Chrome 14, Firefox 25, Safari 6; `AudioWorkletNode` Chrome 66, Firefox 76, Safari 14.1 ([BCD](https://github.com/mdn/browser-compat-data/tree/main/api)).
- **`speechSynthesis`.** The voice never enters Web Audio (§2.1), so ducking can only follow the `start` and `end` events of each utterance. The level cannot follow the speech itself.
- **Realtime over WebRTC.** The remote track can feed `createMediaStreamSource()`. Chromium is widely reported to deliver silence from a remote WebRTC stream to Web Audio unless a (muted) media element also plays the stream **(unverified; secondary reports)**.
- **Depth (analysis).** WCAG 1.4.7's 20 dB is a gain of × 0.1; 12 dB is × 0.25. The score's levels and the voice's loudness are for the listening pass.
- **iOS.** Holding to talk switches the page to `play-and-record` (§1.4), which may change the score's level and route on its own. The system and the site's own ducking could then both lower the score at once **(analysis; unverified on a device)**.
- **Other apps' audio.** Chrome treats Web Audio as "ambient" and never pauses other media for it (*Audio stack* §5.3). The Audio Session types `transient` and `transient-solo` exist to duck or pause other apps' audio, in Safari only ([Audio Session ED](https://w3c.github.io/audio-session/)).

### 5.5 Cues that the bot is speaking, on a rig-less bot

- **What the page can read on each route** (facts from §2–§4; the cue itself is design work):

  | Route | What the page can read | Resolution |
  |---|---|---|
  | `speechSynthesis` | `start`, `end`, `boundary` (word or sentence index) events | Event times only; `boundary` is partial in Chrome |
  | Paid or in-browser TTS through Web Audio | `AnalyserNode` time-domain or frequency data every frame; the start and end of each sentence | A loudness envelope per frame |
  | Babble | Every blip is scheduled by the page, so its time, pitch and source character are known in advance | Exact, with no analysis |
  | Realtime API | The remote track through an `AnalyserNode`, plus response and transcript delta events | A per-frame envelope plus text |

- **Levers on a rig-less bot.**
  - A hover bot is a node hierarchy of body, head and eyes with no skeleton. Look-at, bob, tilt and blink are GSAP tweens on node transforms or morph weights. glTF keeps shape keys, so a "mouth" or "eye squash" morph target is available ([3d-routes.md](3d-routes.md), *3D route verdict*).
  - A loudness envelope read on `gsap.ticker` can drive a morph weight or a transform through `gsap.quickTo` **(analysis)**.
- **Constraints already on the map.**
  - The effects rule bans generic effects: glow, bloom, pulsing dots.
  - Standing constraint 2 keeps text as real HTML, so any speech bubble or caption is DOM.
  - Constraint 4 needs a reduced-motion branch, e.g. a "Speaking" status in text and a static pose change instead of motion **(analysis)**.
- **The cue has to work without sound.** A visitor with sound off, or a screen-reader user, still reads the reply. The bot's "talking" state can be tied to the text stream rather than to audio, so the bot visibly answers even when it is silent **(analysis)**.

---

## What this means for the choice (trade-offs, not a verdict)

These restate the facts above as the axes the verdict will weigh **(analysis)**.

- **Reach of free voice-in.**
  - `SpeechRecognition` works in Chrome, Edge and Safari (desktop and iOS). It does not work in any Firefox release, and it fails in Chromium re-builds without Google keys.
  - Where it works, the audio goes to Google (Chrome), Microsoft (Edge) or Apple (Safari, unless on-device). Chrome desktop can promise on-device for English after a language-pack download. Chrome Android cannot.
  - A paid or in-browser model reaches every browser with `getUserMedia`, at $0.11–0.50 per 1,000 questions (paid) or 28–77 MB of download (in-browser).
- **Quality and control of free voice-out.**
  - `speechSynthesis` is free, has no latency and needs no server. Its voice differs per visitor, novelty voices included. On iOS it needs a gesture-primed first utterance. Its audio cannot be ducked, analysed or pitched through Web Audio.
  - Paid neural TTS gives one controlled voice. It costs $1.50–20 per 1,000 replies (OpenAI to ElevenLabs), or $0 inside Google's free tier. It adds a route and a key, and it carries the AI-voice disclosure rule.
- **Streaming.**
  - Only `speechSynthesis`, babble and the WebSocket TTS vendors can start speaking before the first sentence is complete.
  - OpenAI TTS and the AI SDK helper work per sentence or per reply.
  - Speech-to-speech speaks as it thinks, but then there is no text to check before it is spoken.
- **Speech-to-speech is the expensive and invasive end.**
  - `gpt-realtime-2.1` covers 164–303 replies per $10. It moves the model call, retrieval, rate limit and cost accounting out of `/api/chat`, and over browser WebRTC it exposes the persona prompt with the confidential names.
  - `gpt-realtime-2.1-mini` and Gemini Live are cheaper per reply than today's GPT-4o chat. They still carry the same structural changes, and they swap the chat model.
  - GPT-Live keeps `/api/chat` whole. It costs $0.05 per session minute, idle time included, and speaks before results can be checked.
- **The non-verbal voice.** It is the only route that is free, needs no permission, key, vendor or disclosure, fits the *Audio stack* engine as-is, and gives the speaking cue exact timing. It carries no words, so it never replaces the text or a screen reader. The details are in §3.
- **Every paid route is a paid item** under the map's asset rule, and a new endpoint beside the chat backend redraws the map's out-of-scope line.

## Open questions for the verdict

1. **Voice in, voice out, both or neither?** And is voice-in a real conversation mode, or a convenience next to typing?
2. **Which voice-in path, given the reach?** `SpeechRecognition` misses Firefox and sends audio to Google, Microsoft or Apple. Is a gap in Firefox acceptable, with the mic control hidden where `SpeechRecognition` is missing? Or does voice-in go through a paid or in-browser model so that it works everywhere?
3. **Is a human-sounding voice wanted at all**, given the Trionn reaction ("more like a gimmick") and the persona speaking as Janriz in first person? If yes, is it the visitor's own system voice (free, varies per device) or one chosen neural voice (paid, needs the disclosure)?
4. **Non-verbal: which technique and persona?** Sample-based Animalese from self-recorded syllables, or pure synthesis? One pitch per bot, or per mood? This waits on the bot's persona (*Pick the creative concept* and the visual language).
5. **Default state.** Voice on or off by default, and how it relates to the sound toggle from *Audio stack verdict*. One toggle for all sound, or a separate voice toggle? A stored "on" can only arm, never autoplay (*Audio stack* §2.4).
6. **Screen readers.** The replies are already read aloud from the `aria-live` list. Should voice or babble stay off unless the visitor turns it on, so the two never overlap?
7. **Captions.** The text is on screen already. Is sentence or word highlighting in time with speech wanted, or just a "speaking" state?
8. **Budget.** Does a paid voice route share the $10 cap or get its own? The cap already covers only ≈ 480–600 text replies a month, and its GPT-4o output price is stale ($15 in code vs $10 list).
9. **Hold-to-talk vs tap-to-talk,** and the keyboard equivalent (WCAG 2.1.1, 2.1.4, 2.5.2).
10. **iPhone behaviour** that only a device can answer:
    - Does the score dip or move to the earpiece while the mic is open?
    - Does `speechSynthesis` obey the Silent switch?
    - Does Safari re-prompt for the mic after a minute?

## Unverified or flagged

**Needs a real device** (the *Voice verdict* listening pass on Janriz's laptop and iPhone):
- Recognition accuracy and time-to-text of `SpeechRecognition` in Chrome, Edge and Safari. Headless runs cannot open a real mic.
- Whether iOS Safari re-prompts for the mic after a minute idle, and whether the Speech Recognition system prompt appears on first use.
- Whether the score dips or moves to the earpiece while the mic is open on a 2026 iPhone (WebKit bugs 218012 and 230902 closed as "configuration changed").
- Whether `speechSynthesis` obeys the iOS Silent switch, and which voices a stock iPhone exposes.
- Whether Chrome 153's long-utterance cut-off (Chromium 41346274, 679437) still happens with local voices.
- Chrome's remote "Google" voices (not loaded headless): quality and latency.
- Everything on Android and Firefox: no device or Firefox build was used. The Firefox facts come from source and BCD.
- Phone speed of in-browser Whisper, Moonshine and Kokoro, and phone CPU cost of babble. All measurements were on an Apple M5.
- Babble render cost in a real-time (not offline) context, and on WebKit with just-in-time scheduling.

**Not confirmed at a primary source:**
- `gpt-4o-mini-tts` ≈ $0.015/min. Not on OpenAI's current pages; the per-reply figures use it.
- OpenAI's usage-policies page (403 to the fetchers). The disclosure rule is quoted from the TTS guide instead.
- OpenAI GPT-Live and Realtime latency figures (0.80 s and 1.41 s). From a secondary report; openai.com returned 403.
- GPT-Live's session length limit, and whether its transcripts are included in the per-minute price.
- Whether Realtime prompts referenced by ID keep instruction text out of `session.created`.
- Gemini Live: whether listening tokens accumulate in context, and free-tier limits.
- Deepgram figures. The Voice Agent price came from a fetch summary, not the raw page; per-second billing is from a vendor blog; Aura output formats and licence terms are unchecked.
- ElevenLabs: v3 on the `stream-input` WebSocket; free-plan overage billing.
- Google: attribution or licence terms on TTS output, and a browser token model.
- Edge "Online (Natural)" voices being remote. Inferred from the name; not stated on a Microsoft page seen.
- Apple's one-minute server recognition limit applying inside Safari, given WebKit's one-hour private setting.
- WebKit refusing speech recognition inside iOS apps that lack a usage string (Chrome iOS, in-app browsers). Read from source only.
- Chromium delivering silence from a remote WebRTC track to Web Audio without a media element (secondary reports).
- Animal Crossing engine details from third-party reverse engineering; techniques behind Undertale, Banjo-Kazooie, Hollow Knight and others; R2-D2 details beyond Burtt's NPR interview.
- Sample origins for `animalese-tts` and `@wheen/voices`. Licence terms of commercial itch.io blip packs for a public website repo.
- Kitten TTS in the browser. The licences of the Piper voices marked "See URL".
- Whether CC BY terms on TTS training data (Kokoro `ff_siwis`, Piper `libritts_r`/`vctk`/`alba`) reach generated audio.
- **Legal questions, not research questions:** whether shipping eSpeak NG (GPL-3.0) inside `kokoro-js`'s `phonemizer` or Piper's web runtimes puts GPL obligations on the site.
- The site's Vercel plan (it sets WebSocket and function duration limits).

**Assumptions that drive the cost figures:**
- Reply sizes: 100 / 400 characters, 7 / 28 s.
- Two model passes per factual reply.
- ≈ 1,800 tokens of retrieved chunks.
- A ≈ 2 s backend wait inside realtime sessions.
- No reasoning tokens on `gpt-realtime-2.x`. Reasoning tokens would raise its figures.
- No cross-session cache hits.
