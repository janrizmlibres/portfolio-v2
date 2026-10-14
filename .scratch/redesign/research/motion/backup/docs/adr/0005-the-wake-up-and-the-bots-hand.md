# The page opens on Tycho waking up, and the bot moves the page three ways

Status: accepted (2026-10-01). It replaces ADR 0001's "There is no loading screen" and the rule that the AI entrypoint is usable within the first second. Amended 2026-10-04 (*Finalize the wake-up*): a loader comes first, and Tycho's charge-up is a show (see the end).

*Plan the signature moments* weighed the page's moments together. In a one-take film the scene changes are the moments, and *Storyboard the voyage* had already settled them. Two decisions were left that change how the site works, not how a scene looks.

## Decision

**Every load opens on the wake-up.** Browsers play no sound until a click, a tap or a key press, and scrolling never counts. Janriz wants every visitor to get the whole experience, sound included, so the page waits for that click, as Edolus's does.
- **What shows:** the hero drawn flat. The sky's 93 stars sit at the angle the 3D sky starts from, and Tycho is in front of them, drawn flat too, charging up. His name is real HTML on top.
- **The charge is the real loading.** It covers three.js, the sky, Tycho's model, the first scene's assets, and a warm-up that compiles the shaders so nothing hitches later. Everything past the first scene loads after the wake, on a schedule.
- **When it has loaded,** the 3D takes over from that exact frame. Tycho, now charged, dozes, and his bubble asks to be woken.
- **Until then nothing else works:** no scroll, no chat, no stars.
- **The click wakes him.** It can be a click or tap anywhere, or Enter or Space on a real button for the keyboard and screen readers.
  - Sound comes on, with his waking chirp and the hero's music, and the scroll unlocks.
  - On a first visit he greets the visitor and offers three questions. Returning visitors get his welcome back.
- **It plays on every load, deep links included,** because every load needs that click before sound can play. A deep link lands on its reading spot after the wake.
- **The page's HTML is complete underneath from the first paint,** so crawlers, screen readers and search lose nothing.
- **The tiers:**
  - Without WebGL there is no wake-up, only the plain page.
  - Under reduced motion the wake-up still holds, because sound needs the click. Tycho and the charge are stills, and waking is a crossfade.
  - If the 3D fails, or is still loading after about 10 s, the click wakes Tycho into the plain page.
- **There is no "enter without sound" choice.** After waking, the sound toggle mutes it.

**The bot moves the page three ways:**
- **It lights the stars it reads.** This happens on its own, from its searches.
- **It warps to a reading spot.** This replaces `scroll_to`.
  - The destinations are the reading spots of his own subjects: the hero, About, Work, each company's gate (LogoLife, Tolstoy, Elinnov, the Yearbook), Projects, Athena, the AI Web Crawler, each personal project (Mercado, FlowStack, PulseVR) and Contact.
  - The monoliths are the AI world's milestones, not his, so they aren't destinations.
  - What picks the destination is *Pick the destination router*'s call.
- **It points at what an answer is about.** This replaces `highlight_project`.
  - The subject warms for about 3 s, since warmth only ever means energy (ADR 0002), and its label shows.
  - It works on any subject: a world, a moon, a gate, a crawler stage, a screenshot.
  - After a warp it plays on arrival.
- **Nothing else.** The scenes' big moments, like the crawler's climax, are the scroll's reward. The bot never plays them for you.

## Considered options

