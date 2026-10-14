import { describe, it, expect, beforeEach } from "vitest";
import { createChatStore } from "./store";
import { STORAGE_KEY } from "./types";

beforeEach(() => {
  localStorage.clear();
});

const msg = (id: string, role: "user" | "assistant", content: string) => ({ id, role, content, createdAt: "2026-01-01T00:00:00Z" });

describe("chat store: the conversation, and nothing else", () => {
  it("starts with no messages", () => {
    const s = createChatStore();
    expect(s.getState().messages).toEqual([]);
  });

  it("holds only the conversation: no flag that switched the page between two states", () => {
    const s = createChatStore();
    s.appendMessage(msg("m1", "user", "hi"));
    expect(Object.keys(s.getState()).sort()).toEqual(["messages", "threadId", "updatedAt"]);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).not.toHaveProperty("activated");
  });

  it("appends and persists under the same key", () => {
    const s = createChatStore();
    s.appendMessage(msg("m1", "user", "hi"));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(STORAGE_KEY).toBe("jrz-chat-v1");
    expect(stored.messages).toHaveLength(1);
  });

  it("clear wipes the messages and starts a new thread", () => {
    const s = createChatStore();
    s.appendMessage(msg("m1", "user", "hi"));
    const before = s.getState().threadId;
    s.clear();
    expect(s.getState().messages).toEqual([]);
    expect(s.getState().threadId).not.toBe(before);
  });

  it("still loads a conversation saved by the old two-state page, flag and all", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activated: true,
        messages: [msg("x", "user", "hi"), msg("y", "assistant", "Hello.")],
        updatedAt: "2026-01-01T00:00:00Z",
        threadId: "t-old",
      }),
    );
    const s = createChatStore();
    expect(s.getState().messages).toHaveLength(2);
    expect(s.getState().threadId).toBe("t-old");
    expect(s.getState()).not.toHaveProperty("activated");
  });

  it("subscribers are notified on changes", () => {
    const s = createChatStore();
    const calls: number[] = [];
    s.subscribe(() => calls.push(s.getState().messages.length));
    s.appendMessage({ id: "1", role: "user", content: "a", createdAt: "" });
    s.appendMessage({ id: "2", role: "assistant", content: "b", createdAt: "" });
    expect(calls).toEqual([1, 2]);
  });

  it("takes up what another tab wrote, so its next message keeps both tabs' conversation", () => {
    const s = createChatStore();
    const seen: number[] = [];
    const off = s.subscribe(() => seen.push(s.getState().messages.length));
    s.appendMessage(msg("m1", "user", "hi"));
    const other = { messages: [msg("m1", "user", "hi"), msg("m2", "assistant", "Hello.")], updatedAt: "2026-01-02T00:00:00Z", threadId: s.getState().threadId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(other));
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    s.appendMessage(msg("m3", "user", "And now?"));
    expect(s.getState().messages.map((m) => m.id)).toEqual(["m1", "m2", "m3"]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).messages).toHaveLength(3);
    expect(seen).toEqual([1, 2, 3]);
    off();
  });

  it("survives an unparseable localStorage payload", () => {
    localStorage.setItem(STORAGE_KEY, "not-json");
    const s = createChatStore();
    expect(s.getState().messages).toEqual([]);
  });
});
