"use client";

import { useEffect, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SectionHead } from "@/components/ui/SectionHead";
import { workTimeline, workTotalLabel } from "@/lib/content/work-timeline";
import { professionalProjects } from "@/lib/content/professional-projects";
import { on } from "@/lib/tool-effects/event-bus";

function Timeline() {
  return (
    <div className="mb-10 border-y border-ink-line font-mono text-[13px]">
      {workTimeline.map((row) => (
        <div
          key={row.company}
          className="grid grid-cols-1 items-baseline gap-1 border-b border-ink-line-soft p-4 transition-[padding,background] duration-200 last:border-b-0 hover:bg-[rgba(232,183,90,0.025)] hover:px-2.5 md:grid-cols-[88px_60px_1.4fr_1.6fr_1.4fr] md:gap-5"
        >
          <span className="tracking-[0.02em] text-saffron-500 max-md:text-[11px] max-md:uppercase max-md:tracking-[0.06em]">
            {row.years}
          </span>
          <span className="text-ink-fg-dim max-md:before:content-['·_']">{row.durationLabel}</span>
          <span className="text-base font-medium text-ink-fg" style={{ fontFamily: "var(--font-body)" }}>
            {row.company}
          </span>
          <span className="text-base text-ink-fg-muted" style={{ fontFamily: "var(--font-body)" }}>
            {row.role}
          </span>
          <span className="text-ink-fg-dim md:text-right">{row.techLabel}</span>
        </div>
      ))}
      <div className="flex items-center justify-between border-t border-ink-line p-4 text-[11px] uppercase tracking-[0.08em] text-ink-fg-fade">
        <span>total</span>
        <span className="text-ink-fg-muted normal-case tracking-normal">{workTotalLabel}</span>
      </div>
    </div>
  );
}

export function WorkSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = professionalProjects[activeIdx]!;

  useGSAP(() => {
    gsap.from("#work-detail", { opacity: 0, y: 10, duration: 0.35, ease: "power2.out" });
  }, [activeIdx]);

  // When the agent calls highlight_project with a professional slug, auto-switch
  // to that project so the detail panel reflects what's being highlighted.
  useEffect(() => {
    const off = on("highlightProject", ({ slug }) => {
      const idx = professionalProjects.findIndex((p) => p.slug === slug);
      if (idx >= 0) setActiveIdx(idx);
    });
    return () => {
      off();
    };
  }, []);

  return (
    <section id="sec-work" className="border-b border-ink-line py-16">
      <SectionHead
        num="/02"
        eyebrow="work"
        title="Professional *work*"
        lede={`Where I’ve worked, and what I shipped there. *Implementation patterns* only — proprietary specifics omitted under NDA.`}
      />

      <Timeline />

      <h3
        id="sec-selected-projects"
        className="mb-4 scroll-mt-6 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-fg-dim"
      >
        Selected projects
      </h3>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-2">
          {professionalProjects.map((p, i) => (
            <button
              key={p.slug}
              type="button"
              data-project-slug={p.slug}
              onClick={() => setActiveIdx(i)}
              className={
                "rounded-full border px-4 py-3.5 text-left text-[15px] transition-all duration-200 " +
                (i === activeIdx
                  ? "border-ink-fg bg-ink-fg text-ink-bg"
                  : "border-ink-line bg-transparent text-ink-fg-muted hover:border-ink-fg-dim hover:text-ink-fg")
              }
            >
              {p.title}
            </button>
          ))}
        </div>

        <div
          id="work-detail"
          data-project-slug={active.slug}
          className="rounded-2xl border border-ink-line bg-ink-surface-1 p-7 md:p-8"
        >
          <h3 className="text-display mb-2 text-2xl font-medium leading-tight text-ink-fg">
            {active.title}
          </h3>
          <div className="mb-5 font-mono text-[13px] text-ink-fg-muted">
            <span className="text-saffron-500">stack:</span> {active.stack}
          </div>
          <p className="mb-5 leading-relaxed text-ink-fg-muted">{active.description}</p>
          <ul className="m-0 list-none p-0">
            {active.bullets.map((b) => (
              <li key={b} className="relative mb-2.5 pl-5 leading-snug text-ink-fg">
                <span aria-hidden className="absolute left-0 top-0 text-saffron-500">›</span>
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-dashed border-ink-line pt-4 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-fg-fade">
            ⊘ NDA — screenshots &amp; specifics omitted
          </div>
        </div>
      </div>
    </section>
  );
}
