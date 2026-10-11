# Pick the creative concept

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Blocked by: 02, 03, 04, 05, 06, 07, 16, 17

## Question

What single creative concept does the redesign commit to?

Inputs: the six case studies' ranked "ideas worth taking", the standing constraints and effects rule in the map's Notes, Janriz's seed idea (a roaming, interactable bot as the AI entrypoint), and his reactions to *See the bot in the viewport* and *Warp or scroll*. The answer:

- names the concept;
- says whether the roaming bot goes ahead;
- states how much of the 2026-09-27 prototype survives;
- says whether the current **two-state UX** survives: State 1, a chat-first landing that hides the portfolio, and State 2, the portfolio.

Janriz (2026-09-27): the two-state UX is not an absolute and may be removed. The recommendation going in:

- **One page, always complete.** The bot is the entrypoint on every visit, so a landing that hides the portfolio has no job left. It also costs:
  - skimmers who don't want to chat;
  - the "Skip to the portfolio" patch;
  - two layouts plus a transition;
  - routing through localStorage.
- **Keep what State 1 did well as a first-visit moment.** The bot arrives in the hero, greets, offers the suggested prompts, then goes to its spot. It plays once and can be skipped, over a page that is complete from first paint.

*See the bot in the viewport* lets Janriz feel this before deciding.

## Answer

Decided by Janriz on 2026-09-28, over four rounds of grilling. He wanted 3D used "like what our case study sites are doing", and weight on the AI and agentic side of his work. The record is [ADR 0001](../../../docs/adr/0001-one-page-universe.md).

**The concept: Deep Field.**

> *Janriz's work as a small universe. Every star in its sky is something he has written down. A bot that has read them all flies you through it, and when it answers, the stars it read light up.*

