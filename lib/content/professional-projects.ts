export interface ProfessionalProject {
  slug: string;
  title: string;
  stack: string;
  description: string;
  bullets: string[];
}

export const professionalProjects: ProfessionalProject[] = [
  {
    slug: "athena",
    title: "Athena — AI Chat Assistant",
    stack: "React · Express · Vercel AI SDK · Mem0 · MCP",
    description: "A context-aware AI assistant embedded in the admissions platform — proactive coach + reactive knowledge base for students.",
    bullets: [
      "Implemented Mem0 for cross-session long-term memory.",
      "Built a secure MCP server for controlled access to live student data.",
      'Designed a "Nudge" system to proactively re-engage users.',
    ],
  },
  {
    slug: "counselor-dashboard",
    title: "Counselor Dashboard",
    stack: "React · Node.js · MongoDB · OpenAI (GPT-4o) · Tailwind",
    description: "Unified dashboard streamlining pre-session workflows for counselors with embedded AI assistant.",
    bullets: [
      "Created snapshot of student metrics for instant context.",
      "LLM-powered summarization of past sessions.",
      "Embedded Athena AI directly into the workflow.",
    ],
  },
  {
    slug: "crawler-dashboard",
    title: "Crawler Dashboard",
    stack: "React · TypeScript · MongoDB · Recharts · Tailwind",
    description: "Comprehensive dashboard for managing multi-stage web crawling operations with real-time visibility.",
    bullets: [
      "Real-time pipeline KPIs, success rates, error counts.",
      "Interactive controls for crawls across data categories.",
      "Saturation monitoring to detect duplicate spikes.",
    ],
  },
  {
    slug: "ai-crawler",
    title: "AI-Assisted Crawler",
    stack: "TypeScript · Firecrawl · OpenAI · Grok · Google Places",
    description: "Configurable, multi-stage crawling pipeline for opportunities data extraction and enrichment.",
    bullets: [
      "5-stage fault-tolerant pipeline.",
      "Two-layer vector dedup — 70% cost reduction.",
      "Token-budget aware orchestration with Slack alerts.",
    ],
  },
  {
    slug: "data-maintenance-pipeline",
    title: "Data Maintenance Pipeline",
    stack: "LLMs (Grok, OpenAI) · Mapbox · Slack",
    description: "Autonomous background system validating, standardizing, and enriching dataset records.",
    bullets: [
      "AI-driven structured-output updates.",
      "Automated link validation and geocoding.",
      "Lifecycle management for obsolete records.",
    ],
  },
  {
    slug: "e2e-testing-suite",
    title: "E2E Testing Suite",
    stack: "Playwright · TypeScript · Node.js · Allure",
    description: "Comprehensive automated E2E suite ensuring platform reliability across user roles and workflows.",
    bullets: [
      "Role-based test architecture for 8 personas.",
      "Optimized auth via session reuse.",
      "Stealth mode to bypass bot detection.",
    ],
  },
];
