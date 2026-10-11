# Plan the signature moments

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Blocked by: 12, 30

## Question

Under Deep Field (*Pick the creative concept*), what's the **starting plan** for the page's signature moments?

This ticket is where the page's moments are weighed together rather than one build ticket at a time, for four reasons:
- **Budget:** every moment costs frame time, bytes, and its own phone and reduced-motion versions, and the ≤ 2.5 s / 60 fps budget only makes sense across all of them.
- **Coherence:** one strong motif beats a pile of effects (Produx), and the effects rule applies to the whole page.
- **The agent:** which moments the bot can trigger through tool effects.
- **What waits on it:** the sound design fog (which moments make sound) and the build tickets for each moment.

**Two rules:**
- **No quota.** Nothing requires a moment per stop, per section, or any minimum count. A calm stop is a valid answer, since reading is meant to stay calm (*Pick the creative concept*). Restraint counts as a choice.
- **A starting plan, not a lock.** The map builds and tunes on the real site, because feel can't be judged in advance. Build tickets may add, change or cut a moment. Anything added later passes the same checks as the plan: the effects rule, the standing constraints, a phone version, a reduced-motion version, and the budget.

**The answer gives:**
- **The settled moments**, as fixed inputs placed on the voyage, not reopened:
  - the warp's journey (*Warp or scroll*);
  - the bot's behaviour: wander, shoo, the emotes, the First visit greeting (*See the bot in the viewport*);
  - stars lighting up as the agent reads them, and clicking a star to ask about it (*Pick the creative concept*).
- **Each new moment:** where it lives (the First visit, a stop on the voyage, the sky, the AI entrypoint), what it does, whether the agent can trigger it through a tool effect (existing or new), and a rough cost.
- **An order of priority**, so the build does the strongest first and there is an obvious cut line if the budget runs out.

**Candidates raised so far:**
- **From *Pick the creative concept*:**
  - the bot arriving out of a white hole on the First visit;
  - the Work route's model-release markers, with a faint marker pointing into the unknown ahead;
  - a telemetry line of real agent events (US Avionix);
  - the route map opening its label as the agent moves you.
- **From the case studies:** each one's ranked "ideas worth taking", including the 3D ones. Janriz wants 3D used "like what our case study sites are doing".
- **The warp's transition sound**, a place for the Edolus-style transition sound he liked.
- **What the First visit shows before the 3D arrives**, for example a silhouette of the bot that turns into the render (US Avionix). There is no loading screen.

## Answer

