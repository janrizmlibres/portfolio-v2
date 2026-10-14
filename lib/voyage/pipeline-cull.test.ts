import { describe, expect, it } from "vitest";
import { swarmParts } from "./pipeline-cull";

// a shaft like the film's: the search at 0.0125, Save at 0.075; records lag the fall by -0.0042..0.0078
const base = { v: 1, lag: { lo: -0.0042, hi: 0.0078 }, crawl: 0.0125, save: 0.075, front: 0 };

describe("which of the pipeline's records are drawn this frame", () => {
  it("draws nothing while the shaft isn't shown, wherever the fall is", () => {
    expect(swarmParts({ ...base, v: 0, s: 0.03 })).toEqual({ swarm: false, rush: false, beams: false });
    expect(swarmParts({ ...base, v: 0.003, s: 0.03, front: 0.5 })).toEqual({ swarm: false, rush: false, beams: false });
  });

  it("draws the swarm from the queries leaving Start until the last record has sunk into Save", () => {
    expect(swarmParts({ ...base, s: -0.03 }).swarm).toBe(false);
    expect(swarmParts({ ...base, s: -0.01 }).swarm).toBe(true);
    expect(swarmParts({ ...base, s: 0.05 }).swarm).toBe(true);
    // the last record (the one lagging most) is still above Save
    expect(swarmParts({ ...base, s: 0.079 }).swarm).toBe(true);
    // every record is in the magazine
    expect(swarmParts({ ...base, s: 0.085 }).swarm).toBe(false);
  });

  it("draws the search's hairlines only while some page is out on the web being fetched", () => {
    expect(swarmParts({ ...base, s: -0.015 }).beams).toBe(false);
    expect(swarmParts({ ...base, s: 0.006 }).beams).toBe(true);
    expect(swarmParts({ ...base, s: 0.0125 }).beams).toBe(true);
    expect(swarmParts({ ...base, s: 0.03 }).beams).toBe(false);
  });

  it("draws the rush only while the front is running down the shaft", () => {
    expect(swarmParts({ ...base, s: 0.08, front: 0 }).rush).toBe(false);
    expect(swarmParts({ ...base, s: 0.08, front: 0.4 }).rush).toBe(true);
    expect(swarmParts({ ...base, s: 0.08, front: 1 }).rush).toBe(false);
  });
});
