# Make every scroll a scene

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Blocked by: 27

## Question

How does Deep Field's page become a film, where every scroll changes the scene rather than scrolling a page over a 3D background? The answer amends ADR 0001 (`docs/adr/0001-one-page-universe.md`) and `CONTEXT.md`.

**Why it's open again.**
- Round 4 of *Prototype the visual language* built the page that *Pick the creative concept* described: one world behind a real-HTML page, with a calm text column the world arranges itself around.
- Janriz rejected it on 2026-09-29. It "feels more like a linear site / webpage that's slapped on top of a 3D background as a separate layer. It feels flat."
- What he wants is what Edolus does: "Every scroll is a transformation, rather than a linear progress… Every scroll is a scene."
- That ticket's last comments hold why round 4 read flat and what the references do, from Edolus's transition clips frame by frame.

**What stands** (not reopened):
- **The standing constraints.** GSAP drives. Native scroll goes through ScrollSmoother, with no wheel hijack. Text is real HTML. The AI entrypoint is usable within 1 s. There are reduced-motion and phone tiers, and the budget holds.
- **From *Prototype the visual language*:** the sky, colour as light, and the 3D colour-fidelity rule.
- **The stops, in order:** the sky as the hero, About as home, Work as a newest-first route, a world per project, and Contact as a beacon.
- **The warp for jumps** (*Warp or scroll*), and the bot as the guide. In the concept's words, "a bot that has read them all flies you through it".

**The answer decides:**
- **The stage.** Proposed:
  - one full-screen stage pinned over native scroll, as US Avionix does with its sticky container;
  - one timeline that scroll plays;
  - each scene rests on a hero pose (a composed resting frame), and scrolling settles on it gently after a pause, as in Edolus and Hashgraph;
  - more scroll wherever there's something to read, like Edolus's stretch bands;
  - the scrollbar, the `#sec-*` deep links and Back keep working.

  Avoid US Avionix's stepper, where one gesture plays one scene, and Hashgraph's copy bands, which are so narrow that a fast scroll never shows them.
- **Text in the shot.** Text is set into the frame around its subject and arrives and leaves with it, where round 4 had a column. ADR 0001 promises text "readable at any scroll position", but a film can only promise it at each hero pose. Decide what replaces that promise.
- **How much text a scene carries, and where the rest lives.** Edolus shows a title and one to four short lines, and four roles and nine projects don't fit in that. The options:
  - scenes that hold longer;
  - a world that opens into a readable card;
  - the bot;
  - a plain reading layout, which reduced motion needs in some form anyway.

  It also answers the content questions round 4 left open:
  - the "what I shipped" sentence per role;
  - the title/subtitle split;
  - a screenshot per public project instead of a featured Mercado;
  - the portrait in About;
  - whether the Work route holds breakthroughs beyond model releases. The Model Context Protocol raised this, and Janriz's idea in *Storyboard the voyage* points that way.
- **The camera's grammar.** Round 4 ran outward, with the camera looking back at the sky. The proposal dives in instead: each scene is found inside a point of light, the way Hubble's empty-looking patch held galaxies, and Contact pulls back out to the first frame. The order of the stops stays.
- **Reduced motion and phones, as principles.** The build's tiers follow from them.
- **The warp inside a film.** Warps land on hero poses, scrolling carries on from there, and Back returns.
- **The route map nav.** It stays a route map whose links warp, unless the stage changes that.
- **Terms.** `CONTEXT.md` lists "Scene" as a word to avoid for **Universe**, and "film" for **Voyage**, and says the page's text stays on top of the universe. Settle the word for a scene and rewrite those entries.

Resolved when Janriz has decided the above. The answer amends ADR 0001 and `CONTEXT.md`, and updates the map's Notes and build fog where they describe the page.

## Comments

- 2026-09-29 — **Grilling, round 1** (Janriz).
  - **The stage: one stage for the whole voyage.** A full-screen stage (the 3D canvas and the text layer) stays pinned while the document scrolls under it. The document is a runway: one tall section per scene, with its `sec-*` id and its real HTML text in page order. Native scroll through ScrollSmoother drives one master GSAP timeline. The scrollbar, keyboard, deep links and Back keep working, and a deep link lands on its scene's resting frame.
  - **Scrubbed picture, played text.** The camera and objects scrub with scroll. Text arrives at its own pace once its threshold is crossed, and reverses on the way back.
  - **Settling (open).** He agreed to "always settle to the nearer hold", then pointed out that Edolus doesn't: it keeps whatever frame the visitor stopped on, e.g. the rack held mid-fade with its title and bullets waning. Re-asked in round 2.
  - **The camera's grammar: the sky is the entire thing** (his idea, replacing the options given). In round 4 the sky sat as one piece beside the planets, which looked out of place and hid its scale. Instead:
    - the hero is the whole sky, and the Flare is showcased there;
    - every later scene is a zoom into the sky;
    - a question asked from inside the sky, whose answer has a destination, zooms back out, flares, then goes there;
    - a question with no destination changes nothing on the stage and the bot just answers, unless the flare can be shown from inside.

    His message listed an (a) with no (b). Details are confirmed in round 2.
