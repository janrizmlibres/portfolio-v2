import { NextRequest } from "next/server";
import * as ai from "ai";
import { stepCountIs, convertToModelMessages } from "ai";
import type { UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { Client } from "langsmith";
import { wrapAISDK, createLangSmithProviderOptions } from "langsmith/experimental/vercel";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { PAGE_CONTEXT_BLOCK } from "@/lib/ai/page-context";
import { tools } from "@/lib/ai/tools";
import { checkRateLimit } from "@/lib/limits/rate-limit";
import { hasBudget, recordUsage } from "@/lib/limits/cost-cap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// LangSmith client + wrapped AI SDK. When LANGSMITH_TRACING is unset/false the
// client no-ops, so wrapping is safe in every environment.
const lsClient = new Client();
const { streamText } = wrapAISDK(ai, { client: lsClient });

const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL ?? "gpt-4o";

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
    messages?: UIMessage[];
    threadId?: string;
    viewContext?: { sectionId?: string; domId?: string; label?: string };
  };
  const messages = await convertToModelMessages(body.messages ?? []);
  const threadId = typeof body.threadId === "string" && body.threadId ? body.threadId : undefined;

  const vc = body.viewContext;
  const viewLine =
    vc && typeof vc.sectionId === "string" && typeof vc.domId === "string" && typeof vc.label === "string"
      ? `\n\n# Visitor view\nThe visitor is currently viewing the "${vc.label}" section (#${vc.domId}, slug: ${vc.sectionId}). When they say "this", "here", "above", "this section", or ask "what is this", assume they mean that section unless context clearly says otherwise. Reference its content from the display block above; only call \`search_wiki\` for depth beyond what's on the page.`
      : "";
  const system = `${SYSTEM_PROMPT}\n\n${PAGE_CONTEXT_BLOCK}${viewLine}`;

  // session_id is the LangSmith convention for grouping runs into a thread in
  // the Threads tab. thread_id mirrors it for downstream consumers.
  const langsmith = createLangSmithProviderOptions({
    name: "portfolio-chat",
    metadata: threadId ? { session_id: threadId, thread_id: threadId } : {},
    tags: ["portfolio", "chat"],
  });

  const result = streamText({
    model: openai(CHAT_MODEL),
    system,
    messages,
    tools,
    stopWhen: stepCountIs(4),
    providerOptions: { langsmith },
    onFinish: async ({ totalUsage }) => {
      await recordUsage({
        totalTokens: totalUsage.totalTokens ?? 0,
        promptTokens: totalUsage.inputTokens ?? undefined,
        completionTokens: totalUsage.outputTokens ?? undefined,
        model: CHAT_MODEL,
      });
    },
  });

  return result.toUIMessageStreamResponse();
}
