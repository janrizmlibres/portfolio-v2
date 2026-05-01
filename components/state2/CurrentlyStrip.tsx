import { profile } from "@/lib/content/profile";

function Row({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] items-baseline gap-4">
      <span className="whitespace-nowrap tracking-[0.04em] text-ink-fg-dim">
        {label}
        <span aria-hidden className="ml-2 text-ink-line">──</span>
      </span>
      <span>
        {items.map((item, i) => (
          <span key={item}>
            <span className="text-ink-fg">{item}</span>
            {i < items.length - 1 ? <span className="mx-[0.4em] text-ink-fg-dim">·</span> : null}
          </span>
        ))}
      </span>
    </div>
  );
}

export function CurrentlyStrip() {
  return (
    <div className="grid gap-2 pt-5 font-mono text-[13px] text-ink-fg-muted">
      <Row label="stack" items={[...profile.currentlyStack]} />
      <Row label="open to" items={[...profile.currentlyOpenTo]} />
    </div>
  );
}
