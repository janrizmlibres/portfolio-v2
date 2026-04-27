"use client";

import { createContext, useContext, useMemo } from "react";
import { ChatStore, createChatStore } from "@/lib/chat/store";

const ChatStoreContext = createContext<ChatStore | null>(null);

export function ChatStateProvider({ children }: { children: React.ReactNode }) {
  const store = useMemo(() => createChatStore(), []);
  return <ChatStoreContext.Provider value={store}>{children}</ChatStoreContext.Provider>;
}

export function useChatStore(): ChatStore {
  const store = useContext(ChatStoreContext);
  if (!store) throw new Error("useChatStore must be used within ChatStateProvider");
  return store;
}
