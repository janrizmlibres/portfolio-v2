import { expect, test, type Page } from "@playwright/test";

// The wake-up plays the 3D Tycho and the sky, which want a real GPU (ANGLE on Metal is this machine's). An automated
// browser skips the wake-up unless the address asks for it.
test.use({ launchOptions: { args: ["--enable-gpu", "--use-angle=metal"] } });

const html = (page: Page) => page.locator("html");
const button = (page: Page) => page.getByRole("button", { name: "Wake Tycho (turns on sound)" });
const greeting = (page: Page) => page.getByRole("dialog", { name: "Tycho" }).getByText("Hi, I'm Tycho.");

/** Loads with the wake-up and waits for Tycho to doze, his button showing. */
async function dozing(page: Page, path = "/?wake=on") {
  await page.goto(path);
  await expect(html(page)).toHaveClass(/\bwake-lock\b/);
  await expect(page.locator("#wake")).toHaveAttribute("data-chip", "on", { timeout: 30_000 });
  await expect(button(page)).toBeVisible();
}
/** Clicks the middle of his ring, the wake's target with the button. */
async function clickRing(page: Page) {
  const b = (await page.locator("#wake .wk-frame").boundingBox())!;
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
}
const awake = async (page: Page) => {
  await expect(html(page)).not.toHaveClass(/\bwake\b/, { timeout: 10_000 });
  await expect(greeting(page)).toBeVisible();
};
/** How much of one of the wake-up's controls shows: its opacity, or 0 when it isn't drawn at all. */
const shown = (page: Page, sel: string) =>
  page.locator(sel).evaluate((e) => (e.checkVisibility({ visibilityProperty: true }) ? Number(getComputedStyle(e).opacity) : 0));

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem("jrz-chat-v1"));
});

test("the lock: nothing scrolls and nothing else answers until he wakes", async ({ page }) => {
  await dozing(page);
  await page.mouse.wheel(0, 1200);
  await page.keyboard.press("PageDown");
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  // the voyage's text and Tycho's keys are out of reach, and his bubble stays shut
  await expect(page.locator("#runway")).toHaveAttribute("inert", "");
  await expect(page.locator("#tycho .tycho-ask")).toBeHidden();
  await expect(page.getByRole("dialog", { name: "Tycho" })).toBeHidden();
  // the wake button is the first stop for the keyboard
  await page.keyboard.press("Tab");
  await expect(button(page)).toBeFocused();
});

