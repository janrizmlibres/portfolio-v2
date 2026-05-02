import Image from "next/image";
import { SectionHead } from "@/components/ui/SectionHead";
import { personalProjects } from "@/lib/content/personal-projects";

export function PersonalProjectsSection() {
  return (
    <section id="sec-projects" className="border-b border-ink-line py-16">
      <SectionHead
        num="/03"
        eyebrow="projects"
        title="Personal *projects*"
        lede="Public projects — code, demos, and screenshots all open. The *tangible* complement to NDA-blocked work."
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
        {personalProjects.map((p) => (
          <article
            key={p.slug}
            id={`project-${p.slug}`}
            data-project-slug={p.slug}
            className="scroll-mt-6 rounded-2xl border border-ink-line bg-ink-surface-1 p-6 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-ink-fg-dim"
          >
            <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-xl bg-gradient-to-br from-ink-surface-2 to-ink-line">
              <Image
                src={p.images[0]!}
                alt={`${p.title} screenshot`}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover"
              />
            </div>
            <h3 className="text-display mb-2 text-xl font-medium text-ink-fg">{p.title}</h3>
            <div className="mb-3.5 font-mono text-xs text-ink-fg-dim">{p.stack}</div>
            <p className="mb-4 text-[15px] leading-snug text-ink-fg-muted">{p.description}</p>
            <div className="flex gap-4 font-mono text-[13px]">
              <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="border-b border-transparent text-saffron-500 transition-[border-color] duration-200 hover:border-saffron-500">repo →</a>
              <a href={p.demoUrl} target="_blank" rel="noopener noreferrer" className="border-b border-transparent text-saffron-500 transition-[border-color] duration-200 hover:border-saffron-500">demo →</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