- **Tycho asleep, with the page open.** Tycho would charge and doze in the hero while everything else works, and the first click anywhere would wake him with sound. It kept the first-second rule, but a visitor who scrolled away first went on without sound. Janriz: "i don't want the user to interact with anything or scroll away without sound since I want them to have the full experience."
- **A silent arrival, with sound on the first click.** Tycho's bubble would offer a "Sound on" button and the sky would carry a `[ DRAG ]` label. It had the same gap.
- **Tycho arriving out of a white hole on the first visit.** Dropped, because he is charging before the 3D could draw one. The white hole stays as the warp's arrival.
- **More bot effects:**
  - Playing a scene's big moment. Dropped, because those belong to the scroll.
  - Drag-onto-the-bot (Trionn's scanner). Dropped:
    - Tycho wanders, so he would be a moving target;
    - a drag already turns the sky, and on phones a drag is a scroll;
    - a click or the `[ ASK ABOUT … ]` chip already asks.

## Consequences

- **The five 3D case studies' loaders were all on the avoid lists,** each 4–9 s before anything works. The wake-up keeps out what made theirs costly:
  - the charge shows real loading, never a show (Izanami's counter kept running after its network was done);
  - only the first scene loads before the click (Produx loads the rest on a schedule);
  - the text underneath stays real HTML (Edolus's titles were canvas only).
- **A visitor who only wants to skim pays one click.** ADR 0001 retired a landing that hid the portfolio behind a chat; the wake-up hides it behind one click.
- **The chat works from the moment Tycho wakes.** The ≤ 2.5 s LCP budget now applies to the wake-up's first paint, and the time to the click is measured with it.
- **The agent's tools change.** `scroll_to` and `highlight_project` become the warp and the point, and the system prompt and the tool-effect handlers change with them.

## Amendment (2026-10-04, *Finalize the wake-up*)

What shows changed after four rounds on the real site. Janriz judged the first three, a flat drawing of the hero with Tycho charging in front of it, against Edolus's and Trionn's openings and asked to adopt theirs. He then rejected the charge-up's first look as "a diorama or a view of an unfinished 3D game scene with the default camera" and asked for it "sleek. Like professional."

- **A loader comes first, Edolus's.**
  - It's black, with the name typing in a letter at a time in Jost capitals tracked wide. A small DM Mono count of the real load sits under it.
  - The count covers the page, three.js, the sky, Tycho's model, the first scene and a warm-up of its first frames. It never goes backwards, and a screen reader hears it as a polite status.
  - At 100 a hairline of the stars' light sweeps across the name, the name goes, and the black fades onto Tycho's stage.
  - The page's HTML is still complete underneath.
- **Then Tycho, already in 3D, charges up as a show.** The load is done by then, so the charge is no longer the loading.
  - The stage is black. He fills the frame, dead centre, lit low key: dark but for two cool edges from behind.
  - The band fills a segment at a time, and its own warm light shows his visor's rim and chest as it charges (warmth is energy, ADR 0002).
  - The camera starts low and off his right and comes round and in to a three-quarter angle.
  - He dozes, and a bare `[ WAKE ME ]` in DM Mono capitals shows under him, its brackets spreading with the pointer's speed. Its accessible name is still "Wake Tycho (turns on sound)", and a click or tap anywhere, or Enter or Space, still wakes him. (The finalization picked Edolus's white button with corner ticks; Janriz changed it to the bracket on 2026-10-04, when the wake-up was built.)
- **The wake:**
  1. Sound comes on and he wakes.
  2. His everyday light and framing come back, and the hero's sky comes up behind him.
  3. He flies to his corner as the name rises in.
  4. He greets the visitor, and his bubble opens.

  The hero's lockup is hidden until this, so it gets an arrival after all.
- **Reduced motion:** the name and count show without typing or the sweep, the charge-up steps, and every move is a short fade.

**Considered and dropped:**
- The hero drawn flat at first paint, with Tycho as a line drawing, a silhouette or a still matching the 3D frame to the pixel (round 1).
- A loading page of its own, with Tycho centred over the hero's sky out of focus, sharp, or a deep field (round 2).
- Trionn's loader: grey, a corner-ticked frame round Tycho's line drawing and a three-reel counter. A light grey flash before a dark site, and Trionn's look more than ours.
- The charge-up backlit by a dimmed sky. The nebula competed with him.

**Consequence:** a gating loader is back, which the five 3D case studies all had on their avoid lists. What keeps it honest is what ADR 0005 already asked: the count shows real loading, only the first scene loads before it, and the text underneath stays real HTML. The name is hidden until the wake, so it's no longer the LCP element. The ≤ 2.5 s budget applies to the loader's first paint, and the time to the button is measured with it. As built, the name is in the loader from first paint, faint, and types in bright over itself, so the loader's first paint is its largest one (LCP about 0.25 s on desktop, 0.8 s on a throttled phone).

