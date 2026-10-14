"use client";

import { memo, useMemo, useState, type RefObject } from "react";
import type { Exchange } from "@/lib/chat/log";
import { parseReply } from "@/lib/chat/reply";
import { ReplyText } from "./ReplyText";

const time = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toTimeString().slice(0, 5);
};

// one entry, parsed and drawn again only when its reply changes (the one still arriving)
const Entry = memo(function Entry({ n, at, q, a }: { n: number; at: string; q: string; a: string | null }) {
  const blocks = useMemo(() => (a ? parseReply(a) : null), [a]);
  return (
    <li className="pl-row">
      <p className="pl-meta">
        <span>{String(n).padStart(2, "0")}</span>
        <span>{time(at)}</span>
      </p>
      <p className="pl-q">{q}</p>
      {blocks ? (
        <div className="pl-a">
          <ReplyText blocks={blocks} />
        </div>
      ) : null}
    </li>
  );
});

/**
 * The log: the whole conversation as a logbook, on a sheet over the page (from the right on desktop, from the bottom
 * on phones). Each entry is numbered with its time, the question in mono capitals and the reply under it; the reply
 * still arriving shows as it lands. Clear asks in place, with no dialog of its own. Esc or Close returns to the
 * bubble.
 */
export const Log = memo(function Log({
  sheetRef,
  closeRef,
  entries,
  live,
  canClear,
  onClear,
  onClose,
}: {
  sheetRef: RefObject<HTMLElement | null>;
  closeRef: RefObject<HTMLButtonElement | null>;
  entries: Exchange[];
  /** the reply to the last question, while it arrives */
  live: string | null;
  canClear: boolean;
  onClear: () => void;
  onClose: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <aside ref={sheetRef} className="tycho-log" role="dialog" aria-modal="false" aria-labelledby="pl-title">
      <header className="pl-head">
        <span className="pl-title" id="pl-title">
          Log
        </span>
        <span className="pl-count">
          {entries.length} {entries.length === 1 ? "exchange" : "exchanges"}
        </span>
        <span className="pb-sp" />
        <button ref={closeRef} type="button" className="pl-close" onClick={() => { setConfirm(false); onClose(); }}>
          Close
        </button>
      </header>
      <ol className="pl-rows">
        {entries.map((e, k) => (
          <Entry key={k} n={k + 1} at={e.at} q={e.q} a={e.a ?? (k === entries.length - 1 ? live : null)} />
        ))}
        {!entries.length && <li className="pl-empty">Nothing yet. Ask Tycho something.</li>}
      </ol>
      <footer className="pl-foot">
        {confirm ? (
          <>
            <span>Clear the whole log?</span>
            <button type="button" onClick={() => { setConfirm(false); onClear(); }}>
              Clear
            </button>
            <button type="button" onClick={() => setConfirm(false)}>
              Keep
            </button>
          </>
        ) : (
          <button type="button" disabled={!entries.length || !canClear} onClick={() => setConfirm(true)}>
            Clear
          </button>
        )}
      </footer>
    </aside>
  );
});
