"use client";

import { useState, useSyncExternalStore } from "react";
import { currentSound, onSound } from "@/lib/audio/current";
import type { Levels } from "@/lib/audio/engine";

const KEY = "jrz-mixer-v1";
const PARTS = ["hero", "home", "road", "athena", "crawler", "own", "contact"];
const LAYERS = ["bed", "keys", "pulse", "lead", "drone", "thinking"];
const SCENES = ["dive", "peel", "dock", "slide", "open", "fairing", "climax", "ribbon", "pullout", "warp", "warp-arrive"];
const SMALL = ["relay", "bell", "star-lit", "ui", "toggle", "emote"];

type Saved = Partial<Levels>;

function load(): Saved {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Saved;
  } catch {
    return {};
  }
}
function save(v: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {}
}

/**
 * While the levels are set by ear (development only, `?mixer`): a slider for every part, layer, scene change and
 * small sound, Tycho's voice, the instrument and the chat duck. Each change is heard at once, kept in this browser,
 * and "Copy" hands the numbers over to be written into the code.
 */
export function Mixer() {
  const sound = useSyncExternalStore(onSound, () => currentSound(), () => null);
  const [lv, setLv] = useState<Levels | null>(null);
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  // the engine arrives after the wake: give it what was set last time, then show its levels (set while rendering, as
  // React adjusts state to a changed input; setting the same levels twice is harmless)
  const [seen, setSeen] = useState<typeof sound>(null);
  if (sound && sound !== seen) {
    sound.levels.set(load());
    setSeen(sound);
    setLv(sound.levels.get());
  }

  if (!sound || !lv) return null;
  const set = (next: Saved) => {
    sound.levels.set(next);
    const all = sound.levels.get();
    setLv(all);
    save(all);
  };
  const group = (key: "parts" | "layers" | "shots", names: string[], max = 2, play = false) =>
    names.map((n) => (
      <div key={n} className="mx-row">
        <label htmlFor={`mx-${key}-${n}`}>{n}</label>
        <input id={`mx-${key}-${n}`} type="range" min={0} max={max} step={0.05} value={lv[key][n] ?? 1} onChange={(e) => set({ [key]: { [n]: +e.target.value } })} />
        <output>{(lv[key][n] ?? 1).toFixed(2)}</output>
        {play && (
          <button type="button" onClick={() => sound.play(({ emote: "emote-greet", ui: "ui-click", bell: "inst-bell-86" } as Record<string, string>)[n] ?? n)} aria-label={`Play ${n}`}>
            ▶
          </button>
        )}
      </div>
    ));
  const one = (label: string, value: number, onChange: (v: number) => void, max = 2) => (
    <div className="mx-row">
      <label htmlFor={`mx-${label}`}>{label}</label>
      <input id={`mx-${label}`} type="range" min={0} max={max} step={0.05} value={value} onChange={(e) => onChange(+e.target.value)} />
      <output>{value.toFixed(2)}</output>
    </div>
  );

  return (
    <div className="mx" data-open={open || undefined}>
      <button type="button" className="mx-chip" onClick={() => setOpen(!open)}>
        [ Mixer ]
      </button>
      {open && (
        <div className="mx-panel">
          <fieldset>
            <legend>Score · parts</legend>
            {group("parts", PARTS)}
          </fieldset>
          <fieldset>
            <legend>Score · layers</legend>
            {group("layers", LAYERS)}
          </fieldset>
          <fieldset>
            <legend>Scene changes</legend>
            {group("shots", SCENES, 2, true)}
          </fieldset>
          <fieldset>
            <legend>Small sounds</legend>
            {group("shots", SMALL, 2, true)}
            {one("Tycho's voice", lv.voice, (v) => set({ voice: v }))}
            {one("instrument", lv.instrument, (v) => set({ instrument: v }))}
          </fieldset>
          <fieldset>
            <legend>Chat duck (score level)</legend>
            {one("thinking", lv.duck.submitted, (v) => set({ duck: { ...lv.duck, submitted: v } }), 1)}
            {one("answering", lv.duck.streaming, (v) => set({ duck: { ...lv.duck, streaming: v } }), 1)}
          </fieldset>
          <div className="mx-acts">
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(JSON.stringify(sound.levels.get(), null, 2)).then(() => setCopied(true));
              }}
            >
              {copied ? "Copied" : "Copy values"}
            </button>
            <button
              type="button"
              onClick={() => {
                save({});
                location.reload();
              }}
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
