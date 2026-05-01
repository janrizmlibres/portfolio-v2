import { SectionHead } from "@/components/ui/SectionHead";
import { contactLinks } from "@/lib/content/contact";

export function ContactSection() {
  return (
    <section id="sec-contact" className="py-16">
      <SectionHead
        num="/04"
        eyebrow="contact"
        title="Get in *touch*"
        lede={`Best ways to reach me. The chat agent can also send you a thread of context if it'd help.`}
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        {contactLinks.map((c) => (
          <a
            key={c.slug}
            href={c.href}
            target={c.href.startsWith("http") ? "_blank" : undefined}
            rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="rounded-xl border border-ink-line p-5 text-ink-fg no-underline transition-[border-color,background] duration-200 hover:border-saffron-500 hover:bg-[rgba(232,183,90,0.04)]"
          >
            <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-fg-dim">
              {c.label}
            </div>
            <div className="text-base leading-tight">{c.value}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
