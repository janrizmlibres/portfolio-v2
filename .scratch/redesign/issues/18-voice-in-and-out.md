# Voice in and out

Type: research
Labels: wayfinder:research
Status: resolved
Blocked by: —

## Question

What are the realistic ways for the bot to listen and to talk on this site, and what does each cost? Facts with primary sources, not a verdict. The verdict is *Voice verdict*.

- **Voice in (speech-to-text).**
  - The browser's `SpeechRecognition`: support in Chrome, Edge, Safari, Firefox, iOS and Android; where the audio is sent; languages; interim results.
  - Paid transcription APIs (OpenAI's current models and others): price per minute, latency, streaming, and what a new route handler would need.
  - Hold-to-talk mechanics: `getUserMedia`, the permission prompt, iOS Safari quirks.
- **Voice out (text-to-speech).**
  - The browser's `speechSynthesis`: voices per OS, quality, speaking sentence by sentence as text streams, iOS quirks.
  - Paid neural TTS (OpenAI's current models and others): price per reply at the system prompt's 1–4 sentences, time to first audio, streaming, and whether the licence allows commercial use of the voice.
- **Non-verbal voice.** Babble synthesised in Web Audio as the text streams, such as Animal Crossing's "Animalese", and R2-D2-style beeps: technique, precedents, and cost on the stacks in *Audio stack*.
- **Speech-to-speech.** Realtime voice APIs (OpenAI Realtime and others): cost per minute, whether they can keep this site's retrieval and tool effects, and how much of the chat backend they would replace.
- **Across all of them.**
  - What voice adds against the monthly cost cap.
  - Accessibility: captions for spoken replies, never voice-only, and a way to stop speech.
  - Lowering the score while the bot talks.
  - Visual cues that the bot is speaking, on a rig-less bot.

Janriz found Trionn's spoken robot voice gimmicky, so the non-verbal option gets equal weight.

## Answer

Full findings and citations: [../research/voice.md](../research/voice.md). Facts, not a verdict: the verdict is *Voice verdict*.

- **Voice in.**
  - **The browser's `SpeechRecognition`** is free to the site, but the audio goes to the browser vendor's cloud:
    - Chrome sends it to Google.
    - Edge sends it to Azure.
    - Safari uses Apple's Speech framework. It runs on the device when the language allows, otherwise on Apple's servers.
  - **Coverage gaps.**
    - No Firefox release has it (Nightly desktop only).
    - Chromium re-builds without Google keys get no results.
    - Chrome Android ignores `continuous` and has no on-device mode.
    - Chrome desktop 139+ can run English on the device after a language-pack download. Measured: `"downloadable"` for en-US and `"unavailable"` for fil-PH.
    - Safari needs three yeses: the app's mic access, the system Speech Recognition permission, and the site prompt.
  - **Paid transcription** costs $0.11–1.42 per 1,000 five-second questions (Groq, AssemblyAI, Deepgram, ElevenLabs, OpenAI). That is 1–14% of the $10 cap.
    - OpenAI accepts both Chrome's `webm/opus` and Safari's `mp4/AAC` recordings.
    - `whisper-1` and the `gpt-4o-*transcribe` models retire on 2027-02-26, so a new build would use `gpt-transcribe` at $0.0045/min.
  - **In-browser Whisper or Moonshine** is free but a 28–77 MB download. On an M5 it transcribed 11 s of audio in 1.1–1.9 s.
  - **The microphone prompt differs by browser.**
    - Chrome offers "Allow this time".
    - Safari may ask again after 1 minute of idle capture or after a reload.
    - On iOS, opening the mic switches the page to `play-and-record`. Old WebKit bugs describe the output getting quieter or moving to the earpiece.
- **Voice out.**
  - **`speechSynthesis`** is free and starts in 6–49 ms. It speaks a sentence queue, and `cancel()` stops it. Its drawbacks:
    - The voice varies per visitor. The Mac lists 180 voices in Chrome, including novelty voices such as "Albert" and "Zarvox", and Chrome's reported default was "Albert".
    - Chrome's "Google" voices send the text to Google.
    - On iOS the first `speak()` must happen inside a user gesture.
    - Its audio never enters Web Audio, so it cannot be ducked, analysed or pitched.
  - **Paid neural TTS**, per 1,000 long (4-sentence) replies:

    | Vendor | Cost |
    |---|---|
    | OpenAI `tts-1` | $6 |
    | OpenAI `gpt-4o-mini-tts` | ≈ $7 |
    | Deepgram Aura-2 | $12 |
    | ElevenLabs Flash | $20 |
    | Cartesia | $24.50 |
    | Google Chirp 3 HD | $0 inside its 1M free characters a month |

    - OpenAI cannot take streamed text, so it needs one request per sentence. ElevenLabs, Cartesia, Deepgram and Chirp 3 HD take text over a WebSocket.
    - OpenAI requires telling visitors the voice is AI-generated. That matters because the persona speaks as Janriz.
    - The ElevenLabs and Cartesia free tiers are non-commercial.
  - **AI SDK 6.0.168** has `experimental_generateSpeech` and `experimental_transcribe`. `generateSpeech` returns a whole file and does not stream.
  - **In-browser Kokoro** is 92–326 MB. On WASM it is slower than real time unless the site adds COOP/COEP headers. Its phonemizer bundles GPL-3.0 eSpeak NG.
- **Non-verbal.**
  - Animal Crossing's team rejected TTS because it ran "too fast" against the text. Their patent (expired) plays one short waveform per character at 30 characters/s, overlapped. "?" raises the pitch and "!" raises the volume.
  - Celeste plays a random stream of performed syllables for as long as the text draws. Ben Burtt found synth-only R2 "didn't seem to have a soul".
  - **Licence-clean code:** `animalese-web` (MIT, 1.8 KB, `onLetter` sync), `animalese-tts`, ZzFX, jsfxr, Pink Trombone, klatt-syn.
  - **Clean samples:** only Acedio's letter bank and one itch.io pack, both CC BY 4.0. The popular Animalese Typing set is ripped from the game.
  - **Self-made synthesis** needs no licence and 0 KB of assets. A 26-letter Opus sprite is 12–17 KB.
  - **Measured cost:** 0.2–0.5% of one M5 core at 25 blips/s, if finished nodes are disconnected and blips are scheduled just in time. Scheduling everything up front costs 4–30× more.
- **Speech-to-speech.**
  - **OpenAI `gpt-realtime-2.1`** costs $0.033–0.061 per reply. It runs in the browser, so:
    - it replaces the GPT-4o call;
    - `search_wiki` would need a new route;
    - one minted session allows unlimited turns;
    - usage events reach the browser, not the cost cap;
    - `session.created` would show the full system prompt, confidential names included, in devtools.
  - **The mini model** ($0.007–0.015) and **Gemini 3.8 Live** ($0.009–0.016 on a first turn, rising each turn, no caching) cost less per reply than today's GPT-4o chat. They bring the same structural changes.
  - **OpenAI GPT-Live** ($0.05 per session minute, idle time included) can delegate to the existing `/api/chat` unchanged. It speaks before a reply can be checked.
  - **AI SDK 6** has no realtime support. Realtime arrived in `ai` 7.
- **Cost.**
  - The $10 cap prices only GPT-4o tokens, and at a stale $15/M output price (list price $10).
  - Text chat alone is ≈ $0.017 a reply. So $10 already covers only ≈ 480–600 replies a month, before any voice.
  - With 1,000 replies a month, text alone already costs $16.7–17.4. Voice adds:
    - $0 for the free routes: browser speech, babble, in-browser models;
    - ≈ $2–7 for OpenAI STT + TTS;
    - ≈ $12–30 for GPT-Live.
  - `gpt-realtime-2.1` covers 164–303 replies per $10.
- **Accessibility.**
  - Every route voices text that is already on screen in an `aria-live="polite"` list. That counts as the caption under WCAG 1.2.1.
  - A screen reader will read each reply over any voice or babble, and screen readers cannot be detected.
  - A long reply is ≈ 28 s, so 1.4.2 needs a stop or volume control. Every route has a stop hook.
  - Hold-to-talk needs a keyboard path (2.1.1) and a cancel (2.5.2).
  - Ducking works as a gain ramp for every route except `speechSynthesis`, where it can only follow start and end events.
  - Speaking cues can come from `boundary` events, an `AnalyserNode` envelope, or the babble schedule, which is exact.
  - The site shows each reply only when it finishes (`onFinish`). Speaking or babbling "as it streams" first needs a paced reveal.

**Unverified:** nothing ran on a real iPhone, Android device or Firefox, and no paid API was called. Still open:
- time to first audio and transcription accuracy;
- iOS behaviour: mic re-prompts, the score's level while the mic is open, and `speechSynthesis` against the Silent switch;
- the `gpt-4o-mini-tts` per-minute price;
- the GPT-Live and Realtime latency numbers, and GPT-Live's session limit;
- whether eSpeak NG's GPL reaches a site that ships it;
- phone speed for in-browser models and babble.

The full list is in the research file's last section.
