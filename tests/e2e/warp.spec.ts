import { expect, test, type Page } from "@playwright/test";
import { oklchOf } from "../../lib/film/warp-palette";
import { REGION_LIGHT } from "../../lib/universe/light";

// The warp: a route-map link to another section. The voyage needs a real GPU (see voyage.spec.ts): ANGLE on Metal.
test.use({ launchOptions: { args: ["--enable-gpu", "--use-angle=metal"] } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("jrz-chat-v1", JSON.stringify({ messages: [], threadId: "e2e", activated: true })),
  );
});

type Film = { t: number; screen: number; blocks: Array<{ id: string; spot: number }> };
type Warp = { ready(): { hole: boolean; flight: boolean }; running: boolean };
const t = (page: Page) => page.evaluate(() => (window as unknown as { __film: Film }).__film.t);
const running = (page: Page) => page.evaluate(() => (window as unknown as { __warp: Warp }).__warp.running);
const open = async (page: Page) => {
  await page.goto("/?wake=off");
  await expect(page.locator("[data-universe]")).toHaveAttribute("data-universe", "ready", { timeout: 30000 });
};
const ready = (page: Page) =>
  page.waitForFunction(() => (window as unknown as { __warp?: Warp }).__warp?.ready().hole, null, { timeout: 30000 });
const spotOf = (page: Page, id: string) =>
  page.evaluate((id) => (window as unknown as { __film: Film }).__film.blocks.find((b) => b.id === id)!.spot, id);
const secSpot = (page: Page, sec: string) => page.evaluate((sec) => +document.getElementById(sec)!.dataset.spot!, sec);
const jump = (page: Page, to: number) =>
  page.evaluate((to) => {
    const top = document.getElementById("runway")!.getBoundingClientRect().top + scrollY;
    const y = top + to * (window as unknown as { __film: Film }).__film.screen;
    scrollTo(0, y);
    dispatchEvent(new CustomEvent("film:jump", { detail: { y } }));
  }, to);
// a link, clicked as the page takes it (the map's names show only once it's grown)
const take = (page: Page, sec: string) => page.evaluate((sec) => document.querySelector<HTMLAnchorElement>(`nav.routemap a[href="#${sec}"]`)!.click(), sec);

test("a link warps: the page is locked on the way, it lands on the section's first entry, and focus goes to its heading", async ({ page }) => {
  await open(page);
  await ready(page);
  const from = await spotOf(page, "about-1");
  await jump(page, from);
  await expect.poll(() => t(page).then((x) => Math.abs(x - from))).toBeLessThan(0.01);
  await take(page, "sec-work");
  await expect.poll(() => running(page)).toBe(true);
  // a wheel on the way is swallowed: the film holds where it left from until the jump
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 1600);
  await page.waitForTimeout(400);
  expect(Math.abs((await t(page)) - from)).toBeLessThan(0.05);
  await expect.poll(() => running(page), { timeout: 10000 }).toBe(false);
  // Work's first entry is where its build starts, August 2023, past its intro
  const work = await spotOf(page, "tail");
  await expect.poll(() => t(page).then((x) => Math.abs(x - work))).toBeLessThan(0.01);
  await expect(page).toHaveURL(/#sec-work$/);
  // focus is on its heading, so the film stays there rather than gliding back to the intro
  expect(await page.evaluate(() => document.activeElement?.closest("[data-block]")?.getAttribute("data-block"))).toBe("tail");
  await page.waitForTimeout(800);
  expect(Math.abs((await t(page)) - work)).toBeLessThan(0.01);
});

test("Esc hurries it", async ({ page }) => {
  await open(page);
  await ready(page);
  await jump(page, await spotOf(page, "about-1"));
  await page.waitForTimeout(800);
  await take(page, "sec-contact");
  await expect.poll(() => running(page)).toBe(true);
  const t0 = Date.now();
  await page.waitForTimeout(300);
  await page.keyboard.press("Escape");
  await expect.poll(() => running(page), { timeout: 5000 }).toBe(false);
  expect(Date.now() - t0).toBeLessThan(3000);
  const contact = await secSpot(page, "sec-contact");
  await expect.poll(() => t(page).then((x) => Math.abs(x - contact))).toBeLessThan(0.01);
});

