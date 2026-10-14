import { expect, test, type Page, type Route } from "@playwright/test";

// Tycho's 3D body wants a real GPU, as the voyage does (ANGLE on Metal is this machine's).
test.use({ launchOptions: { args: ["--enable-gpu", "--use-angle=metal"] } });

const REPLY = "Mostly TypeScript. Lately he reaches for Next.js and the Vercel AI SDK, with pgvector for retrieval.";

/** The chat server, stood in for: the reply streams as the AI SDK's UI message stream, after a moment's thought. */
async function replyWith(page: Page, text = REPLY, { delayMs = 600 } = {}) {
  await page.route("**/api/chat", async (route: Route) => {
    await new Promise((r) => setTimeout(r, delayMs));
    const parts = [
      { type: "start" },
      { type: "start-step" },
      { type: "text-start", id: "t1" },
      ...text.split(/(?<= )/).map((delta) => ({ type: "text-delta", id: "t1", delta })),
      { type: "text-end", id: "t1" },
      { type: "finish-step" },
      { type: "finish" },
    ];
    await route.fulfill({
      status: 200,
      headers: { "content-type": "text/event-stream", "x-vercel-ai-ui-message-stream": "v1" },
      body: parts.map((p) => `data: ${JSON.stringify(p)}\n\n`).join("") + "data: [DONE]\n\n",
    });
  });
}

const bubble = (page: Page) => page.getByRole("dialog", { name: "Tycho" });
const shown = (page: Page) => expect(bubble(page)).toBeVisible();
const hidden = (page: Page) => expect(bubble(page)).toBeHidden();
/** Every word of the reply shows. */
const replied = (page: Page, text = REPLY) => expect(bubble(page).locator(".pb-a")).toHaveText(text, { timeout: 10_000 });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("e2e-kept")) localStorage.removeItem("jrz-chat-v1");
  });
});

/** How far his leader starts from his head (its start, out of his head; or out of his base, for a card below him), in CSS px. */
const leaderOff = (page: Page) =>
  page.evaluate(() => {
    const dot = document.querySelector<SVGCircleElement>(".tycho-leader circle")!;
    const me = document.querySelector<HTMLElement>("#tycho .tycho-body")!.getBoundingClientRect();
    const x = +dot.getAttribute("cx")!, y = +dot.getAttribute("cy")!, hx = me.left + me.width / 2;
    return Math.min(Math.hypot(x - hx, y - (me.top + me.height * 0.2)), Math.hypot(x - hx, y - (me.top + me.height * 0.92)));
  });
const key = (page: Page, name: string) => page.getByRole("button", { name, exact: true }).first();

test("the bubble stays on Tycho when the window's resized and he's put somewhere else", async ({ page }) => {
  await page.goto("/");
  await key(page, "Ask Tycho").focus();
  await page.keyboard.press("Enter");
  await shown(page);
  await expect.poll(() => leaderOff(page)).toBeLessThan(3);
  await page.setViewportSize({ width: 1000, height: 700 });
  await expect.poll(() => leaderOff(page), { timeout: 3000 }).toBeLessThan(3);
});

test("the bubble stays on Tycho when it opens as he's flying to another spot, and follows him there", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1500);
  // he sets off round the corners, and the bubble's asked for at once
  await key(page, "Move Tycho").focus();
  await page.keyboard.press("Enter");
  await key(page, "Ask Tycho").focus();
  await page.keyboard.press("Enter");
  await shown(page);
  await page.waitForTimeout(3000);
  expect(await leaderOff(page)).toBeLessThan(3);
});

