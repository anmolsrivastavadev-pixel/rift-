import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, RADIUS } from "../theme";

const COMPLAINTS = [
  {
    source: "App Store review",
    text: "“Missed two appointments because there were no reminders. Lost customers because of it.”",
  },
  {
    source: "Reddit",
    text: "“I have to call three times just to confirm a booking. Why is this still a thing?”",
  },
  {
    source: "YouTube comment",
    text: "“Your pricing makes no sense. I gave up and went with someone else.”",
  },
];

const ComplaintCard: React.FC<{
  source: string;
  text: string;
  delay: number;
}> = ({ source, text, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 16 },
  });

  return (
    <div
      style={{
        opacity: progress,
        transform: `translateY(${(1 - progress) * 60}px)`,
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS,
        padding: "36px 40px",
        width: 520,
      }}
    >
      <div
        style={{
          color: COLORS.muted,
          fontSize: 22,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 18,
        }}
      >
        {source}
      </div>
      <div
        style={{
          color: COLORS.foreground,
          fontSize: 30,
          lineHeight: 1.45,
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const Complaints: React.FC = () => {
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
          textAlign: "center",
        }}
      >
        Customers already tell you{" "}
        <span style={{ color: COLORS.primary }}>what&rsquo;s broken.</span>
      </h2>
      <div style={{ display: "flex", gap: 40 }}>
        {COMPLAINTS.map((c, i) => (
          <ComplaintCard
            key={c.source}
            source={c.source}
            text={c.text}
            delay={20 + i * 14}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
