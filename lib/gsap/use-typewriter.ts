import { useEffect, useRef, useState } from "react";

interface Options {
  /** Time fully-typed word stays visible. Default 2400ms. */
  holdMs?: number;
  /** Per-character erase delay. Default 60ms. */
  eraseMs?: number;
  /** Per-character type delay. Default 90ms. */
  typeMs?: number;
  /** Pause between erase-complete and type-start. Default 220ms. */
  gapMs?: number;
  /** When true, the timeline is suspended; on resume it picks up at the current word. */
  paused?: boolean;
}

/**
 * Cycles through the given words using a typewriter erase/type effect.
 * Returns the currently-displayed substring. Honors `prefers-reduced-motion`
 * by sticking on the first word.
 */
export function useTypewriter(
  words: readonly string[],
  options: Options = {}
): string {
  const { holdMs = 2400, eraseMs = 60, typeMs = 90, gapMs = 220, paused = false } = options;
  const [text, setText] = useState<string>(words[0] ?? "");

  // Keep mutable refs so the effect doesn't need to re-run when these change
  const wordsRef = useRef(words);
  const holdMsRef = useRef(holdMs);
  const eraseMsRef = useRef(eraseMs);
  const typeMsRef = useRef(typeMs);
  const gapMsRef = useRef(gapMs);
  // Persisted across pause/resume so the loop picks up at the current word.
  const idxRef = useRef(0);

  // Sync refs to latest values on every render (lint-clean, no deps)
  useEffect(() => {
    wordsRef.current = words;
    holdMsRef.current = holdMs;
    eraseMsRef.current = eraseMs;
    typeMsRef.current = typeMs;
    gapMsRef.current = gapMs;
  });

  useEffect(() => {
    // Local per-effect-run flag — a shared ref would let a previous run's
    // un-cancellation race with a new run, leaving multiple loops running.
    let cancelled = false;

    if (typeof window !== "undefined") {
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        setText(wordsRef.current[0] ?? "");
        return () => {
          cancelled = true;
        };
      }
    }

    if (paused) {
      // Reset to full word so there's no stale partial word on next unpause.
      setText(wordsRef.current[idxRef.current] ?? "");
      return () => {
        cancelled = true;
      };
    }

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    setText(wordsRef.current[idxRef.current] ?? "");

    (async () => {
      while (!cancelled) {
        await sleep(holdMsRef.current);
        if (cancelled) return;
        const current = wordsRef.current[idxRef.current] ?? "";
        for (let i = current.length - 1; i >= 0; i--) {
          await sleep(eraseMsRef.current);
          if (cancelled) return;
          setText(current.slice(0, i));
        }
        await sleep(gapMsRef.current);
        if (cancelled) return;
        idxRef.current = (idxRef.current + 1) % wordsRef.current.length;
        const next = wordsRef.current[idxRef.current] ?? "";
        for (let i = 1; i <= next.length; i++) {
          await sleep(typeMsRef.current);
          if (cancelled) return;
          setText(next.slice(0, i));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paused]);

  return text;
}
