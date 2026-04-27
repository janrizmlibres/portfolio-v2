"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/chat/types";
import { ToolCallLine } from "./ToolCallLine";

function MessageBubble({ msg }: { msg: ChatMessage }) {
  if (msg.role === "user") {
    return (
      <div className="max-w-[92%] self-end rounded-xl bg-ink-fg px-3.5 py-2.5 text-[15px] font-medium leading-snug text-ink-bg">
        {msg.content}
      </div>
    );
  }
  // assistant
  return (
    <div className="max-w-[92%] self-start py-2 text-[15px] leading-snug text-ink-fg [&_em]:text-italic-accent [&_a]:text-saffron-500 [&_a]:border-b [&_a]:border-saffron-700 [&_a]:transition-colors [&_a:hover]:border-saffron-500">
      {msg.content.split(/(\*[^*]+\*)/g).map((seg, i) =>
        seg.startsWith("*") && seg.endsWith("*") ? (
          <em key={i}>{seg.slice(1, -1)}</em>
        ) : (
          <span key={i}>{seg}</span>
        )
      )}
    </div>
  );
}

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages]);

  return (
    <div ref={ref} aria-live="polite" className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {messages.map((m) => (
        <div key={m.id} className="flex flex-col gap-1.5">
          {m.toolCalls?.map((c, i) => <ToolCallLine key={i} call={c} />)}
          {m.content ? <MessageBubble msg={m} /> : null}
        </div>
      ))}
    </div>
  );
}
