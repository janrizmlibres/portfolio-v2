import { expect, test, type Page } from "@playwright/test";

// the plain tier, where ScrollSmoother runs and a deep link lands on the section's top. With WebGL the page plays as
// the film, where it lands past the section's intro instead (voyage.spec.ts covers that), so pin it here.
test.use({ launchOptions: { args: ["--disable-3d-apis"] } });

// A returning visitor lands straight on the portfolio sections.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("jrz-chat-v1", JSON.stringify({ messages: [], threadId: "e2e", activated: true })),
  );
});

// the sections are server-rendered, so they show before the page has hydrated: wait for the film too, which binds them
// once it has (anything added to the page before then is lost when hydration fails on it)
const shown = async (page: Page) => {
  await expect(page.locator("#sec-about")).toBeVisible();
  await page.waitForFunction(() => "__film" in window);
};
// at the section: its top at the viewport's top, or as near as the page allows when it's the last one
const offTarget = (page: Page, id: string) =>
  page.evaluate((id) => {
    const top = document.getElementById(id)!.getBoundingClientRect().top;
    const atEnd = Math.abs(scrollY - (document.documentElement.scrollHeight - innerHeight)) < 2;
    return atEnd && top > 0 && top < innerHeight ? 0 : Math.abs(top);
  }, id);
const settledTop = (page: Page, id: string) =>
  expect.poll(() => offTarget(page, id), { timeout: 5000 }).toBeLessThan(4);

test("the page keeps its native scroll height under smooth scrolling", async ({ page }) => {
  await page.goto("/");
  await shown(page);
  await expect(page.locator("#smooth-wrapper")).toBeAttached();
  const { scrollHeight, viewport } = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    viewport: innerHeight,
  }));
  expect(scrollHeight).toBeGreaterThan(viewport * 2);
});

test("a deep link lands on its section", async ({ page }) => {
  await page.goto("/#sec-work");
  await shown(page);
  await settledTop(page, "sec-work");
  // and it stays there once the page has settled
  await page.waitForTimeout(1500);
  expect(await offTarget(page, "sec-work")).toBeLessThan(4);
});

test("a deep link lands on its section under reduced motion, where nothing is smoothed", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#sec-projects");
  await shown(page);
  await settledTop(page, "sec-projects");
  await page.waitForTimeout(1500);
  expect(await offTarget(page, "sec-projects")).toBeLessThan(4);
});

test("an in-page link glides to its section, and Back returns to where the visitor was", async ({ page }) => {
  await page.goto("/");
  await shown(page);
  await page.evaluate(() => {
    const a = document.createElement("a");
    a.href = "#sec-contact";
    a.id = "e2e-link";
    a.textContent = "Contact";
    document.querySelector("main")!.prepend(a);
  });
  await page.evaluate(() => window.scrollTo(0, 400));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(400);
  const before = await page.evaluate(() => scrollY);

  await page.evaluate(() => (document.getElementById("e2e-link") as HTMLAnchorElement).click());
  await expect(page).toHaveURL(/#sec-contact$/);
  await settledTop(page, "sec-contact");

  await page.goBack();
  await expect.poll(() => page.evaluate(() => scrollY), { timeout: 5000 }).toBeLessThan(before + 4);
  expect(Math.abs((await page.evaluate(() => scrollY)) - before)).toBeLessThan(4);

  await page.goForward();
  await settledTop(page, "sec-contact");
});

test("the keyboard scrolls the page", async ({ page }) => {
  await page.goto("/");
  await shown(page);
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("End");
  await expect
    .poll(() => page.evaluate(() => Math.abs(scrollY - (document.documentElement.scrollHeight - innerHeight))))
    .toBeLessThan(4);
  await page.keyboard.press("Home");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

test("the universe never gates the page: the text is there first, and it settles without a loading screen", async ({ page }) => {
  await page.goto("/");
  await shown(page);
  await expect(page.locator("#sec-about")).toBeVisible();
  await expect(page.locator("[data-universe]")).toHaveAttribute("data-universe", /^(ready|unsupported|failed)$/, {
    timeout: 15000,
  });
});
