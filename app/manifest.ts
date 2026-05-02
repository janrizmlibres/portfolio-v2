import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Janriz Libres — Full-stack & AI engineer",
    short_name: "Janriz Libres",
    description:
      "Full-stack and AI engineer based in Cebu. Chat-first portfolio.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e0c08",
    theme_color: "#0e0c08",
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { src: "/profile.jpg", sizes: "512x512", type: "image/jpeg", purpose: "any" },
    ],
  };
}
