# Pick the AI entrypoint

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Blocked by: 12, 16

## Question

Which AI entrypoint does the site commit to? The inputs are *Pick the creative concept* (Deep Field: the bot goes ahead as the AI entrypoint and guide, on one page with no two-state split) and Janriz's reaction in *See the bot in the viewport*. The answer settles:

- **The conversation surface:** a full panel, a speech bubble plus a log, or something else. Also what happens to a reply that outgrows a bubble.
- **How a reply appears.** Today it appears all at once: `app/page.tsx` appends it in `onFinish` and shows typing dots until then (*Voice in and out*). A bubble that streams the live reply, and any voice or babble that follows the text, needs a streamed or paced reveal. The answer says which, and what the mascot does while it waits (a "thinking" emote in place of typing dots).
- **How the conversation opens:** clicking the bot, a fixed button, a key, or hold-to-talk. Clicking a star in the sky also asks the bot about its topic (*Pick the creative concept*).
- **How it survives:**
  - the model not yet loaded (now behind the wake-up, ADR 0005);
  - reduced motion (the bot parks);
  - 390 px screens (the corners are where content sits);
  - keyboard and screen-reader access, without chasing a moving target;
  - returning visitors with an open conversation.

Voice layers on top in *Voice verdict*. The entrypoint must work fully without it.

Resolving this ticket writes the ADR in `docs/adr/` and settles the terms in `CONTEXT.md`. Chat bar and Chat drawer are the prototype's terms and may be retired.

## Answer

Janriz settled it in one grilling session on 2026-10-01. The decision is ADR 0007, `docs/adr/0007-tycho-talks-in-a-bubble.md`. `CONTEXT.md` drops Chat bar and Chat drawer and adds **Bubble**, **Log** and **Reveal**.

**The bubble plus a log (B), committed.** His lean from *See the bot in the viewport* stands.
- **The bubble:**
  - holds only the current exchange;
  - grows to about half the screen, then scrolls inside;
  - offers up to three unasked starter questions after a reply.
- **The log** holds the whole conversation. It's a sheet over the page, opened from a "Log" button in the bubble's header, and Clear lives in it. The name visitors see is the copy pass's.
- **One question at a time.** The next question can be typed while Pip answers.
- **The fold:** once a reply is done, scrolling on by about a screen folds the bubble into Pip, and clicking him reopens the same exchange.

**Replies are revealed at a reading pace** from the stream. Words never run ahead of what has arrived, and a tap shows the rest. While Pip waits, the bubble shows the question and he plays his thinking emote. There are no dots.

**How it opens:**
- clicking or tapping Pip;
- asking about a star or a subject, which sends the question at once;
- a real "Ask Pip" button for the keyboard.

There's no single-key shortcut. Hold-to-talk is *Voice verdict*'s.

**How it survives:**
- **No 3D:** the flat Pip from the wake-up's drawing, parked and still.
- **Reduced motion:** Pip stays home and moves by fading, and the reveal keeps its pace. Janriz asked why reduced motion is needed at all. It serves visitors whom movement on screen makes dizzy or sick, and it is standing constraint 4.
- **Phones:**
  - the bubble may cover the last lines while it's open;
  - Pip keeps to his corner and doesn't wander.
- **Keyboard and screen readers:**
  - a dialog that doesn't trap focus;
  - Esc closes it and returns focus;
  - each finished sentence is announced.
- **Returning visitors:** the welcome back offers to pick up where they left off, which opens the log.

**Everything the chat says is in Pip's voice** (Janriz: "the chat should be in Pip's voice, not mine"). That covers his replies and every error, the server's rate-limit and monthly-limit messages included. Those messages are chat backend, so this redraws them into the map.

**Agent-written follow-up questions** were deferred out of the redesign (Janriz) to [../../deferred/agent-written-follow-ups.md](../../deferred/agent-written-follow-ups.md). They need a chat-server change.

**From the case studies:**
- **Edolus:** the keyboard path never chases a moving target, so there's a real button instead of Pip. Its "sound and text as one gesture" is what babble adds on top of the reveal, in *Voice verdict*.
- **Izanami:** every way out of its menu was meant to be one state change, and its Escape path wasn't. The bubble's closes are one.
- **Produx:** its chips are `aria-hidden`, so every chip here has a real control behind it.
- **US Avionix:**
  - its flat silhouette, kept as the end state, becomes the flat Pip when there's no 3D;
  - "arrive warm, settle to white" is offered for the reveal's look and left to *Build the bubble*;
  - its telemetry line stays set aside, since the bubble covers the wait.
- **Trionn:** hold-to-talk is left to voice, because it would collide with dragging Pip. Its gestures had no touch or keyboard path, so every way in here has one.
- **Hashgraph:** its interactions gave no sign they existed. Pip's hover label and perk are the sign.

**Our own:** the fold on scroll, drafting the next question while Pip answers, and the welcome back opening the log.

**New tickets:**
- [Build the bubble](build.md#t49): AFK, then HITL. Blocked by *Name and voice the mascot*, *Stop sending chunks to the browser* and *Build the film engine*. It now also blocks *Build the wake-up* and *Build the pointer layer*.
- [Rewrite the chat in Pip's voice](build.md#t50): blocked by *Name and voice the mascot*.

## Comments
- 2026-10-01 — From [Plan the signature moments](13-plan-the-signature-moments.md) (resolved; ADR 0005):
  - **The ≤ 1 s rule is retired.** Every load opens on the wake-up, and the chat works from the moment Pip wakes. On a first visit his greeting and three suggested questions open in the surface this ticket picks; *Build the wake-up* builds them.
  - **Drag-onto-the-bot is dropped** (Trionn's scanner):
    - Pip wanders, so he'd be a moving target;
    - a drag already turns the sky;
    - a click or the `[ ASK ABOUT … ]` chip already asks.

    Hold-to-talk stays yours.
  - **The bot's page effects are settled:** it lights the stars it reads, warps to a reading spot, and points at a subject.
