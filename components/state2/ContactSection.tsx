import { SectionHead } from "@/components/ui/SectionHead";
import { contactLinks } from "@/lib/content/contact";

export function ContactSection() {
  return (
    <section id="sec-contact" className="py-16">
      <SectionHead
        num="/04"
        eyebrow="contact"
        title="Get in *touch*"
        lede={`Best ways to reach me. Or just talk to the chat — it answers like I would.`}
      />
      <address className="not-italic grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        {contactLinks.map((c) => {
          const isExternal = c.href.startsWith("http");
          const rel = isExternal ? "me noopener noreferrer" : undefined;
          return (
            <a
              key={c.slug}
              href={c.href}
              target={isExternal ? "_blank" : undefined}
              rel={rel}
              className="rounded-xl border border-ink-line p-5 text-ink-fg no-underline transition-[border-color,background] duration-200 hover:border-saffron-500 hover:bg-[rgba(232,183,90,0.04)]"
            >
              <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-fg-dim">
                {c.label}
              </div>
              <div className="text-base leading-tight">{c.value}</div>
            </a>
          );
        })}
      </address>
    </section>
  );
}
