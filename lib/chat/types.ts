export type ChatRole = "user" | "assistant" | "tool" | "system";

export interface ToolCall {
  name: "search_wiki" | "scroll_to" | "highlight_project";
  args: Record<string, unknown>;
  resultPreview?: string; // for the tool-call display line
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  /** For text messages. Tool calls live in `toolCalls`. */
  content: string;
  toolCalls?: ToolCall[];
  createdAt: string; // ISO
}

export interface ChatState {
  activated: boolean;
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
