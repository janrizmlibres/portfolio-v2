/**
 * Development only (`?prints` in the address): draws what Tycho keeps clear of over the page, as he last saw it: the
 * page's text and chrome in blue, the 3D subjects' footprints in amber, and his body's box (dashed when he's small).
 */
import type { Rect } from "./spots";

export type Seen = { page: readonly Rect[]; bodies: readonly Rect[]; body: Rect; small: boolean };

export function createOverlay() {
  const c = document.createElement("canvas");
  Object.assign(c.style, { position: "fixed", inset: "0", width: "100vw", height: "100vh", pointerEvents: "none", zIndex: "2147483000" });
  c.dataset.tychoOverlay = "";
  document.body.appendChild(c);
  const g = c.getContext("2d")!;
  return {
    draw(s: Seen) {
      const dpr = devicePixelRatio || 1;
      if (c.width !== innerWidth * dpr || c.height !== innerHeight * dpr) { c.width = innerWidth * dpr; c.height = innerHeight * dpr; }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, innerWidth, innerHeight);
      const box = (r: Rect, stroke: string, fill: string) => {
        g.fillStyle = fill;
        g.strokeStyle = stroke;
        g.fillRect(r.l, r.t, r.r - r.l, r.b - r.t);
        g.strokeRect(r.l + 0.5, r.t + 0.5, r.r - r.l - 1, r.b - r.t - 1);
      };
      for (const r of s.page) box(r, "rgba(110,160,255,.9)", "rgba(110,160,255,.12)");
      for (const r of s.bodies) box(r, "rgba(255,170,60,.95)", "rgba(255,170,60,.14)");
      g.setLineDash(s.small ? [5, 4] : []);
      box(s.body, "rgba(120,255,160,.95)", "rgba(120,255,160,.08)");
      g.setLineDash([]);
    },
    destroy: () => c.remove(),
  };
}

export const wantsOverlay = () => process.env.NODE_ENV !== "production" && new URLSearchParams(location.search).has("prints");
