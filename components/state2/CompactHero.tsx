"use client";

import { Eyebrow } from "@/components/ui/Eyebrow";
import { profile } from "@/lib/content/profile";
import { useTypewriter } from "@/lib/gsap/use-typewriter";

export function CompactHero() {
  const word = useTypewriter(profile.headlineTypewriter);
  return (
    <div className="grid grid-cols-1 items-end gap-8 border-b border-ink-line pb-10 pt-16 md:grid-cols-[1fr_auto]">
      <div>
        <Eyebrow num="/00">landing</Eyebrow>
        <h1 className="text-display m-0 text-[clamp(3rem,7vw,5.5rem)] font-medium leading-[0.95] text-ink-fg">
          <span data-typewriter>{word}</span>
          <span
            aria-hidden
            className="inline-block h-[0.85em] w-[0.08em] mx-[0.05em] -translate-y-[0.06em] bg-saffron-500 shadow-[0_0_6px_rgba(232,183,90,0.5)] animate-blink"
          />
          {" "}
          <span className="text-italic-accent leading-[0.95]">
            {profile.headlineSuffix}
          </span>
        </h1>
      </div>
      <p className="m-0 max-w-[26rem] text-base leading-normal text-ink-fg-muted md:text-right">
        Building production systems across full-stack and AI. Based in{" "}
        <span className="text-italic-accent text-ink-fg">Cebu</span>, working remotely.
      </p>
    </div>
  );
}
