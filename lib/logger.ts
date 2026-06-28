/* Structured server-side logger.
 * Writes JSON-ish lines to stdout (server only, never exposed to users).
 * Uses console so it works in dev and most hosts.
 */

type Level = "info" | "warn" | "error";

function emit(level: Level, message: string, meta?: Record<string, unknown>) {
  const line = {
    t: new Date().toISOString(),
    level,
    message,
    ...(meta ?? {}),
  };
  // JSON.stringify collapses big objects safely; symbols become undefined.
  const out = JSON.stringify(line, (_k, v) =>
    typeof v === "bigint" ? v.toString() : v
  );
  if (level === "error") console.error(out);
  else if (level === "warn") console.warn(out);
  else console.log(out);
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) =>
    emit("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    emit("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) =>
    emit("error", message, meta),
};