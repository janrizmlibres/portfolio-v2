"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { ChatMessage } from "@/lib/chat/types";
import { ToolCallLine } from "./ToolCallLine";

// Matches *italic* or [text](url). Used to walk assistant prose in one pass.
const INLINE_PATTERN = /(\*[^*\n]+\*)|(\[([^\]]+)\]\(([^)\s]+)\))/g;

// Only allow safe URL schemes — agent shouldn't emit anything else, but guard
// against pathological output reaching the DOM as a real anchor.
function isSafeHref(url: string): boolean {
  return /^(https?:\/\/|mailto:)/i.test(url);
}

function renderInline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  for (const match of text.matchAll(INLINE_PATTERN)) {
    const start = match.index ?? 0;
    if (start > lastIndex) out.push(<span key={key++}>{text.slice(lastIndex, start)}</span>);
    if (match[1]) {
      out.push(<em key={key++}>{match[1].slice(1, -1)}</em>);
    } else if (match[2] && match[3] && match[4]) {
      const label = match[3];
      const href = match[4];
      if (isSafeHref(href)) {
        out.push(
          <a key={key++} href={href} target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        );
      } else {
        out.push(<span key={key++}>{match[0]}</span>);
      }
    }
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) out.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  return out;
}

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
      {renderInline(msg.content)}
    </div>
  );
}

function TypingBubble() {
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const dots = ref.current?.querySelectorAll<HTMLSpanElement>("[data-dot]");
      if (!dots || dots.length === 0) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set(dots, { opacity: 0.7 });
        return;
      }
      gsap.to(dots, {
        opacity: 1,
        y: -3,
        duration: 0.45,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: { each: 0.15, from: "start" },
      });
    },
    { scope: ref }
  );

  return (
    <div
      ref={ref}
      role="status"
      aria-label="Assistant is thinking"
      className="flex max-w-[92%] items-center gap-1.5 self-start py-2"
    >
      <span data-dot className="block h-1.5 w-1.5 rounded-full bg-phosphor-500 opacity-40" />
      <span data-dot className="block h-1.5 w-1.5 rounded-full bg-phosphor-500 opacity-40" />
      <span data-dot className="block h-1.5 w-1.5 rounded-full bg-phosphor-500 opacity-40" />
    </div>
  );
}

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming?: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  const last = messages[messages.length - 1];
  const showTyping =
    !!isStreaming &&
    (!last || last.role === "user" || (last.role === "assistant" && !last.content));

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages, showTyping]);

  return (
    <div ref={ref} aria-live="polite" className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {messages.map((m) => (
        <div key={m.id} className="flex flex-col gap-1.5">
          {m.toolCalls?.map((c, i) => <ToolCallLine key={i} call={c} />)}
          {m.content ? <MessageBubble msg={m} /> : null}
        </div>
      ))}
      {showTyping ? <TypingBubble /> : null}
    </div>
  );
}
