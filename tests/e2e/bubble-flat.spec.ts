import { expect, test } from "@playwright/test";

// no WebGL at all: the plain page, and the flat Tycho in his corner
test.use({ launchOptions: { args: ["--disable-3d-apis"] } });

test("without 3D, the flat Tycho, parked, opens the same bubble", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-film", "plain");
  await expect(page.locator("#tycho .tycho-flat")).toBeVisible();
  await page.locator("#tycho .tycho-body").click();
  const bubble = page.getByRole("dialog", { name: "Tycho" });
  await expect(bubble).toBeVisible();
  await expect(bubble).toContainText("Hi, I'm Tycho.");
});
