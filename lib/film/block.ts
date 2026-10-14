/**
 * A block: one piece of the film's text, written in and dissolved by the scroll. It's real HTML in the runway, in
 * page order, and the film places it in the frame. Blocks are plain data, so the page renders them at first paint;
 * anything that rides the picture (a title's subject, a label's object, the craft a card hangs from) names it by a ref the
 * film's stage resolves once it has loaded.
 */
import type { Manner } from "./manners";
import type { WordMode } from "./modes";
import type { Box, TitleSide } from "./place";
import type { Span } from "./windows";

export type SectionId = "sec-hero" | "sec-about" | "sec-work" | "sec-projects" | "sec-contact";

/** A row of text. `data` is small print. `clock` marks the `{time}` in it as his clock, live. */
export type Line = { text: string; kind?: "line" | "data"; clock?: boolean };

export type Link = { label: string; href: string; back?: boolean };

/**
 * What a title rides: a subject `ref` the stage knows (`home`, `gate:logolife`, `star:s043`, …), offset by `ax`
 * and `ay` of its radius along the camera's right and up. `r` replaces the subject's radius.
 */
export type Anchor = { ref: string; ax: number; ay: number; r?: number; rScale?: number };

/** A photograph: its file, its size in px, and what it shows. */
export type Photo = { src: string; alt: string; width: number; height: number };

/**
 * A label hung on a leader line from its object `ref`, set out from its parent `of`; it may carry a photograph. `rest`
 * names where the label holds instead, its leader stretching on to the object: where its object rests while a hard
 * scroll throws it outwards, or a spot clear of its object's body (his portrait, in the dark under the ship).
 */
export type Label = { text: string; sub?: string; ref: string; of?: string; rest?: string; photo?: Photo };

export type Block = {
  id: string;
  sec: SectionId;
  title?: string;
  sub?: string;
  lines: Line[];
  links?: Link[];
  caption?: string;
  tIn: Span;
  tOut: Span;
  /** `sign`: a card (its date, its name, why) hung on a leader line beside its object `sign`, a ref the stage resolves */
  kind: "col" | "sign";
  sign?: string;
  /**
   * for a `sign` whose object passes too fast for a card hung beside it to be read (a breakthrough's craft): where its
   * card is pinned instead (its left and top, as fractions of the frame, on a wide screen and a portrait one), its
   * leader still running to the object
   */
  pin?: { land: { x: number; y: number }; port: { x: number; y: number } };
  /** how its words move: a word mode, or a manner that moves whole rows, visual lines and letters */
  mode: WordMode | Manner;
  /** the CSS colour its words arrive in */
  tint: string;
  side: TitleSide;
  /** where its title rides on a portrait screen, if not where it rides on a wide one */
  portSide?: TitleSide;
  /** its lines' box on a wide screen, on a portrait one, and on a phone held sideways (`short`, else `land`) */
  body: { land: Box; port: Box; short?: Box };
  anchor?: Anchor;
  labels?: Label[];
  /** labels that keep riding on phones instead of becoming a list */
  phoneRide?: boolean;
  /** for `pass`: each row's own out-window (the title is row 0), so the rows can leave in an order of their own */
  rowOut?: Span[];
  /** for `pass`: the point the dive aims at, a ref the stage resolves (`star:s043`); the rows are pushed out from it */
  passFrom?: string;
  ask?: { label: string; q: string };
  /** a section's opening words, read on the way in: a link to the section lands past them, on its first entry */
  intro?: boolean;
  /** the deep-link id `project-{slug}` */
  projId?: string;
  cls?: "hero" | "stage";
  /** a stage's colour, from his diagram */
  hue?: string;
};

export type Scene = { id: string; sec: SectionId; name: string; t0: number; t1: number };
