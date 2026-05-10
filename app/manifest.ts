import type { MetadataRoute } from "next";
import { profile } from "@/lib/content/profile";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${profile.name} — ${profile.roleShort}`,
    short_name: profile.name,
    description: profile.siteDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#0e0c08",
    theme_color: "#0e0c08",
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
