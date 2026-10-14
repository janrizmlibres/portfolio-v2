/**
 * Deep links under smooth scrolling. The smoothed page lives in a fixed wrapper, so the browser can't scroll
 * to a fragment by itself; this does it instead, and keeps Back and Forward honest:
 * - a URL loaded with a hash lands on that section, once it's laid out;
 * - an in-page link glides to its section and pushes the hash, after saving the scroll position on the entry
 *   being left, so Back returns to exactly where the visitor was;
 * - Back and Forward restore that saved position, and the hash change that follows them is ignored;
 * - a hash typed by hand jumps to its section.
 * Saved positions merge into `history.state`, which the Next.js router also keeps data in.
 */

type Target = Element | number;

type Deps = {
  scrollTo: (target: Target, smooth: boolean) => void;
  find: (id: string) => Element | null;
  history: Pick<History, "state" | "pushState" | "replaceState">;
  location: Pick<Location, "hash">;
  scrollY: () => number;
};

/** Where a deep link saves the scroll position on the history entry being left. */
export const DEEP_LINK_KEY = "deepLinkY";

/**
 * Goes to `href` in history the way an in-page link does: saves the scroll position `y` on the entry being left, so
 * Back returns to exactly there, then pushes the new address.
 */
export function pushDeepLink(history: Pick<History, "state" | "pushState" | "replaceState">, y: number, href: string | null) {
  const state = history.state && typeof history.state === "object" ? history.state : {};
  history.replaceState({ ...state, [DEEP_LINK_KEY]: y }, "");
  history.pushState(null, "", href);
}

const idOf = (hash: string) => {
  const raw = hash.replace(/^#/, "");
  if (!raw) return null;
  try { return decodeURIComponent(raw); } catch { return raw; }
};

export function createDeepLinks({ scrollTo, find, history, location, scrollY }: Deps) {
  let restored = false;
  const target = (hash: string) => { const id = idOf(hash); return id ? find(id) : null; };
  const jumpToHash = () => { const el = target(location.hash); if (el) scrollTo(el, false); return !!el; };

  return {
    /**
     * Lands on the loaded URL's section. "pending" means the hash names something not laid out yet (a section
     * shown only after hydration): call again when the page's layout changes.
     */
    landOnHash(): "landed" | "pending" | "none" {
      if (!idOf(location.hash)) return "none";
      return jumpToHash() ? "landed" : "pending";
    },

    onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      const href = a?.getAttribute("href");
      if (!href?.startsWith("#")) return;
      const el = target(href);
      if (!el) return;
      e.preventDefault();
      pushDeepLink(history, scrollY(), href);
      scrollTo(el, true);
    },

    onPopState(e: PopStateEvent) {
      const y = (e.state as Record<string, unknown> | null)?.[DEEP_LINK_KEY];
      restored = typeof y === "number";
      if (restored) scrollTo(y as number, false);
    },

    onHashChange() {
      if (restored) { restored = false; return; }
      jumpToHash();
    },
  };
}
