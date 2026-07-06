import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, RADIUS } from "../theme";

const BARS = [
  { label: "How often it comes up", weight: "40%", fill: 0.78 },
  { label: "How painful it is", weight: "35%", fill: 0.88 },
  { label: "How confident the AI is", weight: "25%", fill: 0.82 },
];

const ScoreBar: React.FC<{
  label: string;
  weight: string;
  fill: number;
  delay: number;
}> = ({ label, weight, fill, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20 },
    durationInFrames: 40,
  });

  return (
    <div style={{ opacity: interpolate(progress, [0, 0.2], [0, 1]) }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <span style={{ color: COLORS.foreground, fontSize: 26 }}>{label}</span>
        <span style={{ color: COLORS.muted, fontSize: 26 }}>{weight}</span>
      </div>
      <div
        style={{
          height: 16,
          borderRadius: 999,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${fill * progress * 100}%`,
            borderRadius: 999,
            background: COLORS.primary,
          }}
        />
      </div>
    </div>
  );
};

export const IdeaScore: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardIn = spring({ frame, fps, config: { damping: 16 } });
  const scoreProgress = spring({
    frame: frame - 25,
    fps,
    config: { damping: 30 },
    durationInFrames: 60,
  });
  const score = Math.round(scoreProgress * 84);
  const captionOpacity = interpolate(frame, [130, 155], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 50,
      }}
    >
      <div
        style={{
          opacity: cardIn,
          transform: `translateY(${(1 - cardIn) * 60}px)`,
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS + 4,
          padding: "56px 72px",
          width: 1240,
          display: "flex",
          gap: 80,
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "inline-block",
              background: COLORS.primarySoft,
              color: COLORS.primary,
              borderRadius: 999,
              padding: "10px 24px",
              fontSize: 24,
              fontWeight: 600,
              marginBottom: 28,
            }}
          >
            Business idea
          </div>
          <div
            style={{
              color: COLORS.foreground,
              fontSize: 48,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
              marginBottom: 44,
            }}
          >
            Booking + reminder tool for small grooming salons
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
            {BARS.map((bar, i) => (
              <ScoreBar key={bar.label} {...bar} delay={35 + i * 12} />
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 280,
              height: 280,
              borderRadius: "50%",
              border: `10px solid ${COLORS.primary}`,
              background: COLORS.primarySoft,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: COLORS.foreground,
                fontSize: 96,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {score}
            </span>
            <span style={{ color: COLORS.muted, fontSize: 26, marginTop: 8 }}>
              / 100
            </span>
          </div>
          <span
            style={{ color: COLORS.muted, fontSize: 26, fontWeight: 500 }}
          >
            Opportunity Score
          </span>
        </div>
      </div>

      <p
        style={{
          opacity: captionOpacity,
          color: COLORS.muted,
          fontSize: 32,
          margin: 0,
          textAlign: "center",
        }}
      >
        Every idea is scored 0&ndash;100 from real complaint evidence &mdash;
        nothing invented.
      </p>
    </AbsoluteFill>
  );
};
