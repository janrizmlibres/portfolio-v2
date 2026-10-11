# PROTOTYPE — Deep Field sky (throwaway)

For [Prototype the visual language](../../issues/27-prototype-the-visual-language.md), **round 1: the sky on its own**, before any type or layout (the ticket's 2026-09-28 comment). It answers one question first: do the 93 real stars from *Export the sky* hold up as the hero, seen from outside? If they don't, the concept goes back to *Pick the creative concept* before anything else is designed.

The page is the hero only:
- the sky;
- a placeholder name in system type (type is round 2);
- the stand-in bot and its speech bubble from *See the bot in the viewport*.

The stars are real, and so is the lighting. Asking the bot runs **today's agent** with the same prompt, page context and tools, and every passage it reads lights its star.

**Round 2** (after Janriz's first look, 2026-09-29):
- The rendering is now B's gas with C's threads (**B+C**), his pick.
- The ‹ › switch now compares **four ways of lighting** the stars the agent read, because he wasn't sure how much the lighting should do.
- Round 1's three renderings are still under ⚙ Rendering.
- A new setting decides what happens to **weak matches**.
- He wants the far galaxies kept, and the hover labels and click-to-ask work for him.

**Round 3** (after his second look, 2026-09-29):
- **PCA** is his layout: "the flare is more spread apart". **Weak matches stay dimmer.**
- He couldn't see the far galaxies. There were only 1,400 over the whole sphere, so about 25 were on screen at once, each 1–4 px and very dim.
  - Now there are 24,000, so about 500 are on screen. They're soft, faint smudges, always dimmer than the faintest real star, with the odd small spiral.
  - ⚙ Far galaxies: clear (the default), faint or off.
- **From the case studies:** US Avionix's **telemetry line**. One mono line per real agent event, at the bottom left:
  - thinking;
  - each search, with the agent's own query;
  - how many passages it read;
  - the warp it would take;
  - writing the answer;
  - answered, with the time.

  Each line arrives in the energy colour and settles to white, like a star. It fills the 2–4 s before the first stars light, and it makes the reading honest. It shows one line on phones, and ⚙ Telemetry turns it off.
- **Janriz's third look, which settles the sky:**
  - **Flare** is the lighting.
  - The telemetry line is **off by default**: he found it "reads more like a stack trace", and a visitor wouldn't know what a "passage" or a "wiki" is. It stays as a toggle.
  - The visitor-facing words changed with it: a star is "something he's written down", and the bot *explores* stars, Janriz's verb ("Exploring the sky…", "Explored 12 stars", "11 stars · click to ask"). "Passage", "wiki" and "search" stay ours; they only appear in the readout and the prototype chrome.
- **Flare vs Trace, timed against real answers** (PCA, today's agent):
  - Flare lights every star within 0.1 s of its search result.
  - Trace's first star lights about 0.7 s after the result, with about 0.35 s per hop after it, so a six-star search takes about 2 s to show.
  - For "What did he study?", Trace was still lighting stars 0.6 s after the reply had finished.

**Round 4** (2026-09-29) is a second page in this folder, **`voyage.html`**: the whole page around the settled sky. See [Round 4: the voyage](#round-4-the-voyage) below.

**Verdict** (Janriz, 2026-09-29):
- The sky, colour as light and the 3D colour rule (`fidelity.html`) are settled.
- Round 4's page was rejected as flat, "a linear site / webpage that's slapped on top of a 3D background". He wants every scroll to be a scene, as in Edolus.
- `voyage.html` is kept for its parts (the baked worlds, the route, the beacon, the contrast check), not as a base. What's next is *Make every scroll a scene*, then *Storyboard the voyage*.

## Run

```sh
.scratch/redesign/prototypes/deep-field-sky/serve.sh        # then open http://127.0.0.1:4176/ (the sky) or /voyage.html (round 4)
LAN=1 .scratch/redesign/prototypes/deep-field-sky/serve.sh  # same, reachable from a phone on the network
```

three.js 0.186.1 and GSAP 3.15.0 load from `vendor/` (a local copy of three, and a symlink to the repo's GSAP), not from jsdelivr, which stopped answering from this network on 2026-09-29. `vendor/` is untracked like the rest of `.scratch/`.

It needs `OPENAI_API_KEY` and `SUPABASE_DB_URL` in the repo's `.env`. If the database can't be reached, retrieval now fails after 10 s and the agent answers without it. Each question costs one GPT-4o run of about 8–13k tokens, roughly 2–3¢. Star data loads from `public/sky/` through the `public` symlink.

## The four lightings (`?variant=`, ‹ › in the bar, or ← → keys)

Every one lights exactly the passages the agent's `search_wiki` calls returned, as each call comes back. Nothing is scripted. Brightness follows similarity (⚙ Weak matches).

| | Name | What happens when the agent reads |
|---|---|---|
| `flare` | **1 Flare** | Every star it read flares warm where it sits, best match first, a beat apart. Then each cools to a brighter white than the rest. The rest of the sky recedes, and it turns to face them. |
| `trace` | **2 Trace** | A spark leaves the bot and hops from star to star **in the order it read them**, and each flares as the spark lands. The hops stay as a faint path while the answer stands, so you see the route the reading took, across clusters if it went there. A second search carries on from where the first ended. |
| `beam` | **3 Beam** | A beam shoots from the bot to each star it read, a beat apart, and the star flares where it lands. Then the beams fade. It's the most literal "the bot is reading the sky". |
| `quiet` | **4 Quiet** | No warmth and no motion. The read stars fade up to white with a thin ring, and nothing else changes: no receding and no turning. The calm reference to judge the others against. |

In all four, the bot looks at each star as it lights. In B+C, the threads between two read stars show, so what was read shows its own structure.

## The renderings (⚙ Rendering, `?render=`)

| | Name | What makes 93 points read as a shape |
|---|---|---|
| `BC` | **B+C** (default) | B's gas, with C's threads shown only for the hovered star (its neighbours, and its page's chain) and between the stars the agent read. |
| `A` | **Starlight** | Points of light only. The brightest have a telescope's four diffraction spikes, fixed to the screen like a real camera's. Depth shows as size and brightness, and as parallax when the sky turns. |
| `B` | **Nebula** | Gas: a small puff round each star, and filaments along the links between neighbours in meaning. So related passages share one cloud, with lanes and knots in it. The gas is blue-violet and cold teal, drawn at half resolution. |
| `C` | **Threads** | Each star joined to its two nearest neighbours by a hairline, and a page's passages chained. Hovering a star brightens its page's chain. |

Behind all of them is a faint **deep field**: 24,000 tiny galaxies at "infinity", about 500 of them on screen, Hubble's picture of a sky that looked empty.
- Most are soft grey-blue or pale lavender smudges near the limit of seeing, and about 1 in 550 is a small spiral.
- Every one is dimmer than the faintest real star, so the 93 stars lead.
- ⚙ Far galaxies: clear, faint or off.

**PCA / UMAP** is the switch in the bar (or the L key). Switching morphs every star to its other place over 1.6 s, so the two layouts can be compared on the same stars. Both squeeze each passage's 1,536-number embedding (its meaning) into a position in 3D:
- **PCA** keeps the directions along which the passages differ most. It's a straight projection that keeps the overall spread, so the sky reads as one loose cloud, and distances across it roughly mean something.
- **UMAP** keeps each passage's neighbours next to it. Related passages pull into tight islands, but the gaps between islands mean little.

## Colour as light (first values)

The values are in `LIGHT` at the top of `sky.js` and go to the screen as written: there's no tone mapping and no colour conversion.
- **Space:** the hero's light, `#0d1130` deep blue-violet, round the sky and falling off to `#03040a`.
- **Stars at rest:** cool white `#dfe7ff`.
- **Energy:** a star the agent reads flares warm (`#ffa95a`, with a hot core) and throws spikes, then cools over about 3 s to a brighter white than the rest. It warms its gas and its threads too. Sparks and beams are the same warmth, cooling along the line behind their head.
- **While an answer stands** (every lighting but Quiet), the rest of the sky recedes (about 55% dimmer), so the stars it read are the white ones. The next question or ⚙ *clear the lit stars* brings it back.
- **The gas:** `#3a3aa8` violet and `#177a8c` teal. Nothing warm appears unless something happens.

## What to try

- **Ask.** Use a suggestion or type a question. The stars light as each `search_wiki` call comes back, before the reply, and the sky turns to face them (⚙ On answer: stay, to compare). Follow-up questions keep the conversation.
- **Hover a star** for its topic label and passage count. The page's other passages get a thin ring, and in C their thread brightens. **Click** asks about that topic.
- **Tab** into the sky (it lands on the brightest star). The arrow keys move to the nearest star in that direction, Enter asks, and Esc leaves.
- **Drag** to turn the sky. It keeps turning slowly on its own (⚙ Turning).
- ⚙ **View 390 px** shows the page in a phone-sized frame.
- ⚙ **Readout** shows:
  - the frame rate and GPU time;
  - the hovered star (id, topic key, label);
  - for the last question, a timeline of each search, when its stars lit, the tool effects the real site would play, when the first words arrived and the token count;
  - every lit star with its similarity.
- ⚙ **Ask with: retrieval only** lights the stars from one embedding search, without the model. It's fast and cheap for comparing layouts and lightings.
- ⚙ **Weak matches** decides what happens to a search's weaker hits:
  - *dimmer* (the default): brightness follows similarity;
  - *as bright*: every hit lights the same;
  - *not lit*: only hits within 80% of the best one light, and the readout marks the rest "weak: not lit".

  For "Tell me about Athena", the agent's search gave Athena 0.68, then AcceptedX and LogoLife 0.50 and Tolstoy 0.43. *Not lit* keeps only Athena.

## Settings (all kept in the URL)

`variant` flare (Janriz's pick)/trace/beam/quiet · `render` BC/A/B/C (round 1's `?variant=A|B|C` links still open that rendering) · `weak` fade/all/strong · `layout` pca/umap · `backdrop` on/faint/off · `tele` off/on · `turn` off/slow/faster · `follow` turn/stay · `name` on/off · `ask` agent/retrieval · `motion` full/reduced (defaults to the OS setting) · `view` desktop/390 · `readout` off/on · `size` 0.35–1.6 (default 1: Janriz wants the sky to take as much of the screen as it can). `embedded=1` hides the prototype chrome.

## Reduced motion

- The sky doesn't turn on its own, and it doesn't turn to face the answer.
- Lit stars fade up in 0.4 s, with a brief warm tint instead of the flare. Trace and Beam fall back to this: no sparks and no beams.
- The layout switch is instant, and the bot keeps still.
- Dragging still turns the sky, without inertia.

## Frame cost

From `node measure.js` (round 2), headless Chrome with the GPU on (Metal, an M5), with the layout on UMAP. It measures at rest, and right after two questions light their stars with Trace (sparks and paths included). GPU time covers the sky's whole frame; the bot's canvas isn't counted.

| | 1440 × 900 @2x | 1920 × 1080 @2x | 390 × 844 @3x (drawn at 2x) |
|---|---|---|---|
| **B+C** | 3.0 ms (p95 5.2); lit 2.9 | 4.1 ms (p95 6.6); lit 4.9 (p95 7.8) | 1.3 ms (p95 2.1) |
| **B+C, round 3's galaxies** | 4.6 ms (p95 9.0) | 6.2 ms (p95 11.2) | 1.6 ms (p95 4.3) |
| A Starlight | 1.3 ms (p95 2.2) | 2.2 ms (p95 4.3) | 0.5 ms (p95 0.8) |
| B Nebula | 3.0 ms (p95 4.7) | 3.8 ms (p95 7.2) | 1.4 ms (p95 2.3) |
| C Threads | 1.4 ms (p95 2.2) | 2.2 ms (p95 3.4) | 0.7 ms (p95 1.3) |

- Every config held 60 fps. The raw numbers are in `shots/frame-cost.json`.
- An M5 proves nothing about a mid-range laptop, so read these as costs relative to each other.
- B and B+C cost about 2–3× A, nearly all of it in the gas pass; the threads and the sparks add almost nothing.
- Round 3's 24,000 galaxies add about 1.5 ms at 1440 px and 2 ms at 1920 px, drawn live every frame. The build should bake them into a cube-map texture once, so they cost one lookup. The rest of the table predates them.
- Much of A's cost is the full-screen background at 2x. A later tier could draw the background once, not every frame.

## Found while building: retrieval returns almost nothing in production

- `wiki_chunks_embedding_idx` is `ivfflat` with `lists=100`, over 95 rows. At pgvector's default `ivfflat.probes = 1`, a query searches one list, which is usually empty.
- Checked on 2026-09-29: five real questions got 0, 0, 0, 1 and 0 rows back. With every list probed, each got 6 good hits (Athena's own passage at 0.55, the thesis passages at 0.49–0.62).
- So the live agent's `search_wiki` is effectively blind, and it answers from the page's display copy.
- `server.ts` runs the same query with every list probed, so this prototype shows the ranking production should be giving.
- The fix is in the chat backend, which this map rules out of scope. At 95 rows an exact scan is instant, so the index could simply go.

## Files

- `server.ts`: a static server plus `POST /ask` (the real agent, streamed as NDJSON) and `GET /retrieve`.
  - The browser gets star ids and similarities only: never chunk text, titles or chunk ids (the direction of *Stop sending chunks to the browser*).
  - A passage whose chunk has no star (a confidential employer's page) is counted, not shown.
- `sky.js`: three.js draws and GSAP drives.
  - There's one 128×1 float texture of per-star state (heat, lit, hover, focus), which the stars, the gas and the threads all read. Warming one star warms all three.
  - Sparks and beams are 64 reusable trail slots, each a line up to a moving head. Their progress, alpha and warmth sit in a second small texture that GSAP's tweens feed.
- `main.js`:
  - the bar and the settings;
  - one invisible `<button>` per star, placed over it each frame, for hover, click, focus and the arrow keys;
  - drag to turn;
  - the bubble, and the stream reader.
- `labels.js`: rough labels and click-to-ask questions for the 44 topic keys. People are labelled by role, not name. The real labels are the copy pass's.
- `rig.js`, `talk.js`, `bot.glb`: symlinks to the stand-in bot from *See the bot in the viewport* and *3D route verdict*.
- `check.js`: headless screenshots into `shots/`, with `node check.js [filter]`. `measure.js` gives the frame cost.

## Round 4: the voyage

> **Rejected as a direction** (2026-09-29): a text column over a moving camera reads as a webpage on a 3D background. See the verdict at the top.

`voyage.html` is the whole page: the settled sky as the hero, then About, Work, Projects and Contact, each a stop the camera reaches as you scroll, with its own light. The text is one real-HTML column, and native scroll (GSAP's ScrollSmoother) moves the camera. It answers the rest of the ticket's question: type, how text sits over the world, the stops at layout level, the route map, phones, the 3D colour-fidelity rule and the content answers.

### The three directions (`?dir=1|2|3`, ‹ › in the bar, or ← →)

Each direction is a whole design: a layout, a type system and a route map. ⚙ mixes them (say A's layout with C's map); the bar then says "(mixed)".

| | Layout | Type | Route map |
|---|---|---|---|
| **1 A Column** | One calm column on the left; the world always on the right. | **Logbook**: Newsreader, a text serif with optical sizes, for reading and headings; Instrument Sans for the small print. | **Ticks**: a strip at the right edge. The current stop is named, the others are marks. |
| **2 B Alternate** | The column swaps sides per stop (About left, Work right, Projects left, Contact right), and the world takes the other side. The bot crosses over to park on the world's side. | **Plaque**: Jost, in Futura's line (the Apollo 11 plaque's face), with the name and headings in tracked capitals; DM Mono only for dates and stacks. | **Line**: a thin route across the top, each stop marked where it sits in the page, with a ring for "you". |
| **3 C Centre** | One centred column; the world on both flanks, alternating. Contact's beacon sits above the text. | **Instrument**: Geist, a crisp grotesk; Geist Mono only for dates and stacks. | **Map**: a small drawing of the real voyage seen from above, with the sky's 93 stars at its start. They light as the bot explores, from anywhere on the page. "You" is a marker with a view cone, and at Work the map shows the year you're at. |

Every family is free for commercial web use (the OFL, from Google Fonts). General Sans (Fontshare) was the first pick for Instrument, but Fontshare's API and CDN didn't answer from here on 2026-09-29, so Geist stands in. Either way the build self-hosts the files.

### The universe

The voyage runs **outward**. Each stop is further from the sky than the last, and the camera looks back at it, so the sky shrinks behind each stop and stays in view at About, Projects and Contact. Its lighting reads from there too: a flare shows as warm points in the far cluster.
- **Hero:** the sky from outside, size 1, as settled.
- **About, home:** a small planet with a thin orbit and a moon, in the plum light.
- **Work, the route:** a line from the present back to Aug 2023, spaced by time. A ring marks each role and a tick each model release (longer ticks for the ones he built with), and a dashed line runs off the head into what hasn't happened yet. The camera stands just past each role, looking back along the route towards the present, so scrolling back in time pulls you further from home. The HTML list mirrors it: a hairline route down the left, a ring per role and a tick per release.
- **Projects, a world each:** nine planets, the AI work first and biggest; Athena has the ring. Each world's air is a different cool tint.
- **Contact, the beacon:** a pulsar at the edge, its two beams sweeping once every 9 s like a lighthouse, not a blink. The camera stands beyond it, looking back over the whole voyage. The beacon **warms** when you point at or focus a way to get in touch: warmth is energy.
- When the agent calls `highlight_project`, that world **warms** for 3 s (the real site would warp there; the prototype scrolls).

**Two rules came out of the screenshots, and the build should keep them:**
1. **A piece fits its field.** A stop's piece is never wider than the free field beside the column (86% of it), so it never sits behind the text. It's computed from the column's real position, so it holds at any width and in every layout.
2. **Only the current stop is lit.** The other pieces recede (home and the worlds to 34%, the route to 45%). A world that isn't the subject is never bright behind the text, and it reads as depth. At Contact everything behind you comes back to 70%, as a view back over the voyage.

Light comes from a far sun ahead of the voyage, not from the sky. The camera looks back at each stop, so light from the sky would leave every world's near side in the dark (the first screenshots were black discs).

### Colour as light, per stop

The tint round the camera blends in OKLab as you travel. The values are written in OKLCH (`TINTS` in `voyage.js`), with the same lightness and chroma and only the hue walking, so no stop is louder than another.

| Stop | Tint | Why |
|---|---|---|
| Hero | `oklch(0.195 0.061 274)`, round 1's `#0d1130` | blue-violet round the sky |
| About | `oklch(0.2 0.055 320)` | plum: home, the nearest the dark gets to warm without being energy |
| Work | `oklch(0.2 0.04 210)` | teal: the route through the dust |
| Projects | `oklch(0.195 0.055 256)` | deep blue; each world brings its own air |
| Contact | `oklch(0.135 0.03 248)` | almost black: the edge, where the beacon is the light |

- **Warmth is energy only:** a star lighting up, a world the agent points at, the beacon when you reach for it.
- **White is for what matters:** the text, the worlds' lit edges, the beacon.
- **Links, focus and buttons don't depend on colour:** links are white and underlined (thicker on hover), focus is a 2 px white outline, and buttons are outlined.
- ⚙ Light: *the hero's everywhere* turns the per-stop light off, for comparison.

**Contrast.** ⚙ Readout checks the text against whatever the world puts behind it. It samples the frame behind every visible line of text and takes the 98th-percentile brightest spot as the worst case. Over 54 screenshots (three directions × nine stops × 1440 and 390), after the two rules above:
- body text 15.5–18.5:1;
- secondary text (74% white) 8.1–9.1:1;
- the small print (56% white) 5.2–5.5:1, against AA's 4.5.

Before the rules, a world behind the column took the small print down to 1.7:1 on a phone and 3.8:1 in C. The beacon's beams can sweep behind the text for a moment, and each shot only catches the moment it was taken, so the build should keep the beams off the column.

### Phones (⚙ View: 390 px)

- All three directions collapse to one column. Each stop's piece sits in the top quarter as its heading arrives halfway down, and each project gets empty space above it for its world.
- The name moves to the top of the hero, because the First visit's bubble owns the bottom of a phone.
- The route maps shrink: ticks without names, the line with only the current name, and a 104 px map at the top right.
- **Still open for *Pick the AI entrypoint*:** the parked bot covers the bottom-right corner of the text column on every stop.

### The colour-fidelity rule (`fidelity.html`)

The stand-in bot and three flat swatches are drawn four ways, and the pixels are read back and compared with the colour asked for (ΔE in OKLab ×100: under 2 is invisible, over 5 is a different colour).

| Set-up | `#ff5a1f` (old accent) | `#ffa95a` (energy) | `#dfe7ff` (star white) |
|---|---|---|---|
| AgX, lit accent (the 3D route verdict's) | `#d78264`, ΔE 9.8 | `#d0a884`, ΔE 8.4 | `#c1c4cb`, ΔE 11.2 |
| Neutral, lit accent | `#f15a2d`, ΔE 2.7 | `#f1a158`, ΔE 3.2 | `#d3daf1`, ΔE 3.9 |
| No tone mapping | `#ff663c`, ΔE 2.3 | `#ffaf67`, ΔE 1.6 | `#e4ebff`, ΔE 1.3 |
| **Neutral + unlit accent** | `#ff5a1f`, ΔE 0.0 | `#ffa95a`, ΔE 0.0 | `#dfe7ff`, ΔE 0.0 |

**The candidate rule** for the 3D stack ADR's addendum:
- **Lit surfaces** use Khronos PBR Neutral tone mapping, never AgX or ACES. AgX greys the whole palette: even white goes grey.
- **Any colour that carries meaning** (energy, the bot's eyes and boosters, anything that must match the page) is drawn **unlit** (`MeshBasicMaterial` or a shader) with `toneMapped: false`, written as a display value. That's how the sky and every piece in the voyage are already drawn.
- No tone mapping at all is close on colour, but it clips lit surfaces: the bot's shell blows out to flat white.

### Frame cost (`node measure-voyage.js`)

These figures are for direction A, headless Chrome with the GPU on (Metal, an M5), at dpr 2, over 150 frames at each stop once the camera had settled. The bot's own canvas isn't counted.

| Stop | 1440 × 900 | 390 × 844 |
|---|---|---|
| Hero | 4.2 ms (p95 8.1) | 5.4 ms (p95 11.2) |
| About | 4.6 ms (p95 8.9) | 4.8 ms (p95 8.4) |
| Work | 3.7 ms (p95 10.4) | 4.1 ms (p95 8.9) |
| Athena | 4.7 ms (p95 7.6) | 4.6 ms (p95 9.7) |
| Mercado | 4.0 ms (p95 8.3) | 4.3 ms (p95 10.9) |
| Contact | 4.5 ms (p95 7.7) | 4.3 ms (p95 8.2) |

- Every stop held 60 fps. An M5 proves nothing about a mid-range laptop.
- The worlds' surfaces were first worked out per pixel, every frame (fbm noise), and Athena alone cost 9 ms (p95 17.7). They're now **baked once** into a 1024 × 512 map per world at load, and only the light is computed per frame; that halved it. The build should bake them too, or author them in Blender.
- Most of what's left is the sky itself: the gas pass and the 24,000 far galaxies, which the build should also bake (round 3's note).

### The content answers, as the voyage shows them

- **"What I shipped":** each role has one sentence (`ROLES` in `content.js`), as a first draft for the copy pass.
- **The retired copy keys:** the two taglines, the About lede and the typewriter words have no place in one page with no typewriter. One hero line replaces them.
- **Title and subtitle:** "Athena — AI Chat Assistant" becomes **Athena** / *An AI assistant with a memory*, and every project gets a subtitle. It reads well at world scale.
- **Mercado's screenshot:** there's no single featured screenshot. Each public project shows its own, and the NDA work shows none (the NDA line stays). The lead world is Athena, because AI work comes first.
- **Also judged:** his portrait in About (⚙ Portrait on/off).

Some copy is a stand-in for the copy pass: Contact's "what's next" line, the subtitles and the "shipped" sentences.

### Model releases on the route

Thirteen markers, from GPT-4 Turbo (Nov 2023) to Claude Opus 4.5 (Nov 2025), with names and months only. The ones he built with are marked: GPT-4o, GPT-4.1 and GPT-5, plus the Model Context Protocol (a protocol, not a model: in or out?). **Every date is to be verified** by the research step at build time. 2026's releases are missing, because they're past what could be checked here.

### Found on the way

- **The Supabase pooler, jsdelivr, Fontshare and GitHub all timed out from this network** on 2026-09-29, while Google Fonts and OpenAI worked. The page and its libraries now load locally. Real retrieval couldn't be demonstrated in round 4, so the lighting-from-afar screenshots light the Athena and crawler stars directly.
- A slow font host must never block the first paint: both font stylesheets load with `media="print"` and swap in on load.
- The beacon's beams were invisible at first: a camera-facing fan can wind either way on screen, so it has to be double-sided.

### Files (round 4)

- `voyage.html` and `voyage.js`: the page, the three directions, the camera's keyframes built from the page's own headings, the route maps, the contrast check and the readout.
- `stops.js`: home, the route, the worlds and the beacon; the worlds' bake; focus.
- `content.js`: the display content with this round's candidate answers.
- `fidelity.html` and `fidelity.js`: the colour-fidelity bench.
- `check-voyage.js`: screenshots into `shots/voyage/` with a contrast line per shot. `measure-voyage.js` gives the frame cost.
- `sky.js` gained a camera driver, solid and extra scenes, and `setLight`. The far galaxies now centre on the camera. `index.html` looks the same (a mean pixel difference of about 1 in 255).
