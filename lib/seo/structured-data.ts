import { profile } from "@/lib/content/profile";
import { contactLinks } from "@/lib/content/contact";
import { workTimeline } from "@/lib/content/work-timeline";
import { personalProjects } from "@/lib/content/personal-projects";
import { siteUrl } from "@/lib/seo/site";

const email = contactLinks.find((l) => l.slug === "email")?.value;
const sameAs = contactLinks
  .filter((l) => l.slug !== "email")
  .map((l) => l.href);

export const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  url: siteUrl,
  image: `${siteUrl}${profile.portraitSrc}`,
  jobTitle: "Full-stack & AI Engineer",
  description: profile.aboutLede,
  email,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Cebu",
    addressCountry: "PH",
  },
  worksFor: {
    "@type": "Organization",
    name: workTimeline[0]?.company ?? "LogoLife",
  },
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "Xavier University",
  },
  knowsAbout: [
    "Full-stack development",
    "AI engineering",
    "RAG pipelines",
    "Next.js",
    "TypeScript",
    "OpenAI",
    "Vercel AI SDK",
    "pgvector",
    "MCP",
    "Mem0",
  ],
  sameAs,
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: `${profile.name} — Portfolio`,
  url: siteUrl,
  inLanguage: "en",
  author: { "@type": "Person", name: profile.name },
  description: profile.taglineState1,
};

export const projectsSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Personal projects",
  itemListElement: personalProjects.map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "SoftwareSourceCode",
      "@id": `${siteUrl}/#project-${p.slug}`,
      name: p.title,
      description: p.description,
      programmingLanguage: p.stack,
      codeRepository: p.repoUrl,
      url: p.demoUrl,
      author: { "@type": "Person", name: profile.name },
    },
  })),
};
