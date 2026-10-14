/**
 * The film's stage: the picture. It loads after first paint (three.js and the universe come in lazily), so the
 * text runtime starts without it, placing titles in their columns, and takes it up once the universe hands it over
 * through `provideStage`.
 */
import type { Object3D } from "three";
import type { Anchor } from "./block";
import type { Fling } from "./fling";
import type { ScreenPoint } from "./place";

/** Where things in the picture are on screen, valid after the frame has been drawn. */
export interface StageView {
  /** a title's subject, offset along the camera's right and up */
  anchor(a: Anchor): ScreenPoint | null;
  /** a label's object, or its parent */
  point(ref: string): ScreenPoint | null;
  /** a star */
  star(id: string): ScreenPoint | null;
  /** how far (px) the label on `ref` keeps from its parent's centre, to hang outside the parent's disc, if it must; for
   *  a card, how far its object reaches from its middle */
  labelClear?(ref: string): number | undefined;
}

/**
 * A piece of the picture a warp can carry down its throat (lib/voyage/warp-debris.ts): a craft of Work's traffic, a
 * frame of the ribbon (the object each copies: its meshes' geometry and maps are shared, never copied), a record (made
 * from record.ts), or his portrait's Slab (faced with the portrait the page has loaded).
 */
export type Cargo = { kind: "craft" | "frame"; obj: Object3D } | { kind: "record" | "slab" };

export interface Stage {
  /** resolves once the stage's own assets (a photo, a model) have loaded, so no frame shows them missing */
  ready: Promise<void>;
  /** resolves once every later scene's assets (loaded under the wake-up's loader) are in and warmed up */
  whole?: Promise<void>;
  /** sets the picture to the film's time `t`: the timeline's states, the drivers, the camera */
  seek(t: number): void;
  /**
   * how hard the scroll is this frame (0..1; 0 under reduced motion), given before `seek`; `f` reads it as it was a
   * moment ago (`f.at(delay)`), for things thrown one after another
   */
  fling?(v: number, f?: Fling): void;
  /** draws the frame */
  render(): void;
  view: StageView;
  /** a copy of the frame just drawn, for a reduced-motion still */
  snapshot(): HTMLCanvasElement;
  /**
   * What a warp leaving the picture carries down its throat: `at(t)`, the pieces of the scene the film's in at film
   * time `t` (none from the hero or Contact); `all()`, every piece any scene gives, so each compiles ahead.
   * Empty until the later scenes' models are in (`whole`).
   */
  cargo?: { at(t: number): Cargo[]; all(): Cargo[] };
  /** the window changed size: aspect-dependent framing is rebuilt */
  resize(view: { w: number; h: number }): void;
  dispose(): void;
}

let current: Stage | null = null;
const listeners = new Set<(s: Stage | null) => void>();

export function provideStage(s: Stage | null) {
  current = s;
  listeners.forEach((l) => l(s));
}

export function onStage(cb: (s: Stage | null) => void) {
  listeners.add(cb);
  cb(current);
  return () => listeners.delete(cb);
}

const stale = new Set<() => void>();

/**
 * Something in the picture changed with no change of time (an image the stage loads late has arrived): reduced-motion stills already taken are taken again as they're next shown.
 */
export function stillsStale() {
  stale.forEach((l) => l());
}

export function onStillsStale(cb: () => void) {
  stale.add(cb);
  return () => stale.delete(cb);
}
