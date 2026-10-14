import { afterEach, describe, expect, it, vi } from "vitest";
import { createWarpInput } from "./warp-input";

let input: ReturnType<typeof createWarpInput> | null = null;
afterEach(() => { input?.destroy(); input = null; });

const fire = (e: Event) => { window.dispatchEvent(e); return e.defaultPrevented; };
const wheel = () => new WheelEvent("wheel", { deltaY: 40, cancelable: true });
const key = (k: string) => new KeyboardEvent("keydown", { key: k, cancelable: true });

function setup() {
  let clock = 0;
  const onHurry = vi.fn();
  input = createWarpInput({ onHurry, now: () => clock });
  return { input, onHurry, tick: (ms: number) => { clock += ms; } };
}

describe("createWarpInput: the page is locked while a warp runs", () => {
  it("swallows wheels, swipes and scroll keys, which don't hurry it", () => {
    const { input, onHurry } = setup();
    input.lock();
    expect(fire(wheel())).toBe(true);
    expect(fire(new Event("touchmove", { cancelable: true }))).toBe(true);
    for (const k of [" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"]) expect(fire(key(k))).toBe(true);
    expect(onHurry).not.toHaveBeenCalled();
  });

  it("is hurried by a click or tap and by Esc; the click goes no further", () => {
    const { input, onHurry } = setup();
    input.lock();
    fire(new Event("pointerdown", { cancelable: true }));
    expect(onHurry).toHaveBeenCalledTimes(1);
    const click = new MouseEvent("click", { cancelable: true, bubbles: true });
    expect(fire(click)).toBe(true);
    expect(fire(key("Escape"))).toBe(true);
    expect(onHurry).toHaveBeenCalledTimes(2);
  });

  it("leaves other keys alone (typing in the bubble goes on)", () => {
    const { input } = setup();
    input.lock();
    expect(fire(key("a"))).toBe(false);
    expect(fire(key("Enter"))).toBe(false);
  });

  it("does nothing while unlocked", () => {
    const { onHurry } = setup();
    expect(fire(wheel())).toBe(false);
    fire(new Event("pointerdown"));
    expect(onHurry).not.toHaveBeenCalled();
  });

  it("swallows the momentum still running at landing, until the wheel goes quiet", () => {
    const { input, tick } = setup();
    input.lock();
    fire(wheel());
    input.unlock();
    tick(60);
    expect(fire(wheel())).toBe(true); // the same throw, still coasting
    tick(60);
    expect(fire(wheel())).toBe(true);
    tick(400);
    expect(fire(wheel())).toBe(false); // a new turn of the wheel after a pause scrolls
    expect(fire(key("PageDown"))).toBe(false);
  });
});
