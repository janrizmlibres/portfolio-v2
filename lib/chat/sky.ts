/**
 * The sky lit from the chat: the stars Tycho reads flare where they sit, a beat apart, best first, then stay a
 * brighter white until the next question puts them out. Only star ids come from the chat stream, in the order the
 * search ranked them, so brightness follows that rank. The film keeps its camera and its recede: the stars light in
 * place, in the sky's chat pair, which never touches the film's own lit stars.
 * Each star plays `star-lit` as it flares, louder the brighter it lights (a no-op while the sound is off).
 */
import { currentSound } from "@/lib/audio/current";
import { onSky } from "@/lib/universe/live";
import type { Sky } from "@/lib/universe/sky";

let sky: Sky | null = null;
if (typeof window !== "undefined") onSky((s) => { sky = s; });

/** how much dimmer each next-ranked star lights than the one before it (the sky spreads it over 0.45..1) */
const RANK_STEP = 0.1;

export function lightStars(ids: string[]) {
  if (!sky || !ids.length) return;
  sky.light(ids.map((star, rank) => ({ star, sim: 1 - rank * RANK_STEP })), {
    onFlare: (_i, k) => currentSound()?.play("star-lit", undefined, k),
  });
}

export function unlightStars() {
  sky?.clearLit();
}
