import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDeepLinks } from "./deep-links";

function setup(hash = "", scrollY = 0) {
  document.body.innerHTML = `
    <a id="to-work" href="#sec-work">Work</a>
    <a id="to-nowhere" href="#sec-missing">Missing</a>
    <a id="bare" href="#">Top</a>
    <a id="away" href="/elsewhere#sec-work">Away</a>
    <section id="sec-work"></section>`;
  const location = { hash };
  const history = {
    state: null as unknown,
    pushState: vi.fn((s: unknown, _t: string, url: string) => { history.state = s; location.hash = url; }),
    replaceState: vi.fn((s: unknown) => { history.state = s; }),
  };
  const deps = {
    scrollTo: vi.fn(),
    find: (id: string) => document.getElementById(id),
    history,
    location,
    scrollY: () => scrollY,
  };
  const links = createDeepLinks(deps);
  const click = (id: string, init: MouseEventInit = {}) => {
    const e = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...init });
    document.getElementById(id)!.dispatchEvent(e);
    links.onClick(e);
    return e;
  };
  return { links, deps, history, location, click };
}

describe("createDeepLinks", () => {
  beforeEach(() => { document.body.innerHTML = ""; });

  it("lands on the section a loaded URL's hash names, without gliding", () => {
    const { links, deps } = setup("#sec-work");
    links.landOnHash();
    expect(deps.scrollTo).toHaveBeenCalledWith(document.getElementById("sec-work"), false);
  });

  it("does nothing on load without a hash, or with one that names nothing", () => {
    for (const hash of ["", "#", "#sec-missing"]) {
      const { links, deps } = setup(hash);
      links.landOnHash();
      expect(deps.scrollTo).not.toHaveBeenCalled();
    }
  });

  it("says whether it still has a landing to make, so it can retry once the section is laid out", () => {
    expect(setup("#sec-work").links.landOnHash()).toBe("landed");
    expect(setup("#sec-missing").links.landOnHash()).toBe("pending");
    expect(setup("").links.landOnHash()).toBe("none");
    expect(setup("#").links.landOnHash()).toBe("none");
  });

  it("glides to an in-page link's section and records it in history", () => {
    const { click, deps, history } = setup("", 420);
    const e = click("to-work");
    expect(e.defaultPrevented).toBe(true);
    expect(deps.scrollTo).toHaveBeenCalledWith(document.getElementById("sec-work"), true);
    expect(history.pushState).toHaveBeenCalledWith(null, "", "#sec-work");
  });

  it("saves where the visitor was on the entry they're leaving, so Back returns there", () => {
    const { click, history } = setup("", 420);
    history.state = { router: "kept" };
    click("to-work");
    expect(history.replaceState).toHaveBeenCalledWith({ router: "kept", deepLinkY: 420 }, "");
    expect(history.replaceState.mock.invocationCallOrder[0]!).toBeLessThan(history.pushState.mock.invocationCallOrder[0]!);
  });

  it("leaves modified clicks, other pages and links to nothing to the browser", () => {
    const { click, deps } = setup();
    for (const e of [
      click("to-work", { metaKey: true }),
      click("to-work", { ctrlKey: true }),
      click("to-work", { shiftKey: true }),
      click("to-work", { button: 1 }),
      click("away"),
      click("to-nowhere"),
      click("bare"),
    ]) expect(e.defaultPrevented).toBe(false);
    expect(deps.scrollTo).not.toHaveBeenCalled();
  });

  it("on Back or Forward, returns to the saved spot and ignores the hash change that follows", () => {
    const { links, deps, location } = setup("#sec-work");
    links.onPopState({ state: { deepLinkY: 900 } } as PopStateEvent);
    links.onHashChange();
    expect(deps.scrollTo).toHaveBeenCalledTimes(1);
    expect(deps.scrollTo).toHaveBeenCalledWith(900, false);
    // the next, unrelated hash change is handled again
    location.hash = "#sec-work";
    links.onHashChange();
    expect(deps.scrollTo).toHaveBeenLastCalledWith(document.getElementById("sec-work"), false);
  });

  it("jumps to the section of a hash typed by hand", () => {
    const { links, deps } = setup("#sec-work");
    links.onPopState({ state: null } as PopStateEvent);
    links.onHashChange();
    expect(deps.scrollTo).toHaveBeenCalledWith(document.getElementById("sec-work"), false);
  });
});
