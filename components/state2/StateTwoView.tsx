import { CompactHero } from "./CompactHero";
import { CurrentlyStrip } from "./CurrentlyStrip";
import { AboutSection } from "./AboutSection";
import { WorkSection } from "./WorkSection";
import { PersonalProjectsSection } from "./PersonalProjectsSection";
import { ContactSection } from "./ContactSection";

interface Props {
  chatPanelSlot: React.ReactNode;
  chatCollapsed?: boolean;
}

export function StateTwoView({ chatPanelSlot, chatCollapsed }: Props) {
  // No items-start: let the chat slot stretch to row height so its sticky child
  // has a full-page containing block (otherwise the panel scrolls out of view).
  const grid = chatCollapsed
    ? "grid gap-4 px-4 pb-16 pt-6 sm:px-8 md:grid-cols-[minmax(0,1fr)_56px] md:gap-4 lg:px-12 max-md:pb-[35vh]"
    : "grid gap-4 px-4 pb-16 pt-6 sm:px-8 md:grid-cols-[minmax(0,1fr)_380px] md:gap-8 lg:px-12 max-md:pb-[35vh]";
  return (
    <section id="state-2" aria-label="Portfolio with side chat" className="relative z-[2] min-h-dvh">
      <div className={grid}>
        <div className="min-w-0 max-w-[78rem]">
          <CompactHero />
          <CurrentlyStrip />
          <AboutSection />
          <WorkSection />
          <PersonalProjectsSection />
          <ContactSection />
        </div>
        {chatPanelSlot}
      </div>
    </section>
  );
}
