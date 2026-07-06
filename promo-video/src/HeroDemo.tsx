import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "./theme";

/* HeroDemo — a looping in-page demo for the landing hero's product window.
 * Recreates the "research cockpit" mock from components/landing/hero.tsx and
 * animates it like a real session: a scanning state, complaints streaming in,
 * a detected pattern with counting confidence, growing signal bars, the top
 * opportunity, and a cursor that moves in and clicks Compare.
 * 1040x1200 (same aspect ratio as the hero card), 30fps, ~19s, loop-safe.
 */

export const HERO_DEMO_DURATION = 570; // 19s @ 30fps

// Current brand kit (app/globals.css) — pure black palette
const C = {
  window: "#0a0a0a",
  panel: "rgba(255,255,255,0.05)",
  border: "#242424",
  fg: "#ffffff",
  muted: "#737373",
  primary: "#3b82f6",
  primarySoft: "rgba(59,130,246,0.12)",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
};

const quotes = [
  "“They never remind me about my appointment, so I just stopped going.”",
  "“I can't tell what grooming will actually cost until I'm there.”",
  "“Booked online and nobody ever confirmed it.”",
];

const chips = ["missed bookings", "unclear pricing", "no reminders"];
const bars = [38, 55, 44, 70, 58, 86, 64];
const inputs = ["Reviews", "Tickets", "Forums", "Calls"];

// Timeline (frames)
const T = {
  quotes: [48, 90, 132],
  chips: 180,
  pattern: 235,
  signal: 320,
  opportunity: 362,
  footer: 425,
  cursorIn: 448,
  click: 500,
  fadeOut: 548,
};

// Compare button center, in composition coordinates
const COMPARE = { x: 905, y: 1122 };

function useRise(delay: number, distance = 36) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return {
    opacity: frame < delay ? 0 : p,
    transform: `translateY(${(1 - p) * distance}px)`,
  };
}

function Label({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{ color, fontSize: 19, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
      {children}
    </div>
  );
}

/* "Scanning reviews" indicator shown before the first complaint arrives. */
const Scanning: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [4, 14, 36, 46], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ opacity, display: "flex", alignItems: "center", gap: 16, padding: "10px 6px" }}>
      <div style={{ display: "flex", gap: 7 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: C.primary,
              opacity: 0.35 + 0.65 * Math.abs(Math.sin((frame - i * 5) / 8)),
            }}
          />
        ))}
      </div>
      <div style={{ color: C.muted, fontSize: 23 }}>Scanning 24 reviews…</div>
    </div>
  );
};

/* White cursor that glides to the Compare button and presses it. */
const Cursor: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const travel = spring({ frame: frame - T.cursorIn, fps, config: { damping: 60 } });
  const x = interpolate(travel, [0, 1], [620, COMPARE.x - 6]);
  const y = interpolate(travel, [0, 1], [820, COMPARE.y - 6]);
  const opacity = interpolate(
    frame,
    [T.cursorIn, T.cursorIn + 12, T.fadeOut - 10, T.fadeOut],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const press = frame >= T.click && frame < T.click + 10 ? 0.82 : 1;
  return (
    <svg
      width={44}
      height={44}
      viewBox="0 0 24 24"
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity,
        transform: `scale(${press})`,
        filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.7))",
      }}
    >
      <path
        d="M5.5 3.2l12.6 7.9-5.6 1.2-1.9 5.4L5.5 3.2z"
        fill="#ffffff"
        stroke="#0a0a0a"
        strokeWidth={1.2}
      />
    </svg>
  );
};

