import { test, expect } from "@playwright/test";

test("State 1 → click chip → State 2 visible, clear returns to State 1", async ({ page }) => {
  // Stub /api/chat to return a deterministic streaming-shaped reply.
  // The SSE shape may need adapting to AI SDK v6's UIMessage stream format.
  // Inspect node_modules/ai/dist/ if the test fails on the stub format.
  await page.route("**/api/chat", async (route) => {
    const lines = [
      'data: {"type":"text-delta","textDelta":"Hi there!"}',
      'data: {"type":"finish","finishReason":"stop"}',
      "data: [DONE]",
    ];
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: lines.map((l) => l + "\n\n").join(""),
    });
  });

  await page.goto("/");

  await expect(page.getByRole("button", { name: "Show me your projects" })).toBeVisible();
  await expect(page.locator("#state-1")).toBeVisible();

  await page.getByRole("button", { name: "Show me your projects" }).click();

  await expect(page.locator("#state-2")).toBeVisible({ timeout: 5000 });
  // Verify the user's message appears in the chat history within State 2
  await expect(page.locator("#state-2").getByText("Show me your projects")).toBeVisible();

  await page.getByRole("button", { name: "clear" }).click();
  await expect(page.locator("#state-1")).toBeVisible({ timeout: 5000 });
});
