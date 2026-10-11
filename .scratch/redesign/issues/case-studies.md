# Case studies

Merged 2026-10-10. The six case studies (02–07). Each section is the ticket's Answer, verbatim.

| # | Ticket | Gist |
|---|---|---|
| 02 | [Case study — Edolus](#t02) | PlayCanvas one-take scroll film behind a gating loader; take the hotspot with an x-ray reveal, a stem mix that follows state, hero-pose snap; avoid its loader, wheel hijack and canvas-only titles. |
| 03 | [Case study — Trionn](#t03) | GSAP + Lenis with a procedural Three.js logo and opt-in synthesised sound; take hold-to-move-the-page, drag-onto-the-AI, the code-made footer harp; avoid its 8.4 s loader and 21 MB of eager downloads. |
| 04 | [Case study — US Avionix](#t04) | R3F scroll film in 14 beats over real HTML; take the silhouette-to-render match cut, accent-then-settle text, a telemetry line of real agent events; avoid its 4.6 s gate and one-gesture-one-scene stepper. |
| 05 | [Case study — Izanami](#t05) | calm HTML-first site with a Three.js mirror layer; take HTML-first WebGL mirroring, water-surfacing headings, a fisheye image wipe; avoid its 7.2 s gating loader. |
| 06 | [Case study — Produx](#t06) | DOM-first Next.js + GSAP around one transforming motif; take the single motif, pre-rendered 3D as chunked frames, bracketed cursor chips (`[ ASK ]`); avoid a 70 MB reel and one WebGL context per effect. |
| 07 | [Case study — Hashgraph Ventures](#t07) | WebGPU scenes on one Theatre.js timeline; take the object that opens around the pointer, one timeline driving picture, copy and sound; avoid its WebGPU-only gate and wheel hijack. |

---

<a id="t02"></a>

## 02 · Case study — Edolus

*research · resolved · blocked by 01*

Edolus (Vertex3D; Awwwards Honorable Mention, Aug 2026) is a fictional AI-infrastructure showcase. It is one PlayCanvas 2.21.4 WebGL canvas with an HTML overlay, and GSAP 3.12.5 animates the overlay. After a gating loader (the CTA is ready at ~8.8 s, after all 48 MB has loaded), the wheel scrubs one seven-scene film: satellite, city map, data centre, chip, quantum burst, UI cards, car, credits. Three music stems play in sync throughout and are re-mixed per scene from a mix table.

- **Most memorable:** the satellite's "AI CHIP" hotspot. A real-HTML ring is pinned to a 3D point on the hull, and a cursor-following x-ray opens the hull onto the internal frame and a glowing gold chip. Hovering the ring starts a quiet chirp loop.
- **Top ideas worth taking:**
  1. An HTML hotspot on a 3D object with an inside reveal. For us: the bot's core opens the chat. It strains the mobile/reduced-motion tier, performance and keyboard access.
  2. A stem mix table: synced loops whose volumes follow the section or the chat state, tweened with GSAP. It strains the free/self-made assets rule and lazy, gesture-gated audio.
  3. Progress windows with hero-pose snap points, rebuilt on native scroll with ScrollTrigger snap and not copied as wheel hijacking.
- **Avoid:** the gating loader, the wheel hijack, canvas-only titles, the missing reduced-motion branch (verified: it ignores the setting), and the generic layer of film grain, bloom, plexus lines and chromatic streaks.

Detail and evidence: [case-studies/edolus/README.md](../case-studies/edolus/README.md). Sound questions for Janriz are at the end of its §8.

How the run went, and the lessons that brief the other five case studies: [case-studies/edolus/logs/pilot-log.md](../case-studies/edolus/logs/pilot-log.md). The concurrency test is at [research/concurrency-test/README.md](../research/concurrency-test/README.md).


---

<a id="t03"></a>

## 03 · Case study — Trionn

*research · resolved · blocked by 01*

Trionn (the studio's own portfolio; Awwwards Site of the Day, Jul 2026, 7.42, plus a Developer Award) is a Next.js app.
- **Scroll:** a long home page pinned by GSAP ScrollTrigger, with Lenis smooth scroll.
- **Hero:** a procedural Three.js (r128) logo, extruded from its own SVG path into glassy metal shards, sits under all-HTML text.
- **Sound:** off by default behind one real toggle. It is a small mix of samples plus sound synthesised in code: a brown-noise rumble, a sine-tone harp, and a robot voice for the team scanner.

- **Most memorable:** "Hold to blast". A `mousedown` on the hero makes the headline, CTAs and nav tremble for 0.5 s over a synthesised 80 Hz rumble. Then the logo shatters and the real HTML layout comes loose in 3D perspective, tilting up to 25°, while the woosh bed swells with the same `clickBurst` value that drives the shards. On release everything springs back in 0.6 s with a "join" thud. A 0.3 s tap gives only the tremor. It is desktop-only (no touch path) and has no reduced-motion branch.
- **Top ideas worth taking:**
  1. A press-and-hold gesture that moves the real page, as "hold to talk" or "wake the bot". Build it with `gsap.quickTo` on the transforms, driven by one `hold` value. It strains the mobile/reduced-motion tier: it needs a touch path, a keyboard hold and a no-tremor branch, and the chat must never be part of the debris.
  2. Drag something onto the AI and let it identify it, like the voiced "Identifying… Detected." team scanner. For us, drop a project card on the bot and the agent explains it. It needs a click and keyboard path, voice loaded lazily and off by default, and a self-made voice.
  3. The footer harp: about 175 hairlines tuned to a pentatonic scale, played as code-synthesised plucks, with an analyser feeding the visuals. There are no audio files, and it matches Janriz's sound answers point for point. It strains only the reduced-motion/mobile tier.
  - Also noted:
    - one "energy" value driving both picture and mix (`gain = 0.07 + 0.93 × p`)
    - a procedural 3D mark with no model file
    - its sound hygiene: an `aria-pressed` toggle, muting when the tab is hidden, and beds owned by their section
- **Avoid:**
  - the 8.4 s logo loader on every load, unskippable and scroll-locked
  - canvas-only interactions with no cursor or focus cue, and a hint hidden exactly where the gesture fails
  - no reduced-motion tier
  - about 21 MB of eager downloads (a 12.9 MB image sequence, every video fetched twice, reCAPTCHA on every page)
  - SFX lazy-loaded so the first blast is silent for about 1 s
  - the generic lightning, smoke and storm-cloud layer

Detail and evidence: [case-studies/trionn/README.md](../case-studies/trionn/README.md). Sound questions for Janriz (seven) are at the end of its §8. Run log: [case-studies/trionn/logs/notes.md](../case-studies/trionn/logs/notes.md).

Coordinator's check:
- Five kept clips exceed p95. 21, 23 and 25 are scroll pauses where the page's own rAF measured a median of 16.7 ms and p95 of 18.3 ms. 41 and 55 include a full page load.
- I removed 860 MB of orphaned temp frames (`logs/.frames-*`) left behind by failed clips.
- Not visited: `/services` and `/trionn-story`, which are described from the bundle.
- Fonts: Neue Haas Display is paid (use Inter Display or Inter Tight). PP Editorial New is paid for commercial use (use Instrument Serif or Cormorant), and it is preloaded but unused. Familjen Grotesk and Martian Mono are OFL, and Familjen carries the look.


---

<a id="t04"></a>

## 04 · Case study — US Avionix

*research · resolved · blocked by 01*

US Avionix (basement studio; Awwwards Site of the Day, Sep 2026, 7.41) is a Next.js + React Three Fiber (three r180) product film for a drone company, told in 14 scroll beats over one canvas. Every word is real HTML. Scroll runs on Lenis plus a custom "stepper" that plays exactly one scene per gesture. DOM motion is Motion (framer-motion), with no GSAP, so every idea below has to be rebuilt in GSAP. A 96-frame image sequence lands the drone in the footer.

- **Most memorable:** two moments tie.
  - The loader's match cut: a flat grey silhouette of the drone sits in the exact hero pose, then a diagonal wipe swaps in the lit render.
  - A hidden keyboard flight at the hero: ←/→ bank the drone, and Shift fires the afterburner and brings up the site's only sound, a four-stem jet mix whose pitch follows the throttle.
- **Top ideas worth taking:**
  1. The silhouette-to-render match cut as the Facade. The bot's silhouette paints in the first frame beside a chat that already works, then a GSAP-tweened wipe swaps in the real model. It strains the ≤ 1 s rule (theirs gates input for 4.6 s) and needs the silhouette as the reduced-motion and low-tier end state.
  2. Text the agent just changed enters in one accent colour and settles to white, so visitors see what a tool effect did. It strains the reduced-motion tier only a little (drop the move, keep the colour step), and the settled colour must pass AA.
  3. A mono telemetry line narrating real agent events ("WIKI: 5 CHUNKS", "SCROLL_TO #sec-work"). It strains the effects rule unless the data is real, and it must be `aria-hidden`, with the chat transcript as the accessible record.
  - Also noted: a tick-mark section nav that `scroll_to` could drive, and sound that lives only inside a steerable interaction (a code-generated hum for a drivable bot).
- **Avoid:**
  - the non-skippable 4.6 s gate, about 1.4 s of which waits on the footer's image sequence
  - the one-gesture-one-scene stepper (you can't skim or stop)
  - a tick nav you can't reach by keyboard
  - desktop text drawn in WebGL with its DOM copy `visibility: hidden`
  - an undiscoverable easter egg as the only sound
  - no reduced-motion branch
  - the generic layer (film grain, vignette, fake HUD chatter)

Detail and evidence: [case-studies/usavionix/README.md](../case-studies/usavionix/README.md). Sound questions for Janriz are at the end of its §8. Run log: [case-studies/usavionix/logs/notes.md](../case-studies/usavionix/logs/notes.md).

Coordinator's check:
- Journey A's terrain clips (22–42 fps) were shot under contention even with the two-slot cap, which the agent proved with an in-page rAF recorder. They were all reshot and the old ones deleted.
- Two kept clips exceed p95: 61, a static DOM section where the page's rAF held 60, and 88, a mobile cold load.
- The fonts are all free (Geist, Geist Mono and Orbitron are OFL).


---

<a id="t05"></a>

## 05 · Case study — Izanami

*research · resolved · blocked by 01*

Izanami (baqemono.inc.; Awwwards Site of the Day and Developer Award, Jul 2026) is a calm, dark, multi-page brand site, not a 3D experience. Every page is ordinary HTML. One Three.js canvas behind it redraws chosen photos and big headings as planes that track their DOM boxes, and the whole WebGL layer is seen through a mouse-driven stable-fluids simulation. Swup cross-fades the pages through black, Lenis smooths the scroll, and GSAP drives the tweens. There is no sound: no audio code, files or events.

- **Most memorable:** the page acts like a sheet of water over the photos. A slow pointer leaves a lens-shaped bubble that bends the fog, stones and photo edges, then drifts off and heals, while the HTML text on top stays crisp.
- **Top ideas worth taking:**
  1. HTML first, with WebGL mirroring only chosen elements, and the heading's DOM copy kept in place so all text stays real. It strains GSAP-only (drive it from `gsap.ticker` and ScrollSmoother), performance (cache positions, cap DPR) and progressive enhancement (hide the DOM copy only once its plane has drawn).
  2. Headings that rise as if surfacing through water, drawn over real text. It strains the reduced-motion tier, which needs a plain fade.
  3. A pinned frame whose photo opens onto the next through a growing fisheye circle. It could serve Projects and the `highlight_project` tool effect. It strains the reduced-motion tier, which needs a crossfade.
- **Avoid:**
  - a 7.2 s gating loader, even though the network is done by about 1.3 s
  - no reduced-motion branch anywhere
  - photos only in `<noscript>` and headings that are always transparent, so a WebGL failure blanks the page
  - about 1 s of black on every page change, with Back landing at the top
  - a menu that ignores the next click after an Escape close
  - an uncapped DPR 3 canvas on phones
  - the pointer fluid used as decoration, unless the concept is about water or memory

Detail and evidence: [case-studies/izanami/README.md](../case-studies/izanami/README.md). Sound questions for Janriz are at the end of its §8. Run log: [case-studies/izanami/logs/notes.md](../case-studies/izanami/logs/notes.md).


---

<a id="t06"></a>

## 06 · Case study — Produx

*research · resolved · blocked by 01*

Produx (Prødux Design's own studio site; Awwwards Site of the Day and Developer Award, Aug 2026) is a DOM-first Next.js + Tailwind page, 23 viewports long, driven by GSAP 3.14 and Lenis, with up to 12 small three.js effect canvases. There is no loader and the text is in the HTML up front. The page itself is silent: sound lives only in the showreel and the 404 mini-game.

- **Most memorable:** the moss rock. It is a 270-frame pre-rendered sequence, scrubbed by scroll, in which a black rock turns and grows moss while the page blooms to dark green. The same moss is the image the hero tiles assemble into, and the texture the pointer paints into the footer wordmark, so the whole page tells one material story.
- **Top ideas worth taking:**
  1. One motif that transforms with scroll and returns under the pointer. For us it could be the AI entrypoint "growing" knowledge section by section. It strains performance and the mobile and reduced-motion tiers, and the footer reveal must stay decoration over real text.
  2. Pre-rendered 3D (self-rendered in Blender) shipped as a scroll-scrubbed frame sequence that loads in chunks ahead of its section. It strains performance: it has to be cut hard from 26.6 MB, for example to 60–90 AVIF frames. Reduced motion shows a static frame.
  3. Mono, bracketed cursor chips that name the action (`[SCROLL DOWN]`, `▸ PLAY REEL`). It could be `[ ASK ]` over the AI entrypoint. It strains the mobile/reduced-motion tier and accessibility, because the chips are `aria-hidden`. Also noted: one pixel language as "the agent touched this" for tool effects, and a card-to-page shared-element transition built with GSAP Flip.
- **Avoid:**
  - a muted showreel that streams from page load (70 MB over a 5-minute visit)
  - one WebGL context per effect
  - canvas-only section headings on desktop, and a wordmark made of unlabelled SVGs
  - no reduced-motion branch
  - nav links invisible at landing, and no scroll restoration on back
  - a page transition that always holds for at least 2 s
  - lil-gui shipped to production
  - Star Wars IP in the 404
  - the generic blur-in word reveals

Detail and evidence: [case-studies/produx/README.md](../case-studies/produx/README.md). Sound questions for Janriz are at the end of its §8, including "sound only inside a moment the visitor plays" vs Edolus's state-following score. Run log: [case-studies/produx/logs/notes.md](../case-studies/produx/logs/notes.md).

Coordinator's check:
- 14 clips exceed the p95 threshold, but their medians are about 16.7 ms and the page's rAF held 60 fps at every stop (`logs/probe-fps-desktop.json`). The excess is idle gaps (the screencast emits frames only on change), not contention.
- The footer ink clips run at about 30 fps in both takes. That is inherent to the site and worth checking in real Chrome.
- Not captured: the desktop full-screen menu (described from the code instead) and the mobile showreel tap.
- The display font At Aero is commercial. Its free stand-ins are Satoshi or General Sans (Fontshare) and Urbanist or Outfit (OFL).


---

<a id="t07"></a>

## 07 · Case study — Hashgraph Ventures

*research · resolved · blocked by 01*

Hashgraph Ventures (rbxgc; Awwwards Site of the Day, Jun 2026, 7.5, plus a Developer Award) is a Nuxt site for an AI/blockchain venture fund.
- **Home page:** five Three.js scenes, rendered with WebGPU on one canvas, sit on one Theatre.js timeline that the wheel scrubs. There is no native scroll. A hard diagonal wipe of about 18° cuts between scenes, and every word of copy is real HTML, but each block is only visible in a narrow band around its snap pose.
- **Sound:** a gate offers "Enter with audio / without audio". With audio, a Howler score plays per-scene beds that crossfade with scroll position, and the pointer triggers SFX.
- **Portfolio companies** open as their own routes over the same 3D scene.

- **Most memorable:** the hero rock cracks open radially around the pointer onto a white-hot core, with a stone-grinding sound, then re-seals. The Enter button sits where the rock then appears, so most visitors trigger it without looking. The runner-up is a 40 000-particle morph from one partner's face into the next.
- **Top ideas worth taking:**
  1. An object that opens around the pointer to show its core, for the bot: its shell parts onto a lit core, and opening it fully leads into the chat. It strains the mobile/reduced-motion tier, which needs a tap branch and a static open pose. It also needs a real, focusable `<button>` over the object, which Hashgraph lacks, and the core's glow must be emissive material, not screen bloom.
  2. One timeline drives picture, copy and sound, with sound crossfaded by scroll *position*, so a half-scroll holds a half-mix. This extends Edolus's mix table. Ours would be one GSAP master timeline scrubbed by ScrollTrigger on ScrollSmoother, with gains tweened in it. It strains GSAP-only if copied literally (it is Theatre on a hijacked wheel here), and it needs audio that loads lazily and is off by default.
  3. One signature diagonal shared by the page wipes and the micro-interactions. For us it would be a GSAP-tweened `clip-path` on the HTML layer. It strains only the reduced-motion tier (crossfade), and the angle should come from our own concept.
  - Also noted:
    - particle figures sampled from real content (a portrait or a project re-forming on `highlight_project`)
    - its 60 fps craft: fixed render DPR and alternate-frame rendering during transitions
    - the honest, equal-weight sound-choice wording, used as an invite rather than a gate
- **Avoid:**
  - a WebGPU-only gate on every route and every visit, 4.3–5.6 s to first action, with LCP landing on the loader's disclaimer
  - the wheel hijack with narrow copy bands and no deep links
  - canvas-only interactions with no cursor, focus or touch equivalent
  - invisible keyboard focus
  - no reduced-motion branch (verified)
  - the generic bloom, grain and chromatic-aberration stack
  - SFX that load on first use

Detail and evidence: [case-studies/hashgraph-ventures/README.md](../case-studies/hashgraph-ventures/README.md). Sound questions for Janriz (seven) are at the end of its §8. Run log: [case-studies/hashgraph-ventures/logs/notes.md](../case-studies/hashgraph-ventures/logs/notes.md).

Coordinator's check:
- Journey A's contended clips were reshot and deleted, as the page's own rAF logger confirmed they were contention.
- Four kept clips exceed the limit: two cold loads; 66, which is marginal at p95 25.1; and 81, the 01→02 wipe at 43–45 fps in all three takes while the page held 60. That wipe also has a real one-time 84–667 ms stall the first time section 02 activates.
- Every font is paid or custom: Parabole (ECAL), PP Neue Montreal (Pangram Pangram), and the custom Hashgraph Title. Their free stand-ins are Inter, Instrument Sans or Hanken Grotesk, and Space Grotesk in caps.
