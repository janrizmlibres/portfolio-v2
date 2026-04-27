import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExecute = vi.fn();
vi.mock("@/db/client", () => ({
  db: { execute: (...args: unknown[]) => mockExecute(...args) },
}));

const mockEmbed = vi.fn();
vi.mock("@/lib/ai/embed", () => ({
  embedQuery: (...args: unknown[]) => mockEmbed(...args),
}));

import { retrieveChunks } from "./retrieve";

beforeEach(() => {
  mockExecute.mockReset();
  mockEmbed.mockReset();
});

describe("retrieveChunks", () => {
  it("embeds the query and returns top-K rows", async () => {
    mockEmbed.mockResolvedValue(new Array(1536).fill(0.01));
    mockExecute.mockResolvedValue([
      { id: "projects/athena#0", source_path: "projects/athena.md", title: "Athena", type: "project",
        tags: ["ai"], text: "Athena is...", metadata: { routes: { portfolio: "projects/athena" } },
        similarity: 0.91 },
    ]);

    const rows = await retrieveChunks({ query: "athena memory", k: 5 });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: "projects/athena#0", similarity: 0.91 });
    expect(mockEmbed).toHaveBeenCalledWith("athena memory");
  });

  it("returns empty array when DB throws", async () => {
    mockEmbed.mockResolvedValue(new Array(1536).fill(0.01));
    mockExecute.mockRejectedValue(new Error("connection refused"));
    const rows = await retrieveChunks({ query: "anything" });
    expect(rows).toEqual([]);
  });

  it("applies type filter when provided", async () => {
    mockEmbed.mockResolvedValue(new Array(1536).fill(0));
    mockExecute.mockResolvedValue([]);
    await retrieveChunks({ query: "x", type: "project" });
    const sqlArg = mockExecute.mock.calls[0]?.[0];
    expect(String(sqlArg)).toContain("type");
  });
});
