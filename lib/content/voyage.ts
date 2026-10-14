/**
 * The voyage's words: every block of text the film writes in, hand-authored display content. Facts are from the
 * resume and the crawler's own architecture diagram; the breakthroughs are a verified shortlist of AI releases since
 * August 2023. Every sentence still waits for the copy pass.
 *
 * Visitor words only: no "passage", "wiki", "chunk" or "search". NDA work stays at the level of patterns and named
 * tools (no client, no data, no screenshots), and carries the NDA line.
 *
 * `topics` and `star` are the sky's topic keys and star ids (`public/sky/stars-pca.json`): a line lights the stars
 * it's written from, its topics' or, where only some of a topic's chunks are its source, just theirs (`stars`).
 */
import { contactLinks } from "./contact";
import { personalProjects } from "./personal-projects";
import { profile } from "./profile";

export const VOYAGE_PROFILE = {
  name: profile.name,
  role: "Full-Stack / AI Engineer",
  line: "I build production systems: full-stack platforms, AI agents, and the retrieval behind them.",
};

/** His own star: home's sun, and the beacon at Contact. */
export const HIS_STAR = "s043";

export type TopicLine = { text: string; topics: string[]; stars?: string[] };

// About, two beats
export const ABOUT_1: TopicLine[] = [
  { text: "I'm Janriz, a full-stack and AI engineer in Cebu, Philippines.", topics: ["t14", "t28"] },
  { text: "Summa cum laude in Computer Science, Xavier University.", topics: ["t05", "t19"] },
  { text: "Game dev on the side.", topics: ["t30"] },
];
// (the end-to-end line lights the early career's star of his own summary of how he works, "I work end-to-end"; the
// stack line the one that names his tooling)
export const ABOUT_2: TopicLine[] = [
  { text: "At LogoLife, I built Athena, an assistant that remembers each student.", topics: ["t44", "t18"] },
  { text: "I like owning a system end to end, from the schema to the screen.", topics: ["t17"], stars: ["s015"] },
  { text: "I work in TypeScript, Next.js and NestJS. For AI, the Vercel AI SDK, LangChain and MCP.", topics: ["t17"], stars: ["s076"] },
  { text: "Open to full-stack and AI roles, remote.", topics: ["t35"] },
];
// a sentence a line: the caption keeps its line breaks
export const ABOUT_CAPTION = "Every star is one of my notes.\nThe lit ones are where these lines come from.";
/** His portrait, shown with About, and what a label beside it says. */
export const PORTRAIT = { src: "/voyage/plate.jpg", alt: "Portrait of Janriz Libres", width: 384, height: 512, name: "Janriz Libres", place: "Cebu, Philippines" };

export const WORK_INTRO = {
  title: "Work",
  lines: ["First a jump back to August 2023, where it started. Then forward through four roles to now.", "Between them, the AI breakthroughs that changed what I could build."],
};
export const ROAD_START = { title: "August 2023", line: "Home, before any of it." };

/** "YYYY-MM". The road runs from now back to its start, newest first. */
export const NOW = "2026-10";
export const START = "2023-08";

/**
 * Work builds home, a quarter of its ring a company, oldest first (lib/voyage/work.ts): after Work's intro, the relay by
 * home throws you back to August 2023, where home is only its core. Adding a company is adding its role here, newest
 * first, and its breakthroughs below: when its quarter builds and which breakthroughs come by after it follow from the
 * dates. The ring has four quarters (scripts/models/station.py), so a fifth company needs the model to change.
 */
export type Role = { id: string; company: string; role: string; from: string; to: string; span: string; shipped: string; stack: string[] };

export const ROLES: Role[] = [
  {
    id: "logolife", company: "LogoLife", role: "Full-Stack / AI Engineer", from: "2025-10", to: "2026-10", span: "Oct 2025 – Oct 2026",
    shipped: "Shipped Athena, an assistant that remembers students across sessions, and the AI Web Crawler behind it.",
    stack: ["TypeScript", "MCP", "Mem0", "GPT-5 mini", "Grok 4 Fast"],
  },
  {
    id: "tolstoy", company: "Tolstoy", role: "Full-Stack / AI Engineer", from: "2025-08", to: "2025-10", span: "Aug – Oct 2025",
    shipped: "Built the retrieval behind an AI shop assistant. One client’s sitewide conversion rose 11% within six days.",
    stack: ["TanStack", "AWS", "Vercel AI SDK", "GPT-5", "GPT-4.1"],
  },
  {
    id: "elinnov", company: "Elinnov Technologies", role: "Software Engineer Intern", from: "2024-08", to: "2024-11", span: "Aug – Nov 2024",
    shipped: "Built API endpoints for a warehouse system, and client pages that lifted traffic 10% in their first month.",
    stack: ["ASP.NET", "React"],
  },
  {
    id: "yearbook", company: "The Crusader Yearbook", role: "Software Developer", from: "2023-08", to: "2024-05", span: "Aug 2023 – May 2024",
    shipped: "Kept the yearbook’s Laravel site running, and wrote the OCR and mailing tools behind its photo sessions.",
    stack: ["Laravel", "WordPress", "Python"],
  },
];

