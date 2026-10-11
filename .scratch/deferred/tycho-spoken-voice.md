# Tycho's spoken voice

Status: deferred
Deferred: 2026-10-04, from *Voice verdict* in the redesign map (`.scratch/redesign/`)

## Idea

Tycho speaks his replies aloud in a neural voice while the words appear in his bubble, instead of (or as well as) his wordless robot sounds.

## Why deferred

Janriz heard OpenAI's `gpt-4o-mini-tts` in round 1 of *Voice verdict* and found it "definitely better" than the alternatives, but put it off: "let's hold off for now. We can revisit it in the future" (2026-10-04). The redesign ships with the wordless voice.

## What round 1 found

- **The build:** one request per finished sentence through a server route, played in order through Web Audio, so it can go through the suit radio and the score can duck under it. Round 1's code is in `.scratch/redesign/prototypes/voice-verdict/round-1/`: the engine, the dev routes for speech and transcription, and the hooks in `Tycho.tsx`.
- **Latency:** the first byte arrived in 1.5–2.1 s from the dev route, and one whole sentence clip took 8.5 s. With the voice keeping time, each word appears as it's said, so the bubble stays empty about 1.5–2 s longer than with the wordless voice.
- **Pace:** speech runs at about 2.5–2.9 words a second against the reveal's 4. Either the voice sets the pace, which makes the text its caption, or it falls further behind with every sentence.
- **Cost:** about $7 per 1,000 long replies (`gpt-4o-mini-tts`, ≈ $0.015 a minute, a price not on OpenAI's current pages), roughly 70% of the $10 monthly cap on top of the chat. The cap counts only GPT-4o tokens today.
- **Steering:** the route's `instructions` asked for warm and plain, "TY-koh" and "JAN-riz". Whether it says them right needs listening.
- **Facts behind it:** `.scratch/redesign/research/voice.md` (§2.2–2.3, §5).

## When it's picked up

- **The chat backend:** a speech route beside `/api/chat`, with its own rate limit, and its spend counted in the monthly cap. That redraws the redesign map's out-of-scope line.
- **Disclosure:** OpenAI's terms require telling visitors the voice is AI-generated. Tycho being openly an AI (ADR 0008) covers most of it, but there needs to be a line.
- **A vendor that takes streamed text** (ElevenLabs, Cartesia, Deepgram, Google Chirp 3 HD) would start speaking sooner than a request per sentence.
- **How it sits with the wordless voice:** whether it replaces his robot sounds or the sounds stay for his emotes.
- **Voice in** was ruled out with it (no mic, Janriz 2026-10-04). Round 1 had a hold-to-talk mic built and working, and it would come back only with a reason of its own.
