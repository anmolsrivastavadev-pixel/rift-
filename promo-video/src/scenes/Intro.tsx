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

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoIn = spring({ frame, fps, config: { damping: 14 } });
  const taglineOpacity = interpolate(frame, [18, 38], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [18, 38], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 56,
      }}
    >
      <div style={{ transform: `scale(${logoIn})` }}>
        <Wordmark size={120} />
      </div>
      <h1
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          color: COLORS.foreground,
          fontSize: 76,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          textAlign: "center",
          maxWidth: 1300,
          lineHeight: 1.15,
          margin: 0,
        }}
      >
        Turn complaints into business ideas{" "}
        <span style={{ color: COLORS.primary }}>worth testing.</span>
      </h1>
    </AbsoluteFill>
  );
};
