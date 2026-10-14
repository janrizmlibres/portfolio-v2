/**
 * The instrument's voices: at most `cap` sound at once, and past it the oldest is cut over `cutFade` seconds. Each
 * note sounds at most every `gap` seconds, so a fast sweep can't pile one note up. What a voice is (synthesised or a
 * recorded sample) is up to `start`.
 */
export function createVoicePool<V>({
  cap = 16,
  cutFade = 0.04,
  gap = 0.1,
  start,
  cut,
}: {
  cap?: number;
  cutFade?: number;
  gap?: number;
  start: (note: number, at: number) => V;
  cut: (voice: V, at: number, fade: number) => void;
}) {
  const voices: V[] = [];
  const last = new Map<number, number>();
  return {
    voices,
    get sounding() {
      return voices.length;
    },
    /** Sounds `note` at `at`, unless it sounded under `gap` ago. */
    play(note: number, at: number) {
      if (at - (last.get(note) ?? -Infinity) < gap) return false;
      last.set(note, at);
      if (voices.length >= cap) cut(voices.shift()!, at, cutFade);
      voices.push(start(note, at));
      return true;
    },
    /** A voice that has finished on its own. */
    ended(voice: V) {
      const i = voices.indexOf(voice);
      if (i >= 0) voices.splice(i, 1);
    },
  };
}
