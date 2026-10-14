import { describe, expect, it } from "vitest";
import { ATHENA, BREAKTHROUGHS, CONTACT, CRAWLER, OWN_PROJECTS, ROLES } from "@/lib/content/voyage";
import { SUBJECT_SLUGS } from "@/lib/voyage/subjects";
import { PAGE_CONTEXT_BLOCK } from "./page-context";

describe("the page context: what the voyage shows", () => {
  it("heads each section the agent can warp to with its slug", () => {
    for (const sec of ["about", "work", "projects", "contact"]) expect(PAGE_CONTEXT_BLOCK).toContain(`## ${sec} (#sec-${sec})`);
  });

  it("gives every role as the voyage writes it", () => {
    for (const r of ROLES) expect(PAGE_CONTEXT_BLOCK).toContain(`${r.company}: ${r.role}, ${r.span}`);
    expect(PAGE_CONTEXT_BLOCK).not.toContain("Data / AI Engineer");
  });

  it("names every subject the agent can point at by its slug", () => {
    for (const slug of SUBJECT_SLUGS) expect(PAGE_CONTEXT_BLOCK).toContain(`[${slug}]`);
  });

  it("carries the voyage's own words", () => {
    for (const text of [ATHENA.line, CRAWLER.outcome, OWN_PROJECTS[0]!.line, CONTACT.next, BREAKTHROUGHS[0]!.name]) expect(PAGE_CONTEXT_BLOCK).toContain(text);
  });
});
