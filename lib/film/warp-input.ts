/**
 * The page is locked while a warp runs: wheels, swipes and scroll keys are swallowed and don't hurry it, and the
 * momentum still running when it lands is swallowed too, until the wheel goes quiet. A click, tap or Esc hurries it
 * (the click itself goes no further, so it never starts something else). Other keys are left alone: typing in
 * Tycho's bubble carries on. Every listener is on the window's capture phase, added while the click that started the
 * warp is already past it, so that click never hurries its own warp.
 */
const SCROLL_KEYS = new Set([" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"]);
const QUIET_MS = 220;

export function createWarpInput({ onHurry, now = () => performance.now() }: { onHurry: () => void; now?: () => number }) {
  let locked = false;
  // after landing, the wheel stays swallowed until it has been quiet this long
  let coasting = false, lastWheel = -Infinity;

  const swallow = (e: Event) => { if (e.cancelable) e.preventDefault(); };
  const onWheel = (e: Event) => {
    const t = now();
    if (locked) { lastWheel = t; swallow(e); return; }
    if (!coasting) return;
    if (t - lastWheel < QUIET_MS) { lastWheel = t; swallow(e); return; }
    coasting = false;
  };
  const onTouch = (e: Event) => { if (locked) swallow(e); };
  const onKey = (e: KeyboardEvent) => {
    if (!locked) return;
    if (e.key === "Escape") { swallow(e); onHurry(); return; }
    // keys typed into a field are the visitor's
    const el = e.target as HTMLElement | null;
    if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName ?? ""))) return;
    if (SCROLL_KEYS.has(e.key)) swallow(e);
  };
  const onDown = () => { if (locked) onHurry(); };
  const onClick = (e: Event) => {
    if (!locked) return;
    swallow(e);
    e.stopPropagation();
  };

  const opts = { capture: true, passive: false } as const;
  addEventListener("wheel", onWheel, opts);
  addEventListener("touchmove", onTouch, opts);
  addEventListener("keydown", onKey, true);
  addEventListener("pointerdown", onDown, true);
  addEventListener("click", onClick, true);

  return {
    lock() {
      locked = true;
      coasting = false;
    },
    unlock() {
      if (!locked) return;
      locked = false;
      coasting = true;
    },
    get locked() { return locked; },
    destroy() {
      removeEventListener("wheel", onWheel, opts);
      removeEventListener("touchmove", onTouch, opts);
      removeEventListener("keydown", onKey, true);
      removeEventListener("pointerdown", onDown, true);
      removeEventListener("click", onClick, true);
    },
  };
}
