import { describe, expect, it } from "vitest";
import { markBuilt, onBuilt } from "./built";
import type { Milestone } from "./count";

describe("the voyage's parts, built under the loader", () => {
  it("tells a listener each part once, those built before it listened first", () => {
    markBuilt("relay");
    const heard: Milestone[] = [];
    const off = onBuilt((m) => heard.push(m));
    markBuilt("athena");
    markBuilt("athena");
    markBuilt("relay");
    off();
    markBuilt("warp");
    expect(heard).toEqual(["relay", "athena"]);
  });
});
