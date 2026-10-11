# Tycho talks in a speech bubble, and the conversation lives in a log

Status: accepted (2026-10-01). It replaces the 2026-09-27 prototype's chat bar and chat drawer, which ADR 0001 retired until this choice was made.

Tycho is the AI entrypoint (ADR 0001). *See the bot in the viewport* tried two surfaces on the stand-in bot: a full chat panel, and a speech bubble plus a log. Janriz picked the bubble. In his words, it "feels more like an actual conversation", while the panel "feels more like the usual chat widget you see on most pages". *Pick the AI entrypoint* settled the rest.

## Decision

**The bubble is the one conversation surface.**
- It holds only the current exchange: the visitor's question and Tycho's reply. Earlier exchanges live in the log.
- **Replies are kept short:** 1–4 sentences, with lists only now and then. A longer reply grows the bubble to about half the screen's height, then scrolls inside it. The bubble follows the newest words unless the visitor scrolls it back. Links are real links.
- **After a reply,** it offers up to three of the starter questions not yet asked, until they run out.
- **One question at a time.**
  - While Tycho answers, asking is held off, and stars and chips show that he's answering.
  - The visitor can still type the next question. Send comes back when the reply is done.
  - Closing the bubble mid-reply doesn't stop the reply. It lands in the log, and reopening the bubble shows it.
- **It stays open while a reply is appearing.**
  - Once the reply is done, scrolling on by about a screen folds the bubble into Tycho. Clicking Tycho reopens the same exchange.
  - Tycho holds still while the bubble is open.
  - For a warp, the bubble folds into Tycho and reopens at the destination (*Warp or scroll*).

**Replies are revealed at a reading pace.**
- The reply streams from the server, and its words appear in the bubble at a steady pace, never ahead of what has arrived.
- A tap on the text shows the rest at once.
- The pace is one setting, tuned on the real site.
- **While Tycho waits:**
  - the bubble shows the question;
  - Tycho plays his thinking emote;
  - the stars he reads light up (ADR 0005).

  There are no typing dots.

**The log holds the whole conversation.**
- A "Log" button with a count, in the bubble's header, opens it as a sheet over the page: from the right on desktop, from the bottom on phones. It doesn't push the page aside.
- Clear lives in the log. Esc or Close returns to the bubble.
- The name visitors see is the copy pass's to choose.

**How a conversation opens:**
- **Clicking or tapping Tycho** opens the bubble. On desktop the input takes focus. On phones the keyboard waits for a tap on the input, so it doesn't cover the bubble.
- **Asking about a star or a subject** sends that question at once and opens the bubble (ADR 0005).
- **Keyboard users** get a real "Ask Tycho" button early in the tab order, shown when focused, beside "Move Tycho". A moving Tycho is never their target.
- **No single-key shortcut.**
- **Hold-to-talk** is *Voice verdict*'s. If voice input wins, it goes inside the bubble. Pressing on Tycho already starts a drag.

**Everything the chat says is in Tycho's voice** (Janriz): his replies, the greeting, the welcome back, and every error, including the server's rate-limit and monthly-limit messages. *Name and voice the mascot* writes the words.

**The tiers:**
- **Without 3D** (no WebGL, or 3D that failed or took more than about 10 s): the flat Tycho from the wake-up's drawing sits parked and still in his corner. He opens the same bubble and log, so the chat works in full.
- **Reduced motion:**
  - Tycho stays at home with no wander, and moves by fading out and back in;
  - the bubble fades in;
  - the reveal keeps its pace, because words appearing isn't movement.
- **Phones:**
  - the open bubble spans the width above Tycho and may cover the last lines of text, which the fold on scroll uncovers;
  - Tycho keeps to his corner and doesn't wander, though drag and flick still move him.
- **Keyboard and screen readers:**
  - The bubble is a dialog that doesn't trap focus. Focus goes in when it opens, Tab can leave, and Esc closes it and returns focus to where it came from.
  - Every way of closing it is the same state change.
  - "Tycho is reading his notes" is announced once, then each sentence as it finishes. The log is the full record.
- **Returning visitors:**
  - After the wake, Tycho's welcome back offers to pick up where they left off, which opens the log, beside fresh suggestions. The bubble doesn't reopen on the old exchange.
  - A reply cut off by leaving the page is dropped, and its question stays.

## Considered options

- **A full chat panel**, with Tycho perched in its header (the prototype's A). It is roomier for long replies, but it reads as the usual chat widget and pushes the film aside.
- **A bubble that grows into a panel** once the conversation gets long. The log already holds the history, without a second surface.
- **A live stream, shown as fast as it arrives.** It doesn't work here:
  - the model writes far faster than anyone reads;
  - a warp takes about 7 s, so most of a reply would land at once on arrival;
  - voice or babble needs a steady pace to follow.
- **Agent-written follow-up questions** after each reply. They need a change to the chat server outside the redesign, so they're deferred to an effort of their own.

## Consequences

- **The old chat UI goes:** the chat panel, the mobile bottom sheet and the chat bar. The chat store holds only the conversation, which is the log, and the flag that switched the two states goes with them.
- **Replies need the stream.** Today a reply appears only when it finishes (`onFinish` in `app/page.tsx`). The reveal reads the text as it streams.
- **The chat changes voice.** The system prompt stops speaking as Janriz, and the server's error messages are rewritten in Tycho's voice. Those messages are part of the chat backend, so this redraws them into the redesign.
