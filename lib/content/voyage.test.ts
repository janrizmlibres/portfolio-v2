import { describe, expect, it } from "vitest";
import stars from "@/public/sky/stars-pca.json";
import chunkStars from "@/lib/sky/chunk-stars.json";
import { ABOUT_1, ABOUT_2 } from "./voyage";

const topicOf = (id: string) => stars.stars.find((s) => s.id === id)?.topic;

describe("About's lines", () => {
  it("light, where a line names its stars, stars of its own topics", () => {
    for (const l of [...ABOUT_1, ...ABOUT_2]) for (const id of l.stars ?? []) expect([l.text, l.topics.includes(topicOf(id)!)]).toEqual([l.text, true]);
  });

  it("light the tools line from the one chunk that names them, the early career's tooling, not the whole early career", () => {
    const tools = ABOUT_2.find((l) => l.text.includes("LangChain"))!;
    expect(tools.stars).toEqual([(chunkStars as Record<string, string>)["wiki/bio/early-career.md#2"]]);
  });

  it("light the end-to-end line from his own words in the early career, his summary of how he works", () => {
    const own = ABOUT_2.find((l) => l.text.includes("end to end"))!;
    expect(own.stars).toEqual([(chunkStars as Record<string, string>)["wiki/bio/early-career.md#3"]]);
  });

  it("name his stack, not the tool he codes with (Janriz, 2026-10-11)", () => {
    for (const l of [...ABOUT_1, ...ABOUT_2]) expect(l.text).not.toContain("Claude Code");
  });
});
