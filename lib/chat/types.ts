export type ChatRole = "user" | "assistant" | "tool";

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
}

export const STORAGE_KEY = "jrz-chat-v1";
