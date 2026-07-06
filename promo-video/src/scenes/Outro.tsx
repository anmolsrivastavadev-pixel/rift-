import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../theme";
import { Wordmark } from "../common";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoIn = spring({ frame, fps, config: { damping: 14 } });
  const lineOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pillIn = spring({ frame: frame - 30, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 48,
      }}
    >
      <div style={{ transform: `scale(${logoIn})` }}>
        <Wordmark size={110} />
      </div>
      <p
        style={{
          opacity: lineOpacity,
          color: COLORS.muted,
          fontSize: 44,
          margin: 0,
          textAlign: "center",
        }}
      >
        Find business ideas from real customer pain.
      </p>
      <span
        style={{
          transform: `scale(${pillIn})`,
          background: COLORS.primarySoft,
          border: `1px solid rgba(59, 130, 246, 0.4)`,
          color: COLORS.primary,
          borderRadius: 999,
          padding: "18px 44px",
          fontSize: 32,
          fontWeight: 600,
        }}
      >
        Free to start &middot; Pro is $9/month
      </span>
    </AbsoluteFill>
  );
};
