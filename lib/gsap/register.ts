import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollSmoother } from "gsap/ScrollSmoother";

let registered = false;

/**
 * Idempotent: SmoothScroll calls it as the page mounts.
 */
export function registerGsapPlugins() {
  if (registered) return;
  if (typeof window === "undefined") return; // never on server
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, ScrollSmoother);
  registered = true;
}
