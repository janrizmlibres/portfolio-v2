import { describe, expect, it } from "vitest";
import { starsOf } from "./star-ids";

describe("starsOf", () => {
  it("maps each retrieved chunk to its star, best first", () => {
    expect(starsOf([{ id: "wiki/projects/athena.md#0" }, { id: "wiki/bio/childhood.md#0" }])).toEqual(["s077", "s026"]);
  });

  it("drops a chunk the sky has no star for (left out of the export, or published since)", () => {
    expect(starsOf([{ id: "wiki/orgs/somewhere-else.md#0" }, { id: "wiki/bio/childhood.md#0" }])).toEqual(["s026"]);
  });

  it("names each star once", () => {
    expect(starsOf([{ id: "wiki/bio/childhood.md#0" }, { id: "wiki/bio/childhood.md#0" }])).toEqual(["s026"]);
  });

  it("gives nothing for an output that isn't a list of rows", () => {
    expect(starsOf(null)).toEqual([]);
    expect(starsOf({ id: "wiki/bio/childhood.md#0" })).toEqual([]);
    expect(starsOf([null, 3, { id: 4 }])).toEqual([]);
  });
});
