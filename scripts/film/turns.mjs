// How fast the film's camera turns, from its own path in the running dev server (window.__path), and where it turns
// faster than a limit: the whips and jolts a still can't show (docs/adr/0003, amendment of 2026-10-11).
//
//   node scripts/film/turns.mjs [from] [to] [--phone] [--limit 265] [--url http://localhost:3000]
//
// Times are in screens of scroll. The throws' cuts (window.__cuts), each hidden by its flash, are left out. Prints the
// peak turn (degrees a screen) and how fast the subject's screen spot slides (cx, cy a screen), then each stretch over
// the limit. Headless, on the GPU (ANGLE on Metal); it opens its own page, so it needs no wake.
import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; };
const [from = "0", to = "47"] = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
const phone = args.includes("--phone"), limit = Number(flag("--limit", "265")), url = flag("--url", "http://localhost:3000");

const browser = await chromium.launch({ headless: true, args: ["--enable-gpu", "--use-angle=metal"] });
try {
  const ctx = await browser.newContext(phone ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  // a returning visitor, straight onto the portfolio
  await page.addInitScript(() => { try { localStorage.setItem("jrz-chat-v1", JSON.stringify({ messages: [], threadId: "turns", activated: true })); } catch {} });
  await page.goto(`${url}/?wake=off`, { waitUntil: "load" });
  await page.waitForFunction(() => window.__path && document.querySelector("[data-stage='whole']"), null, { timeout: 120000 });
  const rows = await page.evaluate(([a, b]) => {
    const dt = 0.005, out = [], cuts = window.__cuts ?? [];
    const dir = (p) => { const d = [p.target[0] - p.pos[0], p.target[1] - p.pos[1], p.target[2] - p.pos[2]], l = Math.hypot(...d); return d.map((x) => x / l); };
    let prev = window.__path(a);
    for (let t = a + dt; t <= b; t += dt) {
      const p = window.__path(t), u = dir(prev), v = dir(p);
      if (!cuts.some((c) => t >= c - 0.12 && t <= c + 0.15)) {
        const deg = (Math.acos(Math.min(1, u[0] * v[0] + u[1] * v[1] + u[2] * v[2])) * 180) / Math.PI / dt;
        out.push([t, deg, Math.hypot(p.cx - prev.cx, p.cy - prev.cy) / dt]);
      }
      prev = p;
    }
    return out;
  }, [Number(from), Number(to)]);
  const peak = rows.reduce((m, r) => (r[1] > m[1] ? r : m), [0, 0, 0]);
  console.log(`${phone ? "phone" : "desktop"} ${from}–${to}: peak turn ${Math.round(peak[1])}°/screen at ${peak[0].toFixed(2)}, peak slide ${Math.max(...rows.map((r) => r[2])).toFixed(2)}/screen`);
  // each stretch over the limit: where it starts and ends, and its worst
  let run = null;
  for (const [t, deg] of rows) {
    if (deg > limit) run = run ? { ...run, t1: t, worst: Math.max(run.worst, deg) } : { t0: t, t1: t, worst: deg };
    else if (run) { console.log(`  over ${limit}: ${run.t0.toFixed(2)}–${run.t1.toFixed(2)}, worst ${Math.round(run.worst)}°/screen`); run = null; }
  }
  if (run) console.log(`  over ${limit}: ${run.t0.toFixed(2)}–${run.t1.toFixed(2)}, worst ${Math.round(run.worst)}°/screen`);
} finally {
  await browser.close();
}