The name is internal: the map, the glossary, and what the mascot's name must fit. Whether it appears on the site is up to the copy pass. It comes from Hubble's Deep Field, a tiny patch of sky that looked empty and held thousands of galaxies. Space grew out of what he had already approved: the wormhole warp, the boosters, the black and white holes. It also matches his interests (science fiction, *Interstellar*). Space is the most overused portfolio theme, so the sky has to be real data and the look physical, never starfield wallpaper. The options not taken were a workshop of dioramas and "inside the machine" (a descent into the agent's core).

**3D: one world, where scrolling moves the camera.**
- One universe sits behind a real-HTML page for the whole visit.
- Native scroll (ScrollSmoother, no wheel hijack) moves the camera past one 3D piece per section.
- The world arranges itself around the text column, so reading stays calm.
- The page is complete from first paint, and the 3D fades in when it's ready.

This is how Edolus, US Avionix and Hashgraph are built, minus their gates and wheel hijacks. The options not taken were 3D pieces in a flat page, and 3D only in the bot and the warp.

**The sky is the wiki.**
- **What a star is.** Each star is one passage of the wiki the agent reads, placed by meaning: its embedding squeezed into 3D at build time. Related topics cluster.
- **About 120–200 stars.** The last recorded count was 86 chunks on 2026-05-01, and today's 62 pages would give roughly 120–200.
- **Reading.** A star never shows its text. The passages are notes for the agent (wiki links, footnotes, sources), some are confidential, and `AGENTS.md` already separates display content from the agent's knowledge. So:
  - hovering or focusing a star shows a hand-written public label per topic ("Athena", "Game dev");
  - clicking a star asks the bot about that topic, and the answer goes through the prompt's confidentiality rules;
  - when the bot answers anything, the stars it read light up.
- **Privacy.** The confidential employers' pages are left out of the sky. The star data holds positions and meaningless ids only: no titles, slugs or text.
- **A snapshot.** The wiki's publisher was removed on 2026-08-31, so the sky shows what the agent actually reads today and changes only if chunks are published again.

**The AI and agentic side** shows as the sky itself, where retrieval is visible, and in the content: his AI and agentic work gets the biggest, nearest worlds, and the copy leads with it. The telemetry line of real agent events (US Avionix) goes to *Plan the signature moments* as a candidate.

**The voyage runs outward, in page order:**
- **Hero:** the sky seen from outside, with his name in HTML. On the first visit the bot arrives (out of a white hole), greets and offers the suggested questions. Whether 120–200 stars read as a shape from outside is judged in *Prototype the visual language*.
- **About:** home.
- **Work:** a route, **newest first**. Frontier AI model releases are interleaved with the roles by date: plain text, no vendor logos, roughly one a quarter, only the ones that changed what he could build, and the ones he built with are marked. Scrolling travels back in time, so the progress reads as how far things have come. A faint marker at the route's head could point into the unknown ahead. Janriz's idea: "a subtle way of where model capabilities and progress is heading". Every date is verified by a research step at build time.
- **Projects:** a world each.
- **Contact:** a beacon at the edge, with what's next and the availability line.

The options not taken were a system you orbit and a chronological career; the chronological version would have put his oldest work first.

**The roaming bot goes ahead** as the AI entrypoint and the guide. Its conversation surface is *Pick the AI entrypoint*'s, its name and voice *Name and voice the mascot*'s, and its look *Model the mascot*'s.

**The two-state UX is retired.**
- The site is one page, complete from first paint, with no loading screen (standing constraint 3).
- The **First visit** (the bot arriving, greeting and offering the prompts) plays once, can be skipped, and runs over the complete page.
- Returning visitors land with the bot at its home spot.
- "Skip to the portfolio" goes, and the saved chat stops switching layouts. It only holds the conversation.
- State 1, State 2 and Facade are retired in `CONTEXT.md`.

**Navigation: a route map.**
- A quiet indicator of the voyage: the current stop is named and the others are marks. They are real `<a href="#sec-…">` links that warp.
- It works as both navigation and "you are here", so nobody is lost after a warp.
- Warps skipping the voyage's order is accepted (Janriz raised it). Removing the nav wouldn't stop jumps, because the bot's answers warp too, and the universe is a place, not a film:
  - scrolling carries on from wherever a warp lands, in either direction;
  - the browser's Back button returns the visitor to where they were;
  - a visitor who asks about Athena first has chosen their own order.
- The options not taken were a conventional menu (Trionn) and scroll only (Edolus, Hashgraph). Scroll only fails keyboard users and recruiters looking for Contact.

**Colour is light, and it moves with the voyage.** Janriz's direction: think like a designer, not in a list of values, and no locked accent. The case-study sites blend colour rather than commit to one. The direction:
- the base is deep space tinted by where you are (dark blue-violets, dust, the faint warmth of a far star), and it blends as the camera travels, each stop lit by its own light;
- warmth means energy only: the boosters, the wormhole's disc, a star lighting up as the agent reads it. It appears when something happens and cools back down, so warm light is the agent at work;
- white is for what matters: the text, the lit edges of the 3D pieces, the brightest stars;
- UI states (links, focus, buttons) never depend on a colour. They use white, weight, underline and outline, so they stay legible in any light and pass contrast.

*Prototype the visual language* turns this into values. The rule about tone mapping shifting 3D colours still applies.

**What survives from the 2026-09-27 prototype:**
- **Stays:** the facts and content, the sections and their `sec-*` ids, the NDA line, the effects rule.
- **Reopened:**
  - the type (Archivo and Plex Mono);
  - the huge-name hero;
  - the section layouts;
  - the `#FF5A1F` accent, which is no longer a lean;
  - the content answers that came from the prototype's layout: the "what I shipped" field, the retired copy keys, the title/subtitle split, the Mercado screenshot.

  The dark theme survives only as far as space is dark.
- **Retired:**
  - the chat bar and drawer, pending *Pick the AI entrypoint*, which leans towards a speech bubble plus a log;
  - the "Skip to the portfolio" link.

**Scope redrawn** (Janriz, 2026-09-28). What the chat stream sends to the browser is now in scope. Today the browser receives each retrieved chunk in full (text, title, id), so anyone with devtools can read material the prompt keeps confidential. What the model sees is unchanged, so confidentiality stays enforced in the prompt. The fix is *Stop sending chunks to the browser*. Lighting stars by star id comes later, in the sky's build.

**New tickets:**
- [Stop sending chunks to the browser](25-stop-sending-chunks-to-the-browser.md): the leak fix, AFK and test-first, takeable now.
- [Export the sky](26-export-the-sky.md): restore database access, then write the positions-only star data.
- [Prototype the visual language](27-prototype-the-visual-language.md): colour as light, type, layouts, the hero's sky, the route map. Blocked by *Export the sky*.
- [Model the mascot](28-model-the-mascot.md): blocked by the visual language and *Name and voice the mascot*.

## Comments

- 2026-09-28 — Claimed. Round 1 put the concept, how 3D lives on the page, the bot and the two-state UX. Janriz picked the small universe with weight on the AI side, and one world moved by scroll. A research subagent then checked the sky-is-the-wiki idea: `wiki_chunks` holds about 120–200 chunks with stable ids and 1536-d embeddings, the publisher was removed on 2026-08-31, local database access fails ("tenant/user not found"), and `search_wiki`'s full output (text, titles, ids) already streams to the browser. Rounds 2–4 settled the rest.
- 2026-09-29 — **Reopened in part.** Round 4 of *Prototype the visual language* built "3D: one world, where scrolling moves the camera" as written: a real-HTML column over a world that arranges itself around it. Janriz rejected it as flat: "a linear site / webpage that's slapped on top of a 3D background". He wants every scroll to be a scene, as in Edolus.
  - *Make every scroll a scene* amends this answer and ADR 0001. It covers the page over the world, the calm column, text "readable at any scroll position", and whether the voyage runs outward.
  - The rest stands: Deep Field, the sky, the bot, one page, the stops and their order, the warp, and colour as light.
