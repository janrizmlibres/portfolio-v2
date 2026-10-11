# Get a Jev API key

Type: task
Labels: wayfinder:task
Status: open
Blocked by: 21

## Question

HITL. *Pick the destination router* needs real Jev calls.

1. **Janriz signs up** at console.typesafe.ai. Billing is prepaid credits, and there is no free tier.
   - **Sign-ups have been paused since 2026-09-22** (TypeSafe's X posts). Whether they have reopened is unconfirmed, so check first.
   - If they are still paused, the fallback is the Vercel AI Gateway. The same `@typesafe-ai/sdk` works with only a base-URL change, using `AI_GATEWAY_API_KEY`. Jev is not on the Gateway's free tier, and two Hobby teams report 403s there.
   - If neither works, record that here. *Pick the destination router* then runs without Jev and says so.
2. **Janriz puts the key in `.env`** as `TYPESAFE_API_KEY`, or as `AI_GATEWAY_API_KEY` for the Gateway. Following the repo's `.env.example`, add the name there with an empty value.
3. **The agent verifies the key** with one cheap Choice call:
   - pin `jev-1.13.0`;
   - use a short timeout;
   - run on Node 24, since the SDK's timeout or abort can crash Node 20/22 (an open issue).

Resolved when that call returns, or when both routes to a key are confirmed closed. The answer records the route, the key's name, the credit bought and any rate limits seen.

Facts: *Jev as the destination router* ([../research/jev-router.md](../research/jev-router.md)).
