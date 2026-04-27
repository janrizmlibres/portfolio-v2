export interface ContactLink {
  slug: string;
  label: string;
  value: string;
  href: string;
}

export const contactLinks: ContactLink[] = [
  {
    slug: "email",
    label: "email",
    value: "libres.janriz@gmail.com",
    href: "mailto:libres.janriz@gmail.com",
  },
  {
    slug: "github",
    label: "github",
    value: "@janrizmlibres",
    href: "https://github.com/janrizmlibres",
  },
  {
    slug: "linkedin",
    label: "linkedin",
    value: "in/janrizlibres",
    href: "https://linkedin.com/in/janrizlibres",
  },
];
