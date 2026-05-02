import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/seo/site";
import {
  personSchema,
  websiteSchema,
  projectsSchema,
} from "@/lib/seo/structured-data";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
  style: ["italic"],
  weight: "variable",
});

const title = "Janriz Libres — Full-stack & AI engineer";
const description =
  "Full-stack and AI engineer based in Cebu. The chat on this site has read everything I've written — instead of scrolling, just ask.";

export const metadata: Metadata = {
  title: { default: title, template: "%s — Janriz Libres" },
  description,
  metadataBase: new URL(siteUrl),
  applicationName: "Janriz Libres",
  authors: [{ name: "Janriz Libres", url: siteUrl }],
  creator: "Janriz Libres",
  publisher: "Janriz Libres",
  keywords: [
    "Janriz Libres",
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
    siteName: "Janriz Libres",
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
  icons: { icon: "/favicon.ico", apple: "/profile.jpg" },
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
      className={`${jetbrainsMono.variable} ${fraunces.variable}`}
      style={{ ['--font-general-sans' as string]: "'General Sans', ui-sans-serif, system-ui" }}
    >
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600&display=swap"
        />
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
