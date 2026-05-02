import { tool } from "ai";
import { z } from "zod";
import { retrieveChunks } from "@/lib/rag/retrieve";
import { personalProjects } from "@/lib/content/personal-projects";
import { professionalProjects } from "@/lib/content/professional-projects";

// Slugs for both professional (NDA work in WorkSection) and personal cards.
// Derived from the data files so the tool stays in sync with what's rendered.
const PROJECT_SLUGS = [
  ...professionalProjects.map((p) => p.slug),
  ...personalProjects.map((p) => p.slug),
] as [string, ...string[]];

// AI SDK v6: `parameters` was renamed to `inputSchema`.
// `maxSteps` was replaced by `stopWhen: stepCountIs(N)`.
export const tools = {
  search_wiki: tool({
    description:
      "Retrieve grounded chunks from Janriz's personal wiki via vector similarity. Call this BEFORE making factual claims about projects, work, or background. If the first results are weak or off-topic, retry once or twice with a reformulated query (broader phrasing, related concepts) before telling the visitor you don't know.",
    inputSchema: z.object({
      query: z.string().describe("Natural-language query to embed and search. Reformulate broadly on retry."),
      k: z.number().int().min(1).max(12).optional().default(6),
    }),
    execute: async ({ query, k }) => {
      const rows = await retrieveChunks({ query, k });
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        text: r.text,
        similarity: r.similarity,
        portfolioRoute:
          (r.metadata as { routes?: { portfolio?: string } })?.routes
            ?.portfolio ?? null,
      }));
    },
  }),

  scroll_to: tool({
    description:
      "Smoothly scroll the portfolio main column to a section. Call this when your answer is about content visible on the page. Sections: 'about' (intro), 'experience' (work timeline of companies/roles), 'work' (selected professional/NDA projects), 'projects' (personal/public projects), 'contact'.",
    inputSchema: z.object({
      section: z.enum(["about", "experience", "work", "projects", "contact"]),
    }),
    execute: async ({ section }) => ({ ok: true, section }),
  }),

  highlight_project: tool({
    description:
      "Pulse-highlight a project on the page. Works for both professional projects in the Work section (athena, counselor-dashboard, crawler-dashboard, ai-crawler, data-maintenance-pipeline, e2e-testing-suite) and personal projects in the Projects section (flowstack, pulsevr, mercado). Call when the visitor asks about a specific project.",
    inputSchema: z.object({
      slug: z.enum(PROJECT_SLUGS),
    }),
    execute: async ({ slug }) => ({ ok: true, slug }),
  }),
};
