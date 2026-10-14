// Decides which wiki chunks stay out of the sky because their page is about an
// employer the chat's system prompt keeps confidential.
//
// A page is about a confidential employer when it is
//   - the employer's own page: its title or an alias matches the employer's name, or
//   - a project or concept page whose opening paragraph links that page.
// Pages about Janriz himself (bio, events, hubs, the profile) name employers in
// passing and stay in. A chunk whose page is missing from the wiki is dropped,
// because it can't be checked.

export interface WikiPage {
  /** Path from the wiki repo root, the same form as `wiki_chunks.source_path`. */
  path: string;
  markdown: string;
}

const TYPES_ABOUT_AN_EMPLOYER = new Set(["project", "concept"]);

interface ParsedPage {
  type: string | undefined;
  names: string[];
  openingLinks: string[];
}

function parse(markdown: string): ParsedPage {
  const fm = /^---\n([\s\S]*?)\n---\n?/.exec(markdown);
  const frontmatter = fm?.[1] ?? "";
  const body = markdown.slice(fm?.[0].length ?? 0);

  const type = /^type:\s*(\S+)/m.exec(frontmatter)?.[1];
  const aliasesLine = /^aliases:\s*(\[.*\])/m.exec(frontmatter)?.[1];
  const aliases: string[] = aliasesLine ? JSON.parse(aliasesLine) : [];
  const title = /^# (.+)$/m.exec(body)?.[1]?.trim();

  // The opening paragraph: the first block of text after the title.
  const afterTitle = body.replace(/^[\s\S]*?^# .+$/m, "");
  const opening = afterTitle.trim().split(/\n\s*\n/)[0] ?? "";
  const openingLinks = [...opening.matchAll(/\[\[([^\]|#]+)/g)].map((m) => m[1]!.trim());

  return { type, names: [...(title ? [title] : []), ...aliases], openingLinks };
}

/** `[[orgs/acme]]` and `[[acme]]` both point at `wiki/orgs/acme.md`. */
function linksTo(link: string, path: string): boolean {
  const target = path.replace(/^wiki\//, "").replace(/\.md$/, "");
  return link === target || link === target.split("/").pop();
}

export function splitConfidential<T extends { source_path: string }>(
  rows: T[],
  pages: WikiPage[],
  employers: readonly string[],
): {
  kept: T[];
  excluded: { row: T; reason: string }[];
  /** Titles and aliases of the employers' own pages, e.g. for checking output for leaks. */
  employerNames: string[];
} {
  const parsed = new Map(pages.map((p) => [p.path, parse(p.markdown)]));

  const employerPages = employers.map((name) => {
    const match = [...parsed].find(([, p]) =>
      p.names.some((n) => n.toLowerCase() === name.toLowerCase()),
    );
    if (!match) throw new Error(`No wiki page found for confidential employer "${name}".`);
    return match[0];
  });

  const reasonFor = (path: string): string | null => {
    const page = parsed.get(path);
    if (!page) return "page missing from the wiki";
    if (employerPages.includes(path)) return "a confidential employer's page";
    if (!TYPES_ABOUT_AN_EMPLOYER.has(page.type ?? "")) return null;
    const employer = employerPages.find((e) => page.openingLinks.some((l) => linksTo(l, e)));
    return employer ? `about ${employer}` : null;
  };

  const kept: T[] = [];
  const excluded: { row: T; reason: string }[] = [];
  for (const row of rows) {
    const reason = reasonFor(row.source_path);
    if (reason) excluded.push({ row, reason });
    else kept.push(row);
  }
  const employerNames = employerPages.flatMap((path) => parsed.get(path)!.names);
  return { kept, excluded, employerNames };
}
