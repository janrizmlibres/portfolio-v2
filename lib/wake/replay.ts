/**
 * The wake-up's replay: Contact's "Replay experience" (and the route map's Start) bring the wake-up back from its
 * loader, the name on black, without the count, since everything's loaded. The wake-up offers it where it ran on this
 * page (`offerReplay`); elsewhere (an automated browser, `?wake=off`) the replay lands on the film's first frame
 * instead (lib/film/replay.ts).
 */
const EVENT = "wake:replay";
let offered = 0;

/** The wake-up, where it ran on this page: the replay may bring it back. Returns the way to withdraw it. */
export function offerReplay(): () => void {
  offered++;
  let on = true;
  return () => {
    if (on) offered--;
    on = false;
  };
}

/** Brings the wake-up back from its loader, if this page has one; says whether it did. */
export function replayWake(): boolean {
  if (offered <= 0) return false;
  dispatchEvent(new Event(EVENT));
  return true;
}

/** Runs `fn` as the replay brings the wake-up back. Returns the way to stop. */
export function onReplayWake(fn: () => void): () => void {
  addEventListener(EVENT, fn);
  return () => removeEventListener(EVENT, fn);
}

/**
 * What `<html>` is marked with while the wake-up runs, as its head script marks it on a load (lib/wake/script.ts): the
 * lock, Tycho on his stage, and still under reduced motion.
 */
export function wakeClasses(reduced: boolean): string[] {
  return ["wake", "wake-lock", "wake-centre", ...(reduced ? ["wake-still"] : [])];
}
