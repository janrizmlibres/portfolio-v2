# Voice verdict

Type: prototype
Labels: wayfinder:prototype
Status: resolved
Blocked by: 14, 18, 19

## Question

Does the bot listen, talk, both or neither, and through which stack? The facts are in *Voice in and out*.

Build one throwaway page on the chosen AI entrypoint. The same short streamed replies are voiced three ways, side by side:

- the browser's built-in voice;
- one paid neural TTS voice;
- non-verbal babble synthesised in Web Audio.

Hold-to-talk sends a spoken question through whichever input the research favours. Janriz listens on his laptop **and his iPhone**, and reacts.

The answer settles:

- voice in, voice out, both or neither;
- the default, within the unlock rules from *Audio stack verdict*;
- captions;
- whether a paid route earns its case.

A paid route needs Janriz's approval (see **Assets** in the map's Notes). It also adds endpoints next to the chat backend, which the map rules out of scope, so choosing one redraws that line.

The full list of what the answer must settle is "Open questions for the verdict" in [../research/voice.md](../research/voice.md). Facts from that research that shape this ticket:

- **Nothing can follow the text yet.** Replies appear all at once today, because `app/page.tsx` appends the reply in `onFinish` and shows typing dots until then. Speaking or babbling "as it streams" needs the streamed or paced reveal that *Pick the AI entrypoint* decides. Build that into the listening page.
- **Babble has the fewest strings attached.**
  - It is self-made, needs no licence, and costs 0 KB of assets, or 12–17 KB as an Opus sprite.
  - It uses 0.2–0.5% of one core, if blips are scheduled just in time.
  - Its timing follows the reveal exactly.
  - Animal Crossing dropped TTS because it ran "too fast" against the text.
  - Never use the popular "Animalese Typing" samples, which are ripped from the game. `animalese-web` (MIT) and ZzFX are clean.
- **The browser voice** is free and fast, but it sounds different for every visitor. Chrome on this Mac defaulted to the novelty voice "Albert". Its audio also never enters Web Audio, so the score can't duck under it smoothly.
- **Voice in.** No Firefox release has `SpeechRecognition`, and the other browsers send audio to their vendor's cloud. A free voice-in path can't work everywhere: either pay for transcription (about $0.11–1.42 per 1,000 questions) or hide the mic where it isn't supported.
- **Rule out speech-to-speech in the browser.** A realtime session's first event would show the full system prompt, confidential names included, in devtools. One minted session also allows unlimited turns, which bypasses the rate limit.
- **The cost cap is already tight.** It counts only GPT-4o tokens, at a stale $15/M output price. Text alone is about $0.017 a reply, so the $10 cap covers about 480–600 replies a month. Any paid voice route must also teach the cap to count voice, which is chat-backend work outside this map.
- **Disclosure.** OpenAI's voice terms require telling visitors the voice is AI-generated. The mascot (*Name and voice the mascot*) makes that plain. A voice that speaks as Janriz would not.

Resolving this ticket writes the voice ADR in `docs/adr/`.

## Comments
- 2026-10-01 — From [Pick the AI entrypoint](19-pick-the-ai-entrypoint.md) (resolved; ADR 0007): **the entrypoint is Tycho's bubble plus a log.**
  - Build the listening page on the bubble, with the reveal:
    - words appear at a reading pace from the stream, never ahead of it;
    - a tap shows the rest at once;
    - babble or voice follows that pace.
  - **Hold-to-talk,** if voice input wins, goes inside the bubble. Pressing on Tycho already starts a drag.
  - **Screen readers** hear each sentence as it finishes, politely. A voice has to sit alongside that, and screen readers can't be detected.
  - **Everything the chat says is in Tycho's voice** (Janriz), which is what any spoken voice voices.
