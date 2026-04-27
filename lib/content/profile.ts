export const profile = {
  name: "Janriz Libres",
  cityShort: "Cebu, PH",
  greetingName: "Janriz",
  taglineState1:
    "I build production systems — full-stack platforms, AI agents, and RAG pipelines. Instead of scrolling, just ask — the chat has read everything I've written.",
  taglineState2:
    "Building production systems across full-stack and AI. Based in Cebu, working remotely.",
  aboutLede:
    "A Filipino full-stack & AI developer. Summa Cum Laude Bachelor of Science in Computer Science from Xavier University.",
  aboutBody: [
    "I'm Janriz. Full-stack and AI developer based in Cebu, Philippines.",
    "Most recently at LogoLife as a Full-Stack / AI Engineer — where I shipped Athena, a context-aware admissions assistant with Mem0-backed memory and a scoped MCP server, alongside production crawlers, dashboards, and load-testing harnesses.",
    "Game dev hobbyist on the side. Believer in YAGNI and shipping the boring parts first.",
  ],
  currentlyStack: [
    "Next.js",
    "Vercel AI SDK",
    "OpenAI",
    "pgvector",
    "MCP",
  ],
  currentlyOpenTo: ["AI eng roles", "remote"],
  portraitSrc: "/profile.jpg",
  portraitAlt: "Janriz Libres",
  /** Words that the State 1 / State 2 headlines cycle through. */
  headlineTypewriter: ["AI", "Full-stack"] as const,
  /** Italic accent that follows the typewriter. */
  headlineSuffix: "engineer",
  /** Italic accents inside the about body — case-sensitive substring match. */
  aboutItalicWords: ["Cebu", "LogoLife", "YAGNI"] as const,
};