export type Breakthrough = { id: string; date: string; label: string; name: string; why: string; built?: boolean };

/** One a quarter, newest first; each comes by home as a craft after the company it came out during (lib/voyage/work.ts). `built`: he shipped with it, and its craft docks. */
export const BREAKTHROUGHS: Breakthrough[] = [
  { id: "claude-5-5", date: "2026-09", label: "Sept 2026", name: "Claude Opus 5.5 and Sonnet 5.5", why: "The newest frontier models, six days apart." },
  { id: "fable-5", date: "2026-06", label: "June 2026", name: "Claude Fable 5", why: "The first Mythos-class model anyone could use. It felt like AGI." },
  { id: "glasswing", date: "2026-04", label: "Apr 2026", name: "Project Glasswing", why: "A gated model found zero-days in every major OS and browser." },
  { id: "opus-4-6", date: "2026-02", label: "Feb 2026", name: "Claude Opus 4.6", why: "Agent teams on one codebase, with a million tokens of context." },
  { id: "opus-4-5", date: "2025-11", label: "Nov 2025", name: "Claude Opus 4.5", why: "State of the art at real-world software engineering." },
  { id: "gpt-5", date: "2025-08", label: "Aug 2025", name: "GPT-5", built: true, why: "A new flagship generation. I shipped with it at Tolstoy and LogoLife." },
  { id: "gpt-4-1", date: "2025-04", label: "Apr 2025", name: "GPT-4.1", built: true, why: "A million tokens of context, and better at following instructions." },
  { id: "claude-code", date: "2025-02", label: "Feb 2025", name: "Claude 3.7 Sonnet and Claude Code", why: "The coding agent moved into the terminal." },
  { id: "mcp", date: "2024-11", label: "Nov 2024", name: "Model Context Protocol", built: true, why: "One protocol for plugging tools into any assistant. Athena runs on it." },
  { id: "o1", date: "2024-09", label: "Sept 2024", name: "OpenAI o1", why: "The first reasoning models." },
  { id: "gpt-4o", date: "2024-05", label: "May 2024", name: "GPT-4o", built: true, why: "GPT-4-class at a production price. This site’s chat runs on it." },
  { id: "claude-3", date: "2024-03", label: "Mar 2024", name: "Claude 3", why: "Anthropic’s first GPT-4-class family." },
  { id: "gpt-4-turbo", date: "2023-11", label: "Nov 2023", name: "GPT-4 Turbo", why: "A cheaper GPT-4, and an API for building assistants." },
];

export const NDA_LINE = "⊘ NDA. Patterns only, no screenshots.";

export const PROJECTS_INTRO = { title: "Projects", line: "What I built along the way." };

export const ATHENA = {
  slug: "athena", title: "Athena", sub: "An AI assistant with a memory", star: "s077",
  line: "An admissions assistant that coaches students and remembers each one across sessions.",
  stack: "React · Express · Vercel AI SDK · Mem0 · MCP",
  patterns: ["Memory that lasts across sessions", "A secure MCP server for live student data", "Nudges that bring students back"],
};

export const CRAWLER = {
  slug: "ai-web-crawler", title: "AI Web Crawler", sub: "A five-stage pipeline that finds, cleans and enriches records", star: "s040",
  line: "It searches the web, turns pages into records, and enriches them, catching duplicates twice so nothing is paid for twice.",
  outcomeTitle: "Paid for once",
  outcome: "Two dedup layers, one before enrichment and one after it, cut enrichment costs by 70%.",
};

export type Moon = { slug: string; of: "athena" | "ai-web-crawler"; title: string; sub: string };

