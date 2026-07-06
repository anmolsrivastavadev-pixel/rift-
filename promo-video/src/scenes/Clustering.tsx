import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, RADIUS } from "../theme";

const CHIPS = [
  { label: "no reminders", startX: -640, startY: -220 },
  { label: "missed bookings", startX: 640, startY: -180 },
  { label: "no-shows", startX: -560, startY: 240 },
  { label: "double bookings", startX: 600, startY: 220 },
];

export const Clustering: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Chips fly toward the center, then the cluster card pops in.
  const converge = spring({
    frame: frame - 20,
    fps,
    config: { damping: 18 },
    durationInFrames: 55,
  });
  const chipFade = interpolate(frame, [70, 88], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const clusterIn = spring({
    frame: frame - 80,
    fps,
    config: { damping: 14 },
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 60,
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
        Rift&rsquo;s AI groups{" "}
        <span style={{ color: COLORS.primary }}>repeated problems.</span>
      </h2>

      <div
        style={{
          position: "relative",
          width: 1500,
          height: 520,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {CHIPS.map((chip) => (
          <div
            key={chip.label}
            style={{
              position: "absolute",
              opacity: chipFade,
              transform: `translate(${chip.startX * (1 - converge)}px, ${
                chip.startY * (1 - converge)
              }px)`,
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 999,
              padding: "20px 40px",
              color: COLORS.foreground,
              fontSize: 30,
              fontWeight: 500,
            }}
          >
            {chip.label}
          </div>
        ))}

        <div
          style={{
            opacity: clusterIn,
            transform: `scale(${0.9 + clusterIn * 0.1})`,
            background: COLORS.card,
            border: `1px solid rgba(59, 130, 246, 0.4)`,
            borderRadius: RADIUS + 4,
            padding: "48px 64px",
            width: 900,
            boxShadow: "0 0 80px rgba(59, 130, 246, 0.15)",
          }}
        >
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
            Repeated problem &middot; 14 mentions &middot; 3 sources
          </div>
          <div
            style={{
              color: COLORS.foreground,
              fontSize: 44,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              marginBottom: 24,
            }}
          >
            No reminders before appointments
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {["reminders", "bookings", "no-shows"].map((k) => (
              <span
                key={k}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 999,
                  padding: "8px 22px",
                  color: COLORS.muted,
                  fontSize: 24,
                }}
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
