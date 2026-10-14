/**
 * The chat's fixed lines, all in Tycho's voice: he talks about Janriz in the third person, while the page's own text
 * stays Janriz's first person. The model writes the replies (`lib/ai/system-prompt.ts`); these are the words around
 * them. Janriz's email is a markdown link, which the bubble renders as a real one.
 */
import { contactLinks } from "@/lib/content/contact";

const email = contactLinks.find((l) => l.slug === "email")!;
/** Janriz's email as a markdown link. */
export const EMAIL_LINK = `[${email.value}](${email.href})`;

/** The first visit's greeting, followed by the first three starters. */
export const GREETING =
  "Hi, I'm Tycho. Janriz built me to show you around his universe. Every star up there is one of his notes, and they light up as I read them. Ask me anything about him, or start here:";

/** A returning visitor's welcome back, beside "Open the log" and the starters not yet asked. */
export const WELCOME_BACK = "Welcome back. Want to pick up where we left off?";

/** The welcome back's way into the log. */
export const OPEN_LOG = "Open the log";

/** Starter questions, in order. Those not yet asked are offered, three at a time. */
export const STARTERS = [
  "What does he build with AI?",
  "Tell me about Athena",
  "How do you know all this?",
  "What's his stack?",
  "Show me his own projects",
  "What's he looking for next?",
  "Where did he study?",
];

/** Announced once to screen readers while he waits for a reply. */
export const READING = "Tycho is reading his notes.";

// When he can't answer: never a system notice, and always a way to reach Janriz. The server sends the first two as
// the error's message; the page says the third itself.

/** Over the per-visitor rate limit, with the minutes until he can answer again (never fewer than one). */
export function rateLimitLine(minutes: number) {
  const n = Math.max(1, Math.ceil(minutes));
  return `I've answered a lot in a short time, so I need ${n} ${n === 1 ? "minute" : "minutes"} to cool down. Ask me again then, or write to Janriz at ${EMAIL_LINK}.`;
}

/** The month's budget is spent. */
export function monthlyLimitLine() {
  return `I'm out of fuel for this month, so I can't answer until it refills. Janriz reads his own email: ${EMAIL_LINK}.`;
}

/** The page couldn't reach the chat at all. */
export function noConnectionLine() {
  return `I can't reach his notes right now. Try again in a moment, or write to Janriz at ${EMAIL_LINK}.`;
}

/**
 * What he says when a request fails: the server's own line, which the chat client hands over as the JSON body in the
 * error's message, or else the no-connection line. Never a raw error.
 */
export function errorLine(error: unknown) {
  const raw = error instanceof Error ? error.message : "";
  const start = raw.indexOf("{");
  if (start >= 0) {
    try {
      const { message } = JSON.parse(raw.slice(start)) as { message?: unknown };
      if (typeof message === "string" && message) return message;
    } catch {}
  }
  return noConnectionLine();
}
