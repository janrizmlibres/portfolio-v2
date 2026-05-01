"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
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

  const expandedRef = useRef<HTMLDivElement | null>(null);
  const collapsedRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      if (flat) return;
      const expanded = expandedRef.current;
      const tab = collapsedRef.current;
      if (!expanded || !tab) return;

      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced) {
        gsap.set(expanded, { autoAlpha: collapsed ? 0 : 1 });
        gsap.set(tab, { autoAlpha: collapsed ? 1 : 0 });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });
      if (collapsed) {
        tl.to(expanded, { autoAlpha: 0, duration: 0.2 })
          .to(tab, { autoAlpha: 1, duration: 0.3 }, "-=0.1");
      } else {
        tl.to(tab, { autoAlpha: 0, duration: 0.2 })
          .to(expanded, { autoAlpha: 1, duration: 0.35 }, "-=0.1");
      }
    },
    { dependencies: [collapsed, flat] }
  );

  const expandedAside = (
    <aside
      aria-hidden={!flat && collapsed ? true : undefined}
      className={
        "flex flex-col overflow-hidden border border-ink-line border-l-2 border-l-phosphor-700 bg-ink-surface-2 shadow-[-8px_0_40px_rgba(94,229,217,0.05)]" +
        (flat
          ? " h-full rounded-none border-l-0 border-t-2 border-t-phosphor-700 max-md:rounded-t-2xl"
          : " h-full rounded-2xl")
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="bg-transparent font-mono text-[11px] uppercase tracking-[0.06em] text-ink-fg-fade transition-colors duration-200 hover:text-ink-fg"
          >
            clear
          </button>
          {onToggleCollapsed && !flat ? (
            <>
              <span aria-hidden className="h-4 w-px bg-ink-line" />
              <button
                type="button"
                onClick={onToggleCollapsed}
                aria-label="Collapse chat"
                title="Collapse chat"
                tabIndex={collapsed ? -1 : 0}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-ink-line bg-transparent font-mono text-base leading-none text-ink-fg-fade transition-colors duration-200 hover:border-phosphor-700 hover:text-ink-fg"
              >
                ›
              </button>
            </>
          ) : null}
        </div>
      </div>

      <MessageList messages={state.messages} isStreaming={isStreaming} />

      <ChatInput onSubmit={onSubmit} disabled={disabled} />
    </aside>
  );

  if (flat) return expandedAside;

  return (
    <div className="sticky top-6 h-[calc(100vh-3rem)]">
      <div className="relative h-full">
        <div ref={expandedRef} className="absolute inset-0">
          {expandedAside}
        </div>
        <div
          ref={collapsedRef}
          className="absolute inset-y-0 left-0"
          style={{ opacity: collapsed ? 1 : 0, visibility: collapsed ? "visible" : "hidden" }}
          aria-hidden={!collapsed}
        >
          <aside
            aria-label="Chat panel (collapsed)"
            className="flex h-full w-14 flex-col items-center justify-between rounded-2xl border border-ink-line border-l-2 border-l-phosphor-700 bg-ink-surface-2 py-4 shadow-[-8px_0_40px_rgba(94,229,217,0.05)]"
          >
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label="Expand chat"
              tabIndex={collapsed ? 0 : -1}
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
        </div>
      </div>
    </div>
  );
}

