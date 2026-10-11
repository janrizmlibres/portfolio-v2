# See the bot in the viewport

Type: prototype
Labels: wayfinder:prototype
Status: resolved
Blocked by: 10

## Question

Before *Pick the creative concept* decides whether the roaming bot goes ahead, how does it feel to have a bot living in the viewport and to talk to it?

This ticket judges **behaviour, not looks** (Janriz, 2026-09-27). The stand-in is the sample hover bot from *3D route verdict*: `bot-blender.opt.glb` and `motion.js` in [../prototypes/3d-route-verdict/](../prototypes/3d-route-verdict/README.md). The palette and persona aren't chosen yet, so any look modelled now would be redone.

**Backdrop:** the 2026-09-27 redesign prototype (`docs/design/2026-09-27-redesign-prototype.html`), the densest real layout, and the one the *3D route verdict* bot already roamed through `backdrop.html`. Janriz judges motion and interaction, not the backdrop's look.

**Rough now, tuned later** (Janriz, 2026-09-27). This ticket is a rough yes, no or "which version" that comes before the concept, and so before any site design. Waiting for the design would loop, because the design waits on the concept, which waits on this ticket. The bot's movement and conversation are tuned on the real site in their build tickets.

Build one throwaway page over that backdrop, and show:

- **Movement.** The bot travels the viewport's edges and corners on a small travelling canvas, and it animates as it moves:
  - it leans or banks into the direction of travel;
  - it settles when it parks;
  - at rest it keeps its idle (bob, sway, blink) and its pointer look-at.

  GSAP authors all of it.
