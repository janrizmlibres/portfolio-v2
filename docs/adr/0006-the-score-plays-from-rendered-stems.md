# The score plays from pre-rendered stems, on raw Web Audio

Status: accepted (2026-10-01)

*Audio stack verdict* settled how the site makes sound. A listening page played the same 24 s bed two ways: synthesised live in the page, and from stems rendered offline from the same code. Both versions had the scroll mix, the sound toggle, a chat state and the instrument. Janriz heard no difference between them ("basically sound the same"), so the choice came down to cost.

## Decision

**Raw Web Audio, with no library.** One `AudioContext` carries everything. The prototype's whole engine was 4.6 KB gzip: both engines, the mix, the instrument and the one-shots.

**The score plays from pre-rendered stems. Everything interactive is live.**
- **The engine plays files, whatever made them.** Where the score comes from is *Score the voyage*'s call: a music tool with recorded instruments, a composer, or code.
  - The stand-in bed was written as code, from raw oscillators and filtered noise. Janriz heard it as "a 2D pixel video game rather than production-level", so code is not assumed.
  - A build script encodes the stems, names them and checks each loop's seam, whatever their source. For a score written as code it also renders them: an `OfflineAudioContext` in headless Chromium renders two cycles from silence and keeps the second, which already holds the first cycle's tails. Sustained oscillators are snapped to whole cycles per loop, so every loop wraps sample-exact.
- **The stems start together** on one audio-clock time and stay sample-locked. Each section sets their levels from a mix table.
  - A layer whose pitch follows scroll speed runs on its own, because `playbackRate` moves pitch and tempo together.
- **Live** means played on demand: the instrument at Contact, Pip's chirp and emotes, and UI sounds. Each can be synthesised or a recorded sample. Which, and whether scene-change sounds are rendered or live, is *Score the voyage*'s call.
- **Why stems:** they cost bytes but almost no CPU, and they sound the same in every browser. Live synthesis costs CPU every moment the 3D is drawing, and a richer score costs more, most of all on phones.

**GSAP decides, the audio thread smooths.**
- The page computes each layer's target from the section, scroll speed and chat status, and sends only changes, as `setTargetAtTime`.
- Discrete fades are native ramps that **pin the current value first** (`setValueAtTime(param.value, now)`). A ramp starts from the previous automation event, so one issued long after that event jumps. In the prototype that turned the toggle's 1 s fade into a cut.
- `.value` is never written per frame.

**Format: Opus/WebM, with an MP3 fallback.**
- Opus runs at 64 kbit/s stereo with constrained VBR. Plain VBR at a 64k target ran to 124 kbit/s on the bass stem.
- MP3 is encoded by LAME with its gapless header. The page picks a format with `canPlayType`, and falls back when `decodeAudioData` rejects.
- Both formats decode sample-exact in Chromium 147 and WebKit 26.4.

**Defaults:**
- **Sound comes on with the wake-up click** (ADR 0005). The score fades in over 2 s under Pip's chirp.
- **The sound toggle** fades out over 1 s, then suspends the context. Turning it back on resumes the context and fades in over 1 s.
- **A mute is remembered.** On the next visit the click wakes Pip silently, with the toggle off.
- **iOS's Silent switch is respected.** The page keeps the default `ambient` audio session and never sets `playback`.
- **A hidden tab pauses.**
  - The score fades out over 0.25 s and the context suspends. On return it resumes and fades in over 0.6 s.
  - These fades are native ramps, since `requestAnimationFrame` stops in a hidden tab.
  - If the context won't resume, or reports running with a frozen clock (an open WebKit bug), a control to restore sound appears.
