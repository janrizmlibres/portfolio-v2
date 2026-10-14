import { expect, test, type Page } from "@playwright/test";

// The chat moves the page: the stars a search reads light, and the point takes the page to its subject. The voyage
// needs a real GPU (see voyage.spec.ts): ANGLE on Metal. The chat server is stood in for by a canned stream.
test.use({ launchOptions: { args: ["--enable-gpu", "--use-angle=metal"] } });

type Film = { t: number; screen: number; blocks: Array<{ id: string; spot: number }> };
type Sky = { index: Map<string, number>; state: Array<{ read: number; lit: number }> };

/** A reply as the AI SDK streams it: a search that read `stars`, then (optionally) a move, then the words. */
function reply(stars: string[], move: null | { tool: "highlight_project" | "scroll_to"; input: Record<string, string> }, text = "There you go.") {
  const call = (id: string, toolName: string, input: unknown, output: unknown) => [
    { type: "tool-input-start", toolCallId: id, toolName },
    { type: "tool-input-available", toolCallId: id, toolName, input },
    ...(toolName === "search_wiki" ? [{ type: "data-stars", id, data: { stars }, transient: true }] : []),
    { type: "tool-output-available", toolCallId: id, output },
  ];
  return [
    { type: "start" },
    { type: "start-step" },
    ...call("c1", "search_wiki", { query: "q", k: 6 }, null),
    { type: "finish-step" },
    ...(move ? [{ type: "start-step" }, ...call("c2", move.tool, move.input, { ok: true, ...move.input }), { type: "finish-step" }] : []),
    { type: "start-step" },
    { type: "text-start", id: "t1" },
    { type: "text-delta", id: "t1", delta: text },
    { type: "text-end", id: "t1" },
    { type: "finish-step" },
    { type: "finish" },
  ];
}

async function chatReplies(page: Page, replies: unknown[][]) {
  let n = 0;
  await page.route("**/api/chat", async (route) => {
    const parts = replies[Math.min(n++, replies.length - 1)]!;
    await route.fulfill({
      status: 200,
      headers: { "content-type": "text/event-stream", "x-vercel-ai-ui-message-stream": "v1" },
      body: parts.map((p) => `data: ${JSON.stringify(p)}\n\n`).join("") + "data: [DONE]\n\n",
    });
  });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem("jrz-chat-v1"));
});

const open = async (page: Page, { warp = true } = {}) => {
  await page.goto("/?wake=off");
  await expect(page.locator("[data-universe]")).toHaveAttribute("data-universe", "ready", { timeout: 30000 });
  // under reduced motion the warp is a crossfade, with nothing made ahead
  if (warp) await page.waitForFunction(() => (window as unknown as { __warp?: { ready(): { hole: boolean } } }).__warp?.ready().hole, null, { timeout: 30000 });
};
const t = (page: Page) => page.evaluate(() => (window as unknown as { __film: Film }).__film.t);
const spotOf = (page: Page, id: string) => page.evaluate((id) => (window as unknown as { __film: Film }).__film.blocks.find((b) => b.id === id)!.spot, id);
const jump = (page: Page, to: number) =>
  page.evaluate((to) => {
    const top = document.getElementById("runway")!.getBoundingClientRect().top + scrollY;
    const y = top + to * (window as unknown as { __film: Film }).__film.screen;
    scrollTo(0, y);
    dispatchEvent(new CustomEvent("film:jump", { detail: { y } }));
  }, to);
/** how brightly the chat has lit each star (its `read`) */
const read = (page: Page, ids: string[]) =>
  page.evaluate((ids) => {
    const sky = (window as unknown as { __sky: Sky }).__sky;
    return ids.map((id) => +sky.state[sky.index.get(id)!]!.read.toFixed(2));
  }, ids);
const running = (page: Page) => page.evaluate(() => (window as unknown as { __warp: { running: boolean } }).__warp.running);

async function ask(page: Page, q: string) {
  const bubble = page.getByRole("dialog", { name: "Tycho" });
  if (!(await bubble.isVisible())) {
    await page.getByRole("button", { name: "Ask Tycho", exact: true }).first().focus();
    await page.keyboard.press("Enter");
  }
  const input = bubble.getByRole("textbox", { name: "Ask Tycho" });
  await expect(input).toBeVisible();
  await input.fill(q);
  await input.press("Enter");
}

test("a search's stars light where they sit, and the next question puts them out", async ({ page }) => {
  await chatReplies(page, [reply(["s077", "s040"], null), reply([], null, "Nothing more.")]);
  await open(page);
  await jump(page, await spotOf(page, "about-1"));
  await page.waitForTimeout(600);
  const t0 = await t(page);
  await ask(page, "Tell me about Athena");
  await expect.poll(() => read(page, ["s077", "s040"]), { timeout: 5000 }).toEqual([1, expect.any(Number)]);
  const [, second] = await read(page, ["s077", "s040"]);
  expect(second).toBeGreaterThan(0.4);
  expect(second).toBeLessThan(1);
  // in place: the film's camera and time are its own
  expect(Math.abs((await t(page)) - t0)).toBeLessThan(0.02);
  await page.getByRole("dialog", { name: "Tycho" }).locator(".pb-a").filter({ hasText: "There you go." }).waitFor({ timeout: 10000 });
  await ask(page, "Anything else?");
  await expect.poll(() => read(page, ["s077", "s040"]), { timeout: 5000 }).toEqual([0, 0]);
});