Worked with Janriz on 2026-10-01. *Storyboard the voyage* had already settled most of this ticket. In a one-take film the scene changes are the moments, and the moments he picked from the case studies are the build tickets from [Build the hero and home](build.md#t35) to [Build the route map](build.md#t45). What this ticket settled on top:

**1. Every load opens on the wake-up** (ADR 0005 holds the detail).
- Pip charges up over the hero, drawn flat, while the first scene loads. Then he dozes until a click wakes him and turns the sound on. Nothing works until then.
- It replaces ADR 0001's "no loading screen" and the map's first-second rule. Janriz: "that rule doesnt make sense anymore. i don't want the user to interact with anything or scroll away without sound since I want them to have the full experience. let's just do the gate just like what Edolus does."
- From the case studies:
  - Edolus: the click that starts the music.
  - US Avionix: the flat silhouette that turns into the render.
  - Izanami: the page's own heading on the loader.
  - Hashgraph: the shaders warmed up behind the gate.
  - Produx: everything past the first scene loaded after, on a schedule.
- **Pip's home spot is bottom right,** which every reading spot keeps clear (ADR 0004). He wanders from there as *See the bot in the viewport* settled.
- **The white hole is dropped from the first visit,** because he is charging before the 3D could draw one. It stays the warp's arrival.

**2. The bot moves the page three ways** (ADR 0005):
- it lights the stars it reads;
- it warps to a reading spot, replacing `scroll_to`;
- it points at what an answer is about, replacing `highlight_project`.

It never plays a scene's big moment for you.

**3. Where sound goes.** This is the starting plan for [Score the voyage](build.md#t47), drawn from Janriz's answers in the case studies:
- **The score** is keyed to the film's position and remixed per section (Edolus's per-scene mix; Hashgraph's one timeline for picture and sound).
  - Calm in the hero and at Contact (his Izanami answer).
  - On the road, it rises with scroll speed (US Avionix's engine bed, Edolus's quantum loop).
  - It builds into the crawler's climax.
- **Scene changes are the loudest layer,** his favourite kind of sound in Edolus:
  - the dive past his star;
  - the orbit peeling off;
  - passing through each gate;
  - the spur, and Athena opening;
  - the crawler's climax at "Paid for once" (his quantum-climax pick);
  - the record flipping into the ribbon;
  - the pull-out at Contact.
- **The warp:** each leg, ending in the white-hole arrival (his map-boom pick).
- **The wake-up:** the first sound, with Pip's waking chirp and the hero's music coming in on the click.
- **Interactions, kept quiet:** hovering a star, asking, the drag, the fling, the monoliths rising, and Pip's emotes as small non-verbal sounds (his Trionn answer). His voice is *Voice verdict*'s.
- **The one instrument is the sky at Contact.** Each star is a note on a pentatonic scale (Trionn's harp), so sweeping the pointer across the sky plays it. Clicking still asks Pip. The storyboard had set "the harp at the beacon" aside for this.

**4. The route map during a warp** stays in its corner at its normal size and shows the trip in miniature: the flare, the destination's name beside it, and the path drawing in. It replaces none of the warp's legs, and it doesn't open the links. On phones the pill shows the destination's name. This goes into [Build the route map](build.md#t45).

**5. Dropped:**
- **Drag-onto-the-bot** (Trionn's scanner):
  - Pip wanders, so he'd be a moving target;
  - dragging the sky already turns it;
  - on phones a drag is a scroll;
  - a click or the `[ ASK ABOUT … ]` chip already asks.
- **The telemetry line.** It read as "a stack trace", and Pip's bubble already covers the wait.

**6. Priority, cut line and budget: no separate plan.**
- The build tickets' order is the priority.
- A build ticket whose stretch misses the finish bar's frame cost (ADR 0004, point 9) cuts its own extras first (the fling, the lens, Athena's parting), never a scene or a seam.
- The page-wide loading budget stays with *Performance baseline and budget check* on the map.

**7. Phone and reduced-motion versions:** every build ticket carries them under the finish bar, so the map's item for them goes.

**8. Build tickets don't read the case studies.** The vision is already in the prototypes they build from, and the case studies' ideas went into those. Rereading all six costs about 89K tokens, nearly a whole session, and every build ticket had been told to do it. The case studies stay for design tickets (prototypes and grillings). The one exception: where the shot list names a case study as a scene's source (Trionn's ribbon, Hashgraph's object opening towards the pointer, Edolus's quantum climax), a build ticket may open that one study's section for its numbers. A digest ticket was proposed, then dropped at Janriz's push: "i meant the vision basically is already in the prototype".

**Still open elsewhere:** Pip as the film's guide (the map's *Not yet specified*).

**Graduated:** [Build the wake-up](build.md#t46) and [Score the voyage](build.md#t47).

## Comments
- 2026-09-28 — Question updated after *Pick the creative concept* resolved: the two-state split is retired, so "State 1 → State 2" is gone, and the concept's own candidates are listed.
- 2026-09-28 — Renamed from "Shortlist the signature moments" and reframed at Janriz's request. The old wording read as a closed list and as one moment per stop. It is now a starting plan with no quota, which build tickets may change. Moments settled elsewhere are placed, not reopened.
- 2026-09-29 — From *Prototype the visual language*, round 3: **the lighting and the warp collide**, and it needs a plan here.
  - **The collision.** Stars light as the agent reads, and on today's agent the first ones light 3–4 s after asking (four measured runs: 3.0–3.8 s).
    - The warp for a question with a destination starts at about 0.25 s, with a router, and runs about 7 s.
    - So on "Tell me about Athena" asked in the hero, the stars light mid-journey, while the sky is out of view.
    - Today's agent sometimes calls `scroll_to` *before* it searches, which would start the warp before any reading happens.
  - **The open questions:**
    - Where does the lighting show once the visitor has scrolled or warped past the hero, and the sky is behind them? It could be a small sky in the route map, the telemetry line alone, or the sky glimpsed during the warp's journey.
    - Does a question that both reads and jumps light the stars first and then warp, warp and light on arrival, or pass the lit stars during the journey?
  - The telemetry line (US Avionix) is now in the sky prototype. It reports every real event, the warp included, so it may carry the lighting wherever the sky isn't visible.
- 2026-09-29 — **The telemetry line (US Avionix) was tried and set aside.** *Prototype the visual language* built it into the sky: one mono line per real agent event, the query included. Janriz's reaction: it "reads more like a stack trace", and a visitor wouldn't know what a "passage" or a "wiki" is.
  - Treat it as dropped, unless a version in plain visitor words earns its place.
  - The bubble's status line ("Exploring the sky…", "Explored 6 stars") already fills the wait before the stars light.
- 2026-09-29 — From *Prototype the visual language*, round 4 (the voyage), **a partial answer to where the lighting shows once the sky is behind you**:
  - The voyage runs outward and each stop's camera looks back, so the sky stays in view, smaller, at About, Projects and Contact, and a flare reads there as warm points in the far cluster.
  - At Work the camera looks back along the route and the sky is out of frame.
  - Direction C's route map is a small drawing of the voyage with the sky's 93 stars at its start, and they light as the bot explores, so the lighting is visible from anywhere on the page. Which route map wins is that ticket's call. If it's the map, this question is answered.
  - `highlight_project` warms its world for 3 s (warmth = energy), a candidate for how the agent points at a project after a warp lands.
- 2026-09-29 — **Now waits on *Storyboard the voyage*.** Janriz rejected round 4 of *Prototype the visual language* (a text column over a moving camera) as flat. He wants every scroll to be a scene, as in Edolus. In a film, the transitions are the signature moments, so the storyboard takes over most of this ticket: every scene's subject and the device that carries it into the next.
  - **What's left here once the film exists:**
    - the order of priority and the cut line across the scenes and every other moment;
    - the budget across them;
    - which moments the agent triggers through tool effects;
    - the First visit's arrival over the first scene;
    - the lighting and warp collision above;
    - which moments make sound.
  - **The "no quota" rule still holds.** Its reason, "reading is meant to stay calm", is reopened by *Make every scroll a scene*.
- 2026-09-29 — **From [Make every scroll a scene](29-make-every-scroll-a-scene.md)** (resolved). These are settled inputs now:
  - **The warp's journey is redrawn.**
    - The legs: pull back to the whole sky (skipped in the hero), flare the explored stars, Pip's one clean circle with its ring of fire, light travel (the wormhole's throat), then arrival (its white hole) on the destination's hold.
    - The page no longer spirals into a black hole.
    - The finish bar comes from Edolus's quantum climax ([research/edolus-quantum-climax.md](../research/edolus-quantum-climax.md)).
    - It takes about 7–8 s from inside, and about 4–5 s for a nav link.
  - **The lighting–warp collision is resolved.** The pull-back covers the 2–4 s of exploring, and the flare plays on the whole sky before the light travel.
  - **Where the lighting shows once the sky is behind you:**
    - with no destination, the explored stars in view flare where they sit (provisional);
    - the route map, the sky in miniature, always flares.
  - **In a film, the transitions are the moments,** so the storyboard carries most of this ticket.
- 2026-10-01 — **From [Storyboard the voyage](30-storyboard-the-voyage.md)** (resolved). Unblocked.
  - **The film's transitions are settled,** each with a thread across its seam. The shot list is round 3's `SHOTLIST.md`.
  - **Moments Janriz has already picked** (from the case-study list, round 3), now fixed inputs here like the warp:
    - the crawler's climax at "Paid for once";
    - text that arrives in its scene's manner and light;
    - the crawler's lens onto its insides;
    - Athena parting towards the pointer;
    - the `[ ASK ABOUT … ]` chip on every subject;
    - the stars' topic labels, click-to-ask and the drag;
    - a hard scroll flinging loose things outwards;
    - monoliths that rise and sink;
    - screenshots turning flat;
    - his live Cebu time at Contact.
  - Their build tickets exist (35–44). This ticket still weighs the budget, the order and what the agent can trigger, and it can re-weigh any of these.
  - **Still open here:**
    - the First visit (the bot's arrival, what shows before the 3D);
    - the telemetry line;
    - the route map's label;
    - Trionn's hold-to-talk and drag-onto-the-bot;
    - where the one playable instrument lives (sound design);
    - Pip as the film's guide (saved in the map's Not yet specified).
- 2026-10-01 — Worked with Janriz: recommendations for each open item, then his reactions.
  - **The first visit:** the flat picture before the 3D was fine, and so was the bottom-right home spot. He pushed back on a silent arrival: "I really think the best way is to add an initial scene. Like maybe a loading state where Pip is charging up and you have to click to wake him."
    - Two options were offered: a gate, or Pip asleep with the page open.
    - He chose the gate, retiring the first-second rule (quoted in the Answer).
  - **The bot's three page effects:** "yepyep".
  - **The sound plan:** ok.
  - **Dropping drag-onto-the-bot:** agreed.
  - **The route map during a warp:** ok, once it was clear that it doesn't replace the zoom-out or the flare.
  - **Priority and tiers:** agreed.
  - **Reading the case studies:** he worried about the token cost of every build ticket rereading them, and asked whether one overall build ticket would do. The tickets stay as they are.
    - A digest was proposed, then dropped at his push: "don't you think it's pointless to do so since it's already in the prototype?" … "i meant the vision basically is already in the prototype". Build tickets don't read the case studies at all.
- 2026-10-01 — Janriz agreed to the one exception ("yes"): a build ticket may open the one case-study section the shot list names as a scene's source, for its numbers.
