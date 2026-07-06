import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONT } from "./theme";

// Dark backdrop with the landing page's blue radial glow.
export const Backdrop: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          width: 1400,
          height: 900,
          transform: "translate(-50%, -40%)",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at center, rgba(59,130,246,0.14) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

// Fades a scene in over its first frames and out over its last frames.
export const SceneFade: React.FC<{
  durationInFrames: number;
  children: React.ReactNode;
}> = ({ durationInFrames, children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 12, durationInFrames - 12, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const scale = interpolate(frame, [0, 14], [0.98, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ opacity, transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
};

export const Wordmark: React.FC<{ size?: number }> = ({ size = 96 }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.25 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.22,
          background: COLORS.primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontSize: size * 0.55,
          fontWeight: 700,
        }}
      >
        R
      </div>
      <span
        style={{
          color: COLORS.foreground,
          fontSize: size * 0.72,
          fontWeight: 600,
          letterSpacing: "-0.02em",
        }}
      >
        Rift
      </span>
    </div>
  );
};
