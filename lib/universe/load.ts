/**
 * The universe's lazy entry point: everything three.js lives behind this module, which the page imports only
 * after first paint, so none of it counts toward the first load.
 */
import { createSky, type StarLayout } from "./sky";
import type { Tier } from "./tier";

export async function loadSky(canvas: HTMLCanvasElement, opts: { tier: Tier; reduced: boolean }) {
  const res = await fetch("/sky/stars-pca.json");
  if (!res.ok) throw new Error(`stars: ${res.status}`);
  const layout = (await res.json()) as StarLayout;
  return createSky(canvas, { layout, ...opts });
}
