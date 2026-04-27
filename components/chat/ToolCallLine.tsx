import type { ToolCall } from "@/lib/chat/types";

export function ToolCallLine({ call }: { call: ToolCall }) {
  const argEntries = Object.entries(call.args).slice(0, 3);
  return (
    <div className="self-start py-0.5 font-mono text-xs italic tracking-[0.02em] text-phosphor-500">
      <span aria-hidden className="mr-1 opacity-70">↻ </span>
      {call.name}
      {argEntries.map(([k, v]) => (
        <span key={k}>
          <span className="ml-2 mr-1 text-ink-fg-dim">{k}:</span>
          <span className="text-phosphor-300">&quot;{String(v)}&quot;</span>
        </span>
      ))}
    </div>
  );
}
