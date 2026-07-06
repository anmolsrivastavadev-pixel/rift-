import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT } from "./theme";

/* HeroDemo — 90-second scored promo for the landing hero's product window.
 * Four screens inside one browser frame: the research cockpit, the compare
 * board (cursor picks a winner), the validation brief (checklist ticks),
 * and a closing title card. Soundtrack: public/promo-audio.m4a (fades out).
 * 1040x1200, 30fps, 2700 frames, loop-safe (fades to black at the end).
 */

export const HERO_DEMO_DURATION = 2700; // 90s @ 30fps

const C = {
  window: "#0a0a0a",
  panel: "rgba(255,255,255,0.05)",
  border: "#242424",
  fg: "#ffffff",
  muted: "#737373",
  primary: "#3b82f6",
  primaryFill: "#2563eb",
  primarySoft: "rgba(59,130,246,0.12)",
  success: "#22c55e",
  successSoft: "rgba(34,197,94,0.12)",
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

const ideas = [
  { title: "Booking reminders for groomers", tag: "missed bookings", score: 86, tone: C.success },
  { title: "Upfront pricing pages for salons", tag: "unclear pricing", score: 71, tone: C.primary },
  { title: "Waitlist manager for busy shops", tag: "long waits", score: 58, tone: C.warning },
];

const briefRows = [
  ["Top pain", "Clients quietly stop booking when nobody confirms or reminds them."],
  ["Audience", "Small grooming salons that take bookings online but run on pen and paper."],
  ["Test next", "Ask 5 salon owners how they handle no-shows today."],
];
const checks = ["Talked to 5 real people", "Found 3 paying workarounds", "Collected 24 complaints"];

// ---- Timeline (frames) -----------------------------------------------------
/* Retimed 2026-07-06: the first cut had ~20s of dead air (static brief tail,
 * 12s frozen end card). Now every beat lands within ~1.5s of the previous one
 * and a Results scene fills the former gap. */
const S1 = {
  scan: 12,
  quotes: [100, 150, 200],
  chips: 260,
  pattern: 315,
  signal: 420,
  opp: 465,
  footer: 520,
  cursor: 535,
  click: 590,
  out: 610,
};
const S2 = {
  in: 640,
  cards: [668, 698, 728],
  winner: 800,
  cursor: 815,
  click: 865,
  park: [915, 950],
  out: 1150,
};
const S3 = {
  in: 1180,
  rows: [1215, 1268, 1321],
  checks: [1390, 1430, 1470],
  button: 1520,
  out: 1690,
};
const S5 = {
  in: 1720,
  counters: [1750, 1800, 1850],
  meter: 1905,
  line: 1985,
  out: 2150,
};
const S4 = { in: 2180, tagline: 2235, pill: 2310 };
const FADE = { start: 2615, end: 2690 };

// ---- Small helpers ---------------------------------------------------------
function riseAt(frame: number, fps: number, delay: number, distance = 34) {
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return {
    opacity: frame < delay ? 0 : p,
    transform: `translateY(${(1 - p) * distance}px)`,
  };
}

function screenFade(frame: number, tIn: number, tOut: number) {
  return interpolate(frame, [tIn, tIn + 22, tOut, tOut + 22], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

const Label: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <div style={{ color, fontSize: 19, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
    {children}
  </div>
);

const Sidebar: React.FC<{ items: string[]; active: string }> = ({ items, active }) => (
  <div style={{ width: 268, borderRight: `2px solid ${C.border}`, padding: 24, flexShrink: 0 }}>
    {items.map((item) => (
      <div
        key={item}
        style={{
          padding: "16px 22px",
          marginBottom: 8,
          borderRadius: 16,
          fontSize: 23,
          fontWeight: item === active ? 600 : 400,
          color: item === active ? C.fg : C.muted,
          backgroundColor: item === active ? C.panel : "transparent",
        }}
      >
        {item}
      </div>
    ))}
  </div>
);

/* Cursor with two journeys: click Compare (screen 1), click Pursue (screen 2). */
const Cursor: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let x = 0;
  let y = 0;
  let opacity = 0;
  if (frame >= S1.cursor && frame < S1.out + 14) {
    const t = spring({ frame: frame - S1.cursor, fps, config: { damping: 60 } });
    x = interpolate(t, [0, 1], [620, 899]);
    y = interpolate(t, [0, 1], [830, 1116]);
    opacity = interpolate(frame, [S1.cursor, S1.cursor + 12, S1.out, S1.out + 14], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  } else if (frame >= S2.cursor && frame < S2.click + 70) {
    const t = spring({ frame: frame - S2.cursor, fps, config: { damping: 60 } });
    x = interpolate(t, [0, 1], [660, 838]);
    y = interpolate(t, [0, 1], [700, 432]);
    opacity = interpolate(
      frame,
      [S2.cursor, S2.cursor + 12, S2.click + 45, S2.click + 65],
      [0, 1, 1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
  } else {
    return null;
  }
  const pressed =
    (frame >= S1.click && frame < S1.click + 10) || (frame >= S2.click && frame < S2.click + 10);
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
        transform: `scale(${pressed ? 0.82 : 1})`,
        filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.7))",
      }}
    >
      <path d="M5.5 3.2l12.6 7.9-5.6 1.2-1.9 5.4L5.5 3.2z" fill="#ffffff" stroke="#0a0a0a" strokeWidth={1.2} />
    </svg>
  );
};

// ---- Screen 1: research cockpit -------------------------------------------
const CockpitScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scanOpacity = interpolate(frame, [S1.scan, S1.scan + 12, 105, 118], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const confidence = Math.round(
    interpolate(frame, [S1.pattern + 10, S1.pattern + 60], [0, 92], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const signalPct = Math.round(
    interpolate(frame, [S1.signal + 5, S1.signal + 55], [0, 38], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const clicked = frame >= S1.click + 4;
  const press = frame >= S1.click && frame < S1.click + 8 ? 0.94 : 1;

  return (
    <div style={{ flex: 1, padding: 30, display: "flex", flexDirection: "column", gap: 22 }}>
      {frame < 120 && (
        <div style={{ opacity: scanOpacity, display: "flex", alignItems: "center", gap: 16, padding: "10px 6px" }}>
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
      )}

      <div
        style={{
          ...riseAt(frame, fps, S1.pattern),
          display: frame < S1.pattern ? "none" : "flex",
          border: "2px solid rgba(59,130,246,0.3)",
          backgroundColor: "rgba(59,130,246,0.05)",
          borderRadius: 22,
          padding: "26px 30px",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 20,
        }}
      >
        <div>
          <Label color={C.primary}>Pattern detected</Label>
          <div style={{ color: C.fg, fontSize: 30, fontWeight: 600, marginTop: 10 }}>Repeated booking friction</div>
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
            transform:
              frame > S1.pattern + 62
                ? `scale(${1 + 0.02 * Math.sin((frame - S1.pattern - 62) / 8)})`
                : undefined,
          }}
        >
          {confidence} confidence
        </div>
      </div>

      {quotes.map((quote, i) => (
        <div
          key={quote}
          style={{
            ...riseAt(frame, fps, S1.quotes[i]),
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

      <div style={{ display: "flex", gap: 12 }}>
        {chips.map((chip, i) => {
          const pop = spring({ frame: frame - (S1.chips + i * 9), fps, config: { damping: 14 } });
          return (
            <div
              key={chip}
              style={{
                opacity: frame < S1.chips + i * 9 ? 0 : Math.min(1, pop * 1.4),
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

      <div style={{ display: "flex", gap: 22 }}>
        <div
          style={{
            ...riseAt(frame, fps, S1.signal),
            flex: 1,
            border: `2px solid ${C.border}`,
            backgroundColor: C.panel,
            borderRadius: 22,
            padding: 28,
          }}
        >
          <Label color={C.muted}>Signal strength</Label>
          <div style={{ color: C.fg, fontSize: 38, fontWeight: 700, margin: "8px 0 18px" }}>+{signalPct}%</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 11, height: 120 }}>
            {bars.map((h, i) => {
              const grow = spring({ frame: frame - (S1.signal + 12 + i * 5), fps, config: { damping: 16 } });
              const wobble = 1 + 0.03 * Math.sin(frame / 6 + i * 1.3);
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${h * Math.min(1.06, grow) * wobble}%`,
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
            ...riseAt(frame, fps, S1.opp),
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

      <div
        style={{
          ...riseAt(frame, fps, S1.footer, 20),
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "auto",
        }}
      >
        <div style={{ color: C.muted, fontSize: 22 }}>3 idea candidates</div>
        <div
          style={{
            transform: `scale(${press})`,
            border: `2px solid ${clicked ? C.primaryFill : "rgba(59,130,246,0.4)"}`,
            backgroundColor: clicked ? C.primaryFill : C.primarySoft,
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
  );
};

// ---- Screen 2: compare board -----------------------------------------------
const CompareScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pursued = frame >= S2.click + 4;
  return (
    <div style={{ flex: 1, padding: 30, display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ ...riseAt(frame, fps, S2.in + 6), display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: C.fg, fontSize: 34, fontWeight: 700, letterSpacing: "-0.02em" }}>Compare ideas</div>
        <div
          style={{
            border: `2px solid ${C.border}`,
            borderRadius: 999,
            padding: "8px 18px",
            color: C.muted,
            fontSize: 20,
          }}
        >
          3 candidates
        </div>
      </div>

      {ideas.map((idea, i) => {
        const isWinner = i === 0;
        const winnerLift = isWinner && frame >= S2.winner;
        const scoreNow = Math.round(
          interpolate(frame, [S2.cards[i] + 8, S2.cards[i] + 50], [0, idea.score], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        );
        const parked = !isWinner && frame >= S2.park[i - 1];
        const press = isWinner && frame >= S2.click && frame < S2.click + 8 ? 0.94 : 1;
        return (
          <div
            key={idea.title}
            style={{
              ...riseAt(frame, fps, S2.cards[i]),
              border: `2px solid ${winnerLift ? "rgba(34,197,94,0.5)" : C.border}`,
              backgroundColor: winnerLift ? "rgba(34,197,94,0.05)" : C.panel,
              borderRadius: 22,
              padding: "26px 30px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: C.fg, fontSize: 26, fontWeight: 600 }}>{idea.title}</div>
                <div style={{ color: C.muted, fontSize: 20, marginTop: 6 }}>{idea.tag}</div>
              </div>
              <div style={{ color: idea.tone, fontSize: 40, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                {scoreNow}
              </div>
            </div>
            <div style={{ height: 10, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.07)", margin: "18px 0" }}>
              <div
                style={{
                  height: "100%",
                  width: `${scoreNow}%`,
                  borderRadius: 999,
                  backgroundColor: idea.tone,
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {["Pursue", "Park", "Reject"].map((d) => {
                const active =
                  (d === "Pursue" && isWinner && pursued) || (d === "Park" && parked);
                const fill = d === "Pursue" ? C.success : C.muted;
                return (
                  <div
                    key={d}
                    style={{
                      transform: d === "Pursue" && isWinner ? `scale(${press})` : undefined,
                      border: `2px solid ${active ? fill : C.border}`,
                      backgroundColor: active ? (d === "Pursue" ? C.successSoft : C.panel) : "transparent",
                      color: active ? (d === "Pursue" ? C.success : C.fg) : C.muted,
                      borderRadius: 999,
                      padding: "8px 22px",
                      fontSize: 20,
                      fontWeight: active ? 700 : 400,
                    }}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div
        style={{
          ...riseAt(frame, fps, S2.park[1] + 40, 16),
          marginTop: "auto",
          textAlign: "center",
          color: C.muted,
          fontSize: 21,
        }}
      >
        Decision saved. One idea moves forward.
      </div>
    </div>
  );
};

// ---- Screen 3: validation brief ---------------------------------------------
const BriefScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ flex: 1, padding: 30, display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ ...riseAt(frame, fps, S3.in + 6) }}>
        <Label color={C.primary}>Validation brief</Label>
        <div style={{ color: C.fg, fontSize: 32, fontWeight: 700, marginTop: 10, letterSpacing: "-0.02em" }}>
          Booking reminders for groomers
        </div>
      </div>

      {briefRows.map(([label, text], i) => (
        <div
          key={label}
          style={{
            ...riseAt(frame, fps, S3.rows[i]),
            border: `2px solid ${C.border}`,
            backgroundColor: C.panel,
            borderRadius: 22,
            padding: "24px 30px",
          }}
        >
          <Label color={C.muted}>{label}</Label>
          <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 25, lineHeight: 1.4, marginTop: 10 }}>{text}</div>
        </div>
      ))}

      <div
        style={{
          ...riseAt(frame, fps, S3.checks[0] - 15),
          border: `2px solid ${C.border}`,
          backgroundColor: C.panel,
          borderRadius: 22,
          padding: "24px 30px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {checks.map((item, i) => {
          const done = frame >= S3.checks[i];
          const pop = spring({ frame: frame - S3.checks[i], fps, config: { damping: 13 } });
          return (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: `2px solid ${done ? C.success : C.border}`,
                  backgroundColor: done ? C.successSoft : "transparent",
                  display: "grid",
                  placeItems: "center",
                  transform: done ? `scale(${0.7 + 0.3 * Math.min(1, pop)})` : undefined,
                }}
              >
                {done && (
                  <svg width={18} height={18} viewBox="0 0 24 24">
                    <path d="M4 12.5l5 5L20 6.5" stroke={C.success} strokeWidth={3.4} fill="none" strokeLinecap="round" />
                  </svg>
                )}
              </div>
              <div style={{ color: done ? C.fg : C.muted, fontSize: 23 }}>{item}</div>
            </div>
          );
        })}
      </div>

      <div style={{ ...riseAt(frame, fps, S3.button, 16), marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
        <div
          style={{
            backgroundColor: C.primaryFill,
            borderRadius: 16,
            padding: "14px 36px",
            color: "#fff",
            fontSize: 23,
            fontWeight: 600,
            transform: `scale(${1 + 0.02 * Math.sin(Math.max(0, frame - S3.button - 15) / 9)})`,
          }}
        >
          Copy brief
        </div>
      </div>
    </div>
  );
};

// ---- Screen 5: results montage ------------------------------------------------
const resultStats: Array<[number, string, string]> = [
  [24, "complaints in", C.muted],
  [3, "ideas scored", C.primary],
  [1, "worth pursuing", C.success],
];

const ResultsScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const meterPct = interpolate(frame, [S5.meter, S5.meter + 45], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ flex: 1, padding: 30, display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ ...riseAt(frame, fps, S5.in + 6) }}>
        <Label color={C.primary}>Market test</Label>
        <div style={{ color: C.fg, fontSize: 34, fontWeight: 700, marginTop: 10, letterSpacing: "-0.02em" }}>
          One session. One decision.
        </div>
      </div>

      <div style={{ display: "flex", gap: 22 }}>
        {resultStats.map(([target, label, tone], i) => {
          const value = Math.round(
            interpolate(frame, [S5.counters[i] + 5, S5.counters[i] + 40], [0, target], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          );
          return (
            <div
              key={label}
              style={{
                ...riseAt(frame, fps, S5.counters[i]),
                flex: 1,
                border: `2px solid ${C.border}`,
                backgroundColor: C.panel,
                borderRadius: 22,
                padding: "30px 28px",
                textAlign: "center",
              }}
            >
              <div style={{ color: tone === C.muted ? C.fg : tone, fontSize: 62, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
                {value}
              </div>
              <div style={{ color: C.muted, fontSize: 21, marginTop: 8 }}>{label}</div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          ...riseAt(frame, fps, S5.meter - 12),
          border: `2px solid ${C.border}`,
          backgroundColor: C.panel,
          borderRadius: 22,
          padding: "26px 30px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <Label color={C.muted}>From noise to signal</Label>
          <div style={{ color: C.fg, fontSize: 22, fontWeight: 700 }}>{Math.round(meterPct)}%</div>
        </div>
        <div style={{ height: 12, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.07)" }}>
          <div
            style={{
              height: "100%",
              width: `${meterPct}%`,
              borderRadius: 999,
              background: "linear-gradient(90deg, #2563eb, #22c55e)",
            }}
          />
        </div>
      </div>

      <div
        style={{
          ...riseAt(frame, fps, S5.line, 18),
          marginTop: "auto",
          textAlign: "center",
          color: "rgba(255,255,255,0.9)",
          fontSize: 26,
          fontWeight: 600,
        }}
      >
        No invented stats. Just your customers, organized.
      </div>
    </div>
  );
};

// ---- Screen 4: outro ---------------------------------------------------------
const OutroScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const zoom = spring({ frame: frame - S4.in, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
        padding: 60,
        transform: `scale(${0.96 + 0.04 * zoom})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 620,
          height: 620,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.16), transparent 65%)",
          transform: `scale(${1 + 0.06 * Math.sin((frame - S4.in) / 14)})`,
        }}
      />
      <div style={{ ...riseAt(frame, fps, S4.in + 8), color: C.primary, fontSize: 88, fontWeight: 800, letterSpacing: "-0.04em" }}>
        Rift
      </div>
      <div
        style={{
          ...riseAt(frame, fps, S4.tagline),
          color: C.fg,
          fontSize: 46,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          textAlign: "center",
          lineHeight: 1.15,
          maxWidth: 780,
        }}
      >
        Turn complaints into business ideas worth testing.
      </div>
      <div
        style={{
          ...riseAt(frame, fps, S4.pill, 20),
          border: "2px solid rgba(59,130,246,0.4)",
          backgroundColor: C.primarySoft,
          borderRadius: 999,
          padding: "14px 34px",
          color: C.primary,
          fontSize: 24,
          fontWeight: 600,
        }}
      >
        Free during the private beta
      </div>
    </AbsoluteFill>
  );
};

// ---- Root --------------------------------------------------------------------
export const HeroDemo: React.FC = () => {
  const frame = useCurrentFrame();

  const globalFade = interpolate(frame, [FADE.start, FADE.end], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const s1 = screenFade(frame, 0, S1.out + 8);
  const s2 = screenFade(frame, S2.in, S2.out);
  const s3 = screenFade(frame, S3.in, S3.out);
  const s5 = screenFade(frame, S5.in, S5.out);
  const s4 = screenFade(frame, S4.in, HERO_DEMO_DURATION);

  const url =
    frame < S2.in
      ? "rift.app/ideas/new"
      : frame < S3.in
        ? "rift.app/ideas/compare"
        : frame < S5.in
          ? "rift.app/ideas/brief"
          : frame < S4.in
            ? "rift.app/ideas/report"
            : "rift.app";
  const sidebar =
    frame < S2.in
      ? { items: ["Reviews", "Tickets", "Forums", "Calls"], active: "Reviews" }
      : frame < S3.in
        ? { items: ["Home", "Complaints", "Ideas", "Compare", "Saved"], active: "Compare" }
        : frame < S5.in
          ? { items: ["Home", "Complaints", "Ideas", "Compare", "Saved"], active: "Ideas" }
          : { items: ["Home", "Complaints", "Ideas", "Compare", "Saved"], active: "Saved" };

  return (
    <AbsoluteFill style={{ backgroundColor: C.window, fontFamily: FONT }}>
      <Audio src={staticFile("promo-audio.m4a")} volume={0.9} />

      <div style={{ opacity: globalFade, position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
        {/* Window chrome */}
        <div
          style={{
            height: 88,
            display: "flex",
            alignItems: "center",
            gap: 26,
            padding: "0 34px",
            borderBottom: `2px solid ${C.border}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", gap: 13 }}>
            {[`${C.danger}99`, `${C.warning}99`, `${C.success}99`].map((bg, i) => (
              <div key={i} style={{ width: 21, height: 21, borderRadius: "50%", backgroundColor: bg }} />
            ))}
          </div>
          <div style={{ color: C.muted, fontSize: 24 }}>{url}</div>
        </div>

        <div style={{ display: "flex", flex: 1, position: "relative" }}>
          {frame < S4.in && <Sidebar items={sidebar.items} active={sidebar.active} />}

          <div style={{ flex: 1, position: "relative" }}>
            {frame < S2.in && (
              <div style={{ position: "absolute", inset: 0, display: "flex", opacity: s1 }}>
                <CockpitScreen />
              </div>
            )}
            {frame >= S2.in - 10 && frame < S3.in + 10 && (
              <div style={{ position: "absolute", inset: 0, display: "flex", opacity: s2 }}>
                <CompareScreen />
              </div>
            )}
            {frame >= S3.in - 10 && frame < S5.in + 10 && (
              <div style={{ position: "absolute", inset: 0, display: "flex", opacity: s3 }}>
                <BriefScreen />
              </div>
            )}
            {frame >= S5.in - 10 && frame < S4.in + 10 && (
              <div style={{ position: "absolute", inset: 0, display: "flex", opacity: s5 }}>
                <ResultsScreen />
              </div>
            )}
          </div>

          {frame >= S4.in - 10 && (
            <div style={{ position: "absolute", inset: 0, opacity: s4 }}>
              <OutroScreen />
            </div>
          )}
        </div>

        <Cursor />
      </div>
    </AbsoluteFill>
  );
};
