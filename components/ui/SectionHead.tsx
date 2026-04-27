import { Eyebrow } from "./Eyebrow";
import { renderItalicAccents } from "@/lib/utils/render-italic";

interface SectionHeadProps {
  num: string;
  eyebrow: string;
  /** Section title with one or more italic accent words wrapped in `*word*`. */
  title: string;
  /** Lede with optional italic words wrapped in `*word*`. */
  lede: string;
}

export function SectionHead({ num, eyebrow, title, lede }: SectionHeadProps) {
  return (
    <div className="mb-10 grid items-start gap-8 md:grid-cols-[1fr_2fr]">
      <div>
        <Eyebrow num={num}>{eyebrow}</Eyebrow>
        <h2 className="text-display text-[clamp(2rem,4.5vw,3.5rem)] leading-none m-0 font-medium text-ink-fg">
          {renderItalicAccents(title, "text-italic-accent")}
        </h2>
      </div>
      <p className="m-0 text-[1.0625rem] leading-relaxed text-ink-fg-muted">
        {renderItalicAccents(lede, "text-italic-accent text-ink-fg")}
      </p>
    </div>
  );
}