- 2026-09-29 — **Grilling, round 2** (Janriz).
  - **Settling, the Edolus way.** The stage settles only when the visitor stops close to a hold. Anywhere else the frame stays where it was left, so every in-between frame has to be worth resting on, not just the holds. That raises *Finish one scene*'s bar.
  - **Text leaves with the scroll.** Text arrives played (at its own pace, once its threshold is crossed) and leaves scrubbed, waning with its subject. A stop mid-exit holds the wane.
  - **The sky is the universe.** Nothing sits outside it:
    - the hero is the whole sky seen from outside;
    - every later scene is inside it, at a scale that shows how big it is;
    - round 4's pieces are found inside the sky, small against it;
    - Contact pulls all the way back out to the film's first frame.
  - **The warp keeps its light-speed feel.** Its legs:
    - pull back out to the whole sky, skipped in the hero, which is already outside;
    - the flare, when a question explored stars;
    - the bot gets ready;
    - light travel into the destination, where the wormhole can serve as the light travel itself;
    - arrival.

    This amends *Warp or scroll*'s journey: the page no longer spirals into a black hole, and the pull-back replaces it.
  - **Questions in the hero** flare, then warp if there's a destination. There's no pull-back.
  - **With no destination,** his default is that nothing happens on the stage and the bot just answers. He likes the "you are here" miniature sky; option (b), the stars around the scene, is re-explained in round 3.
- 2026-09-29 — **Grilling, round 3** (Janriz).
  - **Scroll hops from scene to scene** once past the hero, by whatever device fits. It isn't a hard rule that every scene is inside the sky: Work's model-release scenes, for example, may be unrelated to it, the way Edolus goes from a satellite to a server room. "We'll see."
  - **The flare, provisional:** with a warp destination, the warp pulls back out and flares. With none, nothing pulls back: the explored stars in view flare where they sit, and the miniature sky flares too.
  - **The route map is the sky in miniature:** each scene marked where it sits, a "you are here", and links that warp. The flare plays on it. Its final form stays with *Finish one scene*.
  - **Text in the frame, mixed:** the title rides its subject, and the few body lines sit steady in a quiet part of the frame and wane with it.
  - **The new promise:** every word is readable at its scene's hold, with AA measured there. All the text is in the document, in page order, all the time.
  - **Text budget:** a hold carries a title and at most four short lines. More to say earns a second hold, where the world opens up. The bot goes deeper. No plain reading layout is offered to everyone. Two more ideas go to the storyboard:
    - each list item (company, project) as its own scene;
    - a row of cards the scroll blazes through, like Edolus's Intelligence Layer carousel.
  - **Warps land on holds,** and Back is a nav-link warp.
  - **Each section sits in its own region of the sky** (the core, the career and campus lobes, the personal lobe), and scenes within a region are placed for composition. See [research/scene-star-clusters.md](../research/scene-star-clusters.md).
  - **New:** within the sky's bounds, the universe can hold other celestial bodies, not just planets.
  - **He likes round 4's direction A.** It's frozen in `prototypes/voyage-round4-a/` (port 4177).
  - **The light travel should feel like Edolus's quantum climax.** It's reviewed in [research/edolus-quantum-climax.md](../research/edolus-quantum-climax.md).
- 2026-09-29 — **Grilling, round 4** (Janriz). All yes:
  - the warp's finish bar from the quantum climax, keeping the bot's one clean circle before takeoff;
  - other celestial bodies, with only stars being stars;
  - reduced motion as crossfading stills;
  - phones as the same film, lighter;
  - the content answers, with the portrait: "I hope the portrait doesn't feel out of place. If it doesn't, get creative";
  - Work as AI breakthroughs of any kind, where the latest is Claude Sonnet 5.5, just after Claude Opus 5.5. He asked for the research, which is [Research the AI breakthroughs on the Work route](32-research-the-ai-breakthroughs.md);
  - the terms.

## Answer

Decided by Janriz on 2026-09-29 over four rounds of grilling. It amends ADR 0001 and *Warp or scroll*'s journey.

