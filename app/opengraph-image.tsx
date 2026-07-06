import { ImageResponse } from "next/og";

/* Social share card (OG + Twitter). Generated at request time with next/og —
 * no static asset, no extra dependency. Dark theme to match the app.
 */

export const alt = "Rift: turn complaints into business ideas worth testing.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          backgroundColor: "#000000",
          backgroundImage:
            "radial-gradient(circle at 20% 0%, rgba(59,130,246,0.25), transparent 55%)",
          color: "#f4f4f5",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Split-R brand mark (see components/logo.tsx) recreated with CSS
              clip-path — satori doesn't support SVG clipPath elements. */}
          <div
            style={{
              display: "flex",
              position: "relative",
              width: 76,
              height: 76,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -1,
                left: -1,
                width: 76,
                height: 76,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2563EB",
                fontSize: 72,
                fontWeight: 800,
                clipPath: "polygon(0% 0%, 66% 0%, 37% 100%, 0% 100%)",
              }}
            >
              R
            </div>
            <div
              style={{
                position: "absolute",
                top: 1,
                left: 1,
                width: 76,
                height: 76,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#3B7CFF",
                fontSize: 72,
                fontWeight: 800,
                clipPath: "polygon(66% 0%, 100% 0%, 100% 100%, 37% 100%)",
              }}
            >
              R
            </div>
          </div>
          <div style={{ fontSize: 44, fontWeight: 700 }}>Rift</div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: -2,
              maxWidth: 950,
            }}
          >
            Turn complaints into business ideas worth testing.
          </div>
          <div style={{ fontSize: 32, color: "#737373", maxWidth: 900 }}>
            Paste real complaints. Rift finds repeated problems and turns them
            into ideas you can compare.
          </div>
        </div>

        <div style={{ fontSize: 26, color: "#71717a" }}>
          Business ideas from real customer pain
        </div>
      </div>
    ),
    size
  );
}
