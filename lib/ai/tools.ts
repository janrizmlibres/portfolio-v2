import { tool } from "ai";
import { z } from "zod";
import { retrieveChunks } from "@/lib/rag/retrieve";
import { SUBJECT_SLUGS } from "@/lib/voyage/subjects";

export const searchWikiInput = z.object({
  query: z.string().describe("Natural-language query to embed and search. Reformulate broadly on retry."),
  k: z.number().int().min(1).max(12).optional().default(6),
});

/** What the model reads as a `search_wiki` result. */
export async function searchWiki({ query, k }: z.output<typeof searchWikiInput>) {
  const rows = await retrieveChunks({ query, k });
  return rows.map((r) => ({ id: r.id, title: r.title, type: r.type, text: r.text, similarity: r.similarity }));
}

export const scrollToInput = z.object({ section: z.enum(["about", "work", "projects", "contact"]) });
export const highlightInput = z.object({ slug: z.enum(SUBJECT_SLUGS) });

// AI SDK v6: `parameters` was renamed to `inputSchema`.
// `maxSteps` was replaced by `stopWhen: stepCountIs(N)`.
export const tools = {
  search_wiki: tool({
    description:
      "Retrieve grounded chunks from Janriz's personal wiki via vector similarity. Call this BEFORE making factual claims about projects, work, or background. If the first results are weak or off-topic, retry once or twice with a reformulated query (broader phrasing, related concepts) before telling the visitor you don't know.",
    inputSchema: searchWikiInput,
    execute: searchWiki,
  }),

  scroll_to: tool({
    description:
      "Warp the page to a section of the voyage. Call this when your answer is about something the visitor can read on the page. Sections: 'about' (who he is), 'work' (his roles, company by company), 'projects' (what he built at work, under NDA, then his own projects), 'contact' (how to reach him).",
    inputSchema: scrollToInput,
    execute: async ({ section }) => ({ ok: true, section }),
  }),

  // the point: the page goes to the subject (a warp from another section) and Tycho points at it
  highlight_project: tool({
    description:
      "Take the visitor to one thing on the page and point at it. Call this when your answer is about one project or one company. Projects: 'athena' and its moons 'counselor-dashboard' and 'e2e-testing-suite'; 'ai-web-crawler' and its moons 'crawler-dashboard' and 'data-maintenance-pipeline'; his own 'mercado', 'flowstack' and 'pulsevr'. Companies (in Work): 'logolife', 'tolstoy', 'elinnov', 'yearbook'. It replaces scroll_to: never call both.",
    inputSchema: highlightInput,
    execute: async ({ slug }) => ({ ok: true, slug }),
  }),
};
