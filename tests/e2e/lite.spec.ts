import { expect, test, type Page } from "@playwright/test";

// Lite (lib/film/lite.ts): the stills and the flat Tycho, the [ LITE ] / [ FULL ] switch beside the sound toggle, and
// the choice kept per browser. The film wants a real GPU (ANGLE on Metal is this machine's). An automated browser
// skips the wake-up, so the switch shows as soon as the page is up; `?wake=on` brings it back.
test.use({ launchOptions: { args: ["--enable-gpu", "--use-angle=metal"] } });

const html = (page: Page) => page.locator("html");
const toLite = (page: Page) => page.getByRole("button", { name: /^Switch to the lite version/ });
const toFull = (page: Page) => page.getByRole("button", { name: /^Switch to the full version/ });
const sound = (page: Page) => page.locator(".snd > .snd-chip").first();

/** The section the film is in, read from the page as the route map reads it (lib/film/here.ts). */
const sectionHere = (page: Page) =>
  page.evaluate(() => {
    const runway = document.getElementById("runway"), film = (window as unknown as { __film?: { screen: number } }).__film;
    if (!runway || !film) return null;
    const t = (scrollY - (runway.getBoundingClientRect().top + scrollY)) / film.screen;
    const order = ["sec-hero", "sec-about", "sec-work", "sec-projects", "sec-contact"];
    return order.findLast((s) => Number(document.getElementById(s)?.dataset.top ?? 0) <= t + 0.3) ?? "sec-hero";
  });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem("jrz-chat-v1"));
});

test("?film=still plays lite: the stills, Tycho flat, and the switch reads [ FULL ]", async ({ page }) => {
  await page.goto("/?film=still");
  await expect(html(page)).toHaveAttribute("data-film", "still");
  await expect(html(page)).toHaveAttribute("data-lite", "");
  await expect(toFull(page)).toBeVisible();
  await expect(toFull(page)).toHaveText("[ Full ]");
  await expect(page.locator("#tycho .tycho-flat")).toBeVisible();
  await expect(page.locator("#tycho canvas")).toHaveCount(0);
});

test("[ FULL ] keeps the choice and loads the film again at the same section", async ({ page }) => {
  await page.goto("/?film=still#sec-work");
  await expect(toFull(page)).toBeVisible();
  await expect.poll(() => sectionHere(page), { timeout: 15_000 }).toBe("sec-work");
  await toFull(page).click();
  await expect(html(page)).toHaveAttribute("data-film", "film");
  await expect(html(page)).not.toHaveAttribute("data-lite");
  await expect(page).toHaveURL(/\/#sec-work$/);
  await expect.poll(() => sectionHere(page), { timeout: 15_000 }).toBe("sec-work");
  await expect(toLite(page)).toHaveText("[ Lite ]");
  expect(await page.evaluate(() => localStorage.getItem("jrz-film-v1"))).toBe('{"choice":"full"}');
});

test("the choice kept is respected on the next load, either way", async ({ page }) => {
  await page.goto("/");
  await expect(html(page)).toHaveAttribute("data-film", "film");
  await toLite(page).click();
  await expect(html(page)).toHaveAttribute("data-lite", "");
  await page.goto("/");
  await expect(html(page)).toHaveAttribute("data-film", "still");
  await expect(html(page)).toHaveAttribute("data-lite", "");
  await expect(toFull(page)).toBeVisible();
  await toFull(page).click();
  await expect(html(page)).toHaveAttribute("data-film", "film");
  await page.goto("/");
  await expect(html(page)).toHaveAttribute("data-film", "film");
  await expect(toLite(page)).toBeVisible();
});

test("a switch skips the wake-up: its loader, then the page at the same section, no button; a plain reload plays it again", async ({ page }) => {
  // whether his button ever shows on this load
  await page.addInitScript(() => {
    const w = window as unknown as { __chip?: boolean };
    new MutationObserver(() => {
      if (document.getElementById("wake")?.dataset.chip === "on") w.__chip = true;
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-chip"] });
  });
  const chipShown = () => page.evaluate(() => !!(window as unknown as { __chip?: boolean }).__chip);
  await page.goto("/?wake=on&film=still#sec-work");
  await expect(page.locator("#wake")).toHaveAttribute("data-chip", "on", { timeout: 30_000 });
  await page.getByRole("button", { name: "Wake Tycho (turns on sound)" }).click();
  await expect(html(page)).not.toHaveClass(/\bwake\b/, { timeout: 10_000 });
  await expect.poll(() => sectionHere(page), { timeout: 15_000 }).toBe("sec-work");

  await toFull(page).click();
  await expect(html(page)).toHaveAttribute("data-film", "film");
  await expect(html(page)).not.toHaveClass(/\bwake\b/, { timeout: 30_000 });
  expect(await chipShown()).toBe(false);
  await expect(page).toHaveURL(/\/\?wake=on#sec-work$/);
  await expect.poll(() => sectionHere(page), { timeout: 15_000 }).toBe("sec-work");
  await expect(toLite(page)).toBeVisible();
  await expect(page.locator("#tycho .tycho-body")).toBeVisible();

  await page.reload();
  await expect(html(page)).toHaveClass(/\bwake-centre\b/);
  await expect(page.locator("#wake")).toHaveAttribute("data-chip", "on", { timeout: 30_000 });
});

test("?film=film plays the film over a choice of lite", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("jrz-film-v1", '{"choice":"lite"}'));
  await page.goto("/?film=film");
  await expect(html(page)).toHaveAttribute("data-film", "film");
  await expect(toLite(page)).toBeVisible();
});

test("the plain page shows no switch", async ({ page }) => {
  await page.goto("/?film=plain");
  await expect(html(page)).toHaveAttribute("data-film", "plain");
  await expect(sound(page)).toBeVisible();
  await expect(page.locator(".lite-chip")).toHaveCount(0);
});

test("reduced motion's stills aren't lite, and show no switch", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(html(page)).toHaveAttribute("data-film", "still");
  await expect(html(page)).not.toHaveAttribute("data-lite");
  await expect(sound(page)).toBeVisible();
  await expect(page.locator(".lite-chip")).toHaveCount(0);
});

test("a visit too slow for the film offers lite once, keeps the verdict, and the next visit starts in lite", async ({ page }) => {
  await page.goto("/");
  await expect(toLite(page)).toBeVisible();
  await page.evaluate(() => (window as unknown as { __lite: { slow: () => void } }).__lite.slow());
  const offer = page.getByRole("button", { name: "Running slow? Switch to lite" });
  await expect(offer).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("jrz-film-v1"))).toBe('{"verdict":"slow"}');
  await expect(offer).toBeHidden({ timeout: 12_000 });
  await expect(html(page)).toHaveAttribute("data-film", "film");
  await page.goto("/");
  await expect(html(page)).toHaveAttribute("data-lite", "");
});
