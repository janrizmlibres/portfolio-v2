import type { ReactNode } from "react";

/** Strip `*word*` italic-accent markers, leaving plain text. */
export function stripItalicMarkers(text: string): string {
  return text.replace(/\*([^*]+)\*/g, "$1");
}

/** Render a string with `*word*` markers as italic-accent spans. */
export function renderItalicMarkers(
  text: string,
  accentClass = "text-italic-accent text-ink-fg"
): ReactNode {
  return text.split(/(\*[^*]+\*)/g).map((part, i) =>
    part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
      <span key={i} className={accentClass}>
        {part.slice(1, -1)}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}
