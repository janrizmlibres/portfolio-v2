/**
 * The levels set by ear on the real site (the mixer, `?mixer`). They trim the score's layers and
 * parts, the one-shots (the emotes and the UI ticks as families) and the buses, and set how far the score ducks while
 * Tycho thinks and answers. The mixer starts from these.
 */
import type { Levels } from "./engine";

export const LEVELS: Partial<Levels> = {
  layers: { bed: 0.75 },
  parts: {},
  shots: { dock: 0.7, climax: 2, emote: 0.55 },
  voice: 1,
  instrument: 1,
  duck: { submitted: 0.4, streaming: 0.6 },
};