**The stage.** One full-screen stage stays pinned over native scroll for the whole voyage.
- **The document is a runway:** one tall section per scene, with its `sec-*` id and its real HTML text in page order. ScrollSmoother drives one master GSAP timeline.
- The scrollbar, keyboard, deep links and Back keep working, and a deep link lands on its scene's hold.
- **Scenes and holds.** Each scene arrives, holds and leaves. A hold is a composed, nearly still stretch with its text fully in, and a scene with more to read gets a longer hold.
- **Settling, the Edolus way.** The stage settles onto a hold only when the visitor stops close to it. Anywhere else the frame stays as it was left, so every in-between frame must be worth resting on.
- **Scrubbed picture, played text.** The camera and objects scrub with scroll. Text arrives at its own pace once its threshold is crossed, and leaves with the scroll, waning with its subject. A stop mid-exit holds the wane.

**The sky is the universe.** Nothing sits outside it.
- **The hero** is the whole sky seen from outside, where the Flare is showcased. Every later scene is inside the sky, at a scale that shows how big it is. Contact pulls all the way back out to the film's first frame.
- **Each section sits in its own region of the sky:**
  - About in the core;
  - Work in the career and campus lobes;
  - Projects in the personal lobe.

  Scenes within a region are placed for composition. Placing each scene at its own stars fails, because most stops have one or two stars or none ([research/scene-star-clusters.md](../research/scene-star-clusters.md)). Half the sky belongs to no section and is reachable only through the bot.
- **Scroll hops from scene to scene** by whatever device fits: a dive in, a pull out, a match cut or an opening up. A scene may leave the sky where the story needs it, e.g. for Work's breakthroughs, as Edolus goes from a satellite to a server room. That's not a hard rule either way.
- **Other celestial bodies are welcome** within the sky's bounds (nebulae, moons, rings, comets, a pulsar), physical and never wallpaper. **Only stars are stars:** nothing decorative reads as a point you could hover, or outshines the faintest star.

**The warp,** in five legs:
1. pull back out to the whole sky, skipped in the hero;
2. flare the explored stars, on questions only;
3. the bot's one clean circle before takeoff, its fire closing into a ring;
4. light travel;
5. arrive on the destination's hold.

From inside, a question's warp takes about 7–8 s and a nav link's about 4–5 s, both tunable. The page no longer spirals into a black hole: the wormhole's throat is the light travel, and its white hole the arrival.
- **Its finish bar,** from Edolus's quantum climax ([research/edolus-quantum-climax.md](../research/edolus-quantum-climax.md)):
  - the bot is the anchor, at the centre;
  - a thread of light crosses the seam;
  - the travel grows out of the flared star;
  - the scene being left smears rather than fading;
  - the tunnel closes into the destination's point of light, which opens into the scene;
  - it's the warmest moment on the page, cooling into the destination's hue;
  - sound follows speed.
- **Questions in the hero** flare, then warp if there's a destination.
- **With no destination** (provisional), nothing moves: the explored stars in view flare where they sit, and the route map flares.
- **Warps land on holds.** Scrolling continues from there in page order, and Back is a nav-link warp.

**The route map** is the sky in miniature:
- each section marked where it sits;
- a "you are here";
- links that warp;
- the flare playing on it.

Its final form, meaning where it sits and how it behaves on phones, is *Finish one scene*'s.

**Text.**
- **In the frame:** the title rides its subject, and the body lines sit steady in a quiet part of the frame and wane with it.
- **The promise** that replaces "readable at any scroll position": every word is readable at its scene's hold, with AA measured there, and all the text is in the document, in page order, all the time.
- **Budget:** a hold carries a title and at most four short lines. More to say earns a second hold, where the world opens up, and the bot goes deeper. Two options for the storyboard:
  - each company or project as its own scene;
  - a row of cards the scroll blazes through, like Edolus's carousel.
- **Content:**
  - a "what I shipped" sentence per role;
  - project titles split into title and subtitle;
  - each public project shows its own screenshot at its open-up hold, and the NDA work shows none;
  - a portrait in About. If a plain photo feels out of place, the storyboard gets creative with it.
- **Work holds AI breakthroughs of any kind** (models, protocols, tools), not only model releases. The latest is Claude Sonnet 5.5, just after Claude Opus 5.5. The list comes from [Research the AI breakthroughs on the Work route](32-research-the-ai-breakthroughs.md).

**Reduced motion.** The stage stays pinned, and each scene shows its hold as a still:
- scroll crossfades between holds, and text fades;
- there's no camera travel, zoom, parallax, streaks or settling glide;
- the flare is a pure brightening;
- warps are crossfades.

A plain reading layout, with the sections flowing as an ordinary page and each hold as a picture, is the fallback when WebGL is missing or fails.

**Phones.** The same film, lighter:
- every hold composed twice, for landscape and portrait;
- titles above or below their subject;
- at most four lines, narrower;
- a lighter rendering tier;
- the route map folded away until tapped.

**Terms** (`CONTEXT.md`): Section, Scene, Hold, Transition and Route map were added; Voyage, Universe and Warp were rewritten.

**Also:** Janriz likes round 4's direction A. It's frozen in `prototypes/voyage-round4-a/`.