test("he can still be dragged with his bubble open, and the bubble comes along", async ({ page }) => {
  await page.goto("/");
  await key(page, "Ask Tycho").focus();
  await page.keyboard.press("Enter");
  await shown(page);
  await expect.poll(() => leaderOff(page)).toBeLessThan(3);
  const me = page.locator("#tycho .tycho-body");
  const a = (await me.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x - 300, a.y - 250, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(2000);
  const b = (await me.boundingBox())!;
  expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThan(100);
  // the drop isn't a click: the bubble stays open, on him
  await shown(page);
  await expect.poll(() => leaderOff(page)).toBeLessThan(3);
});

test("the keyboard's Move still takes him round the corners with his bubble open, and the bubble comes along", async ({ page }) => {
  await page.goto("/");
  await key(page, "Ask Tycho").focus();
  await page.keyboard.press("Enter");
  await shown(page);
  const me = page.locator("#tycho .tycho-body");
  const a = (await me.boundingBox())!;
  await key(page, "Move Tycho").focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(2500);
  const b = (await me.boundingBox())!;
  expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThan(100);
  await shown(page);
  await expect.poll(() => leaderOff(page)).toBeLessThan(3);
});

test("the card sits just above him even over the words being read: only he keeps clear of them", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1500);
  // dragged under the hero's column, below its name and lines
  const me = page.locator("#tycho .tycho-body");
  const a = (await me.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(320, a.y + a.height / 2, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(2000);
  await key(page, "Ask Tycho").focus();
  await page.keyboard.press("Enter");
  await shown(page);
  await page.waitForTimeout(1000);
  const [m, card, name] = await Promise.all([me.boundingBox(), page.locator(".tycho-bubble").boundingBox(), page.locator('[data-block="hero"] .title').boundingBox()]);
  // it covers his name, and sits its usual 26 px above him
  expect(card!.x < name!.x + name!.width && card!.x + card!.width > name!.x && card!.y < name!.y + name!.height && card!.y + card!.height > name!.y).toBe(true);
  expect(Math.abs(m!.y - (card!.y + card!.height) - 26)).toBeLessThan(3);
});

test("the keyboard's Ask Tycho is early in the tab order, opens the bubble with focus in it, and Esc returns it", async ({ page }) => {
  await page.goto("/");
  // he renders in the browser only, after hydration: a Tab before then goes elsewhere
  await expect(page.locator(".tycho-ask")).toBeAttached();
  await page.keyboard.press("Tab");
  const key = page.getByRole("button", { name: "Ask Tycho", exact: true }).first();
  await expect(key).toBeFocused();
  await expect(key).toBeVisible();
  await page.keyboard.press("Enter");
  await shown(page);
  await expect(bubble(page).getByRole("textbox", { name: "Ask Tycho" })).toBeFocused();
  // the greeting, and the first three starters
  await expect(bubble(page)).toContainText("Hi, I'm Tycho.");
  await expect(bubble(page).locator(".pb-chips button")).toHaveText(["What does he build with AI?", "Tell me about Athena", "How do you know all this?"]);
  // not a trap: Tab can leave it
  await page.keyboard.press("Escape");
  await hidden(page);
  await expect(key).toBeFocused();
});

test("a mouse visitor's greeting folds without lighting up the keyboard's Ask Tycho", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1500);
  // woken by a click, his greeting opens the bubble (with focus in its input)
  await page.mouse.click(640, 120);
  await page.evaluate(() => dispatchEvent(new Event("tycho:greet")));
  await shown(page);
  const h = await page.evaluate(() => innerHeight);
  await page.mouse.move(200, 300);
  for (let i = 0; i < 4; i++) await page.mouse.wheel(0, h * 0.4);
  await hidden(page);
  const ask = page.locator(".tycho-ask");
  expect(await ask.evaluate((el) => el.matches(":focus-visible"))).toBe(false);
  await expect(ask).toHaveCSS("opacity", "0");
});

