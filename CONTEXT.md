# Portfolio

Janriz's personal portfolio: one page set in a small universe, where Tycho, a small robot who has read his notes, answers questions about him and flies the visitor between sections.

## Visitor states

**Wake-up**:
The opening every load starts with:
- **the loader**, black, with the name typing in over a count of the real load: the whole voyage, every scene built and warmed;
- then Tycho in 3D on a black stage, charging up and dozing (a show of fixed length: nothing loads from here on);
- until the visitor's click wakes him and turns the sound on.

Nothing else works until then.
_Avoid_: Preloader, splash, intro, gate

**First visit**:
A visitor's first time on the site, when Tycho, just woken, greets them and offers starter questions.
_Avoid_: State 1, Facade, landing, intro

## Chat

**Tycho**:
The mascot: the small helmeted robot (a visor for a face, two arms, a pack of boosters) who explores the universe, lights the stars he reads, and answers visitors in his bubble. He speaks as himself, says plainly that he's an AI Janriz built, and talks about Janriz in the third person. The page's text is Janriz's own voice; everything the chat says is Tycho's.
_Avoid_: Pip (the stand-in's name), bot, mascot, assistant, chatbot, avatar, agent

**Home base**:
The spot on the screen's edges Tycho returns to: his corner at first, then wherever the visitor drops, flicks, shoos or moves him. Tycho belongs to the screen, not to the voyage's world, so it's the same in every scene.
_Avoid_: perch, parking spot, dock

**Footprint**:
Where a 3D subject sits on the screen this frame: the boxes its drawn parts cover. Scenes register their bodies' footprints in one shared registry, and anything on the page that keeps clear of the picture's subjects (Tycho) reads them there.
_Avoid_: hitbox, bounds, collider

**Bubble**:
Tycho's speech bubble, the site's one conversation surface: where he greets the visitor, takes their question and shows his reply.
_Avoid_: Chat bar, chat drawer, chat panel, chat widget, popup

**Log**:
The whole conversation with Tycho, opened from the bubble. A returning visitor finds it there until they clear it.
_Avoid_: Transcript, history, chat drawer

**Reveal**:
How a reply appears in the bubble: word by word at a reading pace, never ahead of what Tycho has written. A tap shows the rest at once.
_Avoid_: Typing, typewriter, streaming (that is the network's)

**Chirps**:
Tycho's voice: wordless robot chirps, phrased like the sentence, on the opening of each sentence as the reveal shows it, through his suit radio with a tone opening and closing each reply. He never speaks words, and visitors don't speak to him.
_Avoid_: Babble, Animalese, TTS, speech, voice-over

**Tool effect**:
A visible change Tycho makes to the page during an answer: lighting the stars he reads, warping to a reading spot, or pointing at a subject.
_Avoid_: Side effect, action

**Warp**:
Tycho's jump to a scene when a tool effect or a nav link sends him there. It pulls back out to the whole sky (unless it is already there), flares the stars he explored, and circles once to take off; his fire winds into a spark that bursts into a black hole, the sky falls in, and he dives after it down the wormhole's throat, past real pieces of the section left behind (its craft, its records, his portrait), out of a white hole at the destination's reading spot. Its fire and gas glow in the destination's light from the start (`warp-palette.ts`), the white-hot cores staying white. Scrolling never warps.
_Avoid_: Teleport, page transition, scroll jump

**Replay**:
What "Replay experience" does from Contact: the frame fades to black, the page lands on the film's first frame under it, and the wake-up comes back from its loader, the name on black without the count, since everything's loaded; waking Tycho again starts the film, the score coming back up from under the black. It never travels or plays the film back. The route map's Start replays only to the first frame: black, and the black lifts on it, as happens wherever the page has no wake-up. Browser Back returns to Contact.
_Avoid_: Rewind, warp home, back to top

## Universe

**Universe**:
The 3D world the voyage happens in, bounded by the sky: its stars, and the worlds and other bodies found among them. Text is set into its scenes, not laid on top.
_Avoid_: Background, canvas

**Voyage**:
The film that scrolling plays as one take, from the whole sky inward and back out to it at Contact. The camera never stops, and every seam carries a thread into the next scene.
_Avoid_: Journey (that is the warp's), scroll story

**Section**:
A named part of the page (Hero, About, Work, Projects, Contact) with its own deep link. A section plays as one or more scenes, found in its own region of the sky. Work and Projects open on an intro, which the scroll passes on the way in; a link, a warp or a deep link to either lands past it, on the section's first entry (LogoLife, Athena).
_Avoid_: Stop, page

**Scene**:
One shot of the voyage: a subject, its text and its reading stretch, grown out of the scene before it.
_Avoid_: Slide, stop

**Reading stretch**:
The part of a scene where its text is fully in. The camera slows there but never stops, and the subject keeps moving. Its middle is the **reading spot**, where deep links, warps and reduced-motion stills land.
_Avoid_: Hold, hero pose, snap point

**Block**:
One piece of the voyage's text (a title, its lines, its labels), written in and dissolved by the scroll over its own windows, and read at its reading spot.
_Avoid_: Card, slide, caption

**Runway**:
The page's real text in page order: one block after another, each as tall as the scroll from its reading spot to the next, so landing on a block lands on its reading spot. The voyage plays over it.
_Avoid_: Scroll track, spacer

**Transition**:
The scroll between two reading stretches, where one subject grows into the next and a thread (an anchor kept centred, a line or stream followed) carries across the seam. Never a cut.
_Avoid_: Page transition, cut, jump

**Slab**:
The voyage's one recurring object, 1.6 to 1 with softly rounded corners. Standing, it's his portrait's plate. Lying down, it's each screenshot in the ribbon.
_Avoid_: Card, panel, tile

**Slate**:
A record, from the crawler's search to Athena: a thin plate, 1 by 1.6, satin aluminium round black glass, whose screen shows what the record is at each stage: a web page, then a record of fields, its missing ones lit warm once enriched, its screen dark once merged or stored. The swarm, the stream into Athena and the backs of the ribbon's slabs are slates.
_Avoid_: Slab (the records' look until 2026-10-13), card, tile

**Relay**:
Work's intro: one jump relay by home, finished, two rings turning round a core of light ahead of a barrel of coils. The camera holds behind it while Work's intro is read, and it throws you back to August 2023 (ADR 0014).
_Avoid_: Gate, dock, milestone, checkpoint, station (the station is home's ship)

**Throw**:
The relay sending you back to August 2023: down its barrel, faster and faster, the stars stretching into streaks, then a flash that cuts to home as it was. Never the warp's wormhole.
_Avoid_: Jump, warp, launch

**Build**:
Work after the throw: home built job by job, a quarter of its ring a company, oldest first, like a timelapse, until it's the ship About showed.
_Avoid_: Construction, assembly

**Quarter**:
A company's part of home's ring: a spoke, three nodes and three modules. It builds itself in place: its spoke, its skeleton, the hull closing over that, its fittings, its solar wings.
_Avoid_: Section, segment, slice

**Skeleton**:
A quarter's bare structure, ring frames and longerons, seen before its hull closes over it.
_Avoid_: Wireframe, cage (the model's name for it)

**Traffic**:
What comes and goes round home while it's built: drones welding at the build's front, workers in EVA suits, and the breakthroughs' craft.
_Avoid_: Swarm (the crawler's records)

**Call**:
An AI breakthrough's craft coming by home after the company it came out during: one he built with docks at the hub, the rest pass close. Its card (date, name, why) is pinned in the column while it comes by, its leader following the craft.
_Avoid_: Buoy, beacon (that is his star at Contact), marker, billboard

**Stack**:
A role's tools, each named on a leader line from a part of its quarter, once that's built.
_Avoid_: Bead, chip, tag, badge

**Fling**:
What a hard scroll does to the film's loose things (the crawler's swarm, the stream's records, the moons): they're thrown outwards one after another and close up again as the scroll slows. Never under reduced motion.
_Avoid_: Shake, burst, explode

**Hand**:
What the pointer, touch and keyboard can do across the film: a star's label, the ask chip, asking Tycho, the drag that turns the sky where it's seen whole and coasts when let go.
_Avoid_: Cursor, interactions, hover layer

**Star label**:
A star's topic, hung on a leader line from its hover ring, shown where the sky is the subject; clicking the star asks Tycho about it.
_Avoid_: Tooltip

**Ask chip**:
The bracketed `[ ASK ABOUT … ]` that follows the pointer over a subject and names it; a click asks Tycho. Each block's "Ask Tycho about …" button is its keyboard twin.
_Avoid_: Tooltip, cursor label

**Shaft**:
The AI Web Crawler's pipeline at full size, dropped out of the crawler: one ring per stage of his diagram on a deployable mast, each fitted out for its stage's work and carrying what its stage does (ADR 0015). The camera falls down it with one record among the **swarm**, the records falling with you, and each ring burns its stage's colour as they pass.
_Avoid_: Tower, tube, pipeline diagram

**Front**:
The film's one climax: a crest of warm light running down the shaft, fast at first and slowing, with a rush of records behind it. Each ring flashes as it passes and stays lit while "Paid for once" is read.
_Avoid_: Burst, wave, explosion

**Ribbon**:
The personal work's scene: its frames, slabs each showing one screenshot, its back the face of the record it was. After the climax they come out of Save's store, down the bore and out from under the shaft's foot, each growing from a record into a frame as it swings out to its place on a spiral winding down round the shaft's axis. Nothing holds them: they stand free, as the stream's records fly. Each turns square to you as the camera comes round. The crawler goes while they're read; as the camera pulls out to Contact, they slide on round the spiral as one chain and go out by a hidden exit a step past the last, each shrinking into thin air there (ADR 0016).
_Avoid_: Gallery, carousel, strip

**Route map**:
The nav: a porthole onto the sky in miniature, top right, framed on the voyage, with each section marked where it sits and a "you are here". At rest five ticks stand beside it; hover or focus grows it and hangs the section names on it. Its links warp, except Start, which replays.
_Avoid_: Menu, progress bar

**Quality**:
How much the 3D draws on this device for the visit: high, mid or low. It sets sharpness and shadow fidelity (the sky's pixel ratio, its far galaxies, shadow maps, Tycho's canvas, the warp's weight), never what's in the frame, where or when. A visit starts from what the browser says about the device (a phone starts at mid) and only ever steps down, when the sky's governor is at its floor and frames are still missed (ADR 0017).
_Avoid_: Tier (the film's tier is how it plays: film, still or plain), graphics setting, phone mode

**Lite**:
The voyage for a device that can't hold the film: the same scenes as stills, one per reading spot, crossfaded, with Tycho in his flat drawing. A weak device starts in it, and so does a browser where an earlier visit was too slow for the film even at the lowest quality; a visit that grows too slow is offered it once, never switched mid-visit. The visitor's own choice, made with the Lite / Full switch beside the sound toggle, is kept per browser and wins (ADR 0019). Reduced motion plays the same stills but isn't lite: it has no switch.
_Avoid_: Low mode, no-3D version (lite keeps the 3D's pictures), reduced motion

**Sky**:
The wiki drawn as the universe's stars: one star per passage Tycho can read, placed by meaning, lighting up when Tycho reads it.
_Avoid_: Starfield, constellation map, knowledge graph

**Beacon**:
His own star at Contact, the sun home orbits, seen from far off: the sky's Flare lit and heated, warm against the cool sky. It is a star like any other: hovering or clicking it asks its own topic.
_Avoid_: Lighthouse, signal

## Sound

**Score**:
The voyage's music, keyed to where the visitor is in the film and remixed per section; it also follows the chat. It starts with the wake-up.
_Avoid_: Soundtrack, background music, ambience

**Stem**:
One layer of the score as a pre-rendered loop (the pad, the bass, the drone…). All the stems start on one audio-clock time and play sample-locked; the mix sets each one's level per scene. The hero's stems load under the wake-up's loader, the rest after the wake.
_Avoid_: Track, channel, sample

**One-shot**:
A sound played once on demand: a scene change, an emote, a UI sound, the wake's chirp. It joins the mix after the chat's duck, so it never dips with the score.
_Avoid_: SFX, sound effect

**Cue**:
A scene change's moment in the film, with the stretch after it that its one-shot belongs to. The one-shot plays as the moment is crossed going forward, and stops once the film leaves the stretch, so a fast scroll cuts it short.
_Avoid_: Trigger, threshold, marker

**Instrument**:
The sky at Contact, played by sweeping the pointer across its stars, each one a note. On a phone there is no sweep: a tap on a star plays its note, then asks. It is the only instrument on the site.
_Avoid_: Harp (Trionn's word for its own), synth

**Sound toggle**:
The visitor's control for turning the site's sound off and on after the wake-up. A visitor who turned it off finds it off on their next visit.
_Avoid_: Mute button, audio switch

## Content

**Display content**:
The hand-written text and media shown in the portfolio sections.
_Avoid_: Copy data, CMS content

**Wiki**:
Janriz's personal knowledge base; Tycho answers from it, and it can go deeper than the display content. To visitors, Tycho calls it his notes.
_Avoid_: RAG, knowledge base

## Redesign

**Signature moment**:
One interaction or transition designed to be remembered on its own — the unit the wow layer is planned in.
_Avoid_: Effect, animation, wow

**Finish bar**:
The standard every scene is built to, so the voyage is finished in every frame, not only at its reading spots: nothing pops or washes out, text is measured for contrast where it's read, light follows the colour rule, phones are composed on their own, and every tier works.
_Avoid_: Polish level, quality bar, definition of done

**Skeleton**:
What a prototype settles and its build keeps: the camera path and timings, the composition, the text and its manners, the type. Never the look: every body and surface in a prototype is a stand-in until a finalization settles it.
_Avoid_: Final design, the prototype's look

**Finalization**:
The grilling before a build ticket that settles its look (what each body is, how it's made, its materials and light), with Janriz picking from variants made for real on the real site.
_Avoid_: Polish pass, art pass

**Case study**:
A hands-on teardown of one reference site, recording what it does and which ideas are worth taking.
_Avoid_: Audit, review, inspiration