export const HeroDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const contentOpacity = interpolate(frame, [T.fadeOut, HERO_DEMO_DURATION - 5], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const confidence = Math.round(
    interpolate(frame, [T.pattern + 8, T.pattern + 55], [0, 92], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  // Little pop when the confidence count lands on 92
  const confidencePop =
    1 + 0.12 * Math.max(0, spring({ frame: frame - (T.pattern + 55), fps, config: { damping: 12 } }) -
      spring({ frame: frame - (T.pattern + 63), fps, config: { damping: 12 } }));

  const signalPct = Math.round(
    interpolate(frame, [T.signal + 5, T.signal + 50], [0, 38], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const clicked = frame >= T.click + 4;
  const comparePress = frame >= T.click && frame < T.click + 8 ? 0.94 : 1;

  const patternStyle = useRise(T.pattern);
  const q0 = useRise(T.quotes[0]);
  const q1 = useRise(T.quotes[1]);
  const q2 = useRise(T.quotes[2]);
  const quoteStyles = [q0, q1, q2];
  const signalStyle = useRise(T.signal);
  const oppStyle = useRise(T.opportunity);
  const footerStyle = useRise(T.footer, 20);

  return (
    <AbsoluteFill style={{ backgroundColor: C.window, fontFamily: FONT }}>
      {/* Window chrome */}
      <div
        style={{
          height: 88,
          display: "flex",
          alignItems: "center",
          gap: 26,
          padding: "0 34px",
          borderBottom: `2px solid ${C.border}`,
        }}
      >
        <div style={{ display: "flex", gap: 13 }}>
          {[`${C.danger}99`, `${C.warning}99`, `${C.success}99`].map((bg, i) => (
            <div key={i} style={{ width: 21, height: 21, borderRadius: "50%", backgroundColor: bg }} />
          ))}
        </div>
        <div style={{ color: C.muted, fontSize: 24 }}>rift.app/ideas/new</div>
      </div>

      <div style={{ display: "flex", flex: 1 }}>
        {/* Inputs sidebar */}
        <div style={{ width: 268, borderRight: `2px solid ${C.border}`, padding: 24 }}>
          <div style={{ color: C.fg, fontSize: 25, fontWeight: 700, padding: "8px 22px 18px" }}>Inputs</div>
          {inputs.map((item) => {
            const active = item === "Reviews";
            return (
              <div
                key={item}
                style={{
                  padding: "16px 22px",
                  marginBottom: 8,
                  borderRadius: 16,
                  fontSize: 23,
                  fontWeight: active ? 600 : 400,
                  color: active ? C.fg : C.muted,
                  backgroundColor: active ? C.panel : "transparent",
                }}
              >
                {item}
              </div>
            );
          })}
        </div>

        {/* Main panel */}
        <div style={{ flex: 1, padding: 30, display: "flex", flexDirection: "column", gap: 22, opacity: contentOpacity }}>
          {frame < 50 && <Scanning />}

          {/* Pattern detected */}
          <div
            style={{
              ...patternStyle,
              border: "2px solid rgba(59,130,246,0.3)",
              backgroundColor: "rgba(59,130,246,0.05)",
              borderRadius: 22,
              padding: "26px 30px",
              display: frame < T.pattern ? "none" : "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 20,
            }}
          >
            <div>
              <Label color={C.primary}>Pattern detected</Label>
              <div style={{ color: C.fg, fontSize: 30, fontWeight: 600, marginTop: 10 }}>
                Repeated booking friction
              </div>
            </div>
            <div
              style={{
                border: "2px solid rgba(59,130,246,0.4)",
                backgroundColor: C.primarySoft,
                borderRadius: 999,
                padding: "10px 24px",
                color: C.primary,
                fontSize: 23,
                fontWeight: 600,
                whiteSpace: "nowrap",
                transform: `scale(${confidencePop})`,
              }}
            >
              {confidence} confidence
            </div>
          </div>

          {/* Complaint quotes */}
          {quotes.map((quote, i) => (
            <div
              key={quote}
              style={{
                ...quoteStyles[i],
                border: `2px solid ${C.border}`,
                backgroundColor: C.panel,
                borderRadius: 22,
                padding: "24px 30px",
                color: "rgba(255,255,255,0.85)",
                fontSize: 25,
                lineHeight: 1.35,
              }}
            >
              {quote}
            </div>
          ))}

          {/* Tag chips, each popping in on its own spring */}
          <div style={{ display: "flex", gap: 12 }}>
            {chips.map((chip, i) => {
              const pop = spring({ frame: frame - (T.chips + i * 9), fps, config: { damping: 14 } });
              return (
                <div
                  key={chip}
                  style={{
                    opacity: frame < T.chips + i * 9 ? 0 : Math.min(1, pop * 1.4),
                    transform: `scale(${0.6 + 0.4 * pop})`,
                    border: `2px solid ${C.border}`,
                    borderRadius: 999,
                    padding: "9px 20px",
                    color: C.muted,
                    fontSize: 21,
                  }}
                >
                  {chip}
                </div>
              );
            })}
          </div>

          {/* Signal strength + top opportunity */}
          <div style={{ display: "flex", gap: 22 }}>
            <div
              style={{
                ...signalStyle,
                flex: 1,
                border: `2px solid ${C.border}`,
                backgroundColor: C.panel,
                borderRadius: 22,
                padding: 28,
              }}
            >
              <Label color={C.muted}>Signal strength</Label>
              <div style={{ color: C.fg, fontSize: 38, fontWeight: 700, margin: "8px 0 18px" }}>
                +{signalPct}%
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 11, height: 120 }}>
                {bars.map((h, i) => {
                  const grow = spring({
                    frame: frame - (T.signal + 10 + i * 5),
                    fps,
                    config: { damping: 16 },
                  });
                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${h * Math.min(1.06, grow)}%`,
                        borderRadius: "6px 6px 2px 2px",
                        background: "linear-gradient(to top, rgba(37,99,235,0.55), #3b82f6)",
                      }}
                    />
                  );
                })}
              </div>
            </div>
            <div
              style={{
                ...oppStyle,
                flex: 1,
                border: `2px solid ${C.border}`,
                backgroundColor: C.panel,
                borderRadius: 22,
                padding: 28,
              }}
            >
              <Label color={C.primary}>Top opportunity</Label>
              <div style={{ color: C.fg, fontSize: 27, fontWeight: 600, lineHeight: 1.25, margin: "10px 0" }}>
                Booking reminders for groomers
              </div>
              <div style={{ color: C.muted, fontSize: 21, lineHeight: 1.45 }}>
                People want confirmations before they trust a salon again.
              </div>
            </div>
          </div>

          {/* Footer row */}
          <div
            style={{
              ...footerStyle,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "auto",
            }}
          >
            <div style={{ color: C.muted, fontSize: 22 }}>3 idea candidates</div>
            <div
              style={{
                transform: `scale(${comparePress})`,
                border: `2px solid ${clicked ? C.primary : "rgba(59,130,246,0.4)"}`,
                backgroundColor: clicked ? C.primary : C.primarySoft,
                borderRadius: 16,
                padding: "12px 34px",
                color: clicked ? "#ffffff" : C.primary,
                fontSize: 23,
                fontWeight: 600,
              }}
            >
              Compare
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: contentOpacity }}>
        <Cursor />
      </div>
    </AbsoluteFill>
  );
};
