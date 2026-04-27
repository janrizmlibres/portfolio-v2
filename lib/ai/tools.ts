import { tool } from "ai";
import { z } from "zod";
import { retrieveChunks } from "@/lib/rag/retrieve";

// AI SDK v6: `parameters` was renamed to `inputSchema`.
// `maxSteps` was replaced by `stopWhen: stepCountIs(N)`.
export const tools = {
  search_wiki: tool({
    description:
      "Retrieve grounded chunks from Janriz's personal wiki via vector similarity. Call this BEFORE making factual claims about projects, work, or background.",
    inputSchema: z.object({
      query: z.string().describe("Natural-language query to embed and search."),
      type: z
        .string()
        .optional()
        .describe("Filter by entity type, e.g. 'project', 'org', 'profile'."),
      tags: z.array(z.string()).optional(),
      k: z.number().int().min(1).max(12).optional().default(6),
    }),
    execute: async ({ query, type, tags, k }) => {
      const rows = await retrieveChunks({ query, type, tags, k });
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
      "Smoothly scroll the portfolio main column to a section. Call this when your answer is about content visible on the page.",
    inputSchema: z.object({
      section: z.enum(["about", "work", "projects", "contact"]),
    }),
    execute: async ({ section }) => ({ ok: true, section }),
  }),

  highlight_project: tool({
    description:
      "Pulse-highlight a personal project card. Call when the visitor asks about a specific project.",
    inputSchema: z.object({
      slug: z.enum(["flowstack", "pulsevr", "mercado"]),
    }),
    execute: async ({ slug }) => ({ ok: true, slug }),
  }),
};
