import Image from "next/image";
import { SectionHead } from "@/components/ui/SectionHead";
import { profile } from "@/lib/content/profile";

function applyItalicAccents(text: string, words: readonly string[]): React.ReactNode {
  if (words.length === 0) return text;
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  const parts = text.split(re);
  return parts.map((p, i) =>
    words.includes(p) ? (
      <span key={i} className="text-italic-accent">{p}</span>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

export function AboutSection() {
  return (
    <section id="sec-about" className="border-b border-ink-line py-16">
      <SectionHead
        num="/01"
        eyebrow="about"
        title="About *me*"
        lede={profile.aboutLede.replace("Summa Cum Laude", "*Summa Cum Laude*")}
      />
      <div className="grid items-start gap-12 md:grid-cols-[1fr_280px]">
        <div className="max-w-[42rem] text-[1.0625rem] leading-[1.7] text-ink-fg [&>p+p]:mt-5">
          {profile.aboutBody.map((p, i) => (
            <p key={i}>{applyItalicAccents(p, profile.aboutItalicWords)}</p>
          ))}
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-ink-line bg-ink-surface-1 max-md:max-w-[280px] group">
          <Image
            src={profile.portraitSrc}
            alt={profile.portraitAlt}
            fill
            sizes="(min-width: 768px) 280px, 100vw"
            className="object-cover transition-[transform,filter] duration-500 [filter:contrast(1.02)_saturate(0.9)] group-hover:scale-[1.04] group-hover:[filter:contrast(1.05)_saturate(1)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-60% to-[rgba(14,13,16,0.55)]"
          />
        </div>
      </div>
    </section>
  );
}
