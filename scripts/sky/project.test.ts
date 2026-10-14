// @vitest-environment node
import { describe, it, expect } from "vitest";
import { projectPCA, projectUMAP, seededRandom } from "./project";

// Three clusters in 16 dimensions, laid out along one axis so PCA has a clear first component.
function clusters(n = 36, dims = 16): number[][] {
  const random = seededRandom(7);
  return Array.from({ length: n }, (_, i) => {
    const centre = (i % 3) * 10;
    return Array.from({ length: dims }, (_, d) => (d === 0 ? centre : 0) + random());
  });
}

const radius = ([x, y, z]: [number, number, number]) => Math.hypot(x, y, z);
const variance = (xs: number[]) => {
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  return xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length;
};

describe("projectPCA", () => {
  it("puts the widest spread on the first axis", () => {
    const points = projectPCA(clusters());
    const [vx, vy, vz] = [0, 1, 2].map((axis) => variance(points.map((p) => p[axis]!)));
    expect(vx).toBeGreaterThan(vy!);
    expect(vy).toBeGreaterThanOrEqual(vz!);
  });

  it("returns one point per vector, fitted inside a unit sphere around the origin", () => {
    const points = projectPCA(clusters());
    expect(points).toHaveLength(36);
    expect(Math.max(...points.map(radius))).toBeCloseTo(1, 10);
  });

  it("gives the same layout on every run", () => {
    expect(projectPCA(clusters())).toEqual(projectPCA(clusters()));
  });
});

describe("projectUMAP", () => {
  it("gives the same layout for the same seed", () => {
    expect(projectUMAP(clusters(), 42)).toEqual(projectUMAP(clusters(), 42));
  });

  it("gives a different layout for a different seed", () => {
    expect(projectUMAP(clusters(), 42)).not.toEqual(projectUMAP(clusters(), 43));
  });

  it("returns one point per vector, fitted inside a unit sphere around the origin", () => {
    const points = projectUMAP(clusters(), 42);
    expect(points).toHaveLength(36);
    expect(Math.max(...points.map(radius))).toBeCloseTo(1, 10);
  });
});
