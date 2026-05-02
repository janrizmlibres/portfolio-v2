export interface TimelineEntry {
  years: string;
  durationLabel: string;
  company: string;
  role: string;
  techLabel: string;
}

export const workTimeline: TimelineEntry[] = [
  { years: "2025–26", durationLabel: "5 mo", company: "LogoLife", role: "Full-stack / AI Engineer", techLabel: "TypeScript · MCP · Mem0" },
  { years: "2025", durationLabel: "3 mo", company: "Tolstoy", role: "Full-stack / AI Engineer", techLabel: "TanStack · AWS" },
  { years: "2024", durationLabel: "4 mo", company: "Elinnov Technologies", role: "Software Engineer Intern", techLabel: "ASP.NET · React" },
  { years: "2023–24", durationLabel: "10 mo", company: "The Crusader Yearbook", role: "Software Developer", techLabel: "Laravel · WordPress · Python" },
];

export const workTotalLabel = "~1 year and 10 months across 4 roles";
