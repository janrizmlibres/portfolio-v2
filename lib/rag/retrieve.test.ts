import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExecute = vi.fn();
const mockTransaction = vi.fn();
vi.mock("@/db/client", () => {
  const tx = { execute: (...args: unknown[]) => mockExecute(...args) };
  return {
    getDb: () => ({
      ...tx,
      transaction: (fn: (t: typeof tx) => unknown) => {
        mockTransaction();
        return fn(tx);
      },
    }),
  };
});

const mockEmbed = vi.fn();
vi.mock("@/lib/ai/embed", () => ({
  embedQuery: (...args: unknown[]) => mockEmbed(...args),
}));

import { retrieveChunks } from "./retrieve";

beforeEach(() => {
  mockExecute.mockReset();
  mockTransaction.mockReset();
  mockEmbed.mockReset();
});

describe("retrieveChunks", () => {
  it("embeds the query and returns top-K rows", async () => {
    mockEmbed.mockResolvedValue(new Array(1536).fill(0.01));
    mockExecute.mockResolvedValue([
      { id: "projects/athena#0", title: "Athena", type: "project", text: "Athena is...", similarity: 0.91 },
    ]);

    const rows = await retrieveChunks({ query: "athena memory", k: 5 });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: "projects/athena#0", similarity: 0.91 });
    expect(mockEmbed).toHaveBeenCalledWith("athena memory");
  });

  it("probes every ivfflat list inside the search's own transaction", async () => {
    mockEmbed.mockResolvedValue(new Array(1536).fill(0.01));
    mockExecute.mockResolvedValue([]);
    await retrieveChunks({ query: "athena memory" });
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockExecute).toHaveBeenCalledTimes(2);
    expect(String(mockExecute.mock.calls[0]?.[0])).toMatch(/SET LOCAL ivfflat\.probes = 100/);
    expect(String(mockExecute.mock.calls[1]?.[0])).toContain("ORDER BY embedding");
  });

  it("returns empty array when DB throws", async () => {
    mockEmbed.mockResolvedValue(new Array(1536).fill(0.01));
    mockExecute.mockRejectedValue(new Error("connection refused"));
    const rows = await retrieveChunks({ query: "anything" });
    expect(rows).toEqual([]);
  });
});
