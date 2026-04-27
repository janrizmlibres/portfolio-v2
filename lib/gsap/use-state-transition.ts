import gsap from "gsap";

interface Args {
  state1: HTMLElement;
  state2: HTMLElement;
  chatPanel: HTMLElement | null;
  direction: "1to2" | "2to1";
  reduced: boolean;
}

export function runStateTransition({
  state1,
  state2,
  chatPanel,
  direction,
  reduced,
}: Args): Promise<void> {
  return new Promise((resolve) => {
    if (reduced) {
      if (direction === "1to2") {
        state1.style.display = "none";
        state2.style.display = "block";
      } else {
        state2.style.display = "none";
        state1.style.display = "grid";
      }
      resolve();
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power3.inOut" }, onComplete: resolve });

    if (direction === "1to2") {
      tl.to(state1, { opacity: 0, scale: 0.97, duration: 0.4 })
        .set(state1, { display: "none" })
        .set(state2, { display: "block", opacity: 0 })
        .to(state2, { opacity: 1, duration: 0.4 })
        .from(
          "#sec-about, #sec-work, #sec-projects, #sec-contact",
          { opacity: 0, y: 16, duration: 0.6, stagger: 0.08 },
          "-=0.1"
        );
      if (chatPanel) tl.from(chatPanel, { opacity: 0, x: 32, duration: 0.5 }, "-=0.5");
    } else {
      tl.to(state2, { opacity: 0, duration: 0.3 })
        .set(state2, { display: "none" })
        .set(state1, { display: "grid", opacity: 0, scale: 1 })
        .to(state1, { opacity: 1, duration: 0.4 });
    }
  });
}
