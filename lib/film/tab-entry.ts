/**
 * Where Tab comes into the page's text. The film shows one block at a time, and focus on a block glides the film to
 * it, so Tab coming in from outside the text (Tycho's buttons and the route map before it, the controls after it)
 * starts at the block on screen, as following an in-page link moves a browser's Tab starting point: after a warp, or
 * a scroll, Tab goes on from where the visitor is, never back to the page's first button. Everything stays in page
 * order, so Shift+Tab still reaches what came before.
 *
 * `spots` are the text's focusable elements, in page order, each at its block's reading spot; `here` is the reading
 * spot of the block on screen. Going forward it's the first at that block or after; going backward, the last of that
 * same block. -1: none (forward, past the last), and the browser's own order stands.
 */
export function tabEntry(spots: readonly number[], here: number, dir: 1 | -1): number {
  const first = spots.findIndex((s) => s >= here - 1e-6);
  if (first < 0) return dir > 0 ? -1 : spots.length - 1;
  if (dir > 0) return first;
  let last = first;
  while (last + 1 < spots.length && spots[last + 1] === spots[first]) last++;
  return last;
}
