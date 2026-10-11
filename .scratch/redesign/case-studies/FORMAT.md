# Case study format

One folder per site: `case-studies/<site>/`

```
<site>/
├── README.md        the write-up (sections below)
├── screenshots/     PNG stills, named NN-<what>.png in the order they were taken
├── motion/          MP4 clips of transitions and interactions, named NN-<what>.mp4
└── audio/           the site's sound files as downloaded, plus <file>.spectrogram.png / .waveform.png
```

Capture method: whatever *Capture setup for case studies* resolved (see its `## Answer`).

## How to study a site

Play with it like a curious visitor, then like an engineer:

- Load it cold. Watch the intro / loader, the first frame, the time until you can act.
- Scroll slowly, then fast, then back up. Note what is scroll-linked vs time-based.
- Hover, click, drag, press-and-hold everything that looks alive (e.g. Trionn's "Hold to blast"). Find the easter eggs.
- Navigate between pages; watch the transitions both ways.
- Turn sound on; note every trigger (hover, click, scroll, ambient loop, transition).
- Resize to 390 px wide; emulate `prefers-reduced-motion: reduce`. Note what degrades and how.
- Read the Awwwards page: studio, credits, the technologies it lists, scores.

## README.md sections

1. **At a glance** — URL, Awwwards link, studio, one-paragraph gist, the single most memorable thing.
2. **Tech found** — libraries and versions detected (e.g. `gsap.version`, `THREE.REVISION`, Lenis, Howler, Barba/Swup, PixiJS, Rive, Spline), render approach (DOM / canvas / WebGL, how many canvases), fonts, framework. Say *how* each was detected.
3. **Intro & loading** — loader, what it covers, duration, skippable?
4. **Navigation & page transitions**
5. **Scroll behaviour** — smooth scroll, pinning, scrubbing, velocity effects.
6. **Cursor & micro-interactions**
7. **3D / WebGL** — what is rendered, what it reacts to, apparent technique (shader, model, particles, post-processing).
8. **Sound** — every file and its trigger, format and duration (ffprobe), spectrogram/waveform read (the agent cannot hear — describe structure: transient clicks vs pads vs loops, pitch range, length), default on/off, the toggle.
9. **Type, colour, layout** — the system behind the look, with exact values:
   - **Fonts:** each family by name, with weights and styles used, where it is served from (Google Fonts, self-hosted file, foundry kit) and whether it is free or paid. For a paid font, name the closest free alternative. Include any font rendered inside the canvas.
   - **Type scale:** size, weight, line height and letter spacing for each role (display, headings, body, labels/mono), read from computed styles.
   - **Colour:** the palette as hex or rgb values, each with its role (background, text, accent, lines/UI chrome), from computed styles or CSS custom properties, not eyedropped from a still.
   - **Layout:** grid, margins, and where content sits relative to the 3D.
10. **Performance & degradation** — transfer size, LCP, frame feel, mobile tier, reduced-motion behaviour.
11. **Ideas worth taking** — ranked, each with *why it would work for this portfolio* and which standing constraint it strains, if any. Also: **what to avoid** from this site.
