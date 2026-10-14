import { describe, expect, it } from "vitest";
import { createHold } from "./hold";

function setup() {
  let moving = false;
  const out: string[] = [];
  const hold = createHold({ moving: () => moving, out: (text, ended) => out.push(`${text}${ended ? " (end)" : ""}`) });
  return { hold, out, move: (m: boolean) => (moving = m) };
}

describe("the reply held while the page moves", () => {
  it("passes the reply straight on while the page is still", () => {
    const { hold, out } = setup();
    hold.arrive("Hi", false);
    hold.arrive("Hi there", true);
    expect(out).toEqual(["Hi", "Hi there (end)"]);
  });

  it("holds the reply while the page moves, and hands over the latest once it stops", () => {
    const { hold, out, move } = setup();
    move(true);
    hold.arrive("He", false);
    hold.arrive("He built", false);
    hold.check();
    expect(out).toEqual([]);
    move(false);
    hold.check();
    hold.check();
    expect(out).toEqual(["He built"]);
  });

  it("keeps the reply's end through the hold", () => {
    const { hold, out, move } = setup();
    move(true);
    hold.arrive("Done.", true);
    move(false);
    hold.check();
    expect(out).toEqual(["Done. (end)"]);
  });

  it("keeps holding a reply that started arriving before the page moved, until the move is over", () => {
    const { hold, out, move } = setup();
    hold.arrive("He", false);
    move(true);
    hold.arrive("He built", false);
    expect(out).toEqual(["He"]);
    move(false);
    hold.arrive("He built it", false);
    expect(out).toEqual(["He", "He built it"]);
  });

  it("drops what it held when a new question is asked", () => {
    const { hold, out, move } = setup();
    move(true);
    hold.arrive("Old", false);
    hold.drop();
    move(false);
    hold.check();
    expect(out).toEqual([]);
  });
});
