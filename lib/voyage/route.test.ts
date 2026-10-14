import { describe, expect, it } from "vitest";
import { homeOf } from "./route";
import stars from "@/public/sky/stars-pca.json";
import { HIS_STAR } from "@/lib/content/voyage";

const s = stars.stars.find((x) => x.id === HIS_STAR)!;
const sun: [number, number, number] = [s.x, s.y, s.z];

describe("homeOf", () => {
  it("puts home just off his star, towards the hero's side, where the storyboard had it", () => {
    const home = [0.1660176218, -0.1843805915, -0.224821807];
    homeOf(sun).P.forEach((x, i) => expect(x).toBeCloseTo(home[i]!, 9));
  });
});
