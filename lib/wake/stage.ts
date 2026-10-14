import { seeded } from "@/lib/universe/magnitude";
import { noise3 } from "@/lib/universe/noise";
import { band, cluster, galaxies, starfield, type Galaxy, type Star } from "./stars";

/**
 * The wake-up's stage, drawn: the glow behind Tycho, and his sky (lib/wake/stars) on one square canvas centred on his
 * middle, wide enough to turn a full circle round him without showing an edge as it turns. Plain 2D
 * canvas, drawn once and on resize; the motion is transforms on the elements.
 */

// how far past the frame the sky runs, so the sway's drift never shows an edge
const BLEED = 24;

/** the glow: a faint cool light round his middle, falling to black, dithered so it never bands; drawn at half size */
export function drawGlow(c: HTMLCanvasElement, w: number, h: number, cy: number) {
  const W = Math.ceil(w / 2), H = Math.ceil(h / 2);
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return;
  const img = ctx.createImageData(W, H), d = img.data;
  const R = 0.31 * Math.min(w, 1.25 * h);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const t = Math.min(1, Math.hypot(x - W / 2, y - cy / 2) / R), f = (1 - t) ** 3, n = Math.random() - 0.5, i = (y * W + x) * 4;
      d[i] = 22 * f + n;
      d[i + 1] = 26 * f + n;
      d[i + 2] = 40 * f + n;
      d[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
}

/** the sky's square: its side in CSS px, enough to cover the frame from his middle (w / 2, cy) at any turn */
export const skySide = (w: number, h: number, cy: number) => Math.ceil(2 * Math.hypot(w / 2, Math.max(cy, h - cy))) + 2 * BLEED;

/**
 * His sky on `c`, a square of `skySide` centred on his middle: the stars, the Milky Way (its glow, its dust lanes, its
 * crowd of stars), the distant galaxies and a cluster.
 */
export function drawSky(c: HTMLCanvasElement, w: number, h: number, cy: number) {
  const S = skySide(w, h, cy), dpr = Math.min(1.5, devicePixelRatio || 1);
  c.width = Math.round(S * dpr);
  c.height = Math.round(S * dpr);
  const ctx = c.getContext("2d");
  if (!ctx) return S;
  ctx.scale(dpr, dpr);
  // the frame's own places (its galaxies, its cluster) moved into the square
  const ox = S / 2 - w / 2, oy = S / 2 - cy;
  const b = band(S, S), noise = noise3(5);
  const dust = (x: number, y: number) => {
    const d = Math.abs((x - b.x) * Math.sin(b.angle) - (y - b.y) * Math.cos(b.angle)) / b.width;
    return smooth(0.5, 0.7, noise(x / 110, y / 110, 7)) * Math.exp(-d * d * 4);
  };
  milkyWay(ctx, S, b, noise, dust);
  for (const s of b.stars) dot(ctx, { ...s, a: s.a * (1 - 0.8 * dust(s.x, s.y)) });
  for (const s of starfield(S, S)) dot(ctx, s, s.a > 0.7);
  const k = cluster(w, h, cy);
  halo(ctx, k.x + ox, k.y + oy, k.radius * 3.2, "170, 190, 255", 0.07);
  for (const s of k.stars) dot(ctx, { ...s, x: s.x + ox, y: s.y + oy }, s.a > 0.8);
  for (const g of galaxies(w, h, cy)) galaxy(ctx, { ...g, x: g.x + ox, y: g.y + oy });
  return S;
}

const smooth = (a: number, b: number, v: number) => {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** a star: a small sharp disc, and for the brightest a faint halo */
function dot(ctx: CanvasRenderingContext2D, s: Star, glow = false) {
  ctx.globalAlpha = s.a;
  ctx.fillStyle = s.c;
  ctx.beginPath();
  ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
  ctx.fill();
  if (glow) {
    ctx.globalAlpha = s.a * 0.18;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** a soft round light: `rgb` at `a` in the middle, nothing at radius `r` */
function halo(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, a: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb}, ${a})`);
  g.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * The Milky Way's glow, at a quarter of the size (it's soft): brightest along its line, milky white at its heart and
 * cool at its edges (a warm heart reads as brown this faint), mottled, and cut by dark dust lanes; dithered, then laid
 * over the black.
 */
function milkyWay(ctx: CanvasRenderingContext2D, S: number, b: ReturnType<typeof band>, noise: ReturnType<typeof noise3>, dust: (x: number, y: number) => number) {
  const Q = Math.ceil(S / 4), buf = document.createElement("canvas");
  buf.width = buf.height = Q;
  const bx = buf.getContext("2d");
  if (!bx) return;
  const img = bx.createImageData(Q, Q), d = img.data, sn = Math.sin(b.angle), cs = Math.cos(b.angle);
  for (let py = 0; py < Q; py++)
    for (let px = 0; px < Q; px++) {
      const x = px * 4, y = py * 4, o = Math.abs((x - b.x) * sn - (y - b.y) * cs) / b.width;
      const i = (py * Q + px) * 4;
      if (o > 3) {
        d[i + 3] = 0;
        continue;
      }
      const v = Math.exp(-o * o * 1.6) * (0.5 + 0.5 * noise(x / 260, y / 260, 1)) * (1 - 0.85 * dust(x, y)),
        heart = Math.exp(-o * o * 3),
        n = Math.random() - 0.5;
      d[i] = (0.66 + 0.14 * heart) * 34 * v + n;
      d[i + 1] = (0.72 + 0.08 * heart) * 34 * v + n;
      d[i + 2] = (0.88 - 0.08 * heart) * 34 * v + n;
      d[i + 3] = 255;
    }
  bx.putImageData(img, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(buf, 0, 0, S, S);
  ctx.restore();
}

/** a distant galaxy: an edge-on spiral (a thin disc, a bulge, a dust lane), a face-on spiral's arms, or an elliptical */
function galaxy(ctx: CanvasRenderingContext2D, g: Galaxy) {
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.rotate(g.angle);
  if (g.kind === "spiral") {
    const rnd = seeded(Math.round(g.x * 7 + g.y));
    for (let i = 0; i < 520; i++) {
      const t = Math.pow(rnd(), 0.7), arm = i % 2, th = t * 4.2 + arm * Math.PI, r = (t * g.size) / 2;
      const jx = (rnd() - 0.5) * g.size * 0.06, jy = (rnd() - 0.5) * g.size * 0.06;
      ctx.globalAlpha = g.a * 0.32 * (1 - t * 0.6);
      ctx.fillStyle = "#dfe6ff";
      ctx.beginPath();
      ctx.arc(r * Math.cos(th) + jx, (r * Math.sin(th) + jy) * g.ratio, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    halo(ctx, 0, 0, g.size * 0.14, "255, 236, 210", g.a);
  } else {
    ctx.save();
    ctx.scale(1, g.ratio);
    const r = g.size / 2, grd = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    if (g.kind === "edge") {
      grd.addColorStop(0, `rgba(255, 236, 210, ${g.a})`);
      grd.addColorStop(0.08, `rgba(240, 230, 222, ${g.a * 0.7})`);
      grd.addColorStop(0.4, `rgba(200, 212, 240, ${g.a * 0.22})`);
      grd.addColorStop(1, "rgba(200, 212, 240, 0)");
    } else {
      grd.addColorStop(0, `rgba(255, 238, 215, ${g.a})`);
      grd.addColorStop(0.22, `rgba(250, 232, 210, ${g.a * 0.42})`);
      grd.addColorStop(1, "rgba(250, 232, 210, 0)");
    }
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (g.kind === "edge") {
      // its bulge, and the dust lane along its disc, a hair off its middle
      halo(ctx, 0, 0, g.size * 0.07, "255, 232, 200", g.a * 0.8);
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.beginPath();
      ctx.ellipse(0, g.size * 0.004, g.size * 0.4, g.size * 0.011, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
