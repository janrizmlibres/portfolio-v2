/**
 * The sound each of Tycho's emotes plays: its own name, case kept (emote-allGood), so the emotes and the files can't
 * drift apart (hooks.test.ts checks every one has a file in shots.json).
 */
export const emoteSound = (name: string) => `emote-${name}`;
