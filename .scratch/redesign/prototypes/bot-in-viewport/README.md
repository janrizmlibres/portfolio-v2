# PROTOTYPE — See the bot in the viewport (throwaway)

For [See the bot in the viewport](../../issues/16-see-the-bot-in-the-viewport.md). The sample hover bot from *3D route verdict* (`bot.glb` is a symlink to its `bot-blender.opt.glb`) lives on the front layer of the 2026-09-27 redesign backdrop. This page judges **behaviour, not looks**.

## Run

```sh
.scratch/redesign/prototypes/bot-in-viewport/serve.sh   # then open http://127.0.0.1:4174/
LAN=1 .scratch/redesign/prototypes/bot-in-viewport/serve.sh   # same, reachable from a phone on the network
```

The bottom bar switches the conversation surface (← → keys work too):
- `?variant=B` (the default, Janriz's lean): a speech bubble from the bot, which streams the reply, plus a log.
- `?variant=A`: a full chat panel. On desktop it pushes the page; on phones it's a sheet. The bot perches in its header.

The ⚙ button opens the settings, plus a live readout of the bot's state. Defaults are Janriz's picks from the ticket's answer: B, the bubble over the bot, direct travel, lively wander.

| Setting | Values | |
|---|---|---|
| First visit | bubble over bot / bot over bubble | how the greeting stacks, centred on the photo (desktop) or the screen (phones); changing it replays the first visit |
| Travel path | along the edges / direct | how it gets from one spot to the next |
| Wander | off / calm / lively | roams to another free spot every 24–38 s or 7–12 s, and keeps roaming after you pick a spot: it holds still there for 30 s first, and comes back to it after you scroll. The readout counts down to the next try |
| Motion | full / reduced | reduced parks it and relocates with a fade |
| Model load | fast / slow (4 s) | slow shows the HTML stand-in first |
| View | desktop / 390 px | 390 px is this page in a phone-sized frame |
| Brain | hide / show | draws what it counts as reading (blue), the free (green) and covered (amber, red) spots, home (orange ring), the bot's body box (dashed) with its 10 px keep-out margin (dotted), and the shake meter |

**Replay first visit** clears the once-per-visitor flag. **Forget my spot** clears the spot you chose.

## What to try

- **First visit.** It flies into the hero, greets you with the bubble stacked on the same centre line and offers the suggested prompts, then parks. You can skip it with *Not now*, Esc, by scrolling or by clicking the bot. It plays once, then returning visits slide the bot in to its spot.
- **Click the bot** to talk. Hovering shows a label and the bot perks up.
- **Shake the cursor over the bot** to shoo it: "oh!", a bow with a sheepish squint and a drooping antenna, a glance, a scoot, then "all good". Nothing on the page tells you the gesture exists, on purpose: whether you find it is one of the questions.
- **Drag or flick it** to any edge. It remembers that spot for the session, as the home it roams from.
- **Scroll.** When text slides under it, it moves off once the scroll stops, and goes back to your spot when that's free again. Clicking, focusing or selecting text under it moves it too.
- **Tab** reaches "Talk to Pip" and "Move Pip", fixed at the top left. Move steps it clockwise round eight spots.

## How it's built

- `rig.js`: three.js draws, GSAP authors all motion. Each layer owns a proxy (idle, travel lean, emote, hover, look-at, talk, blink), and one ticker listener sums them onto the named nodes. So the lean, bob, look-at and emotes never fight.
- `main.js`:
  - the edge track and the reading-cost placement;
  - travel;
  - shake detection: four direction reversals of 14 px or more within 0.9 s, on either axis;
  - drag and flick, the keyboard buttons, the first visit, both surfaces, the settings and the brain.
- `talk.js`: canned replies. "Pip" is a placeholder mascot talking *about* Janriz. It has one reply with a list and links, and three short ones, streamed token by token.
- The backdrop (`backdrop.html`, a symlink) is fetched into this document rather than put in an iframe, so the bot can read its layout, focus and selection. Its own State 1, chat bar, drawer and state toggle are removed.
- `check.js`: a headless smoke run (GPU on) that screenshots each moment into `shots/`. Run it with `node check.js [intro B shoo scroll mobile rm slow]`.