test("one question at a time: Send waits while he answers, the draft is kept, and the reply finishes", async ({ page }) => {
  await replyWith(page, REPLY, { delayMs: 1200 });
  await page.goto("/");
  await page.getByRole("button", { name: "Ask Tycho", exact: true }).first().focus();
  await page.keyboard.press("Enter");
  await bubble(page).getByRole("button", { name: "What does he build with AI?" }).click();
  // while he thinks: the question shows, no starters, Send held off, the input still typable
  await expect(bubble(page).locator(".pb-q")).toContainText("What does he build with AI?");
  await expect(bubble(page).locator(".pb-chips")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-answering", "");
  const input = bubble(page).getByRole("textbox", { name: "Ask Tycho" });
  await input.fill("Tell me about Athena");
  await expect(bubble(page).getByRole("button", { name: /^Send/ })).toBeDisabled();
  // the reveal: some of it, not all of it at once
  await expect(bubble(page).locator(".pb-a .w").first()).toBeVisible({ timeout: 5000 });
  expect(await bubble(page).locator(".pb-a .w").count()).toBeLessThan(15);
  await replied(page);
  await expect(page.locator("html")).not.toHaveAttribute("data-answering", "");
  await expect(input).toHaveValue("Tell me about Athena");
  await expect(bubble(page).getByRole("button", { name: "Send" })).toBeEnabled();
  // the starters not yet asked, three of them
  await expect(bubble(page).locator(".pb-chips button")).toHaveText(["Tell me about Athena", "How do you know all this?", "What's his stack?"]);
  await expect(bubble(page).getByRole("button", { name: /^Log, 1 exchange/ })).toBeVisible();
});

test("a tap on the text shows the rest at once", async ({ page }) => {
  await replyWith(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Ask Tycho", exact: true }).first().focus();
  await page.keyboard.press("Enter");
  await bubble(page).getByRole("textbox", { name: "Ask Tycho" }).fill("What's his stack?");
  await page.keyboard.press("Enter");
  await expect(bubble(page).locator(".pb-a .w").first()).toBeVisible({ timeout: 5000 });
  await bubble(page).locator(".pb-a").click();
  await expect(bubble(page).locator(".pb-a .w")).toHaveCount(16, { timeout: 1000 });
});

test("the log holds the conversation; Esc returns to the bubble, and Clear asks in place", async ({ page }) => {
  await replyWith(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Ask Tycho", exact: true }).first().focus();
  await page.keyboard.press("Enter");
  await bubble(page).getByRole("button", { name: "Tell me about Athena" }).click();
  await replied(page);
  await bubble(page).getByRole("button", { name: /^Log, 1 exchange/ }).click();
  const log = page.getByRole("dialog", { name: "Log" });
  await expect(log).toBeVisible();
  await expect(log.getByRole("button", { name: "Close" })).toBeFocused();
  await expect(log.locator(".pl-q")).toHaveText(["Tell me about Athena"]);
  await expect(log.locator(".pl-a")).toHaveText([REPLY]);
  await page.keyboard.press("Escape");
  await expect(log).toBeHidden();
  await shown(page);
  await expect(bubble(page).getByRole("button", { name: /^Log, 1 exchange/ })).toBeFocused();
  await bubble(page).getByRole("button", { name: /^Log/ }).click();
  await log.getByRole("button", { name: "Clear" }).click();
  await expect(log).toContainText("Clear the whole log?");
  await log.getByRole("button", { name: "Clear" }).click();
  await expect(log.locator(".pl-row")).toHaveCount(0);
  await expect(log).toContainText("Nothing yet.");
});

test("the fold: a finished reply folds into Tycho once the page scrolls on, and clicking him reopens it", async ({ page }) => {
  await replyWith(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Ask Tycho", exact: true }).first().focus();
  await page.keyboard.press("Enter");
  await bubble(page).getByRole("button", { name: "What does he build with AI?" }).click();
  await replied(page);
  const h = await page.evaluate(() => innerHeight);
  await page.mouse.move(200, 300);
  for (let i = 0; i < 4; i++) await page.mouse.wheel(0, h * 0.4);
  await hidden(page);
  await page.locator("#tycho .tycho-body").click();
  await shown(page);
  await expect(bubble(page).locator(".pb-q")).toContainText("What does he build with AI?");
});

test("the bubble stays open while a reply is appearing, however far the page scrolls", async ({ page }) => {
  await replyWith(page, REPLY, { delayMs: 2500 });
  await page.goto("/");
  await page.getByRole("button", { name: "Ask Tycho", exact: true }).first().focus();
  await page.keyboard.press("Enter");
  await bubble(page).getByRole("button", { name: "What does he build with AI?" }).click();
  const h = await page.evaluate(() => innerHeight);
  await page.mouse.move(200, 300);
  for (let i = 0; i < 4; i++) await page.mouse.wheel(0, h * 0.5);
  await page.waitForTimeout(400);
  await shown(page);
});

test("a returning visitor finds the old conversation in the log, saved by the old page and all, and a welcome back", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("e2e-kept", "1");
    localStorage.setItem(
      "jrz-chat-v1",
      JSON.stringify({
        activated: true,
        threadId: "e2e-old",
        updatedAt: "2026-10-01T10:00:00.000Z",
        messages: [
          { id: "a", role: "user", content: "What's his stack?", createdAt: "2026-10-01T10:00:00.000Z" },
          { id: "b", role: "assistant", content: "Mostly TypeScript.", createdAt: "2026-10-01T10:00:05.000Z" },
          { id: "c", role: "user", content: "Where did he study?", createdAt: "2026-10-01T10:01:00.000Z" },
        ],
      }),
    );
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Ask Tycho", exact: true }).first().focus();
  await page.keyboard.press("Enter");
  await expect(bubble(page)).toContainText("Welcome back.");
  await expect(bubble(page).locator(".pb-q")).toHaveCount(0);
  await bubble(page).getByRole("button", { name: "Open the log" }).click();
  const log = page.getByRole("dialog", { name: "Log" });
  // the reply cut off by leaving the page is dropped, and its question kept
  await expect(log.locator(".pl-q")).toHaveText(["What's his stack?", "Where did he study?"]);
  await expect(log.locator(".pl-a")).toHaveText(["Mostly TypeScript."]);
});

test("a failed request is Tycho's line in the bubble, not a system notice", async ({ page }) => {
  await page.route("**/api/chat", (route) =>
    route.fulfill({
      status: 429,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: "rate_limited", message: "I've answered a lot in a short time, so I need 2 minutes to cool down." }),
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Ask Tycho", exact: true }).first().focus();
  await page.keyboard.press("Enter");
  await bubble(page).getByRole("button", { name: "What does he build with AI?" }).click();
  await replied(page, "I've answered a lot in a short time, so I need 2 minutes to cool down.");
});

test("sentences are announced politely: once that he's reading, then each finished sentence", async ({ page }) => {
  await replyWith(page);
  await page.goto("/");
  const live = page.locator("#tycho [aria-live=polite]");
  await page.getByRole("button", { name: "Ask Tycho", exact: true }).first().focus();
  await page.keyboard.press("Enter");
  await bubble(page).getByRole("button", { name: "What does he build with AI?" }).click();
  await expect(live).toHaveText("Tycho is reading his notes.");
  await expect(live).toHaveText("Mostly TypeScript.", { timeout: 5000 });
  await expect(live).toHaveText("Lately he reaches for Next.js and the Vercel AI SDK, with pgvector for retrieval.", { timeout: 8000 });
});

test.describe("phones", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("tapping Tycho opens the bubble across the width, without raising the keyboard", async ({ page }) => {
    await page.goto("/");
    await page.locator("#tycho .tycho-body").tap();
    await shown(page);
    await expect(bubble(page).getByRole("textbox")).not.toBeFocused();
    await expect(bubble(page)).toBeFocused();
    const box = (await bubble(page).boundingBox())!;
    expect(box.width).toBeGreaterThan(360);
  });
});
