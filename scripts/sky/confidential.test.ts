// @vitest-environment node
import { describe, it, expect } from "vitest";
import { splitConfidential, type WikiPage } from "./confidential";

const page = (path: string, markdown: string): WikiPage => ({ path, markdown });

const employerPage = page(
  "wiki/orgs/acme-health.md",
  `---
type: org
aliases: ["Acme Health", "AH"]
---
# Acme Health

A health startup.
`,
);

const employerProject = page(
  "wiki/projects/ah-scheduler.md",
  `---
type: project
aliases: ["AH Scheduler"]
---
# AH Scheduler

The booking engine at [[orgs/acme-health|Acme Health]].

## Background

Built over three waves.
`,
);

const employerConcept = page(
  "wiki/concepts/ah-platform.md",
  `---
type: concept
---
# AH platform

Context for [[acme-health]]'s product.
`,
);

const publicProject = page(
  "wiki/projects/orbit.md",
  `---
type: project
---
# Orbit

A tool built at [[orgs/public-co|Public Co]].

## Later

Also used at [[orgs/acme-health|Acme Health]].
`,
);

const bioPage = page(
  "wiki/bio/early-career.md",
  `---
type: bio
---
# Early career

Worked at [[orgs/acme-health|Acme Health]] and [[orgs/public-co|Public Co]].
`,
);

const pages = [employerPage, employerProject, employerConcept, publicProject, bioPage];

const chunksOf = (path: string, n = 2) =>
  Array.from({ length: n }, (_, i) => ({ id: `${path}#${i}`, source_path: path }));

describe("splitConfidential", () => {
  it("drops the confidential employer's own page, matched by alias in any case", () => {
    const { kept, excluded } = splitConfidential(chunksOf(employerPage.path), pages, ["acme health"]);
    expect(kept).toEqual([]);
    expect(excluded.map((e) => e.row.source_path)).toEqual([employerPage.path, employerPage.path]);
  });

  it("drops project and concept pages whose opening paragraph links the employer", () => {
    const rows = [...chunksOf(employerProject.path), ...chunksOf(employerConcept.path)];
    const { kept, excluded } = splitConfidential(rows, pages, ["Acme Health"]);
    expect(kept).toEqual([]);
    expect(excluded).toHaveLength(4);
  });

  it("keeps a project that only mentions the employer after its opening paragraph", () => {
    const rows = chunksOf(publicProject.path);
    expect(splitConfidential(rows, pages, ["Acme Health"]).kept).toEqual(rows);
  });

  it("keeps pages about Janriz himself even when they name the employer up front", () => {
    const rows = chunksOf(bioPage.path);
    expect(splitConfidential(rows, pages, ["Acme Health"]).kept).toEqual(rows);
  });

  it("drops chunks whose source page is missing from the wiki", () => {
    const rows = chunksOf("wiki/projects/renamed-away.md");
    const { kept, excluded } = splitConfidential(rows, pages, ["Acme Health"]);
    expect(kept).toEqual([]);
    expect(excluded[0]?.reason).toMatch(/missing/);
  });

  it("refuses to run when an employer has no page in the wiki", () => {
    expect(() => splitConfidential([], pages, ["Acme Health", "Nowhere Inc"])).toThrow(/Nowhere Inc/);
  });
});
