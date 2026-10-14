import { describe, expect, it, vi } from "vitest";
import type { SectionId } from "@/lib/film/block";
import { DEEP_LINK_KEY } from "@/lib/scroll/deep-links";
import { createGoToSection, wayTo } from "./go";

const SPOTS: Record<SectionId, number> = { "sec-hero": 0, "sec-about": 3.1, "sec-work": 9.4, "sec-projects": 21.5, "sec-contact": 38.2 };

function setup({ here = "sec-about" as SectionId, active = true, y = 1234 } = {}) {
  const calls: string[] = [];
  const history = {
    state: { next: 1 } as unknown,
    replaceState: vi.fn((s: unknown) => { history.state = s; }),
    pushState: vi.fn((_s: unknown, _u: string, href?: string | URL | null) => { calls.push(`push ${href}`); }),
  };
  const legs = {
    glide: vi.fn((t: number) => { calls.push(`glide ${t}`); }),
    warp: vi.fn((sec: SectionId, t: number) => { calls.push(`warp ${sec} ${t}`); }),
    replay: vi.fn((href: string) => { calls.push(`replay ${href}`); }),
  };
  const go = createGoToSection({
    here: () => here,
    spotOf: (s) => SPOTS[s],
    ...legs,
    history,
    scrollY: () => y,
    active: () => active,
  });
  return { go, legs, history, calls };
}

const click = (init: Partial<MouseEvent> = {}) => {
  const e = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, defaultPrevented: false, ...init } as MouseEvent & { defaultPrevented: boolean };
  e.preventDefault = () => { e.defaultPrevented = true; };
  return e;
};

describe("wayTo", () => {
  it("warps to another section", () => {
    expect(wayTo("sec-work", "sec-about")).toBe("warp");
    expect(wayTo("sec-contact", "sec-projects")).toBe("warp");
    expect(wayTo("sec-about", "sec-contact")).toBe("warp");
  });

  it("replays for Start, from anywhere past it, as Contact's \"Replay experience\" does", () => {
    expect(wayTo("sec-hero", "sec-about")).toBe("replay");
    expect(wayTo("sec-hero", "sec-contact")).toBe("replay");
  });

  it("glides back to the section's beginning when you're already in it, Start included: no warp, no replay", () => {
    expect(wayTo("sec-work", "sec-work")).toBe("glide");
    expect(wayTo("sec-hero", "sec-hero")).toBe("glide");
  });
});

describe("goToSection", () => {
  it("in the section you're in, glides to its first reading spot", () => {
    const { go, legs } = setup({ here: "sec-work" });
    expect(go.goToSection("sec-work")).toBe("glide");
    expect(legs.glide).toHaveBeenCalledWith(SPOTS["sec-work"]);
    expect(legs.warp).not.toHaveBeenCalled();
    expect(legs.replay).not.toHaveBeenCalled();
  });

  it("to another section, warps, aimed at that section's first reading spot", () => {
    const { go, legs } = setup({ here: "sec-about" });
    expect(go.goToSection("sec-projects")).toBe("warp");
    expect(legs.warp).toHaveBeenCalledWith("sec-projects", SPOTS["sec-projects"]);
    expect(legs.glide).not.toHaveBeenCalled();
  });

  it("Start replays, handing the replay its address (the replay keeps Back honest itself)", () => {
    const { go, legs, history } = setup({ here: "sec-contact" });
    expect(go.goToSection("sec-hero")).toBe("replay");
    expect(legs.replay).toHaveBeenCalledWith("#sec-hero");
    expect(history.pushState).not.toHaveBeenCalled();
  });

  it("Start in the opening glides back to its beginning instead of replaying", () => {
    const { go, legs } = setup({ here: "sec-hero" });
    expect(go.goToSection("sec-hero")).toBe("glide");
    expect(legs.glide).toHaveBeenCalledWith(SPOTS["sec-hero"]);
    expect(legs.replay).not.toHaveBeenCalled();
  });

  it("keeps Back honest: saves where you were on the entry being left, then pushes the section's address, then moves", () => {
    const { go, history, calls } = setup({ here: "sec-about", y: 777 });
    go.goToSection("sec-work");
    expect(history.replaceState).toHaveBeenCalledWith({ next: 1, [DEEP_LINK_KEY]: 777 }, "");
    expect(calls).toEqual(["push #sec-work", "warp sec-work 9.4"]);
  });
});

describe("onClick", () => {
  it("takes a plain click on a link: it doesn't scroll by itself, the section's way is played", () => {
    const { go, legs } = setup({ here: "sec-about" });
    const e = click();
    go.onClick(e, "sec-contact");
    expect(e.defaultPrevented).toBe(true);
    expect(legs.warp).toHaveBeenCalledOnce();
  });

  it("leaves a modified or non-primary click to the browser (a new tab, a new window)", () => {
    const { go, legs } = setup();
    for (const init of [{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      const e = click(init);
      go.onClick(e, "sec-work");
      expect(e.defaultPrevented).toBe(false);
    }
    expect(legs.warp).not.toHaveBeenCalled();
  });

  it("leaves the plain page's links to the deep links (no film to warp or replay)", () => {
    const { go, legs } = setup({ active: false });
    const e = click();
    go.onClick(e, "sec-hero");
    expect(e.defaultPrevented).toBe(false);
    expect(legs.replay).not.toHaveBeenCalled();
  });

  it("leaves a click something else already took", () => {
    const { go, legs } = setup();
    go.onClick(click({ defaultPrevented: true }), "sec-work");
    expect(legs.warp).not.toHaveBeenCalled();
  });
});
