/**
 * The wake-up's lock, for whatever must wait for the wake: a deep link lands on its reading spot only after it, and
 * a reload goes back to its place only after it. `<html class="wake-lock">` is set before first paint by the
 * wake-up's head script and taken off by the wake itself (`unlock`), the moment the visitor wakes Tycho.
 */
const EVENT = "wake:unlock";

export const isLocked = () => typeof document !== "undefined" && document.documentElement.classList.contains("wake-lock");

/** Runs `fn` once the page is unlocked: now, if it isn't locked. Returns the way to call it off. */
export function whenUnlocked(fn: () => void): () => void {
  if (!isLocked()) {
    fn();
    return () => {};
  }
  const on = () => {
    if (isLocked()) return;
    removeEventListener(EVENT, on);
    fn();
  };
  addEventListener(EVENT, on);
  return () => removeEventListener(EVENT, on);
}

/** The wake: the page is the visitor's from here; whatever waited for it runs. */
export function unlock() {
  if (!isLocked()) return;
  document.documentElement.classList.remove("wake-lock");
  dispatchEvent(new Event(EVENT));
}
