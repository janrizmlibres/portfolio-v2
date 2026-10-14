import type { SectionId } from "@/lib/film/block";
import { voyageScript } from "@/lib/voyage/script";

const SECTION_NAME: Record<SectionId, string> = {
  "sec-hero": "the opening",
  "sec-about": "About",
  "sec-work": "Work",
  "sec-projects": "Projects",
  "sec-contact": "Contact",
};

export type View = { sectionId: string; domId: SectionId; label: string };

// The browser names the block it's reading by its heading's text (its title and sub run together, as the runway
// lays them), with "(in Section)" after. Only a heading the script has is taken, and the label is rebuilt from it,
// so nothing the browser writes reaches the system prompt.
let titles: Map<string, string> | null = null;
const titleOf = (sec: SectionId, heading: string) => {
  titles ??= new Map(
    voyageScript().blocks.flatMap((b) => (b.title ? [[`${b.sec} ${(b.title + (b.sub ?? "")).trim()}`, b.title]] : [])),
  );
  return titles.get(`${sec} ${heading}`);
};

/** What the visitor is reading, from the view the browser posted: a known section, and a known block in it. */
export function viewOf(raw: unknown): View | null {
  if (!raw || typeof raw !== "object") return null;
  const { domId, label } = raw as { domId?: unknown; label?: unknown };
  if (typeof domId !== "string" || !Object.hasOwn(SECTION_NAME, domId)) return null;
  const sec = domId as SectionId;
  const name = SECTION_NAME[sec];
  const heading = typeof label === "string" ? label.replace(/ \(in [^()]*\)$/, "") : "";
  const title = titleOf(sec, heading);
  return { sectionId: sec.slice(4), domId: sec, label: title && title !== name ? `${title} (in ${name})` : name };
}
