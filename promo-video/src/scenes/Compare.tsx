import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, RADIUS } from "../theme";

const IDEAS = [
  {
    title: "Booking + reminder tool",
    score: 84,
    decision: "Pursue",
    color: COLORS.success,
    soft: COLORS.successSoft,
  },
  {
    title: "Transparent pricing pages",
    score: 67,
    decision: "Park",
    color: COLORS.warning,
    soft: COLORS.warningSoft,
  },
  {
    title: "Loyalty punch cards",
    score: 41,
    decision: "Reject",
    color: COLORS.danger,
    soft: COLORS.dangerSoft,
  },
];

const IdeaCard: React.FC<{
  idea: (typeof IDEAS)[number];
  delay: number;
}> = ({ idea, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 16 },
  });
  const badgeIn = spring({
    frame: frame - delay - 18,
    fps,
    config: { damping: 12 },
  });

  return (
    <div
      style={{
        opacity: progress,
        transform: `translateY(${(1 - progress) * 60}px)`,
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS,
        padding: "44px 44px",
        width: 480,
        display: "flex",
        flexDirection: "column",
        gap: 30,
      }}
    >
      <div
        style={{
          color: COLORS.foreground,
          fontSize: 36,
          fontWeight: 600,
          lineHeight: 1.25,
          minHeight: 90,
        }}
      >
        {idea.title}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: COLORS.muted, fontSize: 28 }}>
          Score{" "}
          <span style={{ color: COLORS.foreground, fontWeight: 700 }}>
            {idea.score}
          </span>
        </span>
        <span
          style={{
            transform: `scale(${badgeIn})`,
            background: idea.soft,
            color: idea.color,
            borderRadius: 999,
            padding: "12px 30px",
            fontSize: 28,
            fontWeight: 600,
          }}
        >
          {idea.decision}
        </span>
      </div>
    </div>
  );
};

export const Compare: React.FC = () => {
  const frame = useCurrentFrame();
  const headingOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 70,
      }}
    >
      <h2
        style={{
          opacity: headingOpacity,
          color: COLORS.foreground,
          fontSize: 60,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          margin: 0,
        }}
      >
        Compare ideas. <span style={{ color: COLORS.primary }}>Decide.</span>
      </h2>
      <div style={{ display: "flex", gap: 40 }}>
        {IDEAS.map((idea, i) => (
          <IdeaCard key={idea.title} idea={idea} delay={15 + i * 12} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
