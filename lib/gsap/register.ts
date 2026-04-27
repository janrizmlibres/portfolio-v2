import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { Draggable } from "gsap/Draggable";

let registered = false;

/**
 * Idempotent. Call once at app boot (e.g. in app/page.tsx via a client child).
 */
export function registerGsapPlugins() {
  if (registered) return;
  if (typeof window === "undefined") return; // never on server
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Draggable);
  registered = true;
}
