import { Fragment } from "react";

/**
 * Splits a string by `*word*` markers and returns React fragments where the
 * starred words are rendered with the given className (an italic accent).
 *
 * Ex:  renderItalicAccents("About *me*") → [About , <span class>me</span>]
 */
export function renderItalicAccents(input: string, accentClass: string): React.ReactNode {
  const parts = input.split(/\*([^*]+)\*/g);
  return parts.map((segment, i) => {
    if (i % 2 === 1) {
      return (
        <span key={i} className={accentClass}>
          {segment}
        </span>
      );
    }
    return <Fragment key={i}>{segment}</Fragment>;
  });
}
