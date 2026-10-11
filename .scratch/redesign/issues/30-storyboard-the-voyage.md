# Storyboard the voyage

Type: prototype
Labels: wayfinder:prototype
Status: resolved
Blocked by: 29, 32

## Question

What is the voyage, scene by scene? Build it as a rough animation played by real scroll, under the grammar from *Make every scroll a scene*, for Janriz to react to. Use grey blocks and the real sky, with no polish, so the structure is decided before any of it is finished.

**For every scene it shows:**
- its subject;
- the device that carries it into the next: a dive in, a pull out, a match cut or an opening up;
- the text it carries and where that text sits in the frame;
- its length in scroll and its hero pose;
- how it reads at 390 px, and what reduced motion shows instead.

**A starting storyboard** (proposed on 2026-09-29, not decided):
1. **Hero → About:** dive into the Deep Field. One point of light grows and turns out to be home.
2. **About → Work:** home's orbit ring peels off and straightens into the route, and the camera rides it back in time. The roles are gates it flies through.
3. **Projects:** each world has two beats: it arrives, then it opens.
   - It opens to show what it's made of, like Edolus's rack → tray → chip.
   - On public projects the surface becomes the real screenshot, like Edolus's cards becoming the car's screen.
   - NDA worlds open to patterns only.
4. **Contact:** pull all the way out. Every world, the route and home shrink back into the Deep Field, the film's first frame, and one star burns: the beacon.

**Janriz's idea for Work** (2026-09-29, not final): the work timeline could be its own experience, with every frontier AI breakthrough emphasised by a scene unfolding.
- His examples: Anthropic releasing Fable, which "felt like AGI at the time", and Project Glasswing before it.
- The route runs to the present, through Claude Opus 5.5 and Claude Sonnet 5.5. Janriz notes Sonnet 5.5 came out on 2026-09-29.
- Round 4's markers stop at Claude Opus 4.5 (Nov 2025), so 2026 has to be added.
- The research step verifies every name and date before it's built (the map's build fog).
- To weigh: how many breakthroughs earn a scene of their own, against the roles, which are the section's point.

**It takes over most of *Plan the signature moments*.** In a film the transitions are the signature moments. That ticket now waits on this one and weighs what's left once the film exists.

**Reuse** from `prototypes/deep-field-sky/`:
- the sky (`sky.js`);
- round 4's pieces (`stops.js`): the baked world surfaces, the route and the beacon;
- the content (`content.js`);
- the stand-in bot and its bubble.

Resolved when Janriz reacts. The answer is the shot list: every scene with its subject, device, text, scroll length and hero pose, plus its phone and reduced-motion versions. The per-scene build tickets graduate from it.

## Comments

- 2026-09-29 — **From [Make every scroll a scene](29-make-every-scroll-a-scene.md)** (resolved). The grammar to storyboard under:
  - **The shape of a scene.** A scene arrives, holds and leaves. The stage settles only near a hold, so in-between frames count too.
  - **Text:** the title rides its subject, with at most four steady lines. More to say earns a second hold, where the world opens up.
  - **The sky is the universe.** Each section is found in its own region: About in the core, Work in the career and campus lobes, Projects in the personal lobe.
    - Placing each scene at its own stars fails, since most stops have one or two stars or none ([research/scene-star-clusters.md](../research/scene-star-clusters.md)). Place scenes within a region for composition.
    - Other celestial bodies are welcome (nebulae, moons, rings, comets, a pulsar). Only stars are stars.
    - A scene may cut away from the sky when its story needs it, e.g. a breakthrough on Work.
  - **Two options to try for the lists:**
    - each company or project as its own scene;
    - a row of cards the scroll blazes through, like Edolus's Intelligence Layer carousel.
  - **The portrait in About.** Janriz: "I hope the portrait doesn't feel out of place. If it doesn't, get creative."
  - **Work's markers** come from [Research the AI breakthroughs on the Work route](32-research-the-ai-breakthroughs.md)'s shortlist, which ends at Claude Sonnet 5.5. "Built with": GPT-4o, MCP, Structured Outputs, embedding v3, GPT-4.1, GPT-5, Grok 4 Fast and Sora 2. Decide whether a built-with entry displaces a bigger breakthrough in its quarter: embedding v3 over Claude 3, Structured Outputs over o1, or Sora 2 over Claude Opus 4.5 (findings §7).
  - **Scroll hops from scene to scene** by any device. The light-speed feel stays the warp's own.
  - **Contact** pulls back out to the whole sky.
  - **Per scene:** show its reduced-motion version (a hold still, crossfaded) and its portrait framing.
