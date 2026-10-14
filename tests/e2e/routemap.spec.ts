import { expect, test, type Page } from "@playwright/test";

// The route map: the nav, top right. The voyage needs a real GPU (see voyage.spec.ts): ANGLE on Metal.
test.use({ launchOptions: { args: ["--enable-gpu", "--use-angle=metal"] } });

// A returning visitor lands straight on the portfolio; the wake-up is left out (`wake=off`).
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("jrz-chat-v1", JSON.stringify({ messages: [], threadId: "e2e", activated: true })),
  );
});

type Film = { t: number; screen: number; blocks: Array<{ id: string; spot: number }> };
const film = (page: Page) => page.evaluate(() => {
  const f = (window as unknown as { __film: Film }).__film;
  return { t: f.t, screen: f.screen, blocks: f.blocks };
});
const open = async (page: Page) => {
  await page.goto("/?wake=off");
  await expect(page.locator("[data-universe]")).toHaveAttribute("data-universe", "ready", { timeout: 30000 });
};
const spotOf = async (page: Page, id: string) => (await film(page)).blocks.find((b) => b.id.startsWith(id))!.spot;
// where a section's link lands: its first entry, past an intro
const secSpot = (page: Page, sec: string) => page.evaluate((sec) => +document.getElementById(sec)!.dataset.spot!, sec);
const settlesAt = async (page: Page, spot: number, timeout = 8000) =>
  expect.poll(async () => Math.abs((await film(page)).t - spot), { timeout }).toBeLessThan(0.01);
const jump = (page: Page, t: number) =>
  page.evaluate((t) => {
    const top = document.getElementById("runway")!.getBoundingClientRect().top + scrollY;
    const y = top + t * (window as unknown as { __film: Film }).__film.screen;
    scrollTo(0, y);
    dispatchEvent(new CustomEvent("film:jump", { detail: { y } }));
  }, t);
const nav = (page: Page) => page.locator("nav.routemap");
const link = (page: Page, sec: string) => page.locator(`nav.routemap a[href="#${sec}"]`);
const names = (page: Page) => page.locator("nav.routemap .rm-links .rm-name");
// a visitor's click: the pointer comes onto the map (it grows, its names hang beside it), then takes the link
const take = async (page: Page, sec: string) => {
  const map = await page.locator("nav.routemap .rm-map").boundingBox();
  await page.mouse.move(map!.x + map!.width / 2, map!.y + map!.height / 2);
  await expect(nav(page)).toHaveAttribute("data-grown", "");
  await page.waitForTimeout(700);
  await link(page, sec).click();
};
const shownNames = (page: Page) => names(page).evaluateAll((els) => els.filter((e) => getComputedStyle(e).opacity === "1").map((e) => e.textContent));

