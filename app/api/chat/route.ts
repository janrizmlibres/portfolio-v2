import { NextRequest } from "next/server";
import { streamText, stepCountIs } from "ai";
import type { ModelMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { tools } from "@/lib/ai/tools";
import { checkRateLimit } from "@/lib/limits/rate-limit";
import { hasBudget, recordUsage } from "@/lib/limits/cost-cap";

// AI SDK v6 adaptations vs v3 reference template:
//   - messages: client sends { role, content } objects. UserModelMessage.content and
//     AssistantModelMessage.content both accept plain strings, so the { role, content }
//     shape is directly assignable to ModelMessage[] — no convertToModelMessages() needed
//     (that helper takes UIMessage[] with a required `parts` field, not this shape).
//   - maxSteps replaced by stopWhen: stepCountIs(N).
//   - toDataStreamResponse() renamed to toUIMessageStreamResponse().
//   - usage fields renamed: inputTokens / outputTokens (not promptTokens / completionTokens).
//   - totalUsage on the onFinish event aggregates across all steps (preferred over per-step usage).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const rl = await checkRateLimit(ip);
  if (!rl.allowed) {
    const minutes = Math.ceil(rl.retryAfterMs / 60_000);
    return new Response(
      JSON.stringify({
        error: "rate_limited",
        message: `You've hit the rate limit. Try again in ~${minutes} min, or email me directly at libres.janriz@gmail.com.`,
        retryAfterMs: rl.retryAfterMs,
      }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": String(Math.ceil(rl.retryAfterMs / 1000)),
        },
      }
    );
  }

  const budget = await hasBudget();
  if (!budget.ok) {
    return new Response(
      JSON.stringify({
        error: "budget_exhausted",
        message:
          "The agent's on a budget right now — happy to chat directly at libres.janriz@gmail.com.",
      }),
      { status: 503, headers: { "content-type": "application/json" } }
    );
  }

  const body = (await req.json()) as {
    messages?: { role: "user" | "assistant"; content: string }[];
  };

  // { role, content } with string content is assignable to ModelMessage[]
  // (UserModelMessage and AssistantModelMessage both accept content: string).
  const messages = (body.messages ?? []) as ModelMessage[];

  const result = streamText({
    model: openai("gpt-4o"),
    system: SYSTEM_PROMPT,
    messages,
    tools,
    // v6: maxSteps replaced by stopWhen + stepCountIs helper.
    stopWhen: stepCountIs(4),
    onFinish: async ({ totalUsage }) => {
      // v6 usage fields: inputTokens / outputTokens (not promptTokens / completionTokens).
      await recordUsage({
        totalTokens: totalUsage.totalTokens ?? 0,
        promptTokens: totalUsage.inputTokens ?? undefined,
        completionTokens: totalUsage.outputTokens ?? undefined,
        model: "gpt-4o",
      });
    },
  });

  // v6: toDataStreamResponse() renamed to toUIMessageStreamResponse().
  return result.toUIMessageStreamResponse();
}
