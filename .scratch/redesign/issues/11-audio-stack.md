# Audio stack

Type: research
Labels: wayfinder:research
Status: resolved
Blocked by: 02

## Question

How should this site produce and play sound?

- Libraries: raw Web Audio vs Howler vs Tone.js — size, latency, sprite support, mobile behaviour.
- Autoplay policy: how and when audio unlocks (first gesture), and what that means for a sound-on/off default.
- Sources within the free/self-made rule: sound synthesised in code, CC0 libraries, anything else free and licence-clean.
- Formats, file sizes, loading after first paint; reduced-motion / user-preference handling.
- Informed by what the case studies found about sound, in each README's §8:
  - *Case study — Edolus*: the stem mix table.
  - *Case study — Hashgraph Ventures*: Howler, with beds crossfaded by scroll position.
  - *Case study — Trionn*: code-synthesised rumble and harp in Web Audio, `ScriptProcessor` noise, and lazy SFX that made the first blast silent.
  - *Case study — US Avionix*: input-driven stems whose pitch follows the throttle.
  - *Case study — Produx*: sound only inside a played moment.
  - *Case study — Izanami*: no sound.

## Answer

Full findings, measurements and citations: [../research/audio-stack.md](../research/audio-stack.md). Facts, not a verdict: the verdict is *Audio stack verdict*.

- **Libraries.**
  - **Raw Web Audio** adds 0 KB.
  - **Howler 2.2.4** is 10.2 KB gzip, MIT, with no release since 2023-09. It brings auto-unlock, a `webm`→`mp3` fallback and named sprites. It has no shared start time for keeping stems in sync and no filter or effect API. It also suspends the context after 30 s of silence.
  - **Tone.js 15.1.22** is 69–91 KB gzip, MIT, and its `next` line is active. It brings synths, effects and sample-accurate sync. It also creates its `AudioContext` the moment it is imported, adds a 100 ms `lookAhead`, and runs its own worker clock.
  - **ZzFX** is a 1.1 KB code-made SFX generator.
  - Any of them must be imported client-only after first paint, and the context must be resumed synchronously inside the gesture handler.
- **GSAP.** Audio keeps its own clock whatever the library. If GSAP writes `.value` every frame, the gain moves in hard steps (measured) and freezes in hidden tabs. If GSAP computes targets and the audio thread smooths them with `setTargetAtTime`, the largest jump is about 700× smaller. Discrete changes (the toggle fade, chat states) are native ramps. None of this conflicts with a single `gsap.ticker` for visuals.
- **Unlock.** Only click, tap, `mousedown` or `keydown` unlock audio; scroll and wheel never do. No browser lets a stored "sound on" resume on a new visit without a new gesture (Chrome desktop with a high Media Engagement Index aside). So a stored "on" can at most arm sound to start on the visitor's first gesture anywhere. The gesture only gates the **first start**. Once unlocked, scroll drives everything, as in Edolus: per-stem mix by scroll progress, and pitch or filter by scroll velocity (§6).
- **iOS.** The Silent switch mutes Web Audio by default. `navigator.audioSession.type = "playback"` makes the score audible in Silent mode, but it stops the visitor's music and keeps playing in the background. Resuming after backgrounding is unreliable (WebKit bug 263627, still open).
- **Sources (free only).**
  - Code synthesis is cheap: a 9-oscillator bed costs 0.2% of an M5 core, or 1–2.4% with a convolver reverb. The harp needs a voice cap, because a full sweep with about 270 voices costs 9–12%.
  - Offline rendering to files works (tested in headless Chromium and WebKit).
  - Clean with no conditions: Kenney, Freesound CC0 items and Sonic Pi samples (all CC0), plus self-made output from ZzFX, jsfxr, ChipTone, BeepBox, Surge XT and Helm.
  - Not clean for this site:
    - Sonniss, Pixabay, Mixkit and Zapsplat ban redistributing the raw files, which collides with a public repo.
    - BBC Sound Effects, Suno's free tier and Udio are non-commercial.
- **Formats and weight.**
  - Opus in WebM decodes sample-exact (gapless) and plays in Safari 15+ (macOS) and 17.4+ (iOS). MP3 with a LAME header is an exact fallback.
  - AAC pads each loop wrap. Ogg works in Safari only from 18.4.
  - A 60 s stereo stem is about 0.35–0.5 MB at Opus 48–64 kbit/s, but about 22 MiB once decoded. Mono, shorter phrases, fewer stems or synthesis are the mobile levers.
  - `<audio>` streaming saves memory but cannot keep stems in sync.
- **Loading.**
  - SFX can be fetched and decoded before the gesture. That fixes Trionn's silent first blast.
  - `requestIdleCallback` is not in Safari.
  - Preload with `as="fetch"`, not `as="audio"`.
  - Next serves `public/` with `max-age=0`, so audio needs hashed file names and a `headers()` rule to cache.
- **Preferences and accessibility.**
  - There is no audio media query. Reduced motion says nothing about sound, and `prefers-reduced-data` exists only in Chromium.
  - Under WCAG 1.4.2, a score the visitor starts with a clearly labelled control is not autoplay.
  - Screen-reader use cannot be detected.
  - Chrome treats Web Audio as "ambient": other media never pauses it, and it never pauses them.

**Unverified:** nothing ran on real Safari, iOS, Firefox or Android devices. WebKit results come from Playwright's WebKit build, and CPU figures are offline proxies. Also unverified: the iOS `playback`-beats-Silent claim (a WebKit engineer's comment, not a release note), and whether Vercel serves `.webm`/`.opus` with the right MIME type. The full list is in the research file's last section.

## Comments

- 2026-09-27 — Janriz: sound is **free only**; paid stock libraries are not considered. Recorded in the map's Notes under **Assets**.
