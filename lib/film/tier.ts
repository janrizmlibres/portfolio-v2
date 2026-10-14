/**
 * How the voyage plays on this device, kept on `<html data-film>`:
 * - `film`: the film, scrolled by the visitor;
 * - `still`: one still per reading spot, crossfaded, with nothing moving: under reduced motion, and lite (`data-lite`,
 *   lite.ts: a device that can't hold the film, or a visitor who chose it);
 * - `plain`: no WebGL: the reading layout, every block flowing as a page.
 * A script in the document's head sets it before first paint (`TIER_SCRIPT`), so the first frame is laid out right,
 * by lite.ts's `startVersion`: the address's `?film=`, then reduced motion, then the choice kept, then the device.
 * It asks for a real WebGL2 context the way the universe will (refusing software rendering, which starves the main
 * thread): about 20 ms on a laptop with a GPU, and the plain page is then plain from its first paint instead of
 * flipping to it once the universe gives up. The universe's loader still corrects it to `plain` if WebGL fails later.
 * It leaves the GPU's renderer string on `data-gpu`, one of the signals the visit's quality starts from
 * (lib/universe/tier.ts). The head script also marks a portrait screen (`html.port`) and a phone held sideways
 * (`html.short`), where every reading spot is composed again.
 */
import { LEAN, WEAK_GPU } from "@/lib/universe/tier";
import { KEY } from "./lite";

export type Tier = "film" | "still" | "plain";

export const PORTRAIT = 0.8; // width / height below which a screen is composed as portrait
export const SHORT = 500; // a wide screen shorter than this, in CSS px, is a phone held sideways

export const isPort = (w: number, h: number) => w / h < PORTRAIT;
export const isShort = (w: number, h: number) => !isPort(w, h) && h < SHORT;

/** A window's size (CSS px) and its screen, the large viewport's height. */
export type View = { w: number; h: number; screen: number };
/**
 * Whether a resize changes what the film is composed for: its width, its screen, or portrait and phone-sideways. A
 * phone's toolbar showing or hiding changes none of them.
 */
export const reframes = (a: View, b: View) =>
  a.w !== b.w || a.screen !== b.screen || isPort(a.w, a.h) !== isPort(b.w, b.h) || isShort(a.w, a.h) !== isShort(b.w, b.h);

/** Runs in the document's head, before anything paints. */
export const TIER_SCRIPT = `(function(){var d=document.documentElement,n=navigator,gl=null,k={},q=new URLSearchParams(location.search).get("film");try{gl=typeof WebGL2RenderingContext==="undefined"?null:document.createElement("canvas").getContext("webgl2",{failIfMajorPerformanceCaveat:true});if(gl){var i=gl.getExtension("WEBGL_debug_renderer_info");d.dataset.gpu=gl.getParameter(i?i.UNMASKED_RENDERER_WEBGL:gl.RENDERER)}var x=gl&&gl.getExtension("WEBGL_lose_context");if(x)x.loseContext();}catch(e){}try{k=JSON.parse(localStorage.getItem("${KEY}"))||{}}catch(e){}var m=n.deviceMemory,c=n.hardwareConcurrency,v=!gl||q==="plain"?"plain":matchMedia("(prefers-reduced-motion: reduce)").matches?"still":q==="still"?"lite":q==="film"?"film":k.choice==="lite"?"lite":k.choice==="full"?"film":k.verdict==="slow"||/${WEAK_GPU.source}/.test(d.dataset.gpu||"")||m<=${LEAN.memory}&&c>0&&c<=${LEAN.cores}?"lite":"film";d.dataset.film=v==="lite"?"still":v;if(v==="lite")d.dataset.lite="";var p=innerWidth/innerHeight<${PORTRAIT};d.classList.toggle("port",p);d.classList.toggle("short",!p&&innerHeight<${SHORT});})();`;

const listeners = new Set<(t: Tier) => void>();

export function getTier(): Tier {
  if (typeof document === "undefined") return "film";
  const t = document.documentElement.dataset.film;
  return t === "still" || t === "plain" ? t : "film";
}

export function setTier(t: Tier) {
  if (getTier() === t) return;
  document.documentElement.dataset.film = t;
  listeners.forEach((l) => l(t));
}

export function onTier(cb: (t: Tier) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
