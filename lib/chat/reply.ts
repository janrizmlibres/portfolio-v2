/**
 * A reply's markdown as the reveal shows it: paragraphs and list items, each a run of word units. A link or a bold
 * run is one unit, so it appears whole; one still arriving is held back, so half a reply never shows raw markdown.
 * A unit right after another with no space between (a full stop after a link) is glued to it.
 */
export type Unit = { text: string; href?: string; bold?: boolean; glue?: boolean };
export type Block = { kind: "p" | "li"; units: Unit[] };

const TOKEN = /\s+|\[([^\]]*)\]\(([^)\s]*)\)|\*\*([^*]+)\*\*|\[|\*\*|[^\s[*]+|\*/g;

function units(line: string): Unit[] {
  const out: Unit[] = [];
  let spaced = true;
  for (const m of line.matchAll(TOKEN)) {
    const [tok, label, href, bold] = m;
    if (/^\s/.test(tok)) {
      spaced = true;
      continue;
    }
    // the start of a link or bold run whose end hasn't arrived
    if (tok === "[" || tok === "**") break;
    const u: Unit = label !== undefined ? { text: label, href } : bold !== undefined ? { text: bold, bold: true } : { text: tok };
    if (!spaced && out.length) u.glue = true;
    out.push(u);
    spaced = false;
  }
  return out;
}

// the bubble, its reveal and its announcements each parse the same reply several times a frame: the last is kept
let last: { md: string; blocks: Block[] } | null = null;

/** The reply's blocks; the same array for the same markdown, so never change it. */
export function parseReply(md: string): Block[] {
  if (last?.md === md) return last.blocks;
  const blocks = parse(md);
  last = { md, blocks };
  return blocks;
}

function parse(md: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of md.trim().split(/\n{2,}/)) {
    const lines = chunk.split("\n").filter((l) => l.trim() && l.trim() !== "-");
    if (!lines.length) continue;
    if (lines.every((l) => /^- /.test(l))) for (const l of lines) blocks.push({ kind: "li", units: units(l.slice(2)) });
    else blocks.push({ kind: "p", units: units(lines.join(" ")) });
  }
  return blocks.filter((b) => b.units.length);
}

export const unitCount = (blocks: Block[]) => blocks.reduce((n, b) => n + b.units.length, 0);