test.describe("on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("at rest it names only the section you're in, and its link is marked as where you are", async ({ page }) => {
    await open(page);
    await jump(page, await spotOf(page, "about-1"));
    await expect(link(page, "sec-about")).toHaveAttribute("aria-current", "location");
    await expect.poll(() => shownNames(page)).toEqual(["About"]);
  });

  test("hover opens it: the map grows and the five names hang beside it in page order; leaving folds it", async ({ page }) => {
    await open(page);
    const map = await page.locator("nav.routemap .rm-map").boundingBox();
    await page.mouse.move(map!.x + map!.width / 2, map!.y + map!.height / 2);
    await expect(nav(page)).toHaveAttribute("data-grown", "");
    await expect.poll(() => shownNames(page)).toEqual(["Start", "About", "Work", "Projects", "Contact"]);
    await page.mouse.move(400, 600);
    await expect(nav(page)).not.toHaveAttribute("data-grown", "");
  });

  test("leaving folds it the way it opened: the leader lines draw back into their marks before the map shrinks", async ({ page }) => {
    await open(page);
    const map = await page.locator("nav.routemap .rm-map").boundingBox();
    await page.mouse.move(map!.x + map!.width / 2, map!.y + map!.height / 2);
    await expect(nav(page)).toHaveAttribute("data-grown", "");
    await page.waitForTimeout(900);
    // every frame of the fold: how much of the most drawn line is left, and how grown the map still is
    const frames = page.evaluate(() => new Promise<Array<{ drawn: number; scale: number }>>((done) => {
      const el = document.querySelector<HTMLElement>("nav.routemap")!, box = el.querySelector<HTMLElement>(".rm-map")!;
      const out: Array<{ drawn: number; scale: number }> = [], t0 = performance.now();
      const tick = () => {
        const lines = [...el.querySelectorAll<SVGLineElement>(".rm-leaders line")];
        const drawn = Math.max(0, ...lines.map((l) => 1 - (parseFloat(getComputedStyle(l).strokeDashoffset) || 0)));
        out.push({ drawn, scale: new DOMMatrix(getComputedStyle(box).transform).a });
        if (!("grown" in el.dataset) || performance.now() - t0 > 3000) done(out);
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }));
    await page.mouse.move(400, 600);
    const f = await frames;
    const gone = f.find((x) => x.drawn <= 0.01)!;
    expect(gone.scale).toBeGreaterThan(0.9 * (236 / 92));
  });

  test("coming back to the window (alt-tab) doesn't open it, though the browser gives a link its focus back", async ({ page }) => {
    await open(page);
    // a link keeps focus with the map folded: Start, taken in the opening, glides back without a warp
    await take(page, "sec-hero");
    await page.mouse.move(400, 600);
    await expect(nav(page)).not.toHaveAttribute("data-open");
    expect(await page.evaluate(() => !!document.activeElement?.closest("nav.routemap"))).toBe(true);
    // away: the window loses focus, and the link with it; back: the window gets it again, and gives it to the link
    await page.evaluate(() => {
      const a = document.activeElement as HTMLElement;
      (window as unknown as { __had: HTMLElement }).__had = a;
      dispatchEvent(new FocusEvent("blur"));
      a.blur();
    });
    await page.evaluate(() => {
      dispatchEvent(new FocusEvent("focus"));
      (window as unknown as { __had: HTMLElement }).__had.focus();
    });
    await page.waitForTimeout(600);
    await expect(nav(page)).not.toHaveAttribute("data-open");
    // the keyboard still opens it
    await page.keyboard.press("Tab");
    await expect(nav(page)).toHaveAttribute("data-open");
  });

  test("coming back while it folds keeps it open, its names on their lines", async ({ page }) => {
    await open(page);
    const map = await page.locator("nav.routemap .rm-map").boundingBox();
    const onMap = () => page.mouse.move(map!.x + map!.width / 2, map!.y + map!.height / 2);
    await onMap();
    await expect(nav(page)).toHaveAttribute("data-grown", "");
    await page.waitForTimeout(900);
    await page.mouse.move(400, 600);
    await page.waitForTimeout(100);
    await onMap();
    await page.waitForTimeout(1000);
    await expect(nav(page)).toHaveAttribute("data-grown", "");
    expect(await page.locator("nav.routemap .rm-leaders line").count()).toBe(5);
    await expect.poll(() => shownNames(page)).toEqual(["Start", "About", "Work", "Projects", "Contact"]);
  });

  test("coming back while it folds takes over from where it's got to, not from the start: it's back whole at once", async ({ page }) => {
    await open(page);
    const map = await page.locator("nav.routemap .rm-map").boundingBox();
    const onMap = () => page.mouse.move(map!.x + map!.width / 2, map!.y + map!.height / 2);
    await onMap();
    await expect(nav(page)).toHaveAttribute("data-grown", "");
    await page.waitForTimeout(900);
    // every frame across the leave and the return: whether all five names are in and all five lines drawn, and when
    // it was opened again
    await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>("nav.routemap")!;
      const rec = { opened: -1, frames: [] as Array<{ t: number; whole: boolean }> };
      (window as unknown as { __rm: typeof rec }).__rm = rec;
      new MutationObserver(() => { if ("open" in el.dataset) rec.opened = performance.now(); }).observe(el, { attributes: true, attributeFilter: ["data-open"] });
      const tick = () => {
        const names = [...el.querySelectorAll(".rm-links li")].map((li) => +getComputedStyle(li).opacity);
        const lines = [...el.querySelectorAll(".rm-leaders line")].map((l) => parseFloat(getComputedStyle(l).strokeDashoffset) || 0);
        rec.frames.push({ t: performance.now(), whole: names.every((o) => o > 0.99) && lines.length === 5 && lines.every((d) => d < 0.01) });
        if (rec.frames.length < 150) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.mouse.move(400, 600);
    await page.waitForTimeout(30);
    await onMap();
    await page.waitForTimeout(1300);
    const { opened, frames } = await page.evaluate(() => (window as unknown as { __rm: { opened: number; frames: Array<{ t: number; whole: boolean }> } }).__rm);
    expect(opened).toBeGreaterThan(0);
    // with the map still grown the names and lines come straight back (a third of a second); started over, the lines
    // would wait a quarter of a second and the names 0.4 s, and be whole only after 0.86 s
    const whole = frames.find((f) => f.t >= opened && f.whole);
    expect(whole).toBeDefined();
    expect(whole!.t - opened).toBeLessThan(600);
    await expect.poll(() => shownNames(page)).toEqual(["Start", "About", "Work", "Projects", "Contact"]);
  });

  test("the leader lines draw out from their marks, their dots waiting for the map to grow (they're laid out for it)", async ({ page }) => {
    await open(page);
    const map = await page.locator("nav.routemap .rm-map").boundingBox();
    const frames = page.evaluate(() => new Promise<Array<{ scale: number; dot: number; part: boolean }>>((done) => {
      const el = document.querySelector<HTMLElement>("nav.routemap")!, box = el.querySelector<HTMLElement>(".rm-map")!;
      const out: Array<{ scale: number; dot: number; part: boolean }> = [], t0 = performance.now();
      const tick = () => {
        const dots = [...el.querySelectorAll<SVGCircleElement>(".rm-leaders circle")].map((c) => +getComputedStyle(c).opacity);
        const lines = [...el.querySelectorAll<SVGLineElement>(".rm-leaders line")].map((l) => parseFloat(getComputedStyle(l).strokeDashoffset) || 0);
        out.push({ scale: new DOMMatrix(getComputedStyle(box).transform).a, dot: Math.max(0, ...dots), part: lines.some((d) => d > 0.05 && d < 0.95) });
        if (performance.now() - t0 > 1000) done(out);
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }));
    await page.mouse.move(map!.x + map!.width / 2, map!.y + map!.height / 2);
    const f = await frames;
    expect(f.some((x) => x.dot > 0.99)).toBe(true);
    expect(f.filter((x) => x.scale < 0.9 * (236 / 92) && x.dot > 0.01)).toEqual([]);
    // a line part-drawn on some frame: drawn out, not popped on whole
    expect(f.filter((x) => x.part).length).toBeGreaterThan(2);
  });

  test("a link a click left focused doesn't hold it open: leaving still folds it", async ({ page }) => {
    await open(page);
    const map = await page.locator("nav.routemap .rm-map").boundingBox();
    // Start, taken in the opening, glides back without a warp, so its link keeps the focus the click gave it
    await take(page, "sec-hero");
    await page.mouse.move(400, 600);
    await expect(nav(page)).not.toHaveAttribute("data-open");
    expect(await page.evaluate(() => document.activeElement?.getAttribute("href"))).toBe("#sec-hero");
    await page.mouse.move(map!.x + map!.width / 2, map!.y + map!.height / 2);
    await expect(nav(page)).toHaveAttribute("data-grown", "");
    await page.waitForTimeout(700);
    await page.mouse.move(400, 600);
    await expect(nav(page)).not.toHaveAttribute("data-open");
    await expect(nav(page)).not.toHaveAttribute("data-grown", "");
    await expect.poll(() => shownNames(page)).toEqual(["Start"]);
  });

  test("the names of the sections you've left are dimmed on the grown map, as the others are", async ({ page }) => {
    await open(page);
    // Start is where it opens, so its name took the arriving light; then About
    await jump(page, await spotOf(page, "about-1"));
    await expect(link(page, "sec-about")).toHaveAttribute("aria-current", "location");
    await page.waitForTimeout(1500);
    const map = await page.locator("nav.routemap .rm-map").boundingBox();
    await page.mouse.move(map!.x + map!.width / 2, map!.y + map!.height / 2);
    await expect(nav(page)).toHaveAttribute("data-grown", "");
    const color = (sec: string) => page.locator(`nav.routemap a[href="#${sec}"] .rm-name`).evaluate((n) => getComputedStyle(n).color);
    expect(await color("sec-hero")).toBe(await color("sec-work"));
    expect(await color("sec-about")).not.toBe(await color("sec-work"));
  });

  test("a hover while a trip plays leaves it folded (the names are hidden then), and it opens once it's landed", async ({ page }) => {
    await open(page);
    const from = await spotOf(page, "about-1");
    await jump(page, from);
    await settlesAt(page, from);
    // the map at rest: where the pointer rests on it once it's folded
    const map = await page.locator("nav.routemap .rm-map").boundingBox();
    await take(page, "sec-work");
    await expect(nav(page)).toHaveAttribute("data-warp", "");
    await page.mouse.move(400, 600);
    await page.mouse.move(map!.x + map!.width / 2, map!.y + map!.height / 2);
    await page.waitForTimeout(700);
    await expect(nav(page)).toHaveAttribute("data-warp", "");
    await expect(nav(page)).not.toHaveAttribute("data-grown", "");
    expect(await page.locator("nav.routemap .rm-leaders line").count()).toBe(0);
    await expect(nav(page)).not.toHaveAttribute("data-warp", "", { timeout: 10000 });
    await expect(nav(page)).toHaveAttribute("data-grown", "");
    await expect.poll(() => shownNames(page)).toEqual(["Start", "About", "Work", "Projects", "Contact"]);
  });

  test("narrowed to a phone's width while it's open, nothing of the grown map is left on the sheet", async ({ page }) => {
    await open(page);
    await link(page, "sec-about").focus();
    await expect(nav(page)).toHaveAttribute("data-grown", "");
    await page.waitForTimeout(900);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(nav(page)).toHaveAttribute("data-phone");
    await expect(nav(page)).not.toHaveAttribute("data-grown", "");
    expect(await page.locator("nav.routemap .rm-leaders line").count()).toBe(0);
    expect(await page.locator("nav.routemap .rm-links li").evaluateAll((lis) => lis.map((li) => li.getAttribute("style") ?? ""))).toEqual(["", "", "", "", ""]);
  });

  test("focus opens it, the keyboard takes the names in page order, and Escape folds it", async ({ page }) => {
    await open(page);
    await link(page, "sec-hero").focus();
    await expect(nav(page)).toHaveAttribute("data-open");
    const order: string[] = [];
    for (let k = 0; k < 5; k++) {
      order.push((await page.evaluate(() => document.activeElement?.getAttribute("href"))) ?? "");
      if (k < 4) await page.keyboard.press("Tab");
    }
    expect(order).toEqual(["#sec-hero", "#sec-about", "#sec-work", "#sec-projects", "#sec-contact"]);
    await page.keyboard.press("Escape");
    await expect(nav(page)).not.toHaveAttribute("data-open");
  });

  test("a link to another section goes to its first entry, past its intro, playing the trip in miniature, and Back returns", async ({ page }) => {
    await open(page);
    const from = await spotOf(page, "about-1");
    await jump(page, from);
    await settlesAt(page, from);
    await take(page, "sec-work");
    await expect(nav(page)).toHaveAttribute("data-warp", "");
    await expect(page.locator("nav.routemap .rm-here")).toHaveText("→ Work");
    expect(await secSpot(page, "sec-work")).toBe(await spotOf(page, "tail"));
    await settlesAt(page, await spotOf(page, "tail"));
    await expect(page).toHaveURL(/#sec-work$/);
    await expect(nav(page)).not.toHaveAttribute("data-warp", "", { timeout: 8000 });
    await page.goBack();
    await settlesAt(page, from);
  });

  test("a link to the section you're in glides back to its first entry, with no trip", async ({ page }) => {
    await open(page);
    const first = await spotOf(page, "tail");
    const later = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>("#sec-work [data-spot]")].map((e) => +e.dataset.spot!)[2]!);
    await jump(page, later);
    await settlesAt(page, later);
    await expect(link(page, "sec-work")).toHaveAttribute("aria-current", "location");
    await take(page, "sec-work");
    await expect(nav(page)).not.toHaveAttribute("data-warp", "");
    await settlesAt(page, first);
    expect(await page.locator("#veil").evaluate((v) => +getComputedStyle(v).opacity)).toBeLessThan(0.01);
  });

  test("Start replays from past the opening: the frame goes black and lands on the film's first frame", async ({ page }) => {
    await open(page);
    await jump(page, await spotOf(page, "contact"));
    await expect(link(page, "sec-contact")).toHaveAttribute("aria-current", "location");
    await take(page, "sec-hero");
    await expect.poll(() => page.locator("#veil").evaluate((v) => +getComputedStyle(v).opacity), { timeout: 3000 }).toBeGreaterThan(0.95);
    await settlesAt(page, 0);
    await expect(page).toHaveURL(/#sec-hero$/);
    await expect.poll(() => page.locator("#veil").evaluate((v) => +getComputedStyle(v).opacity), { timeout: 4000 }).toBeLessThan(0.01);
  });

  test("Start in the opening glides back to its beginning, without the black", async ({ page }) => {
    await open(page);
    const hero = await secSpot(page, "sec-hero");
    await jump(page, hero + 0.8);
    await expect(link(page, "sec-hero")).toHaveAttribute("aria-current", "location");
    await take(page, "sec-hero");
    await page.waitForTimeout(300);
    expect(await page.locator("#veil").evaluate((v) => +getComputedStyle(v).opacity)).toBeLessThan(0.01);
    await settlesAt(page, hero);
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the pill drops a sheet of five 44-px rows; Escape folds it and gives focus back to the pill", async ({ page }) => {
    await open(page);
    const pill = page.locator("nav.routemap .rm-pill");
    await expect(pill).toBeVisible();
    await pill.tap();
    await expect(pill).toHaveAttribute("aria-expanded", "true");
    const rows = await page.locator("nav.routemap .rm-links a").evaluateAll((as) => as.map((a) => a.getBoundingClientRect().height));
    expect(rows).toHaveLength(5);
    for (const h of rows) expect(h).toBeGreaterThanOrEqual(44);
    await page.keyboard.press("Escape");
    await expect(pill).toHaveAttribute("aria-expanded", "false");
    await expect(pill).toBeFocused();
  });

  test("a tap outside folds the sheet", async ({ page }) => {
    await open(page);
    const pill = page.locator("nav.routemap .rm-pill");
    await pill.tap();
    await expect(pill).toHaveAttribute("aria-expanded", "true");
    await page.touchscreen.tap(60, 600);
    await expect(pill).toHaveAttribute("aria-expanded", "false");
  });

  test("a row takes you there and folds the sheet; the pill names where you're going, then where you are", async ({ page }) => {
    await open(page);
    await jump(page, await spotOf(page, "about-1"));
    const pill = page.locator("nav.routemap .rm-pill");
    await pill.tap();
    await link(page, "sec-projects").tap();
    await expect(pill).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("nav.routemap .rm-pill-name")).toHaveText("→ Projects");
    await settlesAt(page, await spotOf(page, "athena"), 10000);
    await expect(page.locator("nav.routemap .rm-pill-name")).toHaveText("Projects", { timeout: 8000 });
  });
});
