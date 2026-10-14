/**
 * How the voyage plays on this device, kept on `<html data-film>`:
 * - `film`: the film, scrolled by the visitor;
 * - `still`: reduced motion: one still per reading spot, crossfaded, with nothing moving;
 * - `plain`: no WebGL: the reading layout, every block flowing as a page.
 * A script in the document's head sets it before first paint (`TIER_SCRIPT`), so the first frame is laid out right.
 * It asks for a real WebGL2 context the way the universe will (refusing software rendering, which starves the main
 * thread): about 20 ms on a laptop with a GPU, and the plain page is then plain from its first paint instead of
 * flipping to it once the universe gives up. The universe's loader still corrects it to `plain` if WebGL fails later.
 * It leaves the GPU's renderer string on `data-gpu`, one of the signals the visit's quality starts from
 * (lib/universe/tier.ts). The head script also marks a portrait screen (`html.port`) and a phone held sideways
 * (`html.short`), where every reading spot is composed again.
 */
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
export const TIER_SCRIPT = `(function(){var d=document.documentElement,gl=null;try{gl=typeof WebGL2RenderingContext==="undefined"?null:document.createElement("canvas").getContext("webgl2",{failIfMajorPerformanceCaveat:true});if(gl){var i=gl.getExtension("WEBGL_debug_renderer_info");d.dataset.gpu=gl.getParameter(i?i.UNMASKED_RENDERER_WEBGL:gl.RENDERER)}var x=gl&&gl.getExtension("WEBGL_lose_context");if(x)x.loseContext();}catch(e){}d.dataset.film=!gl?"plain":matchMedia("(prefers-reduced-motion: reduce)").matches?"still":"film";var p=innerWidth/innerHeight<${PORTRAIT};d.classList.toggle("port",p);d.classList.toggle("short",!p&&innerHeight<${SHORT});})();`;

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
