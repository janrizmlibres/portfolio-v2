# Agent-written follow-up questions

Status: deferred
Deferred: 2026-10-01, from *Pick the AI entrypoint* in the redesign map (`.scratch/redesign/`)

## Idea

After each reply, Pip offers follow-up questions the agent writes for that reply. In the redesign he offers the starter questions not yet asked instead (ADR 0007).

## Why deferred

It needs a change to the chat server: the agent has to return suggestions alongside the reply. The redesign leaves the chat backend out of scope, so it ships with the starter questions (Janriz, 2026-10-01).

## When it's picked up

- **How the agent returns them:** a tool call, or structured output after the reply. Also what they add to the monthly cost cap.
- **Voice:** Pip's, under the prompt's confidentiality rules. No confidential name appears in a suggestion.
- **Where they show:** in the bubble, where the starter questions show now, up to three.
