import { useSyncExternalStore } from "react";
import { ChatStore } from "./store";
import { ChatState } from "./types";

const SSR_SNAPSHOT: ChatState = { activated: false, messages: [], updatedAt: new Date(0).toISOString() };

export function useChatState(store: ChatStore) {
  const state = useSyncExternalStore(
    store.subscribe,
    store.getState,
    () => SSR_SNAPSHOT // must match SSR output to avoid hydration mismatch
  );
  return {
    state,
    appendMessage: store.appendMessage,
    setMessages: store.setMessages,
    clear: store.clear,
  };
}
