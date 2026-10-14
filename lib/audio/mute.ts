/**
 * The remembered mute: a visitor who turned the sound off finds it off on their next visit, and the wake-up's click
 * wakes Tycho silently. Storage that's blocked or missing counts as sound on.
 */
type Store = Pick<Storage, "getItem" | "setItem"> | null;
const KEY = "jrz-sound-v1";

export function soundWasOff(s: Store) {
  try {
    return s?.getItem(KEY) === "off";
  } catch {
    return false;
  }
}

export function rememberSound(s: Store, on: boolean) {
  try {
    s?.setItem(KEY, on ? "on" : "off");
  } catch {}
}
