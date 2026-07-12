import { ImageResponse } from "next/og";

/* Social share card (OG + Twitter). Generated at request time with next/og —
 * no static asset, no extra dependency. Mirrors the doodle landing hero:
 * warm cream paper, faint ink grid, split-R coral mark, huge ink headline
 * with coral accent, paper meta chips. Grid lines are plain divs (satori
 * has no repeating gradients).
 */

export const alt = "Rift: find business ideas hidden in real customer problems.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#3a3245";
const MUTED = "#5f5569";
const CORAL = "#bc3917";
const CORAL_LIGHT = "#f07a52";

const headlineWords = [
  ...["Find", "business", "ideas", "hidden", "in"].map((text) => ({
    text,
    accent: false,
  })),
  { text: "real", accent: true },
  { text: "customer", accent: true },
  { text: "problems.", accent: true },
];

/* Keep in sync with assurances in components/landing/doodle.tsx */
const chips = [
  "Sources included with every result",
  "Free during the beta",
  "No credit card required",
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
          backgroundColor: "#fdf1e3",
          backgroundImage:
            "radial-gradient(circle at 62% 0%, rgba(207,67,24,0.08), transparent 58%)",
          color: INK,
          fontFamily: "sans-serif",
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
              backgroundColor: "rgba(58,50,69,0.06)",
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
              backgroundColor: "rgba(58,50,69,0.06)",
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
                  color: CORAL,
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
                  color: CORAL_LIGHT,
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
              border: `2px solid rgba(188,57,23,0.45)`,
              backgroundColor: "rgba(207,67,24,0.1)",
              borderRadius: 999,
              padding: "10px 26px",
              color: CORAL,
              fontSize: 26,
              fontWeight: 600,
            }}
          >
            rift-fawn.vercel.app
          </div>
        </div>

        {/* Kicker + headline — same voice and accent as the hero */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              color: CORAL,
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            For first-time founders and side-project builders
          </div>
          {/* Satori can't mix raw text and elements in one node, so the
              headline is word-by-word spans in a wrapping flex row. */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 1040,
            }}
          >
            {headlineWords.map((word, i) => (
              <span
                key={i}
                style={{
                  color: word.accent ? CORAL : INK,
                  marginRight: 22,
                }}
              >
                {word.text}
              </span>
            ))}
          </div>
        </div>

        {/* Meta chips, like the hero */}
        <div style={{ display: "flex", gap: 16 }}>
          {chips.map((chip) => (
            <div
              key={chip}
              style={{
                display: "flex",
                border: "2px solid rgba(58,50,69,0.3)",
                backgroundColor: "#fffcf5",
                borderRadius: 999,
                padding: "12px 34px",
                color: MUTED,
                fontSize: 23,
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
