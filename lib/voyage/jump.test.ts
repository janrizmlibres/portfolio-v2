import { describe, expect, it } from "vitest";
import { Vector3, type BufferAttribute, type LineBasicMaterial, type LineSegments } from "three";
import { createJump } from "./jump";

describe("createJump: a throw's streaks and flash", () => {
  const fast = new Vector3(0, 0, -2);

  it("draws no streaks outside a throw, however fast the camera goes (the hero's dive, a zoom)", () => {
    const jump = createJump([]);
    jump.update(new Vector3(), fast, 0, 0);
    expect(jump.root.getObjectByName("streaks")!.visible).toBe(false);
  });

  it("draws them in a throw while the camera's going fast, and not while it's slow", () => {
    const jump = createJump([]);
    jump.update(new Vector3(), fast, 0, 1);
    expect(jump.root.getObjectByName("streaks")!.visible).toBe(true);
    jump.update(new Vector3(), new Vector3(0, 0, -0.01), 0, 1);
    expect(jump.root.getObjectByName("streaks")!.visible).toBe(false);
  });

  it("draws each streak from its star back along the way you're going, as bright as the throw is on, its colours sent once", () => {
    const jump = createJump([]);
    const s = jump.root.getObjectByName("streaks") as LineSegments;
    const { position } = s.geometry.attributes, color = s.geometry.attributes.color as BufferAttribute;
    // a streak's two ends, then the colour each end adds to the frame (its colour times the streaks' opacity)
    const drawn = (i: number) => [
      ...Array.from(position!.array.slice(i * 6, i * 6 + 6)),
      ...Array.from(color.array.slice(i * 6, i * 6 + 6)).map((c) => c * (s.material as LineBasicMaterial).opacity),
    ];
    const cases = [
      [new Vector3(0.3, -0.2, -2), 1, [[0.7803600430488586,-59.99342727661133,-0.4241379499435425,14.066191673278809,-68.85064697265625,-88.99634552001953,0.20111083984375,0.2279256284236908,0.2681477963924408,0,0,0],[37.52225112915039,15.99074935913086,44.00428009033203,50.808082580566406,7.133528232574463,-44.56793212890625,0.1881752610206604,0.2132652997970581,0.25090035796165466,0,0,0],[9.084171295166016,59.07954788208008,5.20432710647583,22.37000274658203,50.222328186035156,-83.36788177490234,0.3344019651412964,0.3789888918399811,0.4458692967891693,0,0,0]]],
      [new Vector3(1, 0.4, 0.1), 0.4, [[0.7803600430488586,-59.99342727661133,-0.4241379499435425,83.98538970947266,-26.711414337158203,7.896365165710449,0.0804443359375,0.09117025136947632,0.1072591170668602,0,0,0],[37.52225112915039,15.99074935913086,44.00428009033203,120.72727966308594,49.272762298583984,52.32477951049805,0.07527010887861252,0.08530612289905548,0.10036014020442963,0,0,0],[9.084171295166016,59.07954788208008,5.20432710647583,92.28919982910156,92.36155700683594,13.524829864501953,0.13376079499721527,0.1515955626964569,0.17834772169589996,0,0,0]]],
    ] as const;
    let sent = -1;
    for (const [vel, on, want] of cases) {
      jump.update(new Vector3(5, 6, 7), vel, 0, on);
      [0, 1234, 2399].forEach((i, k) => drawn(i).forEach((v, j) => expect(v).toBeCloseTo(want[k]![j]!, 4)));
      if (sent < 0) sent = color.version;
      expect(color.version).toBe(sent);
    }
  });
});
