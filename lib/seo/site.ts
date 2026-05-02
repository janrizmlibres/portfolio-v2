// Single source of truth for the canonical site URL.
// Override with NEXT_PUBLIC_SITE_URL in production once a custom domain is live.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://jrz-dev.vercel.app";