- **Phones** hear the same score and mix, from mono stems at half the bytes and memory.
- **Reduced motion leaves the sound alone.** A sound tied to a visual that reduced motion replaces follows the replacement (the warp's sound follows its crossfade).
- **The instrument** has 16 voices. Past the cap the oldest is cut in 40 ms, and each note sounds at most every 100 ms. Janriz heard no cutting at 16.

**Bytes, loading, hosting:**
- **Budget:**
  - the score's stems stay within 1.5 MB stereo and 0.75 MB mono;
  - decoded, within 64 MB on desktop and 32 MB on phones.
  - For scale, the stand-in's seven 24 s stems were 1.38 MB, 61.5 MB decoded.
- **Only the hero's layers load under the wake-up's charge,** because they play on the click. For the stand-in that was about 400 KB stereo or 200 KB mono. They decode before the click, since decoding needs no running context.
- **The rest loads after the wake,** and each layer fades in at its section's level once decoded.
- **Hosting:** the files live in `public/audio/` with content-hashed names written by the render script. A `headers()` rule gives `/audio/:path*` `Cache-Control: public, max-age=31536000, immutable`, because Next serves `public/` with `max-age=0`.

## Considered options

- **Live synthesis of the whole score.** It downloads nothing, but it costs CPU every frame next to the 3D. The prototype kept 280–400 sources alive, because a cycle is scheduled ahead. Its room, a convolver, costs differently per browser version: 4× between Chromium 147 and 153 offline. Phones would need a cheaper room, and so would sound different.
- **Howler.** It has no shared start time for stems, so they can drift, and no filters or effects. It has been dormant since 2023.
- **Tone.js.** It costs 69–91 KB gzip, adds 100 ms of lookahead, and creates the context at import.
- **ZzFX.** It makes its own context and has a chiptune palette, and a hand-written one-shot is as small.
- **iOS `playback` session.** The score would play through Silent mode, but it would stop the visitor's music and keep playing in the background.
- **Ducking, or playing on, in a hidden tab.** Either drains the battery, and Chrome treats an audible tab as foreground.
- **Sound on every visit,** whatever the visitor chose last time.

## Consequences

- **Changing the score means re-exporting or re-rendering its stems** and running the build script.
- **The hero's stems add bytes to the time to the wake,** next to three.js, the sky and Pip.
- **Decoded audio is memory:** each stereo minute of stems costs about 22 MB.
- **A score layer that must change its notes,** not only its level, has to be synthesised live.
- **Firefox lacks `cancelAndHoldAtTime`,** so the ramp helper falls back to `cancelScheduledValues` and pins the value.
- **Not verified on a real iPhone:** the Silent switch, recovery after backgrounding, and Opus decoding in iOS Safari. Janriz has none, so these go into the QA plan. The MP3 fallback and the restore control cover their failure.

## Amendment (2026-10-04): where the sound comes from, and how the one-shots play

*Finalize the score* settled what this ADR left open, from Janriz's ear on the real site.

- **The score is a composition written as code, rendered offline from a real synthesiser** (Surge XT, free, whose output is ours) hosted headless by pedalboard, with a real-room reverb. No raw oscillators: that was the stand-in that sounded like a pixel game. Janriz picked it over a score rendered from recorded instruments, an organ score and a finished free piece. The engine still only plays files; the export script takes the rendered WAVs.
- **The unpulsed stems loop at lengths of their own** (the bed's 37 s against the pulse's 30.8 s), so the bed never lines up with the pulse the same way twice. A late stem joins as far into its own loop as the grid has run.
- **The scene changes are recorded one-shots, not rendered into the stems,** each fired by a cue read off the script as its moment is crossed going forward. Each belongs to a stretch of the film after its moment; once the film leaves it, either way, the sound fades out over 0.25 s, so a fast scroll cuts it short rather than letting it ring over what comes next. A jump plays nothing. Janriz asked for this: a sound that kept playing after a fast scroll no longer matched the picture.
- **The live voices are recorded samples, one per note of the scale,** loaded on demand: a celesta where the sky can be dragged, a bell for a star hovered anywhere else. Dragging the sky makes no sound.
- **The levels are a module the engine starts from,** set by ear on a development-only mixer.
- **The budget still holds.** The one-shots and the voices' notes put decoded audio past 64 MB on top of the stems; the build brings it back inside (mono decode for one-shots, shorter tails) before this budget is amended.

## Amendment (2026-10-04, Score the voyage): what's held decoded, and the budget

The one-shots and the instrument's notes took decoded audio from the stems' 56 MB to about 98 MB on a desktop and 49 MB on a phone. *Score the voyage* brought it down, then set the budget to cover everything:

- **The instrument's notes and the small sounds decode mono on every tier.** The notes are mono recordings already; Tycho's chirp grains and emotes, the UI ticks, the wake's relay and the toggle are narrow. The scene changes and the warp keep their stereo on a desktop. Phones decode everything mono.
- **Each one-shot ends where it falls silent:** the export cuts it after the last sample above −60 dBFS, with a 20 ms fade (109 s of one-shots became 95 s).
- **The scene changes are held only near their moments:** each loads three screens before its moment and is let go half a screen after its stretch, so at most a few are decoded at once.
- **The thinking layer loads when Tycho first thinks,** not after the wake.
- A muted visitor still downloads nothing: a page's request for notes waits for the sound to come on.

**The budget now covers everything the sound holds at its busiest** (every stem with the thinking layer, the sounds held all along, both voices' notes and the busiest stretch of scene changes), at 48 kHz: **72 MB on a desktop and 41 MB on a phone**, measured at 71.5 MB and 40.1 MB. The score's stems stay inside the original 64 MB and 32 MB (56 MB and 28 MB). A unit test (`lib/audio/memory.test.ts`) reads the manifests the page loads and fails an export that breaks either figure.

Bringing everything inside the original 64 MB and 32 MB would have meant cutting the score itself (mono stems on a desktop, which are measurably wide, or shorter loops), which Janriz approved by ear; the one-shots and notes alone are now 15 MB on a desktop and 12 MB on a phone.

**Also settled here:**
- **The warp's sound is played off its legs** (`onWarp`): the riser is timed so its swell peaks as the page jumps, so a question's longer warp waits before it rises; a hurried warp cuts it; the arrival plays as the destination opens. Under reduced motion the crossfade gets the arrival alone, at half its level.
- **The replay's dip:** the score sinks to about −14 dB under the black and comes back as the frame fades in. It never stops, and the one-shots aren't dipped.
- **A ceiling of −1 dB after the limiter.** The limiter's attack let the climax reach full scale.
- **The renderer lives in `scripts/audio/render/`** (Python, Surge XT hosted by pedalboard). `pnpm audio:export --render score|shots` renders and exports. Its sources (Surge XT, the NASA recording, the concert hall's response, the Freesound recordings) are fetched by `fetch.py` into a cache outside the repo, listed with their licences in `sources.json`. A re-render sounds the same but isn't sample-identical, since Surge's oscillators start at random phases; the recorded sounds come out bit-exact.
