/**
 * The pointer, as the film's scenes see it, and the subjects they let the hand ask about.
 * - `pointer` is written by the hand as the pointer moves; a scene reads it from its own frame (Athena's nearest
 *   wedge parts towards it) instead of listening for itself. Lengths in CSS px; `fine` is a mouse or a pen;
 *   `overUI` is over a link, a button, a label or the chat, where nothing in the picture answers the pointer.
 * - A scene registers what can be asked about in it, with where it is on screen this frame (its disc, or a face's
 *   four corners), so the hand needn't know how the scene is built. A registered subject replaces the hand's own
 *   reading of the block with the same id.
 */
import type { SubjectHit } from "./hand";

export const pointer = { x: 0, y: 0, in: false, fine: true, overUI: false, down: false, dragging: false };

export type Subject = {
  /** the block it belongs to (`athena`, `role-logolife`, `mark-mcp`), or an id of its own */
  id: string;
  /** what the chip calls it: `[ ASK ABOUT {label} ]` */
  label: string;
  /** what asking about it asks Tycho */
  q: string;
  /** where it is on screen this frame, or null while it isn't there to ask about */
  hit: () => SubjectHit | null;
};

const registered = new Map<string, Subject>();

/** Lets the hand ask about `s`; returns how to take it back. */
export function registerSubject(s: Subject) {
  registered.set(s.id, s);
  return () => {
    if (registered.get(s.id) === s) registered.delete(s.id);
  };
}

export const registeredSubjects = (): ReadonlyMap<string, Subject> => registered;
