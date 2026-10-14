import { contactLinks } from "@/lib/content/contact";
import { professionalProjects } from "@/lib/content/professional-projects";
import {
  ABOUT_1, ABOUT_2, ATHENA, BREAKTHROUGHS, CONTACT, CRAWLER, MOONS, NDA_LINE, OWN_INTRO, OWN_PROJECTS, PIPELINE, PROJECTS_INTRO, ROAD_START, ROLES,
  VOYAGE_PROFILE, WORK_INTRO,
} from "@/lib/content/voyage";

const strip = (s: string) => s.replace(/\*([^*]+)\*/g, "$1");
const lines = (xs: { text: string }[]) => xs.map((l) => `- ${strip(l.text)}`).join("\n");
const moonsOf = (of: "athena" | "ai-web-crawler") =>
  MOONS.filter((m) => m.of === of).map((m) => `  - [${m.slug}] ${m.title}: ${m.sub}`).join("\n");

const roles = [...ROLES].reverse().map((r) => `- [${r.id}] ${r.company}: ${r.role}, ${r.span}. ${r.shipped} Stack: ${r.stack.join(", ")}.`).join("\n");
const marks = [...BREAKTHROUGHS].reverse().map((b) => `- ${b.label}, ${b.name}${b.built ? " (he built with it)" : ""}: ${b.why}`).join("\n");
const stages = PIPELINE.map((s) => `  - ${s.tag}, ${s.title} (${s.tool}): ${s.line}`).join("\n");
const own = OWN_PROJECTS.map((p) => `- [${p.slug}] ${p.title}, ${p.sub}: ${p.line} Stack: ${p.stack}. Demo: ${p.demo} · Code: ${p.repo}`).join("\n");
const links = contactLinks.map((c) => `- ${c.label}: ${c.value} (${c.href})`).join("\n");
// what the page doesn't show about the work projects, for depth: still NDA, at the level of patterns
const workDepth = professionalProjects
  .map((p) => `- ${p.title}: ${p.description}\n${p.bullets.map((b) => `    • ${b}`).join("\n")}`)
  .join("\n");

/**
 * What the voyage shows, section by section, in its own words (lib/content/voyage.ts, so it never drifts from the
 * page). Appended to the system prompt so the model answers "what is this" without a search, quotes what the visitor
 * can read, and knows the slugs `scroll_to` (the `##` headings) and `highlight_project` (the `[slug]`s) take.
 * The page speaks as Janriz in the first person; Tycho puts it in the third.
 */
export const PAGE_CONTEXT_BLOCK = `# What's on the page (display copy)

The page is a voyage: one long scroll through his universe, written in Janriz's own first-person voice (put it in the third person when you quote it). Use this whenever the visitor asks about something they can see ("what is this", "tell me about that"). For depth beyond it, call \`search_wiki\`. A [slug] is what \`highlight_project\` takes.

## hero
${VOYAGE_PROFILE.name}, ${VOYAGE_PROFILE.role}. ${VOYAGE_PROFILE.line}

## about (#sec-about)
Home: his ship, with his portrait.
${lines(ABOUT_1)}
Around home: the stars round it light as each line is read.
${lines(ABOUT_2)}

## work (#sec-work)
${WORK_INTRO.lines.join(" ")} A relay by home throws you back to ${ROAD_START.title}: "${ROAD_START.line}" Home is only its core then, and the companies build it like a timelapse, oldest first, a quarter of its ring each, drones and workers swarming round it, until it's the ship from About:
${roles}
Between the companies, each AI breakthrough comes by home as a craft (the ones he built with dock at the hub), its card read as it passes:
${marks}

## projects (#sec-projects)
${PROJECTS_INTRO.line} First what he built at work (${NDA_LINE}):
- [${ATHENA.slug}] ${ATHENA.title}, ${ATHENA.sub}: ${ATHENA.line} Stack: ${ATHENA.stack}. Patterns: ${ATHENA.patterns.join("; ")}. Her moons:
${moonsOf("athena")}
- [${CRAWLER.slug}] ${CRAWLER.title}, ${CRAWLER.sub}: ${CRAWLER.line} Its moons:
${moonsOf("ai-web-crawler")}
  Its pipeline, stage by stage:
${stages}
  ${CRAWLER.outcomeTitle}: ${CRAWLER.outcome}
${OWN_INTRO.title}: ${OWN_INTRO.line}
${own}

## contact (#sec-contact)
${CONTACT.next} ${CONTACT.open}
${links}

# More on his work projects (not on the page; NDA, patterns only)
${workDepth}
`;
