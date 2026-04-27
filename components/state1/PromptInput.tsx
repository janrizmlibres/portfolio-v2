"use client";

import { forwardRef } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const PromptInput = forwardRef<HTMLInputElement, Props>(function PromptInput(
  { value, onChange, onSubmit, placeholder = "Ask anything…", disabled },
  ref
) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink-line bg-ink-surface-1 px-5 py-3.5 transition-[border-color,box-shadow] duration-200 focus-within:border-saffron-500 focus-within:shadow-[0_0_0_3px_rgba(232,183,90,0.12)]">
      <span className="font-mono text-base leading-none text-saffron-500">→</span>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && value.trim()) onSubmit(); }}
        placeholder={placeholder}
        aria-label="Ask the agent anything"
        disabled={disabled}
        className="flex-1 bg-transparent text-base text-ink-fg outline-none placeholder:italic placeholder:text-ink-fg-dim"
        style={{ fontFeatureSettings: '"ss01"' }}
      />
      <button
        type="button"
        onClick={() => value.trim() && onSubmit()}
        disabled={!value.trim() || disabled}
        aria-label="Send message"
        className="grid h-9 w-9 place-items-center rounded-full bg-saffron-500 font-mono text-base text-[#1a1408] transition-[background,transform] duration-200 hover:bg-saffron-300 hover:translate-x-[2px] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-x-0"
      >
        ↗
      </button>
    </div>
  );
});
