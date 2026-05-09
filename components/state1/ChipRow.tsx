"use client";

const DEFAULT_CHIPS = [
  "Show me your projects",
  "What's your stack?",
  "Tell me about Athena",
  "Are you available?",
];

interface Props {
  onPick: (prompt: string) => void;
  chips?: string[];
  /** Compact variant for the narrow chat panel — smaller padding, left-aligned, no top margin. */
  compact?: boolean;
}

export { DEFAULT_CHIPS };

export function ChipRow({ onPick, chips = DEFAULT_CHIPS, compact }: Props) {
  return (
    <div
      className={
        compact
          ? "-mx-3 flex flex-nowrap gap-1.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0"
          : "mt-5 flex flex-wrap justify-center gap-2"
      }
    >
      {chips.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onPick(c)}
          className={
            "cursor-pointer rounded-full border border-ink-line bg-transparent font-mono leading-none text-ink-fg-muted transition-[border-color,color,background,transform] duration-200 hover:-translate-y-px hover:border-saffron-500 hover:bg-[rgba(232,183,90,0.06)] hover:text-ink-fg active:translate-y-0 " +
            (compact ? "shrink-0 whitespace-nowrap px-2.5 py-1.5 text-[11px] lg:whitespace-normal" : "px-3.5 py-2 text-[13px]")
          }
        >
          {c}
        </button>
      ))}
    </div>
  );
}
