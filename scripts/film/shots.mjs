// Screenshots of the film at given times, from the running dev server, for judging frames by eye.
//
//   node scripts/film/shots.mjs <out dir> <w>x<h> <t,t,...> [--phone] [--query sfinish=…] [--url http://localhost:3000]
//
// Times are in screens of scroll; each frame is jumped to and given a second to settle. Headless, on the GPU.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; };
const [out, size, times] = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
if (!out || !size || !times) { console.error("usage: node scripts/film/shots.mjs <out dir> <w>x<h> <t,t,...> [--phone] [--query …] [--url …]"); process.exit(2); }
const [w, h] = size.split("x").map(Number), phone = args.includes("--phone"), query = flag("--query", ""), url = flag("--url", "http://localhost:3000");
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ["--enable-gpu", "--use-angle=metal"] });
try {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: phone ? 2 : 1, ...(phone ? { isMobile: true, hasTouch: true } : {}) });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") console.log("page:", m.text().slice(0, 200)); });
  await page.addInitScript(() => { try { localStorage.setItem("jrz-chat-v1", JSON.stringify({ messages: [], threadId: "shots", activated: true })); } catch {} });
  await page.goto(`${url}/?wake=off${query ? `&${query}` : ""}`, { waitUntil: "load" });
  await page.waitForFunction(() => window.__film && document.querySelector("[data-stage='whole']"), null, { timeout: 120000 });
  await page.waitForTimeout(1500);
  for (const t of times.split(",").map(Number)) {
    await page.evaluate((to) => {
      const top = document.getElementById("runway").getBoundingClientRect().top + scrollY, y = top + to * window.__film.screen;
      scrollTo(0, y);
      dispatchEvent(new CustomEvent("film:jump", { detail: { y } }));
    }, t);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${out}/${size}-t${t}.png` });
    console.log("shot", t);
  }
} finally {
  await browser.close();
}
