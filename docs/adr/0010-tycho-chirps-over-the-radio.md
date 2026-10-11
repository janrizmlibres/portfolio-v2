# Tycho chirps over his suit radio, and nobody talks out loud

Status: accepted (2026-10-04)

ADR 0007 put the conversation in Tycho's bubble, with replies revealed at a reading pace, and left his voice to *Voice verdict*. That ticket put every voice in his real bubble and Janriz listened to them in two rounds.
- **Round 1** had a wordless vowel babble, OpenAI's `gpt-4o-mini-tts`, the browser's own `speechSynthesis` voice, and a hold-to-talk mic (the browser's recognition or OpenAI's transcription).
- **Round 2** had three robot voices in the family of WALL-E and R2-D2: FM chirps, pentatonic beeps, and lower chirps with a servo and clicks.

## Decision

**Tycho makes wordless robot chirps, through his suit radio, as each sentence opens.** He doesn't speak words, and visitors don't speak to him.

**The chirps:**
- One or two FM chirps a word. Each bends, sweeps, dips or trills.
- The modulator holds a fixed frequency while the pitch moves, so a sweep turns slightly metallic.
- **They're performed, not random:**
  - pitch falls across a sentence;
  - a phrase's last chirp sweeps up for a question and down otherwise;
  - the same word always makes the same chirp, because it's seeded from the word.
- They're built from sines and shaped noise, never square or saw waves. They must never read as chiptune.

**Only the opening of each sentence:**
- Tycho chirps on the first three words of each sentence, as a phrase that ends the way the sentence does. He stays quiet while the rest of the sentence appears.
- A chirp on every word ran 6–10 s on a long reply, which wears thin by the third question. A phrase per sentence still says that he's talking.

**Through his suit radio:**
- The chirps pass through a comm band: 340–3400 Hz, a little drive, a presence lift at 1.9 kHz.
- Apollo's Quindar tones open and close each reply: 2525 Hz in, 2475 Hz out, a quarter second each.
- He talks to you the way astronauts talked to Houston, which ties him to the documentary-real voyage.

**Timing comes from the reveal:**
- Each word's sound is scheduled on the audio clock the moment the reveal shows that word. Scheduling is just in time, never the whole reply up front, and finished nodes are disconnected.
- So sound and text keep exact time, and Tycho's talk beats land on the same words.
- **A tap that shows the rest, or closing the bubble mid-reply,** silences the rest of that reply. A jump of more than a few words is never chirped.
- The pace stays the reveal's: about 4 words a second, tuned on the real site.

**He follows the one sound toggle (ADR 0006):**
- There's no separate voice switch.
- The wake-up's click turns him on with everything else, a remembered mute keeps him silent, and the toggle stops him (WCAG 1.4.2).
- His chirps join the mix after the score's chat duck, so they never dip with it.

**Accessibility:**
- **Captions:** the text is the caption. The chirps carry no words, so nothing else is needed.
- **Screen readers:** they hear each finished sentence, politely (ADR 0007). The chirps stay on for them: they carry no words to clash with, and the page can't detect a screen reader.
- **Reduced motion** leaves the sound alone (ADR 0006).

**The sound is a skeleton:**
- The chirp's shape, pacing and radio are settled.
- Its final timbre and level are *Finalize the score*'s, heard against the real score: synthesised as here, or a designed sample bank played the same way.
- The prototype's levels peaked at −7.5 to −11.6 dBFS. Nothing clipped.

## Considered options

- **A wordless vowel babble** (Animal Crossing's way): formant-synthesised syllables from each word's vowels. Janriz didn't like how it sounded, and asked for robotic beeps "like the sounds on Wall-e".
- **Pentatonic beeps.** Pleasant, but they read as an interface, not a character.
- **Chirps with a servo and clicks** (the most WALL-E). Too busy on every sentence. A servo may still mark his emotes (turning, pointing), which is *Finalize the score*'s call.
- **A chirp on every word,** which wears on long replies.
- **A clean voice in a small room,** without the radio.
- **OpenAI's neural voice.** Janriz found it "definitely better", but held it off: "let's hold off for now. We can revisit it in the future." It costs about $7 per 1,000 long replies, roughly 70% of the $10 cap on top of the chat. It waits 1.5–2.1 s for a sentence's first byte, needs the AI-voice disclosure, and adds endpoints next to the chat backend. It's deferred, with round 1's findings, to an effort of its own.
- **The browser's own voice.** Free, but it differs on every device, can be a novelty voice, and never enters Web Audio, so the score can't duck under it or follow it.
- **A mic (hold to talk)**, through the browser's recognition or a paid transcription. Ruled out by Janriz: "I agree with no mic." Recruiters at a desk rarely talk to a page. The browser route misses Firefox and sends audio to Google, Apple or Microsoft. Typing and the starter questions cover asking.
- **Speech-to-speech in the browser.** Ruled out by the research: a realtime session would expose the system prompt in devtools, and one minted session allows unlimited turns past the rate limit.

## Consequences

- **The chat backend is untouched:** no speech or transcription route, nothing new in the cost cap, no disclosure line.
- **The audio engine plays his chirps live** as one-shots on its own context (ADR 0006), not from stems. The prototype made its own context, which goes.
- **The bubble drives the voice:**
  - each word as the reveal shows it;
  - stop on a tap or a close;
  - the closing tone once the reply is shown.
- **Tycho's greeting and welcome back** don't go through the chat, so they're voiced only if the wake-up voices them.
- **The reference build** is `components/bubble/voice/engine.ts`. Round 1's code (the neural voice, the browser voice, the mic and their dev routes) is kept outside the public checkout for when a spoken voice is picked up.