- 2026-09-29 — **Prototype built, waiting on Janriz's reaction.** [prototypes/voyage-storyboard/](../prototypes/voyage-storyboard/README.md): run `./serve.sh`, open http://127.0.0.1:4178/.
  - **What it is:** the whole film on real scroll, in grey blocks inside the real sky. It has three storyboards, and the shot lists are generated from the films in [SHOTLIST.md](../prototypes/voyage-storyboard/SHOTLIST.md).
    - **A:** every stop a scene. 25 holds, about 48 screens.
    - **B:** breakthroughs unfold. 32 holds, about 67 screens.
    - **C:** blaze through the lists. 19 holds, about 32 screens.
    - **Recommended cut:** A's Work with B's Projects, `?variant=A&projects=system`. 20 holds, about 40 screens, the length of Edolus's film.
  - **Proposed beyond the starting storyboard:**
    - the dive's point of light is his own star (`s043`), and home is a world in its light;
    - About's second hold lights the stars it's written from;
    - a match cut from the route's start ring to Athena's ring;
    - LogoLife's work sits at the sky's centre by its own stars, not in the personal lobe;
    - the beacon is the star you dove into.
  - **Findings:**
    - A's six NDA worlds come out as near-identical scenes;
    - B's thirteen panels make Work 41 screens, which drowns the roles;
    - C reads as a list, not a film.
  - **For Janriz to react to:** the spine; Work (A/B/C); Projects (A/B/C); "built with" (a tag only is recommended); the portrait (on a plate riding home's orbit, plain, or none); the length; and the pick for *Finish one scene* (the dive into home).
- 2026-10-01 — **Janriz's reaction to round 1, and round 2 built.** Still claimed: round 2 is waiting on his reaction.
  - **His reaction:**
    - **The scroll.** "I hate the scrolling experience… you try to scroll, nothing is happening for a few seconds then it jumps to the next scene." On Edolus, "every scroll there's always something happening." He wants scenes "in coherence and seamless, not fragmented", never a jump.
    - **Ideas.** Round 1 looked like the first prototype's first variant turned into a journey: "nothing is absolute… you have the case studies in your arsenal… so shoot."
    - **He keeps the recommended cut**, with these changes:
      - the three personal projects become one area you scroll through, e.g. Trionn's spiralling gallery;
      - only Athena and the crawler stay as NDA scenes, and the other four become moons;
      - "AI-assisted crawler" is renamed **AI Web Crawler**. It's the main highlight, with its own mini-sequence through its pipeline's stages, from his diagram (stand-in copy in `content.js` `PIPELINE`);
      - breakthroughs become objects you pass and can read on the road, so only the companies get scenes.
    - **A standing rule** added to the map's Notes: every design change goes back to the case studies.
  - **Round 2:** [prototypes/voyage-storyboard-2/](../prototypes/voyage-storyboard-2/README.md). Run `./serve.sh` and open http://127.0.0.1:4179/. The shot list is [SHOTLIST.md](../prototypes/voyage-storyboard-2/SHOTLIST.md), and a 3 min 20 s walkthrough at reading pace is `recording/out/voyage-round-2.mp4`.
    - **One take:** 14 scenes and 48.8 screens.
    - **The camera never stops.** It slows to a fifth of its speed where text is in, as in Edolus's stretch bands, and subjects keep turning with the scroll.
    - **No settling at all**, and text writes in and dissolves word by word with the scroll.
    - **No cuts.** Each seam carries a thread:
      - his star into home;
      - home's orbit into the route;
      - from the route's start, a look back down the road, a fly-back to the present, and a spur off LogoLife's stretch to Athena;
      - a stream of records upstream from Athena to the crawler;
      - one record followed down the crawler's pipeline, which then flies out and turns over into the first screenshot of Trionn's ribbon;
      - the pull-out to the beacon.
    - **Breakthroughs are monoliths beside the road.** Each turns to follow you, with its text on its face in perspective (real HTML, via `matrix3d`). It's readable for about half a screen at desktop and at 390 px.
  - **This amends *Make every scroll a scene*:**
    - "a hold is a composed, nearly still stretch" becomes a reading stretch where the picture keeps moving;
    - "settling, the Edolus way" is dropped;
    - "text arrives at its own pace" becomes text scrubbed by the scroll.

    If round 2 holds, the resolution here carries the amendment, through an ADR and `CONTEXT.md`'s Hold.
  - **Case studies used:** Edolus (stretch bands, the one take, the quantum climax's anchor and thread, turning subjects) and Trionn (the ribbon). Usavionix, Izanami, Produx and Hashgraph Ventures weren't mined for this round. The next design change starts from all six.
  - **For Janriz to react to:**
    - the feel of the scroll;
    - the monoliths;
    - the company scenes;
    - the look back and the fly-back;
    - the crawler's sequence;
    - the ribbon;
    - the length (48.8 screens; the road, about 14, is the first place to cut).
- 2026-10-01 — **Janriz on round 2, and the case-study list for round 3.** Still claimed.
  - **His reaction:** "this is so much better. i'm actually satisfied with this one." Round 2 holds, so the grammar amendment above (reading stretches, no settling, scrubbed text) goes into the resolution's ADR and `CONTEXT.md`'s Hold.
  - **He asked for round 3:** review the case studies and list improvements. All six were re-read. The list, numbered as given to him (source in brackets; "mine" means not lifted from a site):
    - *One story:*
      1. The slab as the film's one object, at every size: monoliths, the crawler's records, the ribbon's cards, and the portrait's plate as the first one (Produx's moss rock; mine).
      2. One climax, at "Paid for once": all eight rings light top to bottom and the swarm rushes into the database (Edolus's quantum climax; Trionn's one energy value).
      3. One angle, from home's orbit tilt, reused for the monoliths' lean, the write-in, the spur and the ribbon (Hashgraph's 18° diagonal).
    - *Text:*
      4. Text arrives the way its scene moves: inscriptions cut into monoliths, About lines rising from their stars, each crawler stage's line going through its stage (Izanami's surfacing headings; Produx flags plain word fills as generic; mine).
      5. Words write in tinted with the scene's light, then settle to white (US Avionix's #FF2200 → white).
      6. Leader lines for riding labels, and a list on phones, fixing Athena's overlap at 390 px (US Avionix's callouts; Produx's phone list).
    - *The hand* (round 2 reacts only to scroll):
      7. Hero and Contact: drag turns the sky, stars show their topic on hover and ask Pip on click, as *Pick the creative concept* decided (Edolus's drag-to-rotate; Trionn's lean).
      8. Every subject can be asked about, with a chip such as `[ ASK ABOUT ATHENA ]` and a real button (Produx's cursor chips; mine).
      9. The crawler shows its inside to the pointer before the dive, and Athena parts towards it (Edolus's x-ray; Hashgraph's rock).
      10. Fast scroll speeds the stream, dust and swarm, keeping streaks for the warp (Edolus's speed-pitched quantum loop).
    - *Pacing:*
      11. Cut to about 40 screens: the road 14.1 → ~10, the crawler 11.8 → ~9, trimming base pace, never reading stretches (Trionn's 14.5-screen pin, flagged as outstaying its welcome).
      12. Monoliths rise as you near them and sink behind, which also clears the slabs crowding the gate frames (Trionn's work track).
      13. The ribbon's cards turn flat to face you at each project's reading spot (Trionn's ribbon settling into a flat grid).
      14. Fill the two thin frames: the empty ring before the look back (~22) and the stream alone (~28.5) (Hashgraph and Edolus keep a subject centred through every seam).
    - *The ending:*
      15. His time in Cebu beside the availability line, and a way back to the first frame (Izanami's live clocks; Edolus's honest ending and replay).
    - *His call:*
      16. Pip rides the film as its guide: beside you on the road, diving after the record (mine; nearest is Hashgraph's figure across two scenes). May clash with the bot's wander.
    - *Parked for other tickets:* the score keyed on film time, and the harp at the beacon (sound design); US Avionix's silhouette-to-render for the first frame (First visit); Hashgraph's alternate-frame rendering and Edolus's frame-time DPR (build).
  - **Recommended for round 3:** 1, 2, 4, 5, 6, 9 and 11–15. The rest of the hand (7, 8, 10) is *Plan the signature moments*' to weigh; 3 and 16 need his eye first.
- 2026-10-01 — **Janriz picks round 3's list.** He agrees with every recommended item (1, 2, 4, 5, 6, 9, 11–15) and adds 7, 8 and 10. Item 7 is already decided, not new: the stars and constellations are interactive, and a click asks Pip (*Pick the creative concept*). Item 3 (one angle) stays out. Item 16 (Pip as the film's guide) stays out of round 3, but he likes it ("Pip could be a guide and still be interactive / clickable and you can still ask"), so it is saved in the map's Not yet specified, to workshop later. Round 3 is built in `prototypes/voyage-storyboard-3/`, with round 2 frozen.
- 2026-10-01 — **Round 3 built.** Still claimed: waiting on Janriz's reaction. [prototypes/voyage-storyboard-3/](../prototypes/voyage-storyboard-3/README.md). Run `./serve.sh` and open http://127.0.0.1:4180/; round 2 still runs on :4179. The shot list is [SHOTLIST.md](../prototypes/voyage-storyboard-3/SHOTLIST.md), and a walkthrough with four pointer stops is `recording/out/voyage-round-3.mp4`.
  - **What's in it:** round 2's film, plus his picks (1, 2, 4–15). Item by item, with sources, in the README.
    - The slab is the film's one object, from his portrait's plate to every monolith, record and screenshot.
    - One climax at "Paid for once": the whole shaft in view, a front of light down every ring with a rush of records, and the bars shooting up.
    - Text arrives the way its scene moves. About's lines come out of their stars, inscriptions are cut into the monoliths, and each crawler stage's words do what the stage does. Words arrive in the scene's light and settle to white.
    - Leader lines for riding labels, and lists on phones.
    - Stars show their topic and ask Pip on click; dragging turns the sky where it's seen whole.
    - A `[ ASK ABOUT … ]` chip on every subject, with a keyboard button per block.
    - The crawler's lens onto its miniature pipeline, and Athena parting towards the pointer.
    - A hard scroll flings loose things outwards.
    - Monoliths rise as you near them and sink behind you.
    - Screenshots turn flat to face you.
    - The tail frames his university's stars, and the stream reads as slabs.
    - Contact gets his live Cebu time and a rewind back to the start.
  - **Length:** 42.4 screens, down from 48.8. The road went from 14.1 to 11.2 and the crawler from 11.8 to 10.0. The next cut would be the opening (7.1 screens before the road).
  - **Checked headless:**
    - no page errors;
    - every reading spot at 1440 and 390;
    - the in-betweens for About, the monoliths, the tail, each crawler stage and the climax;
    - every pointer interaction driven and screenshotted;
    - reduced-motion stills and the plain fallback.
  - **For Janriz to react to:**
    - the climax;
    - the text modes (especially the crawler's);
    - the slab family;
    - the pointer layer (the chip, the lens, Athena's push, the drag);
    - the rising monoliths;
    - the flat screenshots;
    - the tail's university stars;
    - the length.

## Answer

Decided by Janriz on 2026-10-01, over three rounds: "yep this is it. we'll polish along the way through the later tickets". The full shot list is round 3's [SHOTLIST.md](../prototypes/voyage-storyboard-3/SHOTLIST.md), generated from the film itself: every scene's subject, what moves, seam, hero pose, 390 px and reduced-motion versions, and every block's text and windows. The prototype ([round 3](../prototypes/voyage-storyboard-3/README.md)) and its walkthrough MP4 are the reference for feel.

**The grammar** (ADR 0003; it amends *Make every scroll a scene*):
- the voyage is one take on one continuous camera path;
- reading stretches slow the camera but never stop it, while the subject keeps moving;
- there is no settling and no snapping;
- text is tied to the scroll, word by word, arriving in its scene's manner and light;
- every seam carries a thread, never a cut;
- deep links, warps and reduced-motion stills land on reading spots.

In `CONTEXT.md`, *Hold* became *Reading stretch* and *reading spot*, and *Slab*, *Gate* and *Monolith* were added.

**The voyage, 42.4 screens:**

| # | Scene | Screens | Subject, and what moves | Thread into the next |
|---|---|---|---|---|
| 1 | The sky, and the dive | 2.2 | The whole sky; you can drag it to turn it, hover a star for its topic, and click to ask Pip. The camera dives at his star. | His star, dead centre until it turns out to be home's sun |
| 2 | Home | 1.6 | Home turning, his portrait's slab riding its orbit. About's lines come out of the stars they're written from. | Home stays in frame; the camera draws back |
| 3 | Around home | 1.8 | The stars his About lights, round home. | Home's orbit |
| 4 | The orbit peels off | 1.5 | The orbit straightens into the route. | The ring becomes the route's first stretch |
| 5 | The road | 11.2 | The ride, never stopping. 13 monoliths rise as you near them, are read on their faces and sink behind you. | The line you ride |
| 6–9 | LogoLife, Tolstoy, Elinnov, the Yearbook | about 1.1 each, inside the road | A gate the camera swings round and threads, with its stack riding as beads. | The route |
| 10 | The whole road, and a branch | 2.9 | His university's stars framed in the last ring; then the look back with every monolith standing, the fly-back, and the spur. | The spur |
| 11 | Athena | 3.5 | A ringed world with two moons. Her nearest wedge parts towards the pointer, then she opens on three patterns. | The stream of records |
| 12 | AI Web Crawler | 10.0 | Upstream to the crawler, whose pipeline shows inside through a lens round the pointer. Then the fall through its stages from his diagram, each stage's text moving as the stage moves a record. Then the climax: the whole shaft, every ring lit top to bottom, and "Paid for once". | The record you followed |
| 13 | On my own time | 5.9 | The record flips into Mercado's screenshot. Trionn's ribbon of eight unrolls, and each card turns flat to face you. | The ribbon pulling away |
| 14 | Contact | 2.6 | The whole sky and the beacon; his time in Cebu; "Back to the start" rewinds the film. | — |

**Across the film:**
- One slab family.
- Leader lines for labels, which become lists on phones.
- Every subject can be asked about (a `[ ASK ABOUT … ]` chip, or a keyboard button), and a hard scroll flings loose things outwards.
- Phones get every reading spot composed for portrait. On the road the camera hangs back at each monolith.
- Reduced motion is a still per reading spot, crossfaded.
- Plain is the no-WebGL fallback.

**Polish is the build's.** Janriz will polish along the way, through the later tickets, against *Finish one scene*'s bar.

**For *Finish one scene*:** the storyboard picks the dive from the hero into home (scenes 1–2). It's the first scroll every visitor makes, and it carries the hero's type and the route map's first appearance, which that ticket settles. The alternative is the crawler's climax, the main highlight.

**Out, or saved for later:**
- One angle for all motion (round 3's item 3) is out.
- Pip as the film's guide (item 16) is in the map's Not yet specified, to workshop later.
- The warp, the route map, sound and type are other tickets'.

**Graduated:**
- [Set up the stack groundwork](build.md#t33), and [Build the film engine](build.md#t34), which carries the grammar;
- one ticket per stretch of the film:
  - [Build the hero and home](build.md#t35)
  - [Build the peel and the road](build.md#t36)
  - [Build the gates](build.md#t37)
  - [Build the look back and the spur](build.md#t38)
  - [Build Athena](build.md#t39)
  - [Build the crawler](build.md#t40)
  - [Build the pipeline and its climax](build.md#t41)
  - [Build the record's flight and the ribbon](build.md#t42)
  - [Build Contact](build.md#t43)
- [Build the pointer layer](build.md#t44).
