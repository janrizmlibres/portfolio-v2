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
}

export function ChipRow({ onPick, chips = DEFAULT_CHIPS }: Props) {
  return (
    <div className="mt-5 flex flex-wrap justify-center gap-2">
      {chips.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onPick(c)}
          className="cursor-pointer rounded-full border border-ink-line bg-transparent px-3.5 py-2 font-mono text-[13px] leading-none text-ink-fg-muted transition-[border-color,color,background,transform] duration-200 hover:-translate-y-px hover:border-saffron-500 hover:bg-[rgba(232,183,90,0.06)] hover:text-ink-fg active:translate-y-0"
        >
          {c}
        </button>
      ))}
    </div>
  );
}
