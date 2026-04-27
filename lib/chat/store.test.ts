import { describe, it, expect, beforeEach } from "vitest";
import { createChatStore } from "./store";
import { STORAGE_KEY } from "./types";

beforeEach(() => {
  localStorage.clear();
});

describe("chat store", () => {
  it("starts deactivated with no messages", () => {
    const s = createChatStore();
    expect(s.getState().activated).toBe(false);
    expect(s.getState().messages).toEqual([]);
  });

  it("appendMessage activates and persists", () => {
    const s = createChatStore();
    s.appendMessage({ id: "m1", role: "user", content: "hi", createdAt: "2026-01-01T00:00:00Z" });
    expect(s.getState().activated).toBe(true);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.messages).toHaveLength(1);
    expect(stored.activated).toBe(true);
  });

  it("clear resets to deactivated", () => {
    const s = createChatStore();
    s.appendMessage({ id: "m1", role: "user", content: "hi", createdAt: "2026-01-01T00:00:00Z" });
    s.clear();
    expect(s.getState().activated).toBe(false);
    expect(s.getState().messages).toEqual([]);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.activated).toBe(false);
  });

  it("rehydrates from existing storage", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activated: true,
        messages: [{ id: "x", role: "user", content: "hi", createdAt: "2026-01-01T00:00:00Z" }],
        updatedAt: "2026-01-01T00:00:00Z",
      })
    );
    const s = createChatStore();
    expect(s.getState().activated).toBe(true);
    expect(s.getState().messages).toHaveLength(1);
  });

  it("subscribers are notified on changes", () => {
    const s = createChatStore();
    const calls: number[] = [];
    s.subscribe(() => calls.push(s.getState().messages.length));
    s.appendMessage({ id: "1", role: "user", content: "a", createdAt: "" });
    s.appendMessage({ id: "2", role: "assistant", content: "b", createdAt: "" });
    expect(calls).toEqual([1, 2]);
  });

  it("survives an unparseable localStorage payload", () => {
    localStorage.setItem(STORAGE_KEY, "not-json");
    const s = createChatStore();
    expect(s.getState().activated).toBe(false);
    expect(s.getState().messages).toEqual([]);
  });
});
