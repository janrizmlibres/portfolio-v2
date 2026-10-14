import { describe, expect, it } from "vitest";
import { readKept, startVersion, writeKept, type Kept, type Start } from "./lite";

const none: Kept = { choice: null, slow: false };
const start = (s: Partial<Start>): Start => ({ webgl: true, reduced: false, asked: null, kept: none, weak: false, ...s });

describe("how a visit starts", () => {
  it("the film, on a device that holds nothing against it", () => {
    expect(startVersion(start({}))).toBe("film");
  });

  it("lite on a weak device, or where an earlier visit was too slow, with no choice kept", () => {
    expect(startVersion(start({ weak: true }))).toBe("lite");
    expect(startVersion(start({ kept: { choice: null, slow: true } }))).toBe("lite");
  });

  it("the visitor's choice wins over the device and the verdict", () => {
    expect(startVersion(start({ weak: true, kept: { choice: "full", slow: true } }))).toBe("film");
    expect(startVersion(start({ kept: { choice: "lite", slow: false } }))).toBe("lite");
  });

  it("the address's ?film= wins over the choice and the device", () => {
    expect(startVersion(start({ asked: "film", weak: true, kept: { choice: "lite", slow: true } }))).toBe("film");
    expect(startVersion(start({ asked: "still", kept: { choice: "full", slow: false } }))).toBe("lite");
    expect(startVersion(start({ asked: "plain" }))).toBe("plain");
    expect(startVersion(start({ asked: "nonsense", weak: true }))).toBe("lite");
  });

  it("never over reduced motion: its stills, which aren't lite", () => {
    expect(startVersion(start({ reduced: true, asked: "film" }))).toBe("still");
    expect(startVersion(start({ reduced: true, asked: "still", kept: { choice: "lite", slow: true } }))).toBe("still");
  });

  it("never over a device without WebGL: the plain page", () => {
    expect(startVersion(start({ webgl: false, asked: "film" }))).toBe("plain");
    expect(startVersion(start({ webgl: false, asked: "still", reduced: true }))).toBe("plain");
  });
});

describe("what's kept per browser", () => {
  it("reads a choice and a verdict", () => {
    expect(readKept('{"choice":"lite"}')).toEqual({ choice: "lite", slow: false });
    expect(readKept('{"choice":"full","verdict":"slow"}')).toEqual({ choice: "full", slow: true });
    expect(readKept('{"verdict":"slow"}')).toEqual({ choice: null, slow: true });
  });

  it("reads anything else as nothing kept", () => {
    expect(["", "lite", "null", "5", '"lite"', '{"choice":"fast"}', "{"].map(readKept)).toEqual(Array(7).fill(none));
    expect(readKept(null)).toEqual(none);
  });

  it("writes only what's there", () => {
    expect(writeKept({ choice: "lite", slow: false })).toBe('{"choice":"lite"}');
    expect(writeKept({ choice: null, slow: true })).toBe('{"verdict":"slow"}');
    expect(writeKept({ choice: "full", slow: true })).toBe('{"choice":"full","verdict":"slow"}');
  });
});