test("the point warps to its subject from another section, then Tycho points at it", async ({ page }) => {
  await chatReplies(page, [reply(["s077"], { tool: "highlight_project", input: { slug: "athena" } })]);
  await open(page);
  await jump(page, await spotOf(page, "about-1"));
  await page.waitForTimeout(600);
  await ask(page, "Tell me about Athena");
  await expect.poll(() => running(page), { timeout: 5000 }).toBe(true);
  await expect.poll(() => running(page), { timeout: 15000 }).toBe(false);
  const athena = await spotOf(page, "athena");
  await expect.poll(() => t(page).then((x) => Math.abs(x - athena)), { timeout: 5000 }).toBeLessThan(0.02);
  await expect(page.locator("p.sr-only[aria-live]").filter({ hasText: "Tycho points at Athena." })).toHaveCount(1, { timeout: 5000 });
});

test("Tycho answers after the warp, not over it, and his bubble is away while he flies", async ({ page }) => {
  await chatReplies(page, [reply(["s077"], { tool: "scroll_to", input: { section: "work" } }, "Here's his work.")]);
  await open(page);
  await jump(page, await spotOf(page, "about-1"));
  await page.waitForTimeout(600);
  await ask(page, "Where has he worked?");
  const bubble = page.getByRole("dialog", { name: "Tycho" });
  const words = bubble.locator(".pb-a").filter({ hasText: "work" });
  await expect.poll(() => running(page), { timeout: 5000 }).toBe(true);
  await expect(bubble).toBeHidden({ timeout: 2000 });
  await expect(words).toHaveCount(0);
  await expect.poll(() => running(page), { timeout: 15000 }).toBe(false);
  await expect(bubble).toBeVisible({ timeout: 3000 });
  await expect(words).toHaveCount(1, { timeout: 5000 });
});

test("a star asks and the page stays put: the stars light and Tycho answers; a question typed there warps", async ({ page }) => {
  await chatReplies(page, [
    reply(["s077"], { tool: "scroll_to", input: { section: "work" } }, "Here's his work."),
    reply([], { tool: "scroll_to", input: { section: "work" } }, "Off we go."),
  ]);
  await open(page);
  const t0 = await t(page);
  const star = await page.evaluate(() => (window as unknown as { __hand: { stars(): { at: { x: number; y: number } }[] } }).__hand.stars()[0]!.at);
  await page.mouse.move(star.x, star.y);
  await page.waitForTimeout(300);
  await page.mouse.click(star.x, star.y);
  const bubble = page.getByRole("dialog", { name: "Tycho" });
  await bubble.locator(".pb-a").filter({ hasText: "work" }).waitFor({ timeout: 10000 });
  await expect.poll(() => read(page, ["s077"]), { timeout: 5000 }).toEqual([1]);
  expect(await running(page)).toBe(false);
  expect(Math.abs((await t(page)) - t0)).toBeLessThan(0.02);

  await ask(page, "Where has he worked?");
  await expect.poll(() => running(page), { timeout: 5000 }).toBe(true);
});

test("a point at what's being read stays put", async ({ page }) => {
  await chatReplies(page, [reply([], { tool: "highlight_project", input: { slug: "counselor-dashboard" } })]);
  await open(page);
  const athena = await spotOf(page, "athena");
  await jump(page, athena);
  await page.waitForTimeout(800);
  await ask(page, "What's the counselor dashboard?");
  await expect(page.locator("p.sr-only[aria-live]").filter({ hasText: "Tycho points at Counselor Dashboard." })).toHaveCount(1, { timeout: 5000 });
  expect(await running(page)).toBe(false);
  expect(Math.abs((await t(page)) - athena)).toBeLessThan(0.02);
});

test.describe("under reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });
  test("the point crossfades to its subject", async ({ page }) => {
    await chatReplies(page, [reply(["s077"], { tool: "highlight_project", input: { slug: "mercado" } })]);
    await open(page, { warp: false });
    await jump(page, await spotOf(page, "about-1"));
    await page.waitForTimeout(500);
    await ask(page, "What's Mercado?");
    const mercado = await spotOf(page, "own-mercado");
    await expect.poll(() => t(page).then((x) => Math.abs(x - mercado)), { timeout: 6000 }).toBeLessThan(0.02);
    await expect(page.locator("p.sr-only[aria-live]").filter({ hasText: "Tycho points at Mercado." })).toHaveCount(1, { timeout: 5000 });
  });
});
