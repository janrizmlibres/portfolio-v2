/**
 * The reply held while the page moves: Tycho answers once the warp (or the move waiting for its stars) is over, not
 * over it. While `moving()`, what arrives is kept (only the latest: each arrival is everything so far) and handed to
 * `out` on the first `check()` with the page still. A reply already showing holds too, mid-sentence, until the move is
 * over. `drop()` forgets what's held (a new question).
 */
export function createHold(o: { moving(): boolean; out(text: string, ended: boolean): void }) {
  let held: [string, boolean] | null = null;
  const release = () => {
    if (!held || o.moving()) return;
    const [text, ended] = held;
    held = null;
    o.out(text, ended);
  };
  return {
    /** the reply so far, and whether it has ended */
    arrive(text: string, ended: boolean) {
      held = [text, ended];
      release();
    },
    /** once a frame: hands over what's held once the page is still */
    check: release,
    drop() {
      held = null;
    },
  };
}
