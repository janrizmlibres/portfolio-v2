"use client";

import { useEffect, useMemo, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import gsap from "gsap";
import { useChatStore } from "@/components/chat/ChatStateProvider";
import { useChatState } from "@/lib/chat/hook";
import type { AskHow } from "@/lib/chat/ask";
import { createHold } from "@/lib/chat/hold";
import { errorLine } from "@/lib/chat/lines";
import { exchangesOf } from "@/lib/chat/log";
import { createPageEffects } from "@/lib/chat/page-effects";
import { lightStars, unlightStars } from "@/lib/chat/sky";
import { isWarping } from "@/lib/film/warp";
import { emit } from "@/lib/tool-effects/event-bus";
import { useActiveSection, type ActiveSection } from "@/lib/state/use-active-section";

type Part = { type: string; text?: string };
// where the visitor is looking, as last seen; read when a question is sent
let viewing: ActiveSection | null = null;
// the question being sent was asked from a star: the page stays put, and the server tells the model so
let staying = false;
// what a reply does to the page: the stars it reads light, and its move (a warp, the point) waits for them
const pageEffects = createPageEffects({
  light: lightStars,
  unlight: unlightStars,
  go: (m) => (m.kind === "section" ? emit("scrollTo", { section: m.section }) : emit("highlightProject", { slug: m.subject })),
});
// the reply waits for the page to move: held while a move waits or a warp runs, checked once a frame
let tell: (text: string, ended: boolean) => void = () => {};
const hold = createHold({ moving: () => pageEffects.moving() || isWarping(), out: (text, ended) => tell(text, ended) });
const textOf = (m: { parts?: Part[] } | undefined) =>
  (m?.parts ?? [])
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");

/**
 * The chat behind Tycho's bubble: the AI SDK's `useChat` against `/api/chat`, with the conversation kept in the chat
 * store (the log).
 * - `send(q)` stores the question and sends it. The reply is handed to `onText` as it streams (everything so far)
 *   and once more, whole, when it ends; it's stored only then, so a reply cut off by leaving the page is dropped and
 *   its question kept.
 * - A failed request becomes Tycho's line (`errorLine`), stored and handed over like a reply. The SDK reports a
 *   failure to `onError` only when it threw an Error, so `onFinish` fails one that didn't.
 * - What the reply does to the page (`page-effects.ts`): each search's stars arrive as their own transient part
 *   (`data-stars`, star ids only) and light; `scroll_to` and `highlight_project` become the warp and the point,
 *   except for a question asked from a star (`send(q, { stay: true })`): the page stays put and the stars are the show.
 * - He answers after the page has moved: while a move waits or a warp runs, the reply is held (`hold.ts`).
 * - `clear()` empties the log and starts a new thread.
 * The store seeds the SDK on load, so a returning visitor's next question carries the conversation so far.
 */
export function useTychoChat({ onText }: { onText: (text: string, ended: boolean) => void }) {
  const store = useChatStore();
  const { state, appendMessage, clear: clearStore } = useChatState(store);
  useEffect(() => {
    tell = onText;
  });
  useEffect(() => {
    gsap.ticker.add(hold.check);
    return () => gsap.ticker.remove(hold.check);
  }, []);

  // which part of the page the visitor is looking at, for the model's view context
  const activeSection = useActiveSection(true);
  useEffect(() => {
    viewing = activeSection;
  }, [activeSection]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => {
          const a = viewing;
          return {
            threadId: store.getState().threadId,
            stay: staying || undefined,
            viewContext: a ? { sectionId: a.sectionId, domId: a.domId, label: a.label } : undefined,
          };
        },
      }),
    [store],
  );

  const failed = useRef(false);
  const fail = (error: unknown) => {
    failed.current = true;
    pageEffects.end();
    // his line: the server's own message (the SDK hands over its JSON body as the error's message), or else the
    // no-connection line
    const line = errorLine(error);
    appendMessage({ id: crypto.randomUUID(), role: "system", content: line, createdAt: new Date().toISOString() });
    hold.arrive(line, true);
  };
  const { messages, status, sendMessage, setMessages } = useChat({
    transport,
    // a render per chunk at most every 50 ms: the reveal paces the words anyway
    experimental_throttle: 50,
    onError: fail,
    onToolCall({ toolCall }) {
      const input = (toolCall as { input?: Record<string, unknown> }).input;
      const { toolName: name, toolCallId: id } = toolCall as { toolName: string; toolCallId: string };
      if (!input) return;
      if (name === "search_wiki") pageEffects.search(id);
      else if (name === "scroll_to" && typeof input.section === "string") pageEffects.move({ kind: "section", section: input.section as never });
      else if (name === "highlight_project" && typeof input.slug === "string") pageEffects.move({ kind: "point", subject: input.slug });
    },
    onData(part) {
      if (part.type !== "data-stars") return;
      const stars = (part.data as { stars?: unknown } | null)?.stars;
      pageEffects.stars(part.id ?? "", Array.isArray(stars) ? stars.filter((s): s is string => typeof s === "string") : []);
    },
    onFinish({ message, isAbort, isDisconnect, isError }) {
      pageEffects.end();
      if (isError && !failed.current) fail(undefined);
      if (isError || failed.current) return;
      // cut off: the reply is dropped, its question kept
      if (isAbort || isDisconnect) return hold.arrive("", true);
      const content = textOf(message as { parts?: Part[] });
      if (content) appendMessage({ id: message.id ?? crypto.randomUUID(), role: "assistant", content, createdAt: new Date().toISOString() });
      hold.arrive(content, true);
    },
  });

  // the reply as it streams
  const last = messages[messages.length - 1];
  const streaming = status === "streaming" && last?.role === "assistant" ? textOf(last as { parts?: Part[] }) : null;
  useEffect(() => {
    if (streaming) hold.arrive(streaming, false);
  }, [streaming]);

  // seed the SDK from the store once, so the server hears the conversation so far
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const seed = store.getState().messages.flatMap((m) =>
      (m.role === "user" || m.role === "assistant") && m.content ? [{ id: m.id, role: m.role, parts: [{ type: "text" as const, text: m.content }] }] : [],
    );
    if (seed.length) setMessages(seed);
  }, [setMessages, store]);

  const exchanges = useMemo(() => exchangesOf(state.messages), [state.messages]);

  return {
    exchanges,
    send(q: string, how?: AskHow) {
      failed.current = false;
      staying = !!how?.stay;
      pageEffects.question({ stay: staying });
      hold.drop();
      appendMessage({ id: crypto.randomUUID(), role: "user", content: q, createdAt: new Date().toISOString() });
      void sendMessage({ text: q });
    },
    clear() {
      pageEffects.question();
      hold.drop();
      clearStore();
      setMessages([]);
    },
  };
}
