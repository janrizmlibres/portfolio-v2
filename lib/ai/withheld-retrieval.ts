import type { UIMessage, UIMessageChunk } from "ai";
import { starsOf } from "@/lib/ai/star-ids";
import type { z } from "zod";
import { highlightInput, scrollToInput, searchWiki, searchWikiInput } from "@/lib/ai/tools";

// Retrieved wiki chunks never reach the browser: some name employers and
// clients the system prompt keeps confidential, and devtools shows the whole
// stream. The browser keeps each `search_wiki` call with its output as null,
// and the server re-runs those searches when the conversation comes back, so
// the model still reads the earlier results.
//
// What the browser does get from a search is the stars it read (the sky lights them): a `data-stars` part holding
// star ids only, sent just before the nulled output. It's transient, so the chat never keeps it in a message.

const RETRIEVAL_TOOL = "search_wiki";

/** The part that tells the browser which stars a search read: `id` is the search call's own id. */
export type StarsChunk = { type: "data-stars"; id: string; data: { stars: string[] }; transient: true };

/**
 * Nulls every `search_wiki` output in a UI message stream, sending the stars it read ahead of it; all other chunks
 * pass unchanged.
 */
export function withholdRetrievalOutputs(
  stream: ReadableStream<UIMessageChunk>
): ReadableStream<UIMessageChunk> {
  const retrievalCalls = new Set<string>();
  return stream.pipeThrough(
    new TransformStream<UIMessageChunk, UIMessageChunk>({
      transform(chunk, controller) {
        if (
          (chunk.type === "tool-input-start" || chunk.type === "tool-input-available") &&
          chunk.toolName === RETRIEVAL_TOOL
        ) {
          retrievalCalls.add(chunk.toolCallId);
        }
        if (chunk.type === "tool-output-available" && retrievalCalls.has(chunk.toolCallId)) {
          const stars: StarsChunk = { type: "data-stars", id: chunk.toolCallId, data: { stars: starsOf(chunk.output) }, transient: true };
          controller.enqueue(stars);
          controller.enqueue({ ...chunk, output: null });
          return;
        }
        controller.enqueue(chunk);
      },
    })
  );
}

const MAX_SEARCHES = 6;

type ToolPart = { type: string; input?: unknown };
type Search = z.output<typeof searchWikiInput>;
const searchKey = (s: Search) => `${s.k} ${s.query}`;

/** What each page tool returned, made again from its input: they only ever echo it. */
const PAGE_TOOLS: Record<string, (input: unknown) => object | null> = {
  "tool-scroll_to": (input) => {
    const r = scrollToInput.safeParse(input);
    return r.success ? { ok: true, ...r.data } : null;
  },
  "tool-highlight_project": (input) => {
    const r = highlightInput.safeParse(input);
    return r.success ? { ok: true, ...r.data } : null;
  },
};

/**
 * Makes every tool output in the posted messages again on the server, as `parseChatRequest` left each tool part
 * with its input only. A `search_wiki` call is re-run, at most the last `MAX_SEARCHES` distinct searches, each once;
 * an older one, or a call whose input doesn't parse, is dropped along with its call.
 */
export async function restoreToolOutputs(messages: UIMessage[]): Promise<UIMessage[]> {
  const searches = new Map<string, Promise<unknown>>();
  for (const message of messages.toReversed()) {
    for (const part of message.parts.toReversed()) {
      const p = part as ToolPart;
      if (p.type !== `tool-${RETRIEVAL_TOOL}`) continue;
      const input = searchWikiInput.safeParse(p.input);
      if (!input.success || searches.size >= MAX_SEARCHES) continue;
      const key = searchKey(input.data);
      if (!searches.has(key)) searches.set(key, searchWiki(input.data));
    }
  }

  return Promise.all(
    messages.map(async (message) => {
      if (message.role !== "assistant") return message;
      const parts = await Promise.all(
        message.parts.map(async (part) => {
          const p = part as ToolPart;
          if (p.type === `tool-${RETRIEVAL_TOOL}`) {
            const input = searchWikiInput.safeParse(p.input);
            const search = input.success ? searches.get(searchKey(input.data)) : undefined;
            return search ? ({ ...part, output: await search } as typeof part) : null;
          }
          const page = PAGE_TOOLS[p.type];
          if (!page) return part;
          const output = page(p.input);
          return output ? ({ ...part, output } as typeof part) : null;
        })
      );
      return { ...message, parts: parts.filter((p) => p !== null) };
    })
  );
}