export const MOONS: Moon[] = [
  { slug: "counselor-dashboard", of: "athena", title: "Counselor Dashboard", sub: "Every session’s context, with Athena built in" },
  { slug: "e2e-testing-suite", of: "athena", title: "E2E Testing Suite", sub: "Eight personas, every workflow" },
  { slug: "crawler-dashboard", of: "ai-web-crawler", title: "Crawler Dashboard", sub: "Every crawl’s health, live" },
  { slug: "data-maintenance-pipeline", of: "ai-web-crawler", title: "Data Maintenance Pipeline", sub: "Records that keep themselves current" },
];

export type PipelineStage = { id: string; tag: string; title: string; tool: string; line: string; hue: string };

/** The crawler's architecture, from his own diagram: start, five numbered stages, then the report. */
export const PIPELINE: PipelineStage[] = [
  { id: "init", tag: "Start", title: "Load the queries", tool: "MongoDB Atlas", line: "The crawler starts by loading its search queries from the database.", hue: "#7d97a3" },
  { id: "crawl", tag: "Search", title: "Search and crawl", tool: "Firecrawl API · search and web crawling", line: "Each query goes out to the web, and every page that comes back is crawled.", hue: "#3d9df2" },
  { id: "extract", tag: "Stage 1", title: "Extract", tool: "OpenAI GPT-5 mini · structured output", line: "Each page becomes a record that fits one schema.", hue: "#ff9a1f" },
  { id: "dedup1", tag: "Stage 2", title: "Dedup, layer 1", tool: "OpenAI text-embedding-3-large · similarity check", line: "Near-duplicates merge by embedding similarity, before anything costs more.", hue: "#b04fd0" },
  { id: "enrich", tag: "Stage 3", title: "Enrich", tool: "Grok 4 Fast · chat completion", line: "Each record is filled in with what its page left out.", hue: "#ffc531" },
  { id: "dedup2", tag: "Stage 4", title: "Dedup, layer 2", tool: "OpenAI text-embedding-3-large · similarity check", line: "A second check, for records that only match once they’re enriched.", hue: "#b04fd0" },
  { id: "save", tag: "Stage 5", title: "Save", tool: "MongoDB Atlas · document storage", line: "The clean records are stored.", hue: "#56b85a" },
  { id: "report", tag: "Report", title: "Statistics report", tool: "Found, merged, enriched, saved", line: "Every run ends with a report of what it did.", hue: "#ff6a3d" },
];

/** the report's bars, named on leader lines, and what the outcome names the cut in enrichment costs */
export const REPORT_BARS = ["Found", "Merged", "Enriched", "Saved"] as const;
export const REPORT_CUT = { text: "−70%", sub: "enrichment costs" };

export const OWN_INTRO = { title: "On my own time", line: "Three things I built for myself, wound into one ribbon." };

export type OwnProject = { slug: string; title: string; sub: string; line: string; stack: string; images: string[]; repo: string; demo: string };

const OWN_COPY: Array<Omit<OwnProject, "images" | "repo" | "demo">> = [
  { slug: "mercado", title: "Mercado", sub: "A type-safe storefront", line: "An e-commerce frontend with GraphQL, a cart, checkout and an admin dashboard.", stack: "TypeScript · TanStack · NestJS · Postgres" },
  { slug: "flowstack", title: "FlowStack", sub: "A StackOverflow clone", line: "Posting, search, comments and analytics, with NextAuth.", stack: "TypeScript · Next.js · MongoDB" },
  { slug: "pulsevr", title: "PulseVR", sub: "A landing page for a VR startup", line: "A responsive, mobile-first landing page for a fictional VR startup.", stack: "TypeScript · React · Tailwind" },
];

/** The personal work, in the ribbon's order, with its screenshots and links from the projects list. */
export const OWN_PROJECTS: OwnProject[] = OWN_COPY.map((p) => {
  const src = personalProjects.find((q) => q.slug === p.slug);
  if (!src) throw new Error(`no personal project "${p.slug}"`);
  return { ...p, images: src.images, repo: src.repoUrl, demo: src.demoUrl };
});

const link = (slug: string, label: string) => {
  const c = contactLinks.find((l) => l.slug === slug);
  if (!c) throw new Error(`no contact link "${slug}"`);
  return { label, href: c.href };
};

export const CONTACT = {
  title: "Contact",
  next: "Next, I want to build AI products people can trust with real work, on a team that ships.",
  open: "Open to full-stack and AI roles.",
  /** `{time}` is his clock, live, in his time zone */
  local: "It’s {time} in Cebu.",
  timeZone: "Asia/Manila",
  links: [link("email", "Email"), link("github", "GitHub"), link("linkedin", "LinkedIn")],
  back: { label: "Replay experience", href: "#sec-hero" },
};
