"use client";

import type { RefObject } from "react";
import type { Block } from "@/lib/chat/reply";
import { ReplyText } from "./ReplyText";

/** What an empty bubble says: the first visit's greeting, or a returning visitor's welcome back. */
export type Opening = { line: string; openLog?: string };

/**
 * Tycho's bubble: a square card on a hairline, holding only the current exchange (the question, then his reply as
 * the reveal shows it), or his opening line when nothing has been asked here yet. After a reply it offers starters not
 * yet asked. The input stays typable while he answers; Send, the starters and "Open the log" wait.
 * A dialog that doesn't trap focus: Tab leaves it, and Esc closes it (`Tycho.tsx` handles the keys and the motion).
 */
export function Bubble({
  cardRef,
  inputRef,
  logRef,
  question,
  blocks,
  visible,
  opening,
  starters,
  answering,
  draft,
  canSend,
  logCount,
  onDraft,
  onAsk,
  onTap,
  onClose,
  onLog,
}: {
  cardRef: RefObject<HTMLElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  logRef: RefObject<HTMLButtonElement | null>;
  question: string | null;
  blocks: Block[];
  visible: number;
  opening: Opening;
  starters: string[];
  answering: boolean;
  draft: string;
  canSend: boolean;
  logCount: number;
  onDraft: (s: string) => void;
  onAsk: (q: string) => void;
  onTap: () => void;
  onClose: () => void;
  onLog: () => void;
}) {
  return (
    <section ref={cardRef} className="tycho-bubble" role="dialog" aria-modal="false" aria-labelledby="pb-who" tabIndex={-1}>
      <header className="pb-head">
        <span className="pb-who" id="pb-who">
          Tycho
        </span>
        <span className="pb-sp" />
        <button ref={logRef} type="button" className="pb-logb" onClick={onLog} aria-label={`Log, ${logCount} ${logCount === 1 ? "exchange" : "exchanges"}`}>
          Log · {logCount}
        </button>
        <button type="button" className="pb-x" aria-label="Close" onClick={onClose}>
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </button>
      </header>
      <div className="pb-scroll">
        {question ? (
          <>
            <p className="pb-q">
              <span className="pb-tag">You asked</span> {question}
            </p>
            {/* a tap on the text shows the rest; the keyboard has nothing to wait for, since the words are read out as they finish */}
            <div className="pb-a" onClick={onTap}>
              <ReplyText blocks={blocks} visible={visible} />
            </div>
          </>
        ) : (
          <div className="pb-a">
            <p>{opening.line}</p>
          </div>
        )}
      </div>
      <footer className="pb-foot">
        {!answering && (starters.length > 0 || (!question && opening.openLog)) && (
          <div className="pb-chips">
            {!question && opening.openLog && (
              <button type="button" className="pb-open-log" onClick={onLog}>
                {opening.openLog}
              </button>
            )}
            {starters.map((s) => (
              <button key={s} type="button" onClick={() => onAsk(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          className="pb-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSend) onAsk(draft);
          }}
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => onDraft(e.target.value)}
            placeholder="Ask Tycho about Janriz"
            aria-label="Ask Tycho"
            enterKeyHint="send"
            autoComplete="off"
          />
          <button type="submit" disabled={!canSend} aria-label={answering ? "Send (Tycho is answering)" : "Send"}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </button>
        </form>
      </footer>
    </section>
  );
}
