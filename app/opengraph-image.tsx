import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/* Social share card (OG + Twitter). Generated at request time with next/og —
 * no static asset, no extra dependency. Mirrors the doodle landing hero for
 * real: Baloo 2 headline with the yellow underline, the yellow founder badge
 * sticker, paper chips, coral split-R mark. Fonts are read from
 * assets/og-fonts (satori needs WOFF/TTF; the site's live fonts are WOFF2).
 * Grid lines are plain divs (satori has no repeating gradients).
 */

export const alt = "Rift: find business ideas hidden in real customer problems.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#3a3245";
const MUTED = "#5f5569";
const CORAL = "#bc3917";
const CORAL_LIGHT = "#f07a52";
const YELLOW = "#ffc53d";
const PAPER = "#fffcf5";

/* The last word gets the hand-drawn-style yellow underline, like the hero */
const headlineWords = ["Find", "business", "ideas", "hidden", "in", "real", "customer"];

/* Keep in sync with assurances in components/landing/doodle.tsx */
const chips = [
  "Sources included with every result",
  "Free during the beta",
  "No credit card required",
];

export default async function OpenGraphImage() {
  const [baloo, nunito] = await Promise.all([
    readFile(join(process.cwd(), "assets/og-fonts/baloo2-latin-800.woff")),
    readFile(join(process.cwd(), "assets/og-fonts/nunito-latin-700.woff")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 72px",
          backgroundColor: "#fdf1e3",
          backgroundImage:
            "radial-gradient(circle at 62% 0%, rgba(207,67,24,0.07), transparent 58%)",
          color: INK,
          fontFamily: "Nunito",
          position: "relative",
        }}
      >
        {/* Faint ink grid on the paper */}
        {Array.from({ length: 11 }, (_, i) => (
          <div
            key={`v${i}`}
            style={{
              position: "absolute",
              left: (i + 1) * 100,
              top: 0,
              width: 1,
              height: 630,
              backgroundColor: "rgba(58,50,69,0.05)",
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
              backgroundColor: "rgba(58,50,69,0.05)",
            }}
          />
        ))}

        {/* Top row: brand left, domain chip right */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Split-R brand mark (see components/logo.tsx) recreated with CSS
                clip-path — satori doesn't support SVG clipPath elements. */}
            <div style={{ display: "flex", position: "relative", width: 68, height: 68 }}>
              <div
                style={{
                  position: "absolute",
                  top: -1,
                  left: -1,
                  width: 68,
                  height: 68,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: CORAL,
                  fontSize: 62,
                  fontWeight: 800,
                  fontFamily: "Baloo 2",
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
                  width: 68,
                  height: 68,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: CORAL_LIGHT,
                  fontSize: 62,
                  fontWeight: 800,
                  fontFamily: "Baloo 2",
                  clipPath: "polygon(66% 0%, 100% 0%, 100% 100%, 37% 100%)",
                }}
              >
                R
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 44, fontWeight: 800, fontFamily: "Baloo 2" }}>
              Rift<span style={{ color: CORAL }}>.</span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              border: "3px solid rgba(58,50,69,0.3)",
              backgroundColor: PAPER,
              borderRadius: 999,
              padding: "10px 26px",
              color: MUTED,
              fontSize: 25,
            }}
          >
            rift-fawn.vercel.app
          </div>
        </div>

        {/* Badge + headline — the hero, faithfully */}
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              alignItems: "center",
              gap: 10,
              border: `3px solid ${INK}`,
              backgroundColor: YELLOW,
              boxShadow: `0 4px 0 ${INK}`,
              borderRadius: 999,
              padding: "10px 28px",
              color: INK,
              fontSize: 25,
            }}
          >
            <svg width={26} height={26} viewBox="0 0 24 24">
              <path
                d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z"
                fill={INK}
              />
            </svg>
            For first-time founders
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              fontSize: 82,
              fontWeight: 800,
              fontFamily: "Baloo 2",
              lineHeight: 1.06,
              maxWidth: 1060,
            }}
          >
            {headlineWords.map((word, i) => (
              <span key={i} style={{ marginRight: 24 }}>
                {word}
              </span>
            ))}
            {/* Last word wears the chunky yellow underline */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span>problems.</span>
              <div
                style={{
                  height: 12,
                  borderRadius: 999,
                  backgroundColor: YELLOW,
                  marginTop: -6,
                }}
              />
            </div>
          </div>
        </div>

        {/* Meta chips, like the hero assurances */}
        <div style={{ display: "flex", gap: 16 }}>
          {chips.map((chip) => (
            <div
              key={chip}
              style={{
                display: "flex",
                border: "3px solid rgba(58,50,69,0.3)",
                backgroundColor: PAPER,
                borderRadius: 999,
                padding: "12px 30px",
                color: MUTED,
                fontSize: 24,
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Baloo 2", data: baloo, style: "normal", weight: 800 },
        { name: "Nunito", data: nunito, style: "normal", weight: 700 },
      ],
    }
  );
}
