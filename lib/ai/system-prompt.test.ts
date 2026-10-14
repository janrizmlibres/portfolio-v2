import { describe, expect, it } from "vitest";
import { ROLES } from "@/lib/content/voyage";
import { SYSTEM_PROMPT, latestRoleLine, publicCompanies } from "./system-prompt";

describe("system prompt: Tycho, talking about Janriz from what the page shows", () => {
  it("speaks as Tycho, never as Janriz", () => {
    expect(SYSTEM_PROMPT).toMatch(/^You are Tycho\b/);
    expect(SYSTEM_PROMPT).not.toMatch(/You ARE Janriz|Reply in first person/);
  });

  it("names the site by the host of its canonical URL", () => {
    expect(SYSTEM_PROMPT).toContain("Janriz Libres's portfolio at jrz-libres.vercel.app.");
  });

  it("names the latest role the page shows as his most recent, years only", () => {
    expect(latestRoleLine(ROLES)).toBe("Full-Stack / AI Engineer at LogoLife (2025–2026)");
    expect(SYSTEM_PROMPT).toContain("His most recent role was Full-Stack / AI Engineer at LogoLife (2025–2026)");
  });

  it("writes a role within one year with that year once", () => {
    const one = [{ ...ROLES[0]!, company: "Acme", role: "Engineer", from: "2026-01", to: "2026-05" }];
    expect(latestRoleLine(one)).toBe("Engineer at Acme (2026)");
  });

  it("lists every company the page shows, newest first, as the only ones he may name", () => {
    expect(publicCompanies(ROLES)).toBe("LogoLife, Tolstoy, Elinnov Technologies and The Crusader Yearbook");
    expect(SYSTEM_PROMPT).toContain(publicCompanies(ROLES));
  });
});
