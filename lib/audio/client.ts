/**
 * The sound engine in the browser: made once, on the page's one AudioContext, with the stems the pipeline wrote
 * (`pnpm audio:export`). Loaded after first paint, by the wake-up's loader or the sound toggle.
 *
 * The context keeps the default audio session (`ambient` on iOS), so the Silent switch mutes the score and the
 * visitor's own music keeps playing.
 */
import { setCurrentSound, currentSound } from "./current";
import { createSound, type ShotManifest, type Sound, type StemManifest } from "./engine";
import { SCENE_SHOTS } from "./cues";
import { defineStarLit } from "./hand-sound";
import { sampleShot } from "./standin";
import manifest from "./stems.json";
import shots from "./shots.json";
import { LEVELS } from "./levels";

async function fetchBytes(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.arrayBuffer();
}

function storage() {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

export function sound(): Sound {
  const have = currentSound();
  if (have) return have;
  const ctx = new AudioContext({ latencyHint: "interactive" });
  const s = createSound({
    ctx,
    manifest: manifest as StemManifest,
    shots: shots as ShotManifest,
    scenes: SCENE_SHOTS,
    levels: structuredClone(LEVELS),
    fetchBytes,
    canPlay: (mime) => document.createElement("audio").canPlayType(mime),
    phone: matchMedia("(pointer: coarse)").matches,
    storage: storage(),
  });
  document.addEventListener("visibilitychange", () => s.setHidden(document.hidden));
  // once he's awake, a star lit as he reads gets its note (loaded then, never before the wake)
  const offLit = s.subscribe(() => {
    if (!s.state.woken) return;
    offLit();
    void defineStarLit(s, (buf) => sampleShot(buf));
  });
  setInterval(() => s.checkClock(performance.now()), 500);
  if (process.env.NODE_ENV !== "production") Object.assign(window, { __sound: s });
  setCurrentSound(s);
  return s;
}
