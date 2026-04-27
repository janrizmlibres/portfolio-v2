import { useSyncExternalStore } from "react";
import { ChatStore } from "./store";

export function useChatState(store: ChatStore) {
  const state = useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getState // SSR snapshot — same as client; we render State 1 on server
  );
  return {
    state,
    appendMessage: store.appendMessage,
    setMessages: store.setMessages,
    clear: store.clear,
  };
}
