import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Jost, DM_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import "./voyage.css";
import "./routemap.css";
import { TIER_SCRIPT } from "@/lib/film/tier";
import { WAKE_SCRIPT } from "@/lib/wake/script";
import { siteUrl } from "@/lib/seo/site";
import { profile } from "@/lib/content/profile";
import {
  personSchema,
  websiteSchema,
  projectsSchema,
} from "@/lib/seo/structured-data";

// one small label in the log's sheet: not worth a preload
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "700"],
  preload: false,
});

// the voyage's type: Jost capitals for the voice, DM Mono small print, Newsreader for reading
const jost = Jost({ variable: "--font-jost", subsets: ["latin"], display: "swap" });
const dmMono = DM_Mono({ variable: "--font-dm-mono", subsets: ["latin"], display: "swap", weight: ["400", "500"] });
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"], display: "swap", axes: ["opsz"], style: ["normal", "italic"] });

const title = `${profile.name} — ${profile.roleShort}`;
const description = profile.siteDescription;

export const metadata: Metadata = {
  title: { default: title, template: `%s — ${profile.name}` },
  description,
  metadataBase: new URL(siteUrl),
  applicationName: profile.name,
  authors: [{ name: profile.name, url: siteUrl }],
  creator: profile.name,
  publisher: profile.name,
  keywords: [
    profile.name,
    "full-stack engineer",
    "AI engineer",
    "RAG",
    "Next.js",
    "TypeScript",
    "OpenAI",
    "Vercel AI SDK",
    "pgvector",
    "MCP",
    "Cebu",
    "Philippines",
    "remote",
  ],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: profile.name,
    title,
    description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    creator: "@janrizmlibres",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0e0c08" },
    { media: "(prefers-color-scheme: light)", color: "#0e0c08" },
  ],
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      // the head script below marks how the voyage plays here before first paint
      suppressHydrationWarning
      className={`${jetbrainsMono.variable} ${jost.variable} ${dmMono.variable} ${newsreader.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: TIER_SCRIPT }} />
        {/* after the tier, which it reads: whether the wake-up opens this load */}
        <script dangerouslySetInnerHTML={{ __html: WAKE_SCRIPT }} />
      </head>
      <body className="min-h-dvh antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(projectsSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
