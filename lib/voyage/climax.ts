/**
 * The film's one climax, at the foot of the crawler's pipeline, as plain numbers the scene reads:
 * - the front of light: the pulse that runs down the folded rings inside the crawler, come back at full size. It
 *   launches fast and slows as it nears the bottom, and its crest burns as bright as it's fast (Edolus's front), so
 *   it's fierce at launch and gone as it lands;
 * - a ring flares a moment after the crest passes it, and stays lit while "Paid for once" is read;
 * - the report's bars, whose pattern carries the one figure the page states: two dedup layers cut enrichment costs by
 *   70%, so what's enriched is 30% of what would have been without them (every record found).
 */
import { REPORT_BARS } from "@/lib/content/voyage";

/** how sharply the front slows: its progress is 1 − (1 − x)^SLOW */
const SLOW = 2.6;
/** how far behind the crest (in the front's own progress) a ring flares, and over how much it comes up */
const LAG = 0.02, RISE = 0.03;

/** where the front is (0 at the shaft's top, 1 landed) and how bright its crest burns, at film time `t` */
export function front(t: number, T: { t0: number; dur: number }) {
  const x = Math.min(1, Math.max(0, (t - T.t0) / T.dur));
  return { at: 1 - (1 - x) ** SLOW, crest: x > 0 && x < 1 ? (1 - x) ** (SLOW - 1) : 0 };
}

/** how lit a ring at `level` (in the front's progress) is, with the front at `at`: dark until the crest has passed it */
export function held(level: number, at: number) {
  const x = Math.min(1, Math.max(0, (at - level - LAG) / RISE));
  return x * x * (3 - 2 * x);
}

/** the cut in enrichment costs the two dedup layers make */
export const CUT = 0.7;

/** the report's four bars, their heights a pattern (relative, never figures) */
export const BARS = [1, CUT, 1 - CUT, (1 - CUT) * 0.88].map((h, k) => ({ name: REPORT_BARS[k]!, h }));
