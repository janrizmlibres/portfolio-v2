import { NextRequest } from "next/server";
import * as ai from "ai";
import { stepCountIs, convertToModelMessages, createUIMessageStreamResponse } from "ai";
import { openai } from "@ai-sdk/openai";
import { Client } from "langsmith";
import { wrapAISDK, createLangSmithProviderOptions } from "langsmith/experimental/vercel";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { PAGE_CONTEXT_BLOCK } from "@/lib/ai/page-context";
import { tools } from "@/lib/ai/tools";
import { restoreToolOutputs, withholdRetrievalOutputs } from "@/lib/ai/withheld-retrieval";
import { MAX_BODY_CHARS, parseChatRequest } from "@/lib/ai/chat-request";
import { checkRateLimit } from "@/lib/limits/rate-limit";
import { hasBudget, recordUsage } from "@/lib/limits/cost-cap";
import { monthlyLimitLine, rateLimitLine } from "@/lib/chat/lines";

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

const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export async function POST(req: NextRequest) {
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_CHARS) return json(413, { error: "too_large" });
  const raw = await req.text();
  if (raw.length > MAX_BODY_CHARS) return json(413, { error: "too_large" });
  const body = parseChatRequest(raw);
  if (!body) return json(400, { error: "bad_request" });

  const ip = getClientIp(req);
  const rl = await checkRateLimit(ip);
  if (!rl.allowed) {
    const minutes = Math.ceil(rl.retryAfterMs / 60_000);
    return new Response(
      JSON.stringify({
        error: "rate_limited",
        message: rateLimitLine(minutes),
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
  if (!budget.ok) return json(503, { error: "budget_exhausted", message: monthlyLimitLine() });

  const messages = await convertToModelMessages(await restoreToolOutputs(body.messages));
  const { threadId, view } = body;

  const viewLine = view
    ? `\n\n# Visitor view\nThe visitor is reading ${view.label} (section slug: ${view.sectionId}, #${view.domId}). When they say "this", "here", "above", "this section", or ask "what is this", assume they mean that unless context clearly says otherwise. Reference it from the display block above; only call \`search_wiki\` for depth beyond what's on the page. They are already there: don't move the page to it.`
    : "";
  // asked from a star: the stars lighting up are the show, so the page stays where it is
  const stayLine = body.stay
    ? `\n\n# Asked from a star\nThe visitor asked by clicking a star in the sky. Don't move the page: no \`scroll_to\`, no \`highlight_project\`. The stars lighting up as you read are the answer's show. Just answer, and don't offer to take them anywhere.`
    : "";
  const system = `${SYSTEM_PROMPT}\n\n${PAGE_CONTEXT_BLOCK}${viewLine}${stayLine}`;

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

  // run to the end even if the visitor leaves, so onFinish records what the turn cost
  void result.consumeStream();

  return createUIMessageStreamResponse({ stream: withholdRetrievalOutputs(result.toUIMessageStream()) });
}
