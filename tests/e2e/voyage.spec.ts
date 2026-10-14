import { expect, test, type Page } from "@playwright/test";

// The voyage needs a real GPU: Playwright's default headless renders WebGL in software, which the universe refuses
// (the page would turn plain). ANGLE on Metal is this machine's.
test.use({ launchOptions: { args: ["--enable-gpu", "--use-angle=metal"] } });

// A returning visitor lands straight on the portfolio.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("jrz-chat-v1", JSON.stringify({ messages: [], threadId: "e2e", activated: true })),
  );
});

type Film = { t: number; total: number; screen: number; blocks: Array<{ id: string; spot: number }> };
const film = (page: Page) => page.evaluate(() => {
  const f = (window as unknown as { __film: Film }).__film;
  return { t: f.t, total: f.total, screen: f.screen, blocks: f.blocks };
});
const stageReady = (page: Page) => expect(page.locator("[data-universe]")).toHaveAttribute("data-universe", "ready", { timeout: 20000 });
const spotOf = async (page: Page, id: string) => (await film(page)).blocks.find((b) => b.id === id)!.spot;
// the film's time settles where the scroll put it
const settlesAt = async (page: Page, spot: number) =>
  expect.poll(async () => Math.abs((await film(page)).t - spot), { timeout: 8000 }).toBeLessThan(0.01);
// every word of a block is written in (a block of labels alone: every label is hung)
const wordsIn = (page: Page, id: string) =>
  page.evaluate((id) => {
    const words = [...document.querySelectorAll<HTMLElement>(`[data-block="${id}"] .w`)];
    const shown = words.length ? words : [...document.querySelectorAll<HTMLElement>(`[data-block="${id}"] .label`)];
    return shown.length > 0 && shown.every((w) => getComputedStyle(w).opacity === "1");
  }, id);
const jump = (page: Page, t: number) =>
  page.evaluate((t) => {
    const top = document.getElementById("runway")!.getBoundingClientRect().top + scrollY;
    const y = top + t * (window as unknown as { __film: Film }).__film.screen;
    scrollTo(0, y);
    dispatchEvent(new CustomEvent("film:jump", { detail: { y } }));
  }, t);

// the film's fastest turn (degrees a screen) between two times, from its own path, leaving out the throws' cuts, each
// hidden by its flash (window.__path and window.__cuts, development only; scripts/film/turns.mjs prints the stretches)
const peakTurn = (page: Page, from: number, to: number) =>
  page.evaluate(({ a, b }) => {
    const w = window as unknown as { __path: (t: number) => { pos: number[]; target: number[] }; __cuts: number[] };
    const dir = (p: { pos: number[]; target: number[] }) => {
      const d = [p.target[0]! - p.pos[0]!, p.target[1]! - p.pos[1]!, p.target[2]! - p.pos[2]!], l = Math.hypot(d[0]!, d[1]!, d[2]!);
      return d.map((x) => x / l);
    };
    let peak = 0, prev = dir(w.__path(a));
    for (let t = a + 0.005; t <= b; t += 0.005) {
      const cur = dir(w.__path(t));
      if (!w.__cuts.some((c) => t >= c - 0.12 && t <= c + 0.15)) peak = Math.max(peak, (Math.acos(Math.min(1, prev[0]! * cur[0]! + prev[1]! * cur[1]! + prev[2]! * cur[2]!)) * 180) / Math.PI / 0.005);
      prev = cur;
    }
    return peak;
  }, { a: from, b: to });

test("the runway is the page's text in film order: five sections, one article per block, the film's length tall", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#sec-about")).toBeVisible();
  // the film binds the runway once the page has hydrated
  await page.waitForFunction(() => "__film" in window);
  const ids = await page.locator("#runway > section").evaluateAll((s) => s.map((x) => x.id));
  expect(ids).toEqual(["sec-hero", "sec-about", "sec-work", "sec-projects", "sec-contact"]);
  const f = await film(page);
  expect(await page.locator("#runway article").count()).toBe(f.blocks.length);
  const runway = await page.locator("#runway").evaluate((r) => r.getBoundingClientRect().height);
  expect(Math.abs(runway / f.screen - (f.total + 1))).toBeLessThan(0.01);
  // the hero is written in at first paint, before the picture has loaded
  expect(await wordsIn(page, "hero")).toBe(true);
});

test("a section's deep link lands on its first entry, past its intro, with the text in", async ({ page }) => {
  await page.goto("/#sec-work");
  await stageReady(page);
  // Work's first entry is where its build starts: August 2023, home's core alone
  await settlesAt(page, await spotOf(page, "tail"));
  await expect.poll(() => wordsIn(page, "tail")).toBe(true);
});

test("a project's deep link and a typed hash land on the project's reading spot", async ({ page }) => {
  await page.goto("/#project-athena");
  await stageReady(page);
  await settlesAt(page, await spotOf(page, "athena"));
  await page.evaluate(() => { location.hash = "#project-mercado"; });
  await settlesAt(page, await spotOf(page, "own-mercado"));
  await expect.poll(() => wordsIn(page, "own-mercado")).toBe(true);
});

