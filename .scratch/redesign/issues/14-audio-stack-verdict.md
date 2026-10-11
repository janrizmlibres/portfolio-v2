# Audio stack verdict

Type: prototype
Labels: wayfinder:prototype
Status: resolved
Blocked by: 11

## Question

Which audio stack does this site commit to, and with which defaults? The facts are in *Audio stack* ([../research/audio-stack.md](../research/audio-stack.md)), and its "Open questions for the decision" section lists them in full. The answer settles:

- **Library.** Raw Web Audio, Howler or Tone.js. If raw, is ZzFX's generator in?
- **Where the bed comes from.** Pre-rendered Opus stems, live synthesis, or a hybrid (rendered bed, live SFX and instrument). If stems: which free tool makes them (BeepBox, Surge XT, code rendered offline).
- **Format and fallback.** Opus/WebM plus an MP3 fallback for iOS before 17.4, or something else.
- **Default and unlock.** No browser plays sound on arrival: a click, tap or key press must come first. So the choices are these, for **first visits** and for returning visitors with "on" stored:
  - **Armed by default.** The toggle shows as on, and the first click, tap or key press anywhere starts the score. Under WCAG 1.4.2 that counts as autoplay, and the toggle is the required control.
  - **Off until chosen.** Sound starts only from the toggle or a non-gating "headphones" invite.
- **iOS Silent switch.** Keep the default `ambient` session (the Silent switch mutes the score), or set `audioSession.type = "playback"` (the score plays through Silent mode but stops the visitor's music).
- **Hidden tab.** Suspend, duck, or keep playing.
- **Tiers.** What the mobile tier starts with (mono, fewer stems, a synthesised bed, or sound off). Whether reduced motion changes sound (e.g. no scroll-driven pitch, no hover SFX), given there is no audio preference to read.
- **Byte budget, fetch timing and hosting.** How many audio bytes. When to fetch: on hover or focus of the toggle, on idle, or once sound is on. Content-hashed names plus a `headers()` cache rule.

Build one throwaway listening page. On it, the **same short bed** runs two ways, as live synthesis and as pre-rendered Opus stems. Each version is driven by a scroll mix table (targets from GSAP, smoothed by `setTargetAtTime`), a sound toggle with a 1 s fade, one chat-state change and a voice-capped pentatonic harp. Janriz listens on his laptop **and his iPhone**. The phone pass covers what the research could not verify on real devices: the Silent switch, backgrounding, and the Opus fallback. He reacts, and the answer is the stack and its defaults. Resolving this ticket also writes the audio stack ADR in `docs/adr/`.

Out of this ticket: which transitions and interactions make sound, where the instrument lives, the score's actual composition, and volumes. Those are *Score the voyage*'s, from the plan in *Plan the signature moments*.

## Comments
- 2026-10-01 — From [Plan the signature moments](13-plan-the-signature-moments.md) (resolved; ADR 0005): **the wake-up settles the unlock.**
  - Every load opens on Pip charging up, and nothing works until a click, tap, Enter or Space wakes him. Sound comes on with that click, on every load.
  - So the "Default and unlock" choice is made: sound is on from the wake-up click. "Off until chosen" is out.
  - Still yours:
    - whether a visitor's mute is remembered across visits;
    - the tiers;
    - everything else in the Question.
  - Where sound goes is now [Score the voyage](build.md#t47), which waits on this ticket.
- 2026-10-01 — **Listening page built:** [prototypes/audio-stack/](../prototypes/audio-stack/README.md). It needs Janriz's ears, on the laptop and the iPhone.
  - **What it is:** the same 24 s bed, as **A · Live** synthesis and **B · Stems**. The stems are rendered from the same `bed.js` in an `OfflineAudioContext` and encoded to Opus/WebM, with MP3 fallbacks. Both engines get the scroll mix table, the 1 s toggle, Ask Pip and the voice-capped harp.
  - **Headless facts** (Chromium 147, WebKit 26.4; `shots/check.json`):
    - A and B are within 1.4 dB in every section;
    - the whole engine is 4.6 KB gzip;
    - the stems are 1,384 KB stereo or 699 KB mono, and 61.5 or 30.8 MB decoded;
    - every loop is sample-exact in both engines and both formats;
    - the live engine keeps about 280–400 sources alive.
  - **Bug found:** the toggle's fade was a cut (the late-ramp jump from the research's §6.1). Fixed by pinning the current value before every ramp.
  - **Proposed defaults** are in the README, pending the listening pass. In short: raw Web Audio, no ZzFX; a hybrid (stem bed, live harp and one-shots); Opus/WebM with an MP3 fallback; remember mute; keep iOS on `ambient`; suspend when the tab is hidden; mono stems on phones; reduced motion leaves sound alone; the hero's layers load under the charge.
- 2026-10-01 — **Janriz's first listen (laptop):**
  - A and B "basically sound the same".
  - The section changes ease well.
  - The harp's notes come through fine at a cap of 16 with the 40 ms cut.
  - **A constant "swoosh" was unpleasant and threw him off.** That's the air layer: noise whose band sweeps every 12 s. It's now off by default, with a setting to bring it back and compare. *Score the voyage* should not use a constant noise wash.
  - **He has no iPhone,** and this Mac has no Xcode or iOS Simulator.

## Answer

Resolved 2026-10-01, from Janriz's laptop listen and his picks. Recorded in **ADR 0006** (`docs/adr/0006-the-score-plays-from-rendered-stems.md`); the listening page is [prototypes/audio-stack/](../prototypes/audio-stack/README.md).

- **Library:** raw Web Audio, one context, no library. ZzFX is out. The prototype's whole engine was 4.6 KB gzip.
- **The score: a hybrid.** Janriz heard A (live) and B (stems) as the same, and picked **stems, with a live instrument**.
  - The stand-in was written as code and rendered to stems offline (`OfflineAudioContext` in headless Chromium), with sample-exact loops. The prototype's `render.js` is the pipeline.
  - After the verdict Janriz heard the stand-in as "a 2D pixel video game rather than production-level". So where the real score comes from (a music tool, a composer, or code) went to *Score the voyage*. The engine only plays files.
  - The stems play sample-locked, with levels from a per-section mix table.
  - The instrument, Pip's chirp and emotes, and UI sounds are live.
- **Format:** Opus/WebM at 64k with constrained VBR, and an MP3 (LAME) fallback chosen by `canPlayType` plus a decode try/catch.
- **Defaults** (Janriz's picks):
  - **mute remembered** across visits;
  - **iOS Silent switch respected** (the `ambient` session, never `playback`);
  - **a hidden tab fades out and pauses**.
  - Sound on with the wake click was already settled (ADR 0005).
- **Tiers:** phones hear the same score from mono stems. Reduced motion leaves sound alone. The instrument keeps 16 voices with a 40 ms cut everywhere, which Janriz heard as fine.
- **Bytes and loading:**
  - stems within 1.5 MB stereo / 0.75 MB mono, decoded within 64 / 32 MB;
  - the hero's layers load under the charge, the rest after the wake;
  - content-hashed files in `public/audio/` with a long-cache `headers()` rule.
- **Not verified:** the iPhone pass (the Silent switch, backgrounding, Opus decoding on iOS). Janriz has no iPhone and this Mac has no Simulator, so it moves to the QA plan. The MP3 fallback and the restore control cover failure.
- **For *Score the voyage*:** no constant noise wash. The air layer's swoosh was unpleasant to Janriz and is out of the stand-in.
- **Graduated:** [Build the audio engine](build.md#t48). *Score the voyage* now waits on it.
