import { ChatStateProvider } from "@/components/chat/ChatStateProvider";
import { Tycho } from "@/components/bubble/Tycho";
import { ScrollEffectHandler } from "@/components/effects/ScrollEffectHandler";
import { PointEffectHandler } from "@/components/effects/PointEffectHandler";
import { SmoothScroll } from "@/components/scroll/SmoothScroll";
import { Universe } from "@/components/universe/Universe";
import { Voyage } from "@/components/voyage/Voyage";
import { WakeUp } from "@/components/wake/WakeUp";

/**
 * The one page: the voyage, with Tycho on the screen's edges. Asking from the voyage (a block's "Ask Tycho about …"
 * button, a star, a chip) goes to his bubble. Tycho comes before the voyage, so his "Ask Tycho" button is early in
 * the tab order.
 */
export default function HomePage() {
  return (
    <ChatStateProvider>
      {/* the wake-up first, so its loader is the first thing in the page to paint */}
      <WakeUp />
      <Universe />
      <ScrollEffectHandler />
      <PointEffectHandler />
      <Tycho />

      <SmoothScroll>
        <main className="relative">
          <div className="relative z-[2] min-h-dvh">
            <div className="mx-auto px-4 pt-6 pb-6 sm:px-8 lg:px-12 lg:max-w-[120rem]">
              <Voyage />
            </div>
          </div>
        </main>
      </SmoothScroll>
    </ChatStateProvider>
  );
}
