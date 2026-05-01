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
  /** When true, renders the narrow tab variant; ignored when `flat`. */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export function ChatPanel({
  onSubmit,
  onClear,
  isStreaming,
  disabled,
  flat,
  collapsed,
  onToggleCollapsed,
}: Props) {
  const store = useChatStore();
  const { state } = useChatState(store);

  if (collapsed && !flat) {
    return (
      <aside
        aria-label="Chat panel (collapsed)"
        className="sticky top-6 flex h-[calc(100vh-3rem)] w-14 flex-col items-center justify-between rounded-2xl border border-ink-line border-l-2 border-l-phosphor-700 bg-ink-surface-2 py-4 shadow-[-8px_0_40px_rgba(94,229,217,0.05)]"
      >
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label="Expand chat"
          className="flex h-9 w-9 items-center justify-center bg-transparent font-mono text-base text-phosphor-500 transition-colors duration-200 hover:text-ink-fg"
        >
          ‹
        </button>
        <div
          className="select-none [writing-mode:vertical-rl] rotate-180 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-fg-fade"
          aria-hidden
        >
          chat · agent
        </div>
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full bg-phosphor-500 shadow-[0_0_8px_var(--color-phosphor-500)] animate-pulse-soft"
        />
      </aside>
    );
  }

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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClear}
            className="bg-transparent font-mono text-[11px] uppercase tracking-[0.06em] text-ink-fg-fade transition-colors duration-200 hover:text-ink-fg"
          >
            clear
          </button>
          {onToggleCollapsed && !flat ? (
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label="Collapse chat"
              className="bg-transparent font-mono text-base leading-none text-ink-fg-fade transition-colors duration-200 hover:text-ink-fg"
            >
              ›
            </button>
          ) : null}
        </div>
      </div>

      <MessageList messages={state.messages} />

      <ChatInput onSubmit={onSubmit} disabled={disabled} />
    </aside>
  );
}