test("an in-page link glides through the film to the reading spot, and Back returns", async ({ page }) => {
  await page.goto("/");
  await stageReady(page);
  await page.evaluate(() => {
    const a = document.createElement("a");
    a.href = "#sec-contact";
    a.id = "e2e-link";
    document.body.prepend(a);
  });
  await page.evaluate(() => (document.getElementById("e2e-link") as HTMLAnchorElement).click());
  await expect(page).toHaveURL(/#sec-contact$/);
  await settlesAt(page, await spotOf(page, "contact"));
  await page.goBack();
  await settlesAt(page, 0);
});

test("keyboard focus lands on the reading spot of the block it's in", async ({ page }) => {
  await page.goto("/");
  await stageReady(page);
  await page.locator('#sec-contact a[href^="mailto:"]').focus();
  await settlesAt(page, await spotOf(page, "contact"));
  await expect.poll(() => wordsIn(page, "contact")).toBe(true);
});

test("every block's text is fully in at its reading spot, and its title is in the frame", async ({ page }) => {
  await page.goto("/");
  await stageReady(page);
  const { blocks } = await film(page);
  for (const b of blocks) {
    await jump(page, b.spot);
    await expect.poll(() => wordsIn(page, b.id), { message: b.id }).toBe(true);
    const title = await page.evaluate((id) => {
      const t = document.querySelector<HTMLElement>(`[data-block="${id}"] .title`);
      if (!t) return true;
      const r = t.getBoundingClientRect();
      return r.width > 0 && r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight;
    }, b.id);
    expect(title, b.id).toBe(true);
  }
});

test("Tab coming into the page's text enters at the block on screen, and the film stays there", async ({ page }) => {
  await page.goto("/");
  await stageReady(page);
  const athena = await spotOf(page, "athena");
  await jump(page, athena);
  await settlesAt(page, athena);
  const focusedBlock = () => page.evaluate(() => document.activeElement?.closest("[data-block]")?.getAttribute("data-block") ?? null);
  // forward, from the route map's last link (before the text)
  await page.locator('nav.routemap a[href="#sec-contact"]').focus();
  await page.keyboard.press("Tab");
  expect(await focusedBlock()).toBe("athena");
  await page.waitForTimeout(800);
  expect(Math.abs((await film(page)).t - athena)).toBeLessThan(0.05);
  // backward, from the sound toggle (after the text)
  await page.locator(".snd > .snd-chip").focus();
  await page.keyboard.press("Shift+Tab");
  expect(await focusedBlock()).toBe("athena");
  await page.waitForTimeout(800);
  expect(Math.abs((await film(page)).t - athena)).toBeLessThan(0.05);
});

test("a resize far along doesn't bring the later bodies back early: back in the hero, the relay, Athena, the crawler and their moons are hidden", async ({ page }) => {
  await page.goto("/");
  await stageReady(page);
  await jump(page, await spotOf(page, "crawler"));
  await settlesAt(page, await spotOf(page, "crawler"));
  // the film is laid out again for the new size
  await page.setViewportSize({ width: 1180, height: 800 });
  await page.waitForTimeout(800);
  await jump(page, 0.6);
  await settlesAt(page, 0.6);
  // the picture catches up with the film's time on its next frame
  const hidden = () => page.evaluate(() => Object.values((window as unknown as { __shown: () => Record<string, number | number[]> }).__shown()).flat().every((v) => v === 0));
  await expect.poll(hidden, { timeout: 3000 }).toBe(true);
});

test("the dive passes the hero's lockup: each row pushed out from his star and growing, gone by the time it's dived", async ({ page }) => {
  await page.goto("/");
  await stageReady(page);
  const rows = () => page.locator('[data-block="hero"] [data-row]').evaluateAll((rs) => rs.map((r) => ({ tf: getComputedStyle(r).transform, o: Number(getComputedStyle(r).opacity) })));
  // a jump sets the film's time at once; the frame is written on the next tick
  await jump(page, 0.35);
  await expect.poll(async () => (await rows()).every((r) => r.tf !== "none")).toBe(true);
  await jump(page, 0.7);
  await expect.poll(async () => (await rows()).every((r) => r.o === 0)).toBe(true);
  // and it comes back the same way
  await jump(page, 0);
  await expect.poll(async () => (await rows()).every((r) => r.tf === "none" && r.o === 1)).toBe(true);
  expect(await wordsIn(page, "hero")).toBe(true);
});

test("About is written in word by word with the scroll: partway through a line, its first words in and the rest still to come", async ({ page }) => {
  await page.goto("/");
  await stageReady(page);
  // partway through writing About's first line (its in-window starts at 2.15 screens and takes 0.2)
  await jump(page, 2.27);
  const shown = () => page.locator('[data-block="about-1"] [data-row="1"] .w').evaluateAll((ws) => ws.map((w) => Number(getComputedStyle(w).opacity)));
  await expect.poll(async () => { const o = await shown(); return o[0]! > 0.9 && o.at(-1)! < 0.1; }).toBe(true);
  // and at its reading spot it's all in
  await jump(page, await spotOf(page, "about-1"));
  await expect.poll(() => wordsIn(page, "about-1")).toBe(true);
});

test("the camera turns gently all through the film: no whip or snap outside the throws' flashes (ADR 0003, 2026-10-12)", async ({ page }) => {
  await page.goto("/");
  await stageReady(page);
  await page.waitForFunction(() => "__path" in window);
  const total = await page.evaluate(() => (window as unknown as { __film: { total: number } }).__film.total);
  expect(await peakTurn(page, 0, total)).toBeLessThan(270);
});

test("the ribbon's frames come out of the shaft without the camera bobbing: its height moves one way, its view only tilts down (ADR 0016)", async ({ page }) => {
  await page.goto("/");
  await stageReady(page);
  await page.waitForFunction(() => "__path" in window);
  // from the climax's hold, as its words go, to the first project's reading spot on the ribbon
  const [from, to] = await Promise.all([spotOf(page, "outcome"), spotOf(page, "own-mercado")]);
  const swings = await page.evaluate(({ a, b }) => {
    const w = window as unknown as { __path: (t: number) => { pos: number[]; target: number[] } };
    const ys: number[] = [], pitch: number[] = [];
    for (let t = a; t <= b; t += 0.01) {
      const p = w.__path(t), d = [p.target[0]! - p.pos[0]!, p.target[1]! - p.pos[1]!, p.target[2]! - p.pos[2]!];
      ys.push(p.pos[1]!);
      pitch.push((Math.asin(d[1]! / Math.hypot(d[0]!, d[1]!, d[2]!)) * 180) / Math.PI);
    }
    // how far it goes against its way, up or down (the chase to the old ribbon rose 0.08 and dropped 0.1; a frame here is
    // ~0.03 tall)
    const steps = ys.slice(1).map((y, i) => y - ys[i]!), net = Math.sign(ys.at(-1)! - ys[0]!);
    return { back: steps.reduce((s, d) => s + (Math.sign(d) === -net ? Math.abs(d) : 0), 0), rise: Math.max(0, ...pitch.slice(1).map((x, i) => x - pitch[i]!)) };
  }, { a: from + 0.65, b: to });
  expect(swings.back).toBeLessThan(0.0002);
  expect(swings.rise).toBeLessThan(0.1);
});

test("a reload lands on the same frame", async ({ page }) => {
  await page.goto("/");
  await stageReady(page);
  await jump(page, 12.38);
  await settlesAt(page, 12.38);
  await page.reload();
  await stageReady(page);
  await settlesAt(page, 12.38);
});

test("under reduced motion, each reading spot is a still and its text is in", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#sec-about");
  await expect(page.locator("html")).toHaveAttribute("data-film", "still");
  await stageReady(page);
  await settlesAt(page, await spotOf(page, "about-1"));
  await expect.poll(() => wordsIn(page, "about-1")).toBe(true);
  await expect(page.locator("#stills canvas").first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.querySelector("[data-universe] canvas")!).visibility)).toBe("hidden");
});

