import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Janriz Libres — Full-stack & AI engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "radial-gradient(ellipse at top left, #2a2418 0%, #0e0c08 60%)",
          color: "#f5efe2",
          fontFamily: "ui-serif, Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#b8a884",
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
          }}
        >
          jrz-dev.vercel.app
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 96,
              lineHeight: 1.0,
              fontWeight: 500,
              letterSpacing: -2,
            }}
          >
            Janriz Libres
          </div>
          <div
            style={{
              fontSize: 44,
              lineHeight: 1.15,
              color: "#d8cdb4",
              fontStyle: "italic",
              maxWidth: 980,
            }}
          >
            Full-stack & AI engineer building production systems — Next.js, RAG, agents.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "#a8997a",
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
          }}
        >
          <div style={{ display: "flex" }}>Cebu · remote</div>
          <div style={{ display: "flex" }}>github.com/janrizmlibres</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
