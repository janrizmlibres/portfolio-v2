import { ChatMessage, ChatState, STORAGE_KEY, newThreadId } from "./types";

type Listener = () => void;

export interface ChatStore {
  getState: () => ChatState;
  appendMessage: (msg: ChatMessage) => void;
  clear: () => void;
  subscribe: (listener: Listener) => () => void;
}

function emptyState(): ChatState {
  return {
    messages: [],
    updatedAt: new Date(0).toISOString(),
    threadId: newThreadId(),
  };
}

// a conversation saved by the old two-state page also carries an `activated` flag; it's read past and dropped on
// the next write
function readFromStorage(): ChatState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<ChatState>;
    return {
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

/**
 * The conversation, kept in localStorage under `jrz-chat-v1`: the messages, and the thread they trace under. While
 * anything listens, what another tab writes there is taken up, so neither tab's next write drops the other's messages.
 */
export function createChatStore(): ChatStore {
  let state = readFromStorage();
  const listeners = new Set<Listener>();
  const notify = () => {
    for (const l of listeners) l();
  };

  function commit(next: ChatState) {
    state = next;
    writeToStorage(state);
    notify();
  }
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY && e.key !== null) return;
    state = readFromStorage();
    notify();
  };

  return {
    getState: () => state,
    appendMessage(msg) {
      commit({ messages: [...state.messages, msg], updatedAt: new Date().toISOString(), threadId: state.threadId });
    },
    clear() {
      // a new thread on clear, so the next conversation traces as a fresh LangSmith thread
      commit({ messages: [], updatedAt: new Date().toISOString(), threadId: newThreadId() });
    },
    subscribe(listener) {
      if (!listeners.size) addEventListener("storage", onStorage);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (!listeners.size) removeEventListener("storage", onStorage);
      };
    },
  };
}