- **First visit.** The bot arrives in the hero, greets the visitor and offers suggested prompts (State 1's chips). Then it flies to its parked spot. This plays once per visitor, can be skipped, and runs over a page that is complete underneath. It is the one-page alternative to State 1, which *Pick the creative concept* weighs.
- **Click to talk.** Clicking the bot opens the conversation, and hover or focus shows that it can be clicked. Before the `.glb` loads, an HTML stand-in in the same place can already be clicked (the ≤ 1 s rule). Tab reaches a fixed button, not the moving bot.
- **Two conversation surfaces, with a toggle:**
  - A: a full chat panel;
  - B: a speech bubble from the bot that streams the live reply, plus a log of the conversation.

  The canned replies speak as a mascot with a placeholder name that talks *about* Janriz, not as Janriz. That is the direction in *Name and voice the mascot*. Each surface streams two of them:
  - a short one of 1–4 sentences, the length the current system prompt asks for;
  - one with a list and links.
- **Getting out of the way.** The bot sits on the front layer, so it will cover things.
  - **Shake to shoo** (Janriz's idea, 2026-09-28). Shaking the cursor over the bot, meaning a few quick back-and-forth direction changes inside its hit area, is the visitor saying "excuse me". The bot emotes an apology, "oh! ok, sorry, I'll move over here", as its own GSAP-authored animation:
    - it notices: a small flinch, and wide eyes on the "oh!";
    - it apologises: a head dip or bow, a sheepish squint, the antenna drooping;
    - it glances at where it's going, then scoots there;
    - it settles with a small "all good" beat.

    The emote alone carries it, with no text or bubble (Janriz, 2026-09-28). It is a delight, not the only way out.
  - **Baseline, needing no discovery.** The bot never parks on what the visitor is reading, and it moves off an element the visitor focuses, clicks or selects text in.
  - **Touch and keyboard**, which have no cursor to shake. Try dragging or flicking the bot to a new spot, and a keyboard "move" on its fixed button.
  - It remembers the spot the visitor chose for the session.
  - Under reduced motion it relocates without the flourish.
- **A 390 px view** and a **reduced-motion view**, where the bot parks.

If this outgrows one session, split the two conversation surfaces into their own prototype, and keep this one on the bot's behaviour.

Janriz reacts. The answer records:

- how the movement felt;
- whether shake-to-shoo is findable and fun, or gets in the way, and whether the apology reads on a 160 px bot;
- which surface he leans towards, and why;
- anything that felt off.

The answer feeds *Pick the creative concept* (does the bot go ahead) and *Pick the AI entrypoint* (which surface), but decides neither.

Out of this ticket:

- the effect of going to a section, which is *Warp or scroll*;
- voice, which is *Voice in and out*;
- the bot's final look.

## Answer

Janriz reacted on 2026-09-28, after trying the prototype on desktop and on a phone: [../prototypes/bot-in-viewport/](../prototypes/bot-in-viewport/README.md). Run `serve.sh` there and open `http://127.0.0.1:4174/`. Its defaults are now his picks: surface B, direct travel, lively wander, and the first visit with the bubble over the bot.

**Movement: it feels good overall.** He picked **lively wander** (a hop every 7–12 s) and **direct travel** over travel along the edges, because they make the bot feel less constrained.
- Tuning note for the build, which he agreed to. The prototype is watched and the real site is read, so:
  - pace wander to reading: lively in the hero and when the visitor is idle, easing towards calm while they scroll through sections;
  - keep wander hops short, so direct flights bow round the reading band instead of crossing it;
  - moves the visitor causes (shoo, flick, going to talk, the warp) always fly direct.
- **Wander stays on after the visitor picks a spot** (Janriz, 2026-09-28). The pick becomes its home base:
  - it holds still there for 30 s, then roams;
  - a recheck after scrolling brings it back to that spot when the spot is free;
  - spots it was shooed from stay off-limits for the session.

  Built into the prototype.

**Clearance** (Janriz, 2026-09-28). After a move the bot still covered a few letters, so it now keeps a 10 px margin between its body and any text. A spot counts as free only when no text is inside the body plus that margin. Photos may cover up to a quarter of that box, so the bot can still sit on the edge of a picture. Measured over the whole page after the change, no scroll stop left text under the body, at 1440 px or 390 px. Before it, 8 of 13 stops at 1440 px did.

**Shake-to-shoo: committed.** He finds it fun.
- The emotes read clearly at the parked size, which is about 150 px tall on a laptop and 115 px on a phone. The same goes for the "oh!" flinch with wide eyes, and for the bow, sheepish squint and antenna droop of the apology.
- **Findability wasn't judged**, because he knew about the gesture beforehand. It stays an easter egg on top of the baseline, which gets the bot out of the way without it:
  - the bot never parks on text being read, and moves off what the visitor focuses, clicks or selects;
  - drag and flick on touch;
  - the keyboard "Move" button.

  No hint is added. The flinch after two direction reversals nudges anyone who wiggles over the bot by accident.

**Surface: he leans towards B**, the speech bubble plus a log. "It feels more like an actual conversation" with the bot, while A "feels more like the usual chat widget you see on most pages". He also liked how B works on mobile. What B costs, for *Pick the AI entrypoint*:
- long replies are cramped in a bubble, so the mascot's voice keeps replies short and uses lists sparingly (*Name and voice the mascot*), and the log holds the history;
- replies must stream or be paced, where today they appear on finish.

**First visit: the bot and its bubble stack on one centre line** (Janriz's idea). That's the photo's centre on desktop and the screen's centre on phones.
- **He picked bubble over bot.** It's the prototype's default, and bot over bubble is kept as a setting. Why it's better:
  - speech sits above the speaker, with the tail down to it;
  - the bot starts lower, nearer its bottom-right home;
  - on phones the input sits in the upper half, so the keyboard covers the bot rather than the input.
- **While it greets, the bot faces the visitor.** Its look-at follows the cursor at a quarter of its usual strength. At full strength the head turned towards a cursor over the name, and Janriz read the stack as off-centre.
- The final layout belongs to the visual language.

**Anything off:** nothing.

**The emote set this prototype used**, as input to the mascot's look and to *Name and voice the mascot*:
- greet;
- anticipate (a crouch before a move);
- settle on parking;
- the shoo sequence: notice, apologise, glance, scoot, then "all good";
- perk up on hover;
- a hint flinch;
- thinking while a reply loads;
- talk beats while it streams;
- idle bob, sway and blink, and the pointer look-at.

At the parked size they all need a readable face, eyes and antenna.

This feeds *Pick the creative concept* (the bot is welcome, and the behaviour holds up) and *Pick the AI entrypoint* (it leans B), but decides neither. The warp with B is suggested in a comment on *Warp or scroll*.

## Comments

- 2026-09-28 — Prototype built, waiting on Janriz's reaction: [../prototypes/bot-in-viewport/](../prototypes/bot-in-viewport/README.md). Run `serve.sh` there and open `http://127.0.0.1:4174/`. Both surfaces fit in one prototype, so it wasn't split.
