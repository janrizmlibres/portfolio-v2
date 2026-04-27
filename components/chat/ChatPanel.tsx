"use client";

import { useChatState } from "@/lib/chat/hook";
import { useChatStore } from "./ChatStateProvider";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

interface Props {
  onSubmit: (text: string) => void;
  onClear: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  /** When true, renders without sticky-positioning (for the mobile bottom sheet). */
  flat?: boolean;
}

export function ChatPanel({ onSubmit, onClear, isStreaming, disabled, flat }: Props) {
  const store = useChatStore();
  const { state } = useChatState(store);

  return (
    <aside
      className={
        "flex flex-col overflow-hidden border border-ink-line border-l-2 border-l-phosphor-700 bg-ink-surface-2 shadow-[-8px_0_40px_rgba(94,229,217,0.05)]" +
        (flat
          ? " h-full rounded-none border-l-0 border-t-2 border-t-phosphor-700 max-md:rounded-t-2xl"
          : " sticky top-6 h-[calc(100vh-3rem)] rounded-2xl")
      }
    >
      <div className="flex items-center justify-between border-b border-ink-line px-4 py-3.5 font-mono text-xs tracking-[0.06em] text-ink-fg-dim">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-phosphor-500 shadow-[0_0_8px_var(--color-phosphor-500)] animate-pulse-soft"
          />
          <span>{isStreaming ? "agent · thinking" : "chat · agent"}</span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="bg-transparent font-mono text-[11px] uppercase tracking-[0.06em] text-ink-fg-fade transition-colors duration-200 hover:text-ink-fg"
        >
          clear
        </button>
      </div>

      <MessageList messages={state.messages} />

      <ChatInput onSubmit={onSubmit} disabled={disabled} />
    </aside>
  );
}
