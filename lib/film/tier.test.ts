import { describe, expect, it } from "vitest";
import { reframes } from "./tier";

describe("a resize composes the film again only when the frame it's composed for changes", () => {
  const phone = { w: 390, h: 664, screen: 844 };

  it("a phone's toolbar showing or hiding changes nothing", () => {
    expect(reframes(phone, { ...phone, h: 750 })).toBe(false);
  });

  it("a new width, a new screen height or a turn to landscape does", () => {
    expect(reframes(phone, { ...phone, w: 430 })).toBe(true);
    expect(reframes({ w: 1280, h: 800, screen: 800 }, { w: 1280, h: 700, screen: 700 })).toBe(true);
    expect(reframes(phone, { w: 844, h: 340, screen: 390 })).toBe(true);
  });

  it("a landscape window that drops under a phone held sideways's height does, though its screen is the same", () => {
    expect(reframes({ w: 900, h: 520, screen: 520 }, { w: 900, h: 480, screen: 520 })).toBe(true);
  });
});
