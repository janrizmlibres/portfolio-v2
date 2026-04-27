import { cn } from "@/lib/utils/cn";

interface EyebrowProps {
  num: string;
  children: React.ReactNode;
  className?: string;
}

export function Eyebrow({ num, children, className }: EyebrowProps) {
  return (
    <p
      className={cn(
        "mb-5 flex items-baseline gap-3 font-mono text-xs tracking-[0.06em] text-ink-fg-dim lowercase",
        className
      )}
    >
      <span className="text-saffron-500">{num}</span>
      <span>{children}</span>
      <span aria-hidden className="ml-2 inline-block h-px w-14 self-center bg-ink-line" />
    </p>
  );
}
