// @vitest-environment node
import { describe, it, expect } from "vitest";
import { buildSky, type ChunkRow } from "./build";
import { seededRandom } from "./project";
import type { WikiPage } from "./confidential";

const page = (path: string, type: string, title: string, opening: string, aliases: string[] = []): WikiPage => ({
  path,
  markdown: `---\ntype: ${type}\naliases: ${JSON.stringify(aliases)}\n---\n# ${title}\n\n${opening}\n`,
});

const pages = [
  page("wiki/orgs/acme-health.md", "org", "Acme Health", "A health startup.", ["AH"]),
  page("wiki/projects/ah-scheduler.md", "project", "AH Scheduler", "Built at [[orgs/acme-health|Acme Health]]."),
  page("wiki/projects/orbit.md", "project", "Orbit", "A public tool."),
  page("wiki/projects/comet.md", "project", "Comet", "A game."),
  page("wiki/bio/university.md", "bio", "University", "Studied computer science."),
];

function rowsFor(paths: string[], perPage = 8): ChunkRow[] {
  const random = seededRandom(1);
  return paths.flatMap((path, p) =>
    Array.from({ length: perPage }, (_, i) => ({
      id: `${path}#${i}`,
      source_path: path,
      embedding: Array.from({ length: 12 }, (_, d) => (d === p ? 5 : 0) + random()),
    })),
  );
}

const rows = rowsFor(pages.map((p) => p.path));
const build = () => buildSky({ rows, pages, employers: ["Acme Health"], seed: 42 });

describe("buildSky", () => {
  it("leaves the confidential employer's chunks out of the stars and the mapping", () => {
    const sky = build();
    expect(sky.layouts.pca.stars).toHaveLength(24);
    expect(Object.keys(sky.chunkStars)).toHaveLength(24);
    expect(Object.keys(sky.chunkStars).some((id) => /acme|ah-/.test(id))).toBe(false);
    expect(sky.report.excluded.map((e) => e.source_path).sort()).toEqual([
      "wiki/orgs/acme-health.md",
      "wiki/projects/ah-scheduler.md",
    ]);
  });

  it("gives each star only an opaque id, a position and an opaque topic key", () => {
    const { pca } = build().layouts;
    for (const star of pca.stars) {
      expect(Object.keys(star).sort()).toEqual(["id", "topic", "x", "y", "z"]);
      expect(star.id).toMatch(/^s\d{3}$/);
      expect(star.topic).toMatch(/^t\d{2}$/);
    }
    const json = JSON.stringify(pca);
    for (const word of ["wiki", "orbit", "comet", "university", "Orbit"]) expect(json).not.toContain(word);
  });

  it("uses the same stars and topics in both layouts, at different positions", () => {
    const { pca, umap } = build().layouts;
    const idsAndTopics = (l: typeof pca) => l.stars.map((s) => [s.id, s.topic]);
    expect(idsAndTopics(umap)).toEqual(idsAndTopics(pca));
    expect(umap.stars.map((s) => [s.x, s.y, s.z])).not.toEqual(pca.stars.map((s) => [s.x, s.y, s.z]));
  });

  it("maps every kept chunk to its star, and a page's chunks share one topic", () => {
    const sky = build();
    const topicOf = new Map(sky.layouts.pca.stars.map((s) => [s.id, s.topic]));
    const orbitTopics = new Set(
      Object.entries(sky.chunkStars)
        .filter(([chunk]) => chunk.startsWith("wiki/projects/orbit.md#"))
        .map(([, star]) => topicOf.get(star)),
    );
    expect(orbitTopics.size).toBe(1);
    expect(sky.topics.find((t) => t.path === "wiki/projects/orbit.md")?.key).toBe([...orbitTopics][0]);
  });

  it("gives the same output on every run", () => {
    expect(build()).toEqual(build());
  });

  it("refuses to write a mapping that names a confidential employer", () => {
    const leaky = page("wiki/bio/acme-health-years.md", "bio", "Those years", "Worked hard.");
    const withLeak = rowsFor([...pages.map((p) => p.path), leaky.path]);
    expect(() =>
      buildSky({ rows: withLeak, pages: [...pages, leaky], employers: ["Acme Health"], seed: 42 }),
    ).toThrow(/acme-health-years/);
  });
});
