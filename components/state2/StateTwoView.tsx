import { CompactHero } from "./CompactHero";
import { CurrentlyStrip } from "./CurrentlyStrip";
import { AboutSection } from "./AboutSection";
import { WorkSection } from "./WorkSection";
import { PersonalProjectsSection } from "./PersonalProjectsSection";
import { ContactSection } from "./ContactSection";

interface Props {
  chatPanelSlot: React.ReactNode;
}

export function StateTwoView({ chatPanelSlot }: Props) {
  return (
    <section id="state-2" aria-label="Portfolio with side chat" className="relative z-[2] min-h-dvh">
      <div className="grid items-start gap-4 px-4 pb-16 pt-6 sm:px-8 md:grid-cols-[minmax(0,1fr)_380px] md:gap-8 lg:px-12 max-md:pb-[35vh]">
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