test("a link clicked while he lands, once the page is given back, warps on rather than being lost", async ({ page }) => {
  await open(page);
  await ready(page);
  await jump(page, await spotOf(page, "about-1"));
  await page.waitForTimeout(800);
  await take(page, "sec-work");
  await expect.poll(() => running(page)).toBe(true);
  const unlock = await page.evaluate(() => (window as unknown as { __warp: { plan: { unlock: number } } }).__warp.plan.unlock);
  // the page is his again, and his landing is still playing out
  await page.waitForFunction((u) => ((window as unknown as { __warp: { time(): number | null } }).__warp.time() ?? 0) > u + 0.1, unlock, { timeout: 15000 });
  expect(await running(page)).toBe(true);
  await take(page, "sec-contact");
  await expect.poll(() => running(page), { timeout: 15000 }).toBe(false);
  const contact = await secSpot(page, "sec-contact");
  await expect.poll(() => t(page).then((x) => Math.abs(x - contact))).toBeLessThan(0.01);
  await expect(page).toHaveURL(/#sec-contact$/);
});

// his fire as the trail is given it and draws it (the dev handle's gear): its points, and how many of each jet's are lit
type Scene = { children: Array<{ geometry: { attributes: { aA: { array: Float32Array } } } }> };
type Renderer = { render: (s: Scene, cam: unknown) => void };
type Trail = { push: (j: number, p: { x: number; y: number }, ...rest: unknown[]) => void; draw: (r: Renderer, ...rest: unknown[]) => void };
type Fire = { pts: Array<Array<[number, number, number]>>; lit: Array<[number, number]> };
test("his fire leaves smooth streaks round his circle, and shows in the throat as soon as he's back in view", async ({ page }) => {
  await open(page);
  await page.waitForFunction(() => (window as unknown as { __warp?: Warp }).__warp?.ready().flight, null, { timeout: 30000 });
  await jump(page, await spotOf(page, "about-1"));
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const w = (window as unknown as { __warp: { time(): number | null; gear: { trail: Trail } } }).__warp, tr = w.gear.trail;
    const fire: Fire = { pts: [[], [], []], lit: [] };
    (window as unknown as { __fire: Fire }).__fire = fire;
    const push = tr.push.bind(tr), draw = tr.draw.bind(tr);
    tr.push = (j, p, ...rest) => { fire.pts[j]?.push([w.time() ?? 0, p.x, p.y]); push(j, p, ...rest); };
    // the trail only renders through its renderer: one that reads the ribbon's alphas on the way
    tr.draw = (r, ...rest) => {
      let lit = 0;
      draw({ render: (s, cam) => { lit = s.children[0]!.geometry.attributes.aA.array.reduce((n, a, i) => n + (i % 2 === 0 && a > 0.02 ? 1 : 0), 0); r.render(s, cam); } }, ...rest);
      fire.lit.push([w.time() ?? 0, lit]);
    };
  });
  await take(page, "sec-work");
  await expect.poll(() => running(page)).toBe(true);
  const plan = await page.evaluate(() => (window as unknown as { __warp: { plan: { circle: [number, number]; travel: [number, number] } } }).__warp.plan);
  await expect.poll(() => running(page), { timeout: 15000 }).toBe(false);
  const fire = await page.evaluate(() => (window as unknown as { __fire: Fire }).__fire);
  // round his circle (before he brakes off it), each jet's line turns gently from point to point: no saw-teeth
  const [c0, c1] = plan.circle, from = c0 + (c1 - c0) * 0.1, to = c0 + (c1 - c0) * 0.65;
  for (const pts of fire.pts) {
    const on = pts.filter(([tt]) => tt > from && tt < to);
    const turns: number[] = [];
    for (let i = 2; i < on.length; i++) {
      const [, ax, ay] = on[i - 2]!, [, bx, by] = on[i - 1]!, [, cx, cy] = on[i]!;
      const ux = bx - ax, uy = by - ay, vx = cx - bx, vy = cy - by;
      if (Math.hypot(ux, uy) < 0.5 || Math.hypot(vx, vy) < 0.5) continue;
      turns.push(Math.abs(Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)) * (180 / Math.PI));
    }
    turns.sort((a, b) => a - b);
    expect(turns.length).toBeGreaterThan(20);
    expect(turns[Math.floor(turns.length / 2)]!).toBeLessThan(8);
  }
  // down the throat, his fire is drawn from the first moments he's back in view, not held back by the hole outside
  const early = fire.lit.filter(([tt]) => tt > plan.travel[0] && tt < plan.travel[0] + 0.4).map(([, n]) => n);
  expect(Math.max(0, ...early)).toBeGreaterThan(10);
});

test("the warp's fire takes the destination's hue, not orange", async ({ page }) => {
  await open(page);
  await ready(page);
  await jump(page, await spotOf(page, "about-1"));
  await page.waitForTimeout(800);
  // the trail's accent, as it's drawn
  await page.evaluate(() => {
    type Drawn = { children: Array<{ material: { uniforms: { uAccent: { value: { toArray(): number[] } } } } }> };
    const w = window as unknown as { __accent: number[] | null; __warp: { gear: { trail: { draw: (r: { render: (s: Drawn, c: unknown) => void }, ...rest: unknown[]) => void } } } };
    const tr = w.__warp.gear.trail, draw = tr.draw.bind(tr);
    w.__accent = null;
    tr.draw = (r, ...rest) => draw({ render: (s, c) => { w.__accent = s.children[0]!.material.uniforms.uAccent.value.toArray(); r.render(s, c); } }, ...rest);
  });
  await take(page, "sec-work");
  await expect.poll(() => page.evaluate(() => (window as unknown as { __accent: number[] | null }).__accent), { timeout: 10000 }).not.toBeNull();
  const [, C, h] = oklchOf((await page.evaluate(() => (window as unknown as { __accent: number[] }).__accent)));
  expect(C).toBeGreaterThan(0.08);
  expect(Math.abs(((h - REGION_LIGHT.work.tint[2] + 540) % 360) - 180)).toBeLessThan(3);
  await expect.poll(() => running(page), { timeout: 15000 }).toBe(false);
});

test.describe("under reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });
  test("it's a crossfade: no journey, it lands on the section's first entry", async ({ page }) => {
    await open(page);
    await jump(page, await spotOf(page, "about-1"));
    await page.waitForTimeout(500);
    await take(page, "sec-projects");
    await expect.poll(() => running(page), { timeout: 3000 }).toBe(false);
    const projects = await spotOf(page, "athena");
    await expect.poll(() => t(page).then((x) => Math.abs(x - projects)), { timeout: 3000 }).toBeLessThan(0.01);
    expect(await page.locator(".tycho-flight").count()).toBe(0);
  });
});
