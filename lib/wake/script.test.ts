import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { markSwitched, WAKE_SCRIPT } from "./script";

const html = document.documentElement;
const load = (search = "?wake=on") => {
  history.replaceState(null, "", `/${search}`);
  html.className = "";
  new Function(WAKE_SCRIPT)();
  return [...html.classList];
};

describe("the wake-up's head script, after a switch between lite and the film", () => {
  beforeEach(() => {
    window.matchMedia = ((q: string) => ({ matches: false, media: q })) as unknown as typeof matchMedia;
    sessionStorage.clear();
  });
  afterEach(() => sessionStorage.clear());

  it("a switch's reload runs the loader and skips his stage: marked wake-switch, not wake-centre", () => {
    markSwitched();
    expect(load()).toEqual(["wake", "wake-lock", "wake-switch"]);
  });

  it("the mark is one-shot: the next load plays the whole wake-up", () => {
    markSwitched();
    load();
    expect(load()).toEqual(["wake", "wake-lock", "wake-centre"]);
  });

  it("is cleared where the wake-up doesn't play, so it can't wait for a later load", () => {
    markSwitched();
    expect(load("?wake=off")).toEqual([]);
    expect(load()).toEqual(["wake", "wake-lock", "wake-centre"]);
  });
});
