import { profile } from "@/lib/content/profile";
import { workTimeline, workTotalLabel } from "@/lib/content/work-timeline";
import { professionalProjects } from "@/lib/content/professional-projects";
import { personalProjects } from "@/lib/content/personal-projects";
import { contactLinks } from "@/lib/content/contact";

function stripItalicMarkers(s: string): string {
  return s.replace(/\*([^*]+)\*/g, "$1");
}

const aboutBody = profile.aboutBody.map(stripItalicMarkers).join("\n");

const timelineBlock = workTimeline
  .map((e) => `- ${e.years} (${e.durationLabel}) · ${e.company} — ${e.role} · ${e.techLabel}`)
  .join("\n");

const professionalBlock = professionalProjects
  .map((p) => {
    const bullets = p.bullets.map((b) => `    • ${b}`).join("\n");
    return `- ${p.slug} · ${p.title}\n    Stack: ${p.stack}\n    ${p.description}\n${bullets}`;
  })
  .join("\n");

const personalBlock = personalProjects
  .map(
    (p) =>
      `- ${p.slug} · ${p.title}\n    Stack: ${p.stack}\n    ${p.description}\n    repo: ${p.repoUrl}\n    demo: ${p.demoUrl}`
  )
  .join("\n");

const contactBlock = contactLinks
  .map((c) => `- ${c.label}: ${c.value} (${c.href})`)
  .join("\n");

/**
 * Static block describing exactly what's rendered on the portfolio page,
 * grouped by section anchor. Appended to the system prompt so the model can
 * answer "what is this section" / "tell me about this" without retrieval —
 * and so quoted text matches the visible copy.
 *
 * Slug ↔ anchor mapping (matches scroll_to and useActiveSection):
 *   about       → #sec-about
 *   experience  → #sec-work               (work timeline at top of Work section)
 *   work        → #sec-selected-projects  (selected professional projects subhead)
 *   projects    → #sec-projects
 *   contact     → #sec-contact
 */
export const PAGE_CONTEXT_BLOCK = `# What's on the page (display copy)

Use this whenever the visitor asks about something they can see — "what is this section", "what does this say", "tell me about that", "expand on this". Reference it directly. For deeper background not on the page, call \`search_wiki\`.

## about (#sec-about) — About
${profile.aboutLede}

${aboutBody}

Currently working with: ${profile.currentlyStack.join(", ")}.
Open to: ${profile.currentlyOpenTo.join(", ")}.

## experience (#sec-work) — Work timeline
${workTotalLabel}.
${timelineBlock}

## work (#sec-selected-projects) — Selected professional projects
NDA — implementation-pattern level only. No proprietary specifics.
${professionalBlock}

## projects (#sec-projects) — Personal projects (public)
${personalBlock}

## contact (#sec-contact) — Contact
${contactBlock}
`;
