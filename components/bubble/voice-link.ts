/**
 * Tycho's voice follows his talking: the chirps engine (`voice/engine.ts`) hears the bubble's talk events. It's
 * unlocked inside the asking gesture, voices each word as the reveal shows it, falls silent on a hush, and closes
 * the radio once the reply has shown. Returns the way to stop listening.
 */
import { onTalk } from "@/lib/chat/talk";
import { createVoice } from "./voice/engine";

export function linkVoice() {
  const v = createVoice();
  const off = onTalk((t) => {
    if (t.type === "ask") {
      v.unlock();
      v.reset();
    } else if (t.type === "show") v.update(t.blocks, t.visible);
    else if (t.type === "hush") v.stop();
    else if (t.type === "done") v.end();
  });
  return () => {
    off();
    v.destroy();
  };
}
