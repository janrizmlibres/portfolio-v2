/**
 * The wake-up's sway (Edolus's landing): while Tycho charges and dozes, the pointer swings the camera round him a few
 * degrees, right with it right and up with it up: about 4° across and 2° up and down, in radians at the screen's edges.
 */
export const SWAY = { az: 0.07, el: 0.035 };

const edge = (v: number) => Math.max(-1, Math.min(1, v));

/** the camera's offset for a pointer at (x, y) in a w × h viewport: none at the centre, the most at the edges */
export function swayAt(x: number, y: number, w: number, h: number) {
  return { az: edge((x - w / 2) / (w / 2)) * SWAY.az, el: edge((h / 2 - y) / (h / 2)) * SWAY.el };
}
