# One page set in a 3D universe; the two-state UX is retired

Status: accepted (2026-09-28), amended 2026-09-29 (see the end). The 2026-09-29 amendment's holds, settling and text pacing are superseded by ADR 0003 (2026-10-01): the voyage is one take. Its "There is no loading screen" is superseded by ADR 0005 (2026-10-01): every load opens on the wake-up.

The site was two states: a chat-first landing (State 1) that hid the portfolio, and the portfolio itself (State 2), switched through the `jrz-chat-v1` store. The redesign replaces them with **one page, complete in HTML from first paint**, set in a single 3D universe drawn behind it. Native scroll moves the camera along a voyage through it, one section after another, and a roaming bot is the AI entrypoint on every visit. A landing that hides the portfolio has no job left once the bot greets on every visit. It also cost us:
- skimmers who don't want to chat;
- a "skip to the portfolio" patch;
- two layouts plus a transition;
- routing through `localStorage`.

What the landing did well survives as the **first visit**: the bot arrives, greets and offers suggested questions once, and it can be skipped over a page that already works. There is no loading screen. The 3D and the bot fade in when they arrive.

The universe's stars are the wiki the agent reads, one star per chunk, placed by its embedding. **A star never shows its chunk's text.** The chunks are notes written for the agent, some are confidential, and display content stays hand-written. Visitors read the sky through the bot: a hand-written topic label on hover, and a question to the bot on click. The star data holds positions and opaque ids only. Pages that name confidential employers are left out, and the browser receives star ids from retrieval, never chunk text or titles.

## Considered options

- **Keep two states.** Rejected: the bot already covers the landing's job, and the split costs every skimmer.
- **A scroll-only film with the wheel hijacked** (the reference sites). Rejected: text must stay real and readable at any scroll position, sections keep deep links, and warps jump between places rather than scrubbing a timeline.
- **3D only as pieces in a flat page, or only in the bot.** Rejected for a single world, so that travel (scroll and warp) happens inside one place.

## Consequences

- `State 1`, `State 2` and `Facade` leave the vocabulary. The chat store keeps only the conversation.
- Section order is the voyage's order. A warp may skip it, and that is accepted: a warp lands at a point in the world, scrolling continues from there, and Back returns the visitor.
- The sky is a snapshot of the published chunks. It changes only when chunks are published again.

## Amendment (2026-09-29): the page is a film inside the sky

Built as first written, with a calm text column scrolling over a camera that dollies through the world, the page read as "a webpage slapped on top of a 3D background". So the voyage became a film on native scroll.

**The stage.** One full-screen stage is pinned for the whole voyage, over a runway of sections: one per scene, each carrying its deep link and its real HTML text in page order. Native scroll plays one timeline on the stage.
- Each **scene** arrives, holds and leaves. The picture scrubs with scroll. Text arrives at its own pace and wanes with the scroll as its subject leaves.
- The stage settles onto a **hold** only when the visitor stops close to one. Every other frame stays where it was left, so every in-between frame is designed to be rested on.

**The sky is the universe.** Nothing sits outside it, though a scene may cut away when its story needs it (a breakthrough on the Work route, for example).
- The hero is the whole sky. Each section is found inside its own region of the sky, and Contact pulls back out to the first frame.
- Other bodies may sit among the stars, but only stars are stars.

**A new promise for text.** "Readable at any scroll position" is replaced: every word is readable, at AA, at its scene's hold, and all the text is in the document, in page order, at every moment. Text is set into the frame with its subject rather than laid on top of the universe.

**Warps.** A warp pulls back to the whole sky, flares the stars the bot explored, circles once, travels at light speed and lands on the destination's hold. Scrolling carries on from there, and Back returns by a shorter warp.

**Reduced motion and fallback.** Reduced motion plays the holds as crossfading stills. A plain reading layout is the fallback when WebGL is missing or fails.

**Options set aside:**
- **The column over a moving camera,** as first built: it read as flat.
- **A stage pinned per section, with ordinary scrolling between:** the gaps read as a page over a background.
- **A virtual-scroll film, as the reference sites use:** still rejected, because it hijacks the wheel and loses the scrollbar and deep links.
