import { describe, expect, it } from "vitest";
import { errorLine, monthlyLimitLine, noConnectionLine, rateLimitLine } from "./lines";
import { parseReply } from "./reply";

const EMAIL = "[libres.janriz@gmail.com](mailto:libres.janriz@gmail.com)";

describe("errors: what Tycho says when he can't answer, each ending on Janriz's email as a link", () => {
  it("tells the visitor how many minutes the rate limit has left", () => {
    expect(rateLimitLine(3)).toBe(
      `I've answered a lot in a short time, so I need 3 minutes to cool down. Ask me again then, or write to Janriz at ${EMAIL}.`,
    );
  });

  it("says one minute, not one minutes", () => {
    expect(rateLimitLine(1)).toContain("I need 1 minute to cool down.");
  });

  it("never asks for less than a minute", () => {
    expect(rateLimitLine(0)).toContain("I need 1 minute to cool down.");
  });

  it("says he's out of fuel when the month's budget is spent", () => {
    expect(monthlyLimitLine()).toBe(
      `I'm out of fuel for this month, so I can't answer until it refills. Janriz reads his own email: ${EMAIL}.`,
    );
  });

  it("says he can't reach the notes when the page has no connection", () => {
    expect(noConnectionLine()).toBe(
      `I can't reach his notes right now. Try again in a moment, or write to Janriz at ${EMAIL}.`,
    );
  });

  it("renders the email as a real link in the bubble, the full stop glued after it", () => {
    for (const line of [rateLimitLine(2), monthlyLimitLine(), noConnectionLine()]) {
      const units = parseReply(line)[0]!.units;
      const link = units.find((u) => u.href);
      expect(link).toEqual({ text: "libres.janriz@gmail.com", href: "mailto:libres.janriz@gmail.com" });
      expect(units.at(-1)).toEqual({ text: ".", glue: true });
    }
  });
});

describe("errorLine: what Tycho says when a request fails, from the error the chat client hands the page", () => {
  it("says the server's own line, which the client wraps in the error's message as JSON", () => {
    const body = JSON.stringify({ error: "rate_limited", message: rateLimitLine(4), retryAfterMs: 200_000 });
    expect(errorLine(new Error(body))).toBe(rateLimitLine(4));
  });

  it("says the no-connection line when the request never reached the server", () => {
    expect(errorLine(new TypeError("Failed to fetch"))).toBe(noConnectionLine());
  });

  it("never shows a raw error or a body without a message", () => {
    expect(errorLine(new Error('{"error":"internal"}'))).toBe(noConnectionLine());
    expect(errorLine(new Error("Internal Server Error"))).toBe(noConnectionLine());
    expect(errorLine(undefined)).toBe(noConnectionLine());
  });
});
