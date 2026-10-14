import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // the score's stems: each file is named by its content's hash, so it never changes (Next serves `public/`
        // with max-age=0 otherwise)
        source: "/audio/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // the models, maps and sky: their names aren't hashed, so a day's cache, refreshed in the background after
      ...["/voyage/:path*", "/sky/:path*"].map((source) => ({
        source,
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      })),
    ];
  },
};

export default nextConfig;
