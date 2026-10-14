import type { UIMessage } from "ai";
import { z } from "zod";
import { viewOf, type View } from "@/lib/ai/view-context";

/** Long enough for a conversation kept over many visits; the model still reads only its last `MAX_MESSAGES`. */
export const MAX_BODY_CHARS = 1_000_000;
const MAX_MESSAGES = 20;
const MAX_TEXT = 4000;
const TOOL_PARTS = new Set(["tool-search_wiki", "tool-scroll_to", "tool-highlight_project"]);

const envelope = z.object({
  messages: z.array(z.object({ id: z.string().optional(), role: z.string(), parts: z.array(z.unknown()) })),
  threadId: z.string().max(200).optional().catch(undefined),
  viewContext: z.unknown(),
  stay: z.unknown(),
});

export type ChatRequest = { messages: UIMessage[]; threadId?: string; view: View | null; stay: boolean };

type Part = UIMessage["parts"][number];

/**
 * The parts of a posted message the model may read: text (cut to `MAX_TEXT`), step boundaries, and the assistant's
 * calls to the known tools with only their call and input. Every tool output is made again on the server
 * (`restoreToolOutputs`), so whatever output, error or provider metadata the browser sent is dropped here.
 */
function partOf(raw: unknown, role: "user" | "assistant"): Part | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  if (p.type === "text" && typeof p.text === "string") return { type: "text", text: p.text.slice(0, MAX_TEXT) };
  if (role === "user") return null;
  if (p.type === "step-start") return { type: "step-start" };
  if (typeof p.type === "string" && TOOL_PARTS.has(p.type) && typeof p.toolCallId === "string")
    return { type: p.type, toolCallId: p.toolCallId, state: "output-available", input: p.input, output: null } as Part;
  return null;
}

/** Parses a posted chat request; null when it isn't one. */
export function parseChatRequest(body: string): ChatRequest | null {
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return null;
  }
  const r = envelope.safeParse(json);
  if (!r.success) return null;

  const messages: UIMessage[] = [];
  for (const m of r.data.messages) {
    if (m.role !== "user" && m.role !== "assistant") continue;
    const role = m.role;
    const parts = m.parts.flatMap((p) => partOf(p, role) ?? []);
    if (parts.some((p) => p.type !== "step-start")) messages.push({ id: m.id ?? "", role, parts });
  }
  return {
    messages: messages.slice(-MAX_MESSAGES),
    threadId: r.data.threadId || undefined,
    view: viewOf(r.data.viewContext),
    stay: r.data.stay === true,
  };
}
