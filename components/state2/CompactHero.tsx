"use client";

import { Eyebrow } from "@/components/ui/Eyebrow";
import { profile } from "@/lib/content/profile";
import { renderItalicMarkers } from "@/lib/content/italic";
import { useTypewriter } from "@/lib/gsap/use-typewriter";
import { useChatStore } from "@/components/chat/ChatStateProvider";
import { useChatState } from "@/lib/chat/hook";

export function CompactHero() {
  // Pause while State 1 is showing so only the visible hero ticks a timeline.
  const { state } = useChatState(useChatStore());
  const word = useTypewriter(profile.headlineTypewriter, { paused: !state.activated });
  return (
    <div className="border-b border-ink-line pb-10 pt-16">
      <Eyebrow num="/00">landing</Eyebrow>

      {/* Row 1: typewriter word — full width, unconstrained */}
      <h1 className="text-display m-0 text-[clamp(2.5rem,7vw,5.5rem)] font-medium leading-[0.95] text-ink-fg">
        <span className="block whitespace-nowrap">
          <span data-typewriter>{word}</span>
          <span
            aria-hidden
            className="inline-block h-[0.85em] w-[0.08em] mx-[0.05em] -translate-y-[0.06em] bg-saffron-500 shadow-[0_0_6px_rgba(232,183,90,0.5)] animate-blink"
          />
        </span>
      </h1>

      {/* Row 2: "engineer" + description side by side */}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between sm:gap-8">
        <p className="text-display m-0 text-[clamp(2.5rem,7vw,5.5rem)] font-medium leading-[0.95] text-italic-accent shrink-0">
          {profile.headlineSuffix}
        </p>
        <p className="m-0 max-w-[26rem] shrink text-base leading-normal text-ink-fg-muted md:text-right">
          {renderItalicMarkers(profile.taglineState2)}
        </p>
      </div>
    </div>
  );
}
