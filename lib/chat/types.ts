/** `system` is his line when a request fails. A conversation saved before may carry other fields; they're ignored. */
export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string; // ISO
}

/** The conversation, which the log shows; nothing about the page. */
export interface ChatState {
  messages: ChatMessage[];
  updatedAt: string;
  /** Stable per-conversation id used to group LangSmith traces into a thread. */
  threadId: string;
}

export const STORAGE_KEY = "jrz-chat-v1";

export function newThreadId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
