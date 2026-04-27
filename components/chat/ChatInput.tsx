"use client";

import { forwardRef, useState } from "react";

interface Props {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput = forwardRef<HTMLInputElement, Props>(function ChatInput(
  { onSubmit, disabled, placeholder = "Ask anything…" },
  ref
) {
  const [v, setV] = useState("");
  return (
    <div className="border-t border-ink-line p-3 pt-3">
      <div className="flex items-center gap-2 rounded-xl border border-ink-line bg-ink-surface-1 px-3.5 py-2.5 transition-[border-color,box-shadow] duration-200 focus-within:border-phosphor-700 focus-within:shadow-[0_0_0_2px_rgba(94,229,217,0.12)]">
        <input
          ref={ref}
          type="text"
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && v.trim() && !disabled) {
              onSubmit(v.trim());
              setV("");
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          aria-label="Ask the agent anything"
          className="flex-1 bg-transparent text-[15px] text-ink-fg outline-none placeholder:text-ink-fg-dim"
        />
        <span className="rounded border border-ink-line px-1.5 py-0.5 font-mono text-[11px] text-ink-fg-fade">
          ⏎
        </span>
      </div>
    </div>
  );
});
