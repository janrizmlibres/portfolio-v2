"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import Image from "next/image";
import { profile } from "@/lib/content/profile";
import { useTypewriter } from "@/lib/gsap/use-typewriter";
import { useChatStore } from "@/components/chat/ChatStateProvider";
import { useChatState } from "@/lib/chat/hook";
import { PromptInput } from "./PromptInput";
import { ChipRow } from "./ChipRow";

export interface StateOneLandingHandle {
  /** Animate the chip's text into the input then trigger submit. */
  dispatchChip: (text: string) => Promise<void>;
}

interface Props {
  onSubmit: (text: string) => void;
}

export const StateOneLanding = forwardRef<StateOneLandingHandle, Props>(function StateOneLanding(
  { onSubmit },
  ref
) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState("");
  // Pause when State 2 is active so only the visible hero ticks a timeline.
  const { state } = useChatState(useChatStore());
  const word = useTypewriter(profile.headlineTypewriter, { paused: state.activated });

  useImperativeHandle(ref, () => ({
    async dispatchChip(text: string) {
      inputRef.current?.focus();
      setValue("");
      for (let i = 0; i < text.length; i++) {
        setValue(text.slice(0, i + 1));
        await new Promise((r) => setTimeout(r, 18));
      }
      await new Promise((r) => setTimeout(r, 150));
      onSubmit(text);
    },
  }));

  return (
    <section
      id="state-1"
      aria-label="State 1 landing"
      className="relative z-[2] grid min-h-dvh grid-rows-[auto_1fr_auto] px-4 pb-8 pt-6 sm:px-8 lg:px-12"
    >
      <nav className="flex items-center justify-between font-mono text-xs tracking-[0.06em] text-ink-fg-dim">
        <div className="font-medium text-ink-fg">
          <span className="mr-1.5 text-saffron-500">●</span>jrz·dev
        </div>
        <div className="inline-flex items-center gap-1.5 text-ink-fg-muted">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-phosphor-500 shadow-[0_0_10px_var(--color-phosphor-500)] animate-pulse-soft"
          />
          agent · live
        </div>
      </nav>

      <div className="grid place-items-center text-center">
        <div>
          <div className="mx-auto mb-5 h-[88px] w-[88px] overflow-hidden rounded-full border border-ink-line shadow-[0_0_0_4px_rgba(232,183,90,0.06),0_0_30px_rgba(232,183,90,0.10)] transition-[transform,box-shadow] duration-300 hover:scale-[1.04] hover:shadow-[0_0_0_4px_rgba(232,183,90,0.12),0_0_40px_rgba(232,183,90,0.18)]">
            <Image
              src={profile.portraitSrc}
              alt={profile.portraitAlt}
              width={176}
              height={176}
              priority
              className="h-full w-full object-cover [filter:contrast(1.02)_saturate(0.92)]"
            />
          </div>

          <p className="text-display mb-2 text-[clamp(2rem,4.5vw,3.5rem)] font-medium text-ink-fg-muted">
            Hi, I&apos;m <span className="text-ink-fg">{profile.greetingName}.</span>
          </p>

          <h1 className="text-display mx-auto mb-6 mt-2 text-[clamp(4.5rem,10vw,8rem)] font-medium leading-[0.95] text-ink-fg">
            <span className="block">
              <span data-typewriter>{word}</span>
              <span
                aria-hidden
                className="inline-block h-[0.85em] w-[0.08em] mx-[0.05em] -translate-y-[0.06em] bg-saffron-500 shadow-[0_0_6px_rgba(232,183,90,0.5)] animate-blink"
              />
            </span>
            <span className="block text-italic-accent">
              {profile.headlineSuffix}
            </span>
          </h1>

          <p className="mx-auto mb-11 max-w-[38rem] text-[1.0625rem] leading-relaxed text-ink-fg-muted">
            I build production systems — full-stack platforms, AI agents, and RAG pipelines. Instead of scrolling, just{" "}
            <span className="text-italic-accent text-ink-fg">ask</span> — the chat has read everything I&apos;ve written.
          </p>

          <div className="mx-auto w-full max-w-[640px]">
            <PromptInput
              ref={inputRef}
              value={value}
              onChange={setValue}
              onSubmit={() => onSubmit(value.trim())}
            />
            <ChipRow
              onPick={async (text) => {
                inputRef.current?.focus();
                setValue("");
                for (let i = 0; i < text.length; i++) {
                  setValue(text.slice(0, i + 1));
                  await new Promise((r) => setTimeout(r, 18));
                }
                await new Promise((r) => setTimeout(r, 150));
                onSubmit(text);
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between font-mono text-[11px] tracking-[0.06em] uppercase text-ink-fg-fade">
        <div>jrz·dev / 2026</div>
        <div className="flex gap-4">
          <span>{profile.cityShort.toLowerCase()}</span>
          <span>open to ai eng roles</span>
        </div>
      </div>
    </section>
  );
});
