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
  const cancelledRef = useRef(false);
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
    cancelledRef.current = false;

    if (typeof window !== "undefined") {
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        setText(wordsRef.current[0] ?? "");
        return;
      }
    }

    if (paused) return;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        setTimeout(() => {
          if (!cancelledRef.current) resolve();
        }, ms);
      });

    setText(wordsRef.current[idxRef.current] ?? "");

    (async () => {
      while (!cancelledRef.current) {
        await sleep(holdMsRef.current);
        const current = wordsRef.current[idxRef.current] ?? "";
        for (let i = current.length - 1; i >= 0; i--) {
          await sleep(eraseMsRef.current);
          if (cancelledRef.current) return;
          setText(current.slice(0, i));
        }
        await sleep(gapMsRef.current);
        idxRef.current = (idxRef.current + 1) % wordsRef.current.length;
        const next = wordsRef.current[idxRef.current] ?? "";
        for (let i = 1; i <= next.length; i++) {
          await sleep(typeMsRef.current);
          if (cancelledRef.current) return;
          setText(next.slice(0, i));
        }
      }
    })();

    return () => {
      cancelledRef.current = true;
    };
  }, [paused]);

  return text;
}