test("without WebGL the page is the plain reading layout, every word shown", async ({ page }) => {
  await page.addInitScript(() => { delete (window as unknown as { WebGL2RenderingContext?: unknown }).WebGL2RenderingContext; });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-film", "plain");
  await expect(page.locator("[data-universe]")).toHaveAttribute("data-universe", "unsupported");
  const hidden = await page.locator("#runway .w").evaluateAll((ws) => ws.filter((w) => getComputedStyle(w).opacity !== "1").length);
  expect(hidden).toBe(0);
  // it flows: the page is about as tall as its text, not the film's length
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight / innerHeight)).toBeLessThan(20);
});

test.describe("on a phone, portrait", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("riding labels become a list under the lines, except those that ride on phones too", async ({ page }) => {
    await page.goto("/#sec-work");
    await stageReady(page);
    await expect(page.locator("html")).toHaveClass(/port/);
    // (Work lands where its build starts; LogoLife's quarter is its last)
    const spot = await spotOf(page, "role-logolife");
    await jump(page, spot);
    await settlesAt(page, spot);
    await expect(page.locator('[data-block="role-logolife"] .lablist')).toBeVisible();
    await expect(page.locator('[data-block="role-logolife"] .label').first()).toBeHidden();
    await expect(page.locator('[data-block="athena-open"] .label').first()).toBeAttached();
  });

  test("the camera turns gently all through the film, standing further off as a phone's frame needs", async ({ page }) => {
    await page.goto("/");
    await stageReady(page);
    await page.waitForFunction(() => "__path" in window);
    const total = await page.evaluate(() => (window as unknown as { __film: { total: number } }).__film.total);
    expect(await peakTurn(page, 0, total)).toBeLessThan(325);
  });
});
