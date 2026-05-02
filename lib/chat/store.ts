import { ChatMessage, ChatState, STORAGE_KEY, newThreadId } from "./types";

type Listener = () => void;

export interface ChatStore {
  getState: () => ChatState;
  appendMessage: (msg: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clear: () => void;
  subscribe: (listener: Listener) => () => void;
}

function emptyState(): ChatState {
  return {
    activated: false,
    messages: [],
    updatedAt: new Date(0).toISOString(),
    threadId: newThreadId(),
  };
}

function readFromStorage(): ChatState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<ChatState>;
    return {
      activated: Boolean(parsed.activated),
      messages: Array.isArray(parsed.messages) ? (parsed.messages as ChatMessage[]) : [],
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date(0).toISOString(),
      threadId: typeof parsed.threadId === "string" && parsed.threadId ? parsed.threadId : newThreadId(),
    };
  } catch {
    return emptyState();
  }
}

function writeToStorage(state: ChatState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be full or disabled (incognito). Swallow — store is in-memory.
  }
}

export function createChatStore(): ChatStore {
  let state = readFromStorage();
  const listeners = new Set<Listener>();

  function notify() {
    for (const l of listeners) l();
  }

  return {
    getState: () => state,
    appendMessage(msg) {
      state = {
        activated: true,
        messages: [...state.messages, msg],
        updatedAt: new Date().toISOString(),
        threadId: state.threadId,
      };
      writeToStorage(state);
      notify();
    },
    setMessages(messages) {
      state = {
        activated: messages.length > 0,
        messages,
        updatedAt: new Date().toISOString(),
        threadId: state.threadId,
      };
      writeToStorage(state);
      notify();
    },
    clear() {
      // New thread on clear so the next conversation traces as a fresh LangSmith thread.
      state = {
        activated: false,
        messages: [],
        updatedAt: new Date().toISOString(),
        threadId: newThreadId(),
      };
      writeToStorage(state);
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
