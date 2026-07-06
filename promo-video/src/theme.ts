import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
});

export const FONT = fontFamily;

// Mirrors the design tokens in app/globals.css
export const COLORS = {
  background: "#09090b",
  card: "#111113",
  border: "rgba(255, 255, 255, 0.10)",
  foreground: "#fafafa",
  muted: "#a1a1aa",
  primary: "#3b82f6",
  primarySoft: "rgba(59, 130, 246, 0.12)",
  success: "#22c55e",
  successSoft: "rgba(34, 197, 94, 0.12)",
  warning: "#f59e0b",
  warningSoft: "rgba(245, 158, 11, 0.12)",
  danger: "#ef4444",
  dangerSoft: "rgba(239, 68, 68, 0.12)",
};

export const RADIUS = 12;