- 2026-10-03 — From [Name and voice the mascot](24-name-and-voice-the-mascot.md) (resolved; ADR 0008): the mascot is **Tycho**, said "TY-koh". Nobody has heard a text-to-speech voice say it yet, so any spoken voice should be checked for it. Write it "Tycho" everywhere. His tone is a curious explorer, warm and plain, with at most one dry aside per reply.
- 2026-10-04 — Round 1 built, waiting on Janriz: the listening takes are in Tycho's real bubble on `localhost:3000`. The take switcher (top left) flips them: *Tycho's voice*, *Suit radio*, *Who keeps time*, *Neural voice* and *Hold to talk*. Ask with a starter chip or by typing; the replies are the bubble's canned ones, streamed as the model's are. A readout under the form shows the take, the chosen voice, clip latency, sentences spoken and what the mic heard. The bubble's header has a **Voice on/off** switch. Code: `components/bubble/voice/` (engine, mic, CSS), two dev-only routes in `app/api/prototype-voice/` (404 in production), and small hooks in `components/bubble/Tycho.tsx`.
  - **babble** (default): a wordless voice synthesised in the page. One glottal source runs through three formant filters (Peterson & Barney's vowels, raised a little for a small body), with one to three syllables per word taken from the word's own vowels. Pitch falls across a sentence, rises on a question and drops at a full stop. Consonants are short noise ticks. It follows the reveal exactly (4 words a second) and costs nothing. **It's a stand-in made of carefully shaped synthesis, not a finished sound.** If babble wins, its final sound is made to the score's bar.
  - **Suit radio** (babble and neural): the voice comes through a comm band (340–3100 Hz, a little drive, a presence lift), and Apollo's Quindar tones (2525 Hz in, 2475 Hz out) open and close each reply. The idea comes from documentary realism: Tycho talks to you the way the astronauts talked to Houston. Off is a clean voice in a small room.
  - **neural**: OpenAI `gpt-4o-mini-tts`, one request per finished sentence, steered towards "warm and plain, TY-koh, JAN-riz". Four voices to try: cedar, ash, verse, marin. Measured from the dev route: **first byte 1.5–2.1 s, and a whole sentence clip once took 8.5 s**. Under the spoken pace the words wait for the voice, so the bubble sits empty about 1.5–2 s longer than with babble.
  - **browser**: the visitor's own `speechSynthesis` voice, never a macOS novelty voice; a natural one is picked by name. Headless Chrome on this Mac got "Daniel". It can't go through the radio.
  - **Who keeps time:** *spoken* means the voice leads and each word appears as it's said, so the text is the caption. *Reading* keeps the text at 4 words a second, with the voice a sentence at a time behind it; speech runs at about 2.5–2.9 words a second, so it falls further behind every sentence. Babble always keeps the reading pace.
  - **Hold to talk** sits in the bubble's form, left of the field.
    - Pointer: press and hold, release to send; sliding off cancels (WCAG 2.5.2).
    - Keyboard: Space or Enter starts, again sends, Esc cancels (WCAG 2.1.1).
    - *browser* uses the browser's own `SpeechRecognition`, which shows interim words in the field and is hidden where it's missing (Firefox).
    - *transcribe* records and sends the clip to OpenAI. `gpt-transcribe` returned a TTS clip word for word ("Janriz", "Tycho") in 2.5 s.
    - The release is the gesture that unlocks his voice on phones.
  - **Ideas taken from the case studies:**
    - Trionn: sound is opt-in, and its synthesised voice was judged "a gimmick" (*Voice in and out* §0), which tips against a human voice.
    - Edolus: the stem mix follows state, so babble is a layer that plays only while he talks.
    - US Avionix: a telemetry line of real agent events, the Quindar tones' kin (a radio that marks each transmission).
    - Hashgraph: one timeline drives picture, copy and sound, so the babble is scheduled from the reveal itself and his talk beats land on the same words.
    - Izanami and Produx: calm, with one motif, so there's one voice and no second sound for "thinking".
  - **Ideas held:** his talk beats driven by the voice's loudness (an `AnalyserNode` on the radio bus), and ducking the score under him once the score exists (*Score the voyage*).
  - ➡️ **I'd pick babble through the suit radio, with no voice in.**
    - Why babble: it's free, needs no vendor, key, endpoint or disclosure, keeps exact time with the text Tycho's chat already has, and suits a character who's openly a robot.
    - Why the radio: it ties him to the documentary-real voyage instead of a cartoon.
    - What tips it against the neural voice: about $7 per 1,000 long replies, roughly 70% of the $10 cap on top of the chat. It adds 1.5–2 s of silence before the words, needs the AI-voice disclosure, means two new endpoints in the chat backend, and still can't be checked before it speaks a name wrong.
    - Against the browser voice: it differs on every device, the score can't duck under it, and a crafted site would speak in whatever voice the visitor's OS ships.
    - Against a mic: recruiters at a desk rarely talk to a page. The mic adds a permission prompt, a Firefox gap, and either Google's or Apple's ears or a paid route. Typing and the starters already cover asking.
  - **Defaults I'd propose with that pick:**
    - babble follows the one sound toggle (ADR 0006), so there's no separate voice switch: the wake-up click turns it on, a remembered mute keeps it off, and the toggle stops it (WCAG 1.4.2);
    - no captions beyond the text itself, which the babble follows word for word;
    - babble stays on for screen-reader users, since it carries no words and the page can't detect them.
  - **For Janriz:** listen to each take on your laptop, with sound on and the mic allowed. Which voice, radio or clean, which pace, and do you want to talk to Tycho at all?
    - **iPhone:** *Audio stack verdict* recorded that you have no iPhone. If that's still so, the phone questions go to the QA plan's iPhone pass (the score while the mic is open, `speechSynthesis` and the Silent switch, the mic prompt after a minute).
    - The mic on a phone over the LAN would also need HTTPS on the dev server.
- 2026-10-04 — Janriz on round 1:
  - **No mic:** "I agree with no mic."
  - **A wordless voice, but not that one:** "Also with the babble but I don't like how it sounds at the moment, what if instead it's like a robotic beep? like the sounds on Wall-e if you know?"
  - **The neural voice, later:** "The openAI voice is definitely better but let's hold off for now. We can revisit it in the future." It's deferred to [../../deferred/tycho-spoken-voice.md](../../deferred/tycho-spoken-voice.md), with round 1's findings.
  - Round 1's code (the engine, the mic, the dev routes for speech and transcription, the `Tycho.tsx` hooks) is kept in [../prototypes/voice-verdict/round-1/](../prototypes/voice-verdict/round-1/). The site drops the mic, the routes and the neural, browser and babble takes.
- 2026-10-04 — Round 2 built, waiting on Janriz: robot voices in place of the babble, on `localhost:3000`. The take switcher flips *Tycho's voice*, *How much he says* and *Suit radio*.
  - **chirp** (default; WALL-E and R2-D2's family): FM chirps, one or two a word.
    - Each chirp bends, sweeps, dips or trills. The modulator stays at a fixed frequency while the pitch moves, so a sweep goes slightly metallic.
    - It's performed, not random: pitch falls across a sentence, the last chirp sweeps up on a question and down at a full stop, and the same word always makes the same chirp.
  - **beep:** calm sine tones on a D major pentatonic scale, one a word, wandering down across a sentence, with a two-note cadence at its end. The most musical take, closest to an instrument readout.
  - **whirr:** lower, buzzier chirps with his body in them. A servo whirs as each sentence starts (a resonant whine and a motor hum), and small relay clicks fall between some words. The closest to WALL-E, whose voice comes with the sound of his machinery.
  - **How much he says:** *every* word, or only an *opening* phrase on each sentence's first three words, ending as the sentence does, then quiet while the rest appears.
  - **Suit radio**, as in round 1: the comm band and the Quindar tones, or clean in a small room.
  - **Built from:** FM sines, shaped noise and one triangle hum, with no square or saw waves and no 8-bit arpeggios. That keeps it away from the chiptune that sank the score's stand-in, but **it's still code-made synthesis, not a finished sound**.
  - **Levels:** within about 2 dB of each other, peaks at −7.5 to −11.6 dBFS (headless meter on the speaker bus). Nothing clips.
  - **Ideas taken from the case studies:**
    - Trionn: opt-in, code-made sound with character;
    - Hashgraph: one timeline drives picture, copy and sound, so the sounds are scheduled from the reveal and his talk beats land on the same words;
    - US Avionix: a radio that marks each transmission;
    - Edolus: a layer that plays only while he talks;
    - Izanami and Produx: calm and one motif, which is why *opening* exists.
  - ➡️ **I'd pick chirp, opening phrases, through the radio.**
    - Why chirp: it has the most character per sound, and its intonation reads as a question or an answer without words, which is what makes WALL-E and R2 feel alive.
    - Why opening phrases: a chirp on every word runs 6–10 s on a long reply, which wears on a third or fourth question. A phrase per sentence still says "he's talking" and leaves room for the score.
    - What tips it against beep: it's pleasant but reads as an interface, not a character.
    - Against whirr: it's the most WALL-E, but the servo and clicks get busy every sentence. Its servo could instead mark his emotes (turning to you, pointing) rather than his speech.
  - **For Janriz:** which voice, every word or opening phrases, radio or clean? If none is right yet, which way to push: higher and cuter, lower and mechanical, more musical? Or should a finished sound come from somewhere other than code (a designed sample bank, as *Score the voyage* weighs for the score)?
- 2026-10-04 — Janriz on round 2: "Go with your pick." Chirp, opening phrases, through the radio.

## Answer

**Tycho chirps over his suit radio as each sentence opens, and nobody talks out loud** (ADR 0010, `docs/adr/0010-tycho-chirps-over-the-radio.md`).

- **Voice in:** none. No mic (Janriz: "I agree with no mic").
- **Voice out:** wordless robot chirps in the family of WALL-E and R2-D2, not words.
  - One or two FM chirps a word, bending, sweeping, dipping or trilling.
  - Performed, not random: pitch falls across a sentence, a phrase ends rising for a question and falling otherwise, and the same word always makes the same chirp.
  - Only the first three words of each sentence; he's quiet while the rest appears.
  - Through his suit radio: a comm band, and Apollo's Quindar tones opening and closing each reply.
  - Scheduled from the reveal itself, so sound and text keep exact time. A tap that shows the rest, or closing mid-reply, silences the rest of the reply.
- **The default:** he follows the one sound toggle (ADR 0006), with no voice switch of his own. The wake-up's click turns him on, and a remembered mute keeps him silent.
- **Captions:** the text is the caption. Screen readers hear each finished sentence (ADR 0007), and the chirps stay on for them because they carry no words.
- **A paid route doesn't earn its case yet.** OpenAI's voice was "definitely better", but Janriz held it off. It's deferred to [../../deferred/tycho-spoken-voice.md](../../deferred/tycho-spoken-voice.md) with round 1's findings: the cost, a 1.5–2.1 s first byte, the disclosure, and the backend routes it needs. The chat backend's line is not redrawn.
- **The sound is a skeleton:** its shape, pacing and radio are settled; its timbre and level are *Finalize the score*'s.
- **iPhone:** not heard. Janriz has no iPhone, so the chirps through the Silent switch go to the QA plan's iPhone pass. With no mic and no `speechSynthesis`, the other iPhone questions are moot.
- **Reference build:** `components/bubble/voice/engine.ts`, hooked into `components/bubble/Tycho.tsx`. Both rounds are kept in [../prototypes/voice-verdict/](../prototypes/voice-verdict/):
  - round 1: the babble, the neural and browser voices, the mic and its dev routes;
  - round 2: chirp, beep and whirr.
