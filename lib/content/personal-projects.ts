export interface PersonalProject {
  slug: string;
  title: string;
  stack: string;
  description: string;
  /** First image becomes the primary thumbnail. Paths are relative to /public. */
  images: string[];
  repoUrl: string;
  demoUrl: string;
}

export const personalProjects: PersonalProject[] = [
  {
    slug: "flowstack",
    title: "FlowStack",
    stack: "TypeScript · Next.js · MongoDB · Tailwind",
    description: "StackOverflow clone with NextAuth — posting, search, comments, and analytics.",
    images: ["/projects/flowstack/1.png", "/projects/flowstack/2.png"],
    repoUrl: "https://github.com/janrizmlibres/devflow-clone-app",
    demoUrl: "https://devflow-clone-app.vercel.app/",
  },
  {
    slug: "pulsevr",
    title: "PulseVR",
    stack: "TypeScript · React · Tailwind",
    description: "Responsive landing page for a fictional VR startup — mobile-first, motion-rich.",
    images: ["/projects/pulsevr/1.png", "/projects/pulsevr/2.png", "/projects/pulsevr/3.png"],
    repoUrl: "https://github.com/janrizmlibres/pulse-vr",
    demoUrl: "https://pulse-vr.vercel.app/",
  },
  {
    slug: "mercado",
    title: "Mercado",
    stack: "TS · TanStack · Nest.js · Postgres · Docker",
    description: "Type-safe e-commerce frontend with GraphQL, cart, checkout, and admin dashboard.",
    images: ["/projects/mercado/1.png", "/projects/mercado/2.png", "/projects/mercado/3.png"],
    repoUrl: "https://github.com/janrizmlibres/mercado-front/",
    demoUrl: "https://mercado-front-production.up.railway.app/",
  },
];
