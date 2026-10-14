import chunkStars from "@/lib/sky/chunk-stars.json";

// The sky is the wiki: one star per chunk. This map (chunk id -> star id) names the pages chunks come from, so it
// stays on the server; the browser only ever gets the star ids, which carry nothing but a place in the sky.
const STAR_OF = new Map(Object.entries(chunkStars as Record<string, string>));

/**
 * The stars a `search_wiki` result read, best first, each once. A chunk the sky has no star for (left out of the
 * export, or published after it) is dropped; anything that isn't a list of rows reads no stars.
 */
export function starsOf(rows: unknown): string[] {
  if (!Array.isArray(rows)) return [];
  const stars: string[] = [];
  for (const row of rows) {
    const id = (row as { id?: unknown } | null)?.id;
    const star = typeof id === "string" ? STAR_OF.get(id) : undefined;
    if (star && !stars.includes(star)) stars.push(star);
  }
  return stars;
}
