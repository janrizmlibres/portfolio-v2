import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPageEffects, type Move } from "./page-effects";

const toWork: Move = { kind: "section", section: "work" };
const atAthena: Move = { kind: "point", subject: "athena" };

function setup() {
  const log: string[] = [];
  const fx = createPageEffects({
    light: (stars) => log.push(`light ${stars.join(",")}`),
    unlight: () => log.push("unlight"),
    go: (m) => log.push(m.kind === "point" ? `point ${m.subject}` : `warp ${m.section}`),
  });
  return { fx, log };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("the page's effects of a reply", () => {
  it("lights each search's stars as they arrive, and puts the last question's out when a new one is asked", () => {
    const { fx, log } = setup();
    fx.question();
    fx.search("c1");
    fx.stars("c1", ["s001", "s002"]);
    fx.search("c2");
    fx.stars("c2", ["s003"]);
    fx.question();
    expect(log).toEqual(["unlight", "light s001,s002", "light s003", "unlight"]);
  });

  it("lights nothing for a search that read no stars", () => {
    const { fx, log } = setup();
    fx.search("c1");
    fx.stars("c1", []);
    expect(log).toEqual([]);
  });

  it("holds a move until the stars of every search in flight are lit, so the warp's flare has them", () => {
    const { fx, log } = setup();
    fx.search("c1");
    fx.move(toWork);
    vi.advanceTimersByTime(1000);
    expect(log).toEqual([]);
    fx.stars("c1", ["s004"]);
    vi.advanceTimersByTime(300);
    expect(log).toEqual(["light s004", "warp work"]);
  });

  it("makes a move with no search in flight once a moment has passed for another asked with it", () => {
    const { fx, log } = setup();
    fx.move(toWork);
    vi.advanceTimersByTime(100);
    expect(log).toEqual([]);
    vi.advanceTimersByTime(300);
    expect(log).toEqual(["warp work"]);
  });

  it("points rather than warps when both are asked together: the point takes the page to its subject anyway", () => {
    const { fx, log } = setup();
    fx.move(toWork);
    fx.move(atAthena);
    fx.move({ kind: "point", subject: "mercado" });
    vi.advanceTimersByTime(1000);
    expect(log).toEqual(["point athena"]);
  });

  it("stops waiting for stars that never come", () => {
    const { fx, log } = setup();
    fx.search("c1");
    fx.move(toWork);
    vi.advanceTimersByTime(3900);
    expect(log).toEqual([]);
    vi.advanceTimersByTime(200);
    expect(log).toEqual(["warp work"]);
  });

  it("makes a waiting move at once when the reply ends", () => {
    const { fx, log } = setup();
    fx.search("c1");
    fx.move(atAthena);
    fx.end();
    expect(log).toEqual(["point athena"]);
    vi.advanceTimersByTime(5000);
    expect(log).toEqual(["point athena"]);
  });

  it("makes a later step's move too, once the first has gone", () => {
    const { fx, log } = setup();
    fx.move(toWork);
    vi.advanceTimersByTime(400);
    fx.move(atAthena);
    vi.advanceTimersByTime(400);
    expect(log).toEqual(["warp work", "point athena"]);
  });

  it("drops a move still waiting when a new question is asked", () => {
    const { fx, log } = setup();
    fx.search("c1");
    fx.move(toWork);
    fx.question();
    vi.advanceTimersByTime(5000);
    expect(log).toEqual(["unlight"]);
  });

  it("drops every move for a question asked to keep the page put (a star), and still lights the stars", () => {
    const { fx, log } = setup();
    fx.question({ stay: true });
    fx.search("c1");
    fx.move(toWork);
    fx.stars("c1", ["s001"]);
    vi.advanceTimersByTime(1000);
    fx.move(atAthena);
    fx.end();
    expect(log).toEqual(["unlight", "light s001"]);
    expect(fx.moving()).toBe(false);
    fx.question();
    fx.move(atAthena);
    fx.end();
    expect(log).toEqual(["unlight", "light s001", "unlight", "point athena"]);
  });

  it("says a move is coming while one waits, and not once it has gone or been dropped", () => {
    const { fx } = setup();
    expect(fx.moving()).toBe(false);
    fx.search("c1");
    fx.move(toWork);
    expect(fx.moving()).toBe(true);
    fx.end();
    expect(fx.moving()).toBe(false);
    fx.move(toWork);
    fx.question();
    expect(fx.moving()).toBe(false);
  });

  it("queues no move for a question asked to keep the page put, so the reply never waits on one", () => {
    const { fx, log } = setup();
    fx.question({ stay: true });
    fx.move(toWork);
    expect(fx.moving()).toBe(false);
    vi.advanceTimersByTime(5000);
    fx.question();
    fx.move(toWork);
    expect(fx.moving()).toBe(true);
    vi.advanceTimersByTime(300);
    expect(log).toEqual(["unlight", "unlight", "warp work"]);
  });
});
