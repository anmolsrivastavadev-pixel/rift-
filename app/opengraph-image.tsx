import { ImageResponse } from "next/og";

/* Social share card (OG + Twitter). Generated at request time with next/og —
 * no static asset, no extra dependency. Mirrors the current landing hero:
 * pure black, faint blueprint grid, navy glow, split-R mark, huge headline,
 * meta chips. Grid lines are plain divs (satori has no repeating gradients).
 */

export const alt = "Rift: turn complaints into business ideas worth testing.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const chips = [
  "Free during the private beta",
  "No credit card required",
  "Works with 5–10 complaints",
];

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
          padding: 72,
          backgroundColor: "#000000",
          backgroundImage:
            "radial-gradient(circle at 62% 0%, rgba(30,64,175,0.38), transparent 58%), radial-gradient(circle at 0% 100%, rgba(37,99,235,0.14), transparent 45%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Faint blueprint grid */}
        {Array.from({ length: 11 }, (_, i) => (
          <div
            key={`v${i}`}
            style={{
              position: "absolute",
              left: (i + 1) * 100,
              top: 0,
              width: 1,
              height: 630,
              backgroundColor: "rgba(255,255,255,0.05)",
            }}
          />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={`h${i}`}
            style={{
              position: "absolute",
              top: (i + 1) * 105,
              left: 0,
              width: 1200,
              height: 1,
              backgroundColor: "rgba(255,255,255,0.05)",
            }}
          />
        ))}

        {/* Top row: brand left, domain right */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* Split-R brand mark (see components/logo.tsx) recreated with CSS
                clip-path — satori doesn't support SVG clipPath elements. */}
            <div style={{ display: "flex", position: "relative", width: 76, height: 76 }}>
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
            <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: -1 }}>Rift</div>
          </div>
          <div
            style={{
              display: "flex",
              border: "2px solid rgba(59,130,246,0.4)",
              backgroundColor: "rgba(59,130,246,0.12)",
              borderRadius: 999,
              padding: "10px 26px",
              color: "#93c5fd",
              fontSize: 26,
              fontWeight: 600,
            }}
          >
            rift-fawn.vercel.app
          </div>
        </div>

        {/* Headline — same voice as the hero */}
        <div
          style={{
            fontSize: 92,
            fontWeight: 800,
            lineHeight: 1.02,
            letterSpacing: -4,
            maxWidth: 1040,
            display: "flex",
          }}
        >
          Turn complaints into business ideas worth testing.
        </div>

        {/* Meta chips, like the hero */}
        <div style={{ display: "flex", gap: 16 }}>
          {chips.map((chip) => (
            <div
              key={chip}
              style={{
                display: "flex",
                border: "2px solid #242424",
                backgroundColor: "#0a0a0a",
                borderRadius: 999,
                padding: "12px 26px",
                color: "#a1a1a1",
                fontSize: 25,
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