test("a click outside his ring does nothing; inside it wakes him, and he greets a first visit", async ({ page }) => {
  await dozing(page);
  await page.mouse.click(40, 40);
  await page.waitForTimeout(400);
  await expect(html(page)).toHaveClass(/\bwake-lock\b/);
  await clickRing(page);
  await awake(page);
  await expect(page.locator("#runway")).not.toHaveAttribute("inert", "");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("Esc never wakes him; Enter does", async ({ page }) => {
  await dozing(page);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  await expect(html(page)).toHaveClass(/\bwake-lock\b/);
  await page.keyboard.press("Enter");
  await awake(page);
});

test("Space on the button wakes him", async ({ page }) => {
  await dozing(page);
  await button(page).focus();
  await page.keyboard.press(" ");
  await awake(page);
});

test("the button waits on the whole voyage: every scene built and the warp made before it shows, and nothing is built after it", async ({ page }) => {
  test.setTimeout(90_000);
  await dozing(page);
  // every later scene in and warmed, and the warp's hole and Tycho's flight rig made
  await expect(page.locator('[data-universe][data-stage="whole"]')).toBeAttached();
  expect(await page.evaluate(() => (window as unknown as { __warp: { ready(): { hole: boolean; flight: boolean } } }).__warp.ready())).toEqual({ hole: true, flight: true });
  const gpu = () => page.evaluate(() => {
    const info = (window as unknown as { __sky: { renderer: { info: { programs: unknown[]; memory: { textures: number; geometries: number } } } } }).__sky.renderer.info;
    return { programs: info.programs.length, textures: info.memory.textures, geometries: info.memory.geometries };
  });
  const before = await gpu();
  await clickRing(page);
  await awake(page);
  // hero → About at once, as a visitor scrolls: no shader compiles, no texture or geometry goes up
  await page.mouse.move(700, 500);
  for (let i = 0; i < 30; i++) {
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(40);
  }
  await expect.poll(() => page.evaluate(() => (window as unknown as { __film: { t: number } }).__film.t), { timeout: 10_000 }).toBeGreaterThan(3);
  await page.waitForTimeout(500);
  expect(await gpu()).toEqual(before);
});

test("woken the moment his button shows, the button and its headphones line both go", async ({ page }) => {
  await page.goto("/?wake=on");
  await page.locator('#wake[data-chip="on"]').waitFor({ state: "attached", timeout: 30_000 });
  // the headphones line is still fading in under this click
  await button(page).click();
  await page.waitForTimeout(1_200);
  // still waking, the controls still in the page, over the hero
  await expect(html(page)).toHaveClass(/\bwake\b/);
  expect(await shown(page, "#wake .wk-chip")).toBe(0);
  expect(await shown(page, "#wake .wk-phones")).toBe(0);
  await awake(page);
});

test("woken from his ring before his button shows, the button never comes", async ({ page }) => {
  await page.goto("/?wake=on");
  await page.locator('#wake[data-state="dozing"]').waitFor({ state: "attached", timeout: 30_000 });
  await clickRing(page);
  // past the moment the button would have shown (0.9 s into his doze)
  await page.waitForTimeout(1_500);
  await expect(html(page)).toHaveClass(/\bwake\b/);
  expect(await shown(page, "#wake .wk-chip")).toBe(0);
  expect(await shown(page, "#wake .wk-phones")).toBe(0);
  await awake(page);
});

test("Replay experience brings the wake-up back: the name on black without the count, his doze and the button; woken again, the film starts at its first frame", async ({ page }) => {
  test.setTimeout(90_000);
  await dozing(page);
  await clickRing(page);
  await awake(page);
  // on to Contact, where the link is
  await page.evaluate(() => {
    const f = (window as unknown as { __film: { screen: number; blocks: Array<{ id: string; spot: number }> } }).__film;
    const top = document.getElementById("runway")!.getBoundingClientRect().top + scrollY, y = top + f.blocks.find((b) => b.id === "contact")!.spot * f.screen;
    scrollTo(0, y);
    dispatchEvent(new CustomEvent("film:jump", { detail: { y } }));
  });
  const link = page.getByRole("link", { name: /Replay experience/i });
  await expect(link).toBeVisible({ timeout: 10_000 });
  await link.click();
  await expect(html(page)).toHaveClass(/\bwake-lock\b/, { timeout: 5_000 });
  // the loader: the name, and no count; nothing scrolls or answers meanwhile
  await expect(page.locator("#wake .wk-mark")).toBeVisible();
  expect(await shown(page, "#wake .wk-pct")).toBe(0);
  await expect(page.locator("#runway")).toHaveAttribute("inert", "");
  // he charges and dozes, and his button shows
  await expect(page.locator("#wake")).toHaveAttribute("data-chip", "on", { timeout: 30_000 });
  await clickRing(page);
  await expect(html(page)).not.toHaveClass(/\bwake\b/, { timeout: 10_000 });
  await expect(page.locator("#runway")).not.toHaveAttribute("inert", "");
  expect(await page.evaluate(() => (window as unknown as { __film: { t: number } }).__film.t)).toBeLessThan(0.05);
});

test("the route map's Start, with the wake-up on, replays only to the film's first frame: the wake-up never comes back", async ({ page }) => {
  test.setTimeout(90_000);
  await dozing(page);
  await clickRing(page);
  await awake(page);
  await page.evaluate(() => {
    const f = (window as unknown as { __film: { screen: number; blocks: Array<{ id: string; spot: number }> } }).__film;
    const top = document.getElementById("runway")!.getBoundingClientRect().top + scrollY, y = top + f.blocks.find((b) => b.id === "contact")!.spot * f.screen;
    scrollTo(0, y);
    dispatchEvent(new CustomEvent("film:jump", { detail: { y } }));
  });
  const map = (await page.locator("nav.routemap .rm-map").boundingBox())!;
  await page.mouse.move(map.x + map.width / 2, map.y + map.height / 2);
  await expect(page.locator("nav.routemap")).toHaveAttribute("data-grown", "");
  await page.waitForTimeout(700);
  await page.locator('nav.routemap a[href="#sec-hero"]').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __film: { t: number } }).__film.t), { timeout: 8000 }).toBeLessThan(0.01);
  await expect.poll(() => page.locator("#veil").evaluate((v) => +getComputedStyle(v).opacity), { timeout: 4000 }).toBeLessThan(0.01);
  await expect(html(page)).not.toHaveClass(/\bwake\b/);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test("a tap inside his ring wakes him", async ({ page }) => {
    await dozing(page);
    const b = (await page.locator("#wake .wk-frame").boundingBox())!;
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
    await awake(page);
    // the tap that woke him reached nothing else (a star under it would have asked him about itself)
    await expect(page.getByRole("dialog", { name: "Tycho" }).getByText("You asked")).toHaveCount(0);
  });
});

test("a deep link lands on its reading spot after the wake, not before", async ({ page }) => {
  await dozing(page, "/?wake=on#sec-work");
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await clickRing(page);
  await expect.poll(() => page.evaluate(() => scrollY), { timeout: 5_000 }).toBeGreaterThan(0);
  const spot = await page.evaluate(() => {
    const el = document.getElementById("sec-work")!;
    return Number(el.dataset.spot);
  });
  expect(spot).toBeGreaterThan(0);
});

test("3D still loading at about 10 s: the wake opens onto the plain page, Tycho flat", async ({ page }) => {
  test.setTimeout(60_000);
  // the stars never arrive, so the sky never loads
  await page.route("**/sky/stars-pca.json", () => {});
  await page.goto("/?wake=on");
  await expect(html(page)).toHaveClass(/\bwake-lock\b/);
  await page.waitForTimeout(8_000);
  await expect(button(page)).toBeHidden();
  await expect(button(page)).toBeVisible({ timeout: 6_000 });
  await expect(html(page)).toHaveAttribute("data-film", "plain");
  // with no 3D there's no ring: the button is the target
  await button(page).click();
  await awake(page);
  await expect(page.locator("#tycho")).toHaveClass(/\bis-flat\b/);
});

test("3D that fails gives way to the plain page at once", async ({ page }) => {
  await page.route("**/sky/stars-pca.json", (r) => r.abort());
  await page.goto("/?wake=on");
  await expect(button(page)).toBeVisible({ timeout: 8_000 });
  await expect(html(page)).toHaveAttribute("data-film", "plain");
  await page.keyboard.press("Enter");
  await awake(page);
});

test.describe("under reduced motion", () => {
  test("the wake-up still holds, and the click still wakes him", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await dozing(page);
    await expect(html(page)).toHaveClass(/\bwake-still\b/);
    await expect(html(page)).toHaveAttribute("data-film", "still");
    await clickRing(page);
    await awake(page);
  });
});
