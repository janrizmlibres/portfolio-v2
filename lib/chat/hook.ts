import { useSyncExternalStore } from "react";
import { ChatStore } from "./store";
import { ChatState } from "./types";

const SSR_SNAPSHOT: ChatState = {
  messages: [],
  updatedAt: new Date(0).toISOString(),
  threadId: "",
};

export function useChatState(store: ChatStore) {
  const state = useSyncExternalStore(
    store.subscribe,
    store.getState,
    () => SSR_SNAPSHOT // must match SSR output to avoid hydration mismatch
  );
  return {
    state,
    appendMessage: store.appendMessage,
    clear: store.clear,
  };
}
