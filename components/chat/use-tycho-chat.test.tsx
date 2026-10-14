import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

type Opts = { onFinish(e: Record<string, unknown>): void };
const chat: { opts: Opts | null } = { opts: null };
vi.mock("@ai-sdk/react", () => ({
  useChat: (opts: Opts) => {
    chat.opts = opts;
    return { messages: [], status: "ready", sendMessage: () => {}, setMessages: () => {} };
  },
}));
vi.mock("@/lib/film/warp", () => ({ isWarping: () => false }));
vi.mock("@/lib/chat/sky", () => ({ lightStars: () => {}, unlightStars: () => {} }));
vi.mock("@/lib/state/use-active-section", () => ({ useActiveSection: () => null }));

import { ChatStateProvider, useChatStore } from "./ChatStateProvider";
import { useTychoChat } from "./use-tycho-chat";

const wrapper = ({ children }: { children: ReactNode }) => <ChatStateProvider>{children}</ChatStateProvider>;

describe("useTychoChat", () => {
  it("a request that fails without an Error still ends in his no-connection line, stored in the log", () => {
    localStorage.clear();
    const said: Array<[string, boolean]> = [];
    const { result } = renderHook(() => ({ chat: useTychoChat({ onText: (t, e) => said.push([t, e]) }), store: useChatStore() }), { wrapper });
    act(() => result.current.chat.send("What's his stack?"));
    act(() => chat.opts!.onFinish({ message: { id: "m1", role: "assistant", parts: [] }, messages: [], isAbort: false, isDisconnect: false, isError: true }));
    expect(said).toHaveLength(1);
    expect(said[0]![0]).toMatch(/^I can't reach his notes right now\./);
    expect(said[0]![1]).toBe(true);
    expect(result.current.store.getState().messages.map((m) => m.role)).toEqual(["user", "system"]);
  });
});
