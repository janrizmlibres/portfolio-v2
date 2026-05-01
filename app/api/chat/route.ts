import { NextRequest } from "next/server";
import { streamText, stepCountIs, convertToModelMessages } from "ai";
import type { UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { tools } from "@/lib/ai/tools";
import { checkRateLimit } from "@/lib/limits/rate-limit";
import { hasBudget, recordUsage } from "@/lib/limits/cost-cap";

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

  const body = (await req.json()) as { messages?: UIMessage[] };
  const messages = await convertToModelMessages(body.messages ?? []);

  const result = streamText({
    model: openai("gpt-4o"),
    system: SYSTEM_PROMPT,
    messages,
    tools,
    stopWhen: stepCountIs(4),
    onFinish: async ({ totalUsage }) => {
      await recordUsage({
        totalTokens: totalUsage.totalTokens ?? 0,
        promptTokens: totalUsage.inputTokens ?? undefined,
        completionTokens: totalUsage.outputTokens ?? undefined,
        model: "gpt-4o",
      });
    },
  });

  return result.toUIMessageStreamResponse();
}
