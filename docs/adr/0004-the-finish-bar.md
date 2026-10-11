# Every scene is built to one finish bar, in one type system

Status: accepted (2026-10-01); amended 2026-10-02 (the prototype is the skeleton, not the look)

The voyage is built one stretch at a time, and each build ticket polishes its own scenes. Without one shared standard, "finished" would drift from ticket to ticket. *Finish one scene* took the opening (the sky, the dive into his star, home and the stars round home) to finish and set the standard from it. Its prototype is `.scratch/redesign/prototypes/finish-one-scene/`. Its bodies (home, the sun, the orbit, the plate) are code-made stand-ins: the prototype set the bar and the skeleton, not the look.

## Decision

**The finish bar.** Every build ticket for a scene meets it at 1440 × 900, 390 × 844 and 844 × 390.

1. **Every frame is finished, not only the reading spots.** Frames are checked every 0.2 screens, and every 0.1 through transitions:
   - nothing pops in or out without a cause, and a body under about 16 px fades by its size;
   - nothing washes out the whole frame (gas fades when the camera is inside it);
   - no hairline cuts across the picture (one longer than half the frame's diagonal fades);
   - no text sits on other text;
   - text moves by rows and visual lines, never as stray single words.
2. **The camera never stops and never jumps** (ADR 0003). A deep link, a reload and a resize land on the same frame. **The motion is the storyboard's:** build tickets port round 3's camera path and timings, and the polish changes the look, not the motion, unless Janriz asks. A finish once straightened the dive's curve to move the sun off the text, and he caught it; a composition problem is solved with light, text placement or timing of reveals, not by moving the camera.
3. **Text is real HTML, in page order, moved by the scroll, and reversible.** Each scene's text arrives in a manner tied to what the scene does, in the scene's tint, and settles to white. Titles ride their subject.
4. **Contrast is measured at every reading spot,** sampled from the rendered frame: 4.5:1 for text and small print, 3:1 for titles.
5. **Light follows the colour rule** (ADR 0002):
   - lit surfaces go through PBR Neutral;
   - colours that carry meaning are drawn unlit;
   - no night side is pure black, because the region's light fills it;
   - warmth appears only as energy.
6. **Composition keeps three things clear at every reading spot:** the subject from the text, Pip's corner, and the route map's corner.
7. **Phones are composed, not scaled.** Portrait and landscape are framed separately. The voice shrinks while the labels hold their size.
8. **The tiers work:** reduced motion (stills, with text handing over in turn), plain (a complete page), and the keyboard (every subject can be asked about with a real button, and the route map is a list of links).
9. **A stretch costs no more than its grey-block storyboard,** measured the same way, at 60 fps. The budget check on a mid-range laptop is separate.
10. **Each build ticket's evidence** is an MP4 at 1440 and 390, screenshots at every reading spot and every 0.2 screens, a contrast table, and the frame cost.

**The prototype is the skeleton, not the look** (amended 2026-10-02). A prototype settles the skeleton, and a build keeps it:
- the camera path and timings;
- the composition;
- the text and its manners;
- the type.

Every body, surface and element in a prototype is a stand-in, however finished it looks. This prototype's home was called finished, ported to the real site unchanged, and read there as a placeholder.

So before a scene is built, a finalization grilling settles its look:
- what each body is;
- how it's made, by ADR 0002's routes;
- its materials and light.

Janriz picks from variants made for real and shown in place on the real site. The build then builds that look on the skeleton and holds it to the bar above.

**Type: Plaque's voice with Logbook's text.**
- The name and the scene titles are set in Jost capitals, tracked open.
- A hairline rule sits under the name.
- Small print and labels are DM Mono capitals.
- The reading lines are Newsreader.
- All three are OFL fonts from Google Fonts.

**Text manners proven here:**
- the hero's lockup is passed by the dive;
- a line is written out of the star it comes from, along a hairline of its light, and erased back into it;
- titles arrive letter by letter.

How they feel gets judged again once the real lighting is built.

**The route map's form:**
- The sky in miniature, top right: the stars from the hero's side, not turning, with the voyage drawn through them and the part you've travelled brighter.
- A "you are here" ring on what the camera is looking at.
- The flare plays on it.
- Hovering it, or focusing it with the keyboard, opens the five links.
- On phones it is a pill that unfolds into a sheet.

## Considered options

- **Type:**
  - Logbook: Newsreader with Instrument Sans.
  - Plaque: Jost with DM Mono.
  - Instrument: Geist with Geist Mono, US Avionix's pair.
  - General Sans with JetBrains Mono, Edolus's pair.

  Every one passed AA. Janriz found Logbook fine but liked Plaque's look in the hero, and the mix takes the best of both.
- **The route map at rest:** only the current section's name shows until it's hovered. At first Janriz didn't read it as the nav, but he likes it as a nav that fits the universe. The rest state is a tuning point for its build ticket. One option there is showing all five names, dimmed, at rest.

## Consequences

- Every build ticket that says "*Finish one scene*'s finish bar" means the ten points above.
- Every build ticket with a look of its own waits on its finalization grilling, and builds that answer, not the prototype's bodies.
- The checks that prove it already exist as prototype scripts: screenshots, the contrast sampler, the frame-cost measure and the MP4 recorder. The build turns them into its own checks.
- The build loads three font families. Newsreader and Jost are variable fonts, so each is one file.

## Amendment, 2026-10-02: text is written in word by word

*Finalize the hero and home*, round 3. Janriz, judging the text manners again under the real light: he dislikes the whole idea of text arriving by light ("I find the whole text comes via light concept unlikable"). Of the earlier ways, he picked round 2's (*Storyboard the voyage*: "cleaner").
- **What changes:** a reading line is written in word by word with the scroll and dissolved the same way (the `rise` word mode), never out of a star along a hairline of its light. A title arrives as its words do, not letter by letter.
- **What stays:** the hero's lockup is still passed by the dive. A line still lights the stars of what it's about as it writes in, which is the stage's doing, not the text's.
- **Gone from the engine:** the `thread` manner, its letters and its SVG layer.

## Amendment, 2026-10-03: the route map's look

*Finalize the route map*. Janriz picked from variants made for real on the real site. The form above stands; this settles the look, and with it the rest state this ADR left as a tuning point.
- **The miniature is a porthole:** a round window onto the sky's own light. Each star is a point with its halo, as the sky draws it, and the window is washed with the light of the region you're in. It isn't a glow added to the page: the halos and the wash are the sky's own light, and they carry meaning (the flare, the region). Drawn as SVG over the sky, in the HTML from first paint.
- **It's framed on the voyage, not the whole sky.** Seen whole, the sky crowds the voyage into a sixth of the map. Stars beyond the window are left out, and those near its rim fade.
- **At rest:** five ticks beside the map, one per section, in page order. Only the section you're in is named. A lone name hadn't read as a nav.
- **Hover or focus:** the map grows, and the five names hang beside it in page order, each on a leader line drawn out to where its section sits.
- **A trip:** a light-travel arc across the chart, from here to there, with the destination's name beside the map. The warp is a jump, not a ride down the road.
- **Start replays,** as "Back to the start" does, instead of warping.
- **Phones:** the pill drops a sheet with a larger map and five 44-px rows.
