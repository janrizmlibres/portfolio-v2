import { afterEach, describe, expect, it } from "vitest";
import { createRoam } from "./roam";

let roam: ReturnType<typeof createRoam> | null = null;
afterEach(() => {
  roam?.destroy();
  roam = null;
  document.body.innerHTML = "";
});

function setup() {
  const said: string[] = [];
  const body = document.createElement("button");
  document.body.append(body);
  roam = createRoam({ body, rig: () => null, phone: () => false, reduced: true, talking: () => false, announce: (t) => said.push(t) });
  return { roam, said };
}

describe("roam: holding Tycho on his spot", () => {
  it("stays held until every hold is let go, so a point ending mid-warp doesn't free him", () => {
    const { roam, said } = setup();
    roam.hold(true);
    roam.hold(true);
    roam.hold(false);
    roam.moveByKey();
    expect(said).toEqual([]);
    roam.hold(false);
    roam.moveByKey();
    expect(said).toEqual(["Tycho moved to the bottom left."]);
  });

  it("lets go of every hold when a replay resets him", () => {
    const { roam, said } = setup();
    roam.hold(true);
    roam.hold(true);
    roam.reset();
    roam.moveByKey();
    expect(said).toEqual(["Tycho moved to the bottom left."]);
  });
});
