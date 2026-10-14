/**
 * The subjects Tycho can point at (the agent's `highlight_project`): each world, moon, company and personal project on
 * the voyage, with the block it's read at and what on the stage it is (a ref the stage's view resolves to a point on
 * screen). A personal project has no ref: its screenshot is the card turned square to you at its block, so Tycho
 * points at the biggest body in frame there. Plain data, so the chat's tool and the page share one list.
 */
import type { SectionId } from "@/lib/film/block";
import { ATHENA, CRAWLER, MOONS, OWN_PROJECTS, ROLES } from "@/lib/content/voyage";

export type Subject = { slug: string; name: string; block: string; ref: string | null; sec: SectionId };

const WORLD_BLOCK: Record<"athena" | "ai-web-crawler", string> = { athena: "athena", "ai-web-crawler": "crawler" };

const SUBJECTS: Subject[] = [
  { slug: ATHENA.slug, name: ATHENA.title, block: "athena", ref: "athena", sec: "sec-projects" },
  { slug: CRAWLER.slug, name: CRAWLER.title, block: "crawler", ref: "ai-web-crawler", sec: "sec-projects" },
  ...MOONS.map((m) => ({ slug: m.slug, name: m.title, block: WORLD_BLOCK[m.of], ref: `moon:${m.slug}`, sec: "sec-projects" as const })),
  ...OWN_PROJECTS.map((p) => ({ slug: p.slug, name: p.title, block: `own-${p.slug}`, ref: null, sec: "sec-projects" as const })),
  ...ROLES.map((r) => ({ slug: r.id, name: r.company, block: `role-${r.id}`, ref: `stack:${r.id}:0`, sec: "sec-work" as const })),
];

// the work projects list (and so older conversations) calls the crawler by a shorter slug
const ALIAS: Record<string, string> = { "ai-crawler": CRAWLER.slug };

export const SUBJECT_SLUGS = SUBJECTS.map((s) => s.slug) as [string, ...string[]];

export function subjectOf(slug: string): Subject | null {
  const s = ALIAS[slug] ?? slug;
  return SUBJECTS.find((x) => x.slug === s) ?? null;
}

/** how near (screens of film time) the film must be to a block's reading spot for its subject to count as in view */
const HERE = 0.35;

/**
 * How the page gets to a subject's block from where the film is: it's there already, it glides within the section
 * it's in, or it warps to another (the route map's rules).
 */
export function wayTo(from: { t: number; sec: SectionId }, to: { spot: number; sec: SectionId }): "here" | "glide" | "warp" {
  if (Math.abs(from.t - to.spot) < HERE) return "here";
  return from.sec === to.sec ? "glide" : "warp";
}
