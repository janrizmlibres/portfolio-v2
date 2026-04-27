"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { ChatStateProvider, useChatStore } from "@/components/chat/ChatStateProvider";
import { useChatState } from "@/lib/chat/hook";
import { StateOneLanding } from "@/components/state1/StateOneLanding";
import { StateTwoView } from "@/components/state2/StateTwoView";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { MobileBottomSheet } from "@/components/chat/MobileBottomSheet";
import { ScrollEffectHandler } from "@/components/effects/ScrollEffectHandler";
import { HighlightEffectHandler } from "@/components/effects/HighlightEffectHandler";
import { registerGsapPlugins } from "@/lib/gsap/register";
import { runStateTransition } from "@/lib/gsap/use-state-transition";
import { emit } from "@/lib/tool-effects/event-bus";

function HomeInner() {
  const store = useChatStore();
  const { state, appendMessage, clear } = useChatState(store);

  const state1Ref = useRef<HTMLDivElement | null>(null);
  const state2Ref = useRef<HTMLDivElement | null>(null);
  const chatPanelRef = useRef<HTMLDivElement | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  // AI SDK v6: useChat from @ai-sdk/react
  // - sendMessage({ text }) to submit user messages
  // - status: 'submitted' | 'streaming' | 'ready' | 'error'
  // - setMessages([]) to reset SDK message state
  // - onToolCall: toolCall.toolName + toolCall.input (not .args)
  // - onFinish: { message, messages, isAbort, isDisconnect, isError, finishReason }
  // - transport: DefaultChatTransport defaults to POST /api/chat
  const { sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),

    onToolCall({ toolCall }) {
      // v6: tool call input lives at toolCall.input (not toolCall.args)
      const input = (toolCall as { input?: Record<string, unknown> }).input;
      if (!input) return;
      const toolName = (toolCall as { toolName: string }).toolName;
      if (toolName === "scroll_to") {
        emit("scrollTo", { section: input.section as never });
      } else if (toolName === "highlight_project") {
        emit("highlightProject", { slug: input.slug as never });
      }
    },

    onFinish({ message }) {
      // v6 onFinish: { message: UIMessage, messages: UIMessage[], isAbort, isDisconnect, isError, finishReason }
      // Extract text content from the UIMessage parts
      const parts = (message as { parts?: Array<{ type: string; text?: string }> }).parts ?? [];
      const text = parts
        .filter((p) => p.type === "text")
        .map((p) => p.text ?? "")
        .join("");
      // Also fall back to content if parts are empty
      const content =
        text || (message as { content?: string }).content || "";
      if (content) {
        appendMessage({
          id: message.id ?? crypto.randomUUID(),
          role: "assistant",
          content,
          createdAt: new Date().toISOString(),
        });
      }
    },
  });

  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    registerGsapPlugins();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((document.activeElement as HTMLElement)?.tagName ?? "")) {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>('input[aria-label="Ask the agent anything"]');
        input?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const showState2 = state.activated;

  async function handleSubmit(text: string) {
    if (!text.trim() || transitioning) return;

    // Persist user message to our local store
    appendMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    });

    // Trigger state transition on first submit
    if (!showState2 && state1Ref.current && state2Ref.current) {
      setTransitioning(true);
      await runStateTransition({
        state1: state1Ref.current,
        state2: state2Ref.current,
        chatPanel: chatPanelRef.current,
        direction: "1to2",
        reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
      setTransitioning(false);
    }

    // v6: sendMessage({ text }) — sends the user message to the server
    sendMessage({ text });
  }

  async function handleClear() {
    // Reset our local store
    clear();
    // Reset AI SDK v6 message state
    setMessages([]);

    if (state1Ref.current && state2Ref.current) {
      await runStateTransition({
        state1: state1Ref.current,
        state2: state2Ref.current,
        chatPanel: chatPanelRef.current,
        direction: "2to1",
        reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
    }
  }

  const desktopChatPanel = (
    <div ref={chatPanelRef} className="max-md:hidden">
      <ChatPanel
        onSubmit={handleSubmit}
        onClear={handleClear}
        isStreaming={isStreaming}
        disabled={transitioning}
      />
    </div>
  );

  return (
    <>
      <AmbientBackdrop />
      <ScrollEffectHandler />
      <HighlightEffectHandler />

      <main className="relative">
        <div ref={state1Ref} style={{ display: showState2 ? "none" : "grid" }}>
          <StateOneLanding onSubmit={handleSubmit} />
        </div>

        <div ref={state2Ref} style={{ display: showState2 ? "block" : "none" }}>
          <StateTwoView chatPanelSlot={desktopChatPanel} />
        </div>

        {showState2 ? (
          <MobileBottomSheet>
            <ChatPanel
              flat
              onSubmit={handleSubmit}
              onClear={handleClear}
              isStreaming={isStreaming}
              disabled={transitioning}
            />
          </MobileBottomSheet>
        ) : null}
      </main>
    </>
  );
}

export default function HomePage() {
  return (
    <ChatStateProvider>
      <HomeInner />
    </ChatStateProvider>
  );
}
