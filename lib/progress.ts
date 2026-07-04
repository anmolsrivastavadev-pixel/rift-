/* In-memory progress tracker for long-running server actions.
 * The client generates a jobId, submits the form with it, and polls
 * getProcessingStatus(jobId, projectId) while the action updates progress here.
 *
 * Note: this is process-local, so it works in single-instance dev/deploys.
 * Entries expire after 10 minutes to avoid unbounded growth.
 */

export type Stage =
  | "idle"
  | "cleaning"
  | "clustering"
  | "generating"
  | "saving"
  | "complete"
  | "error";

export interface ProcessingStatus {
  stage: Stage;
  message?: string;
  total?: number;
  done?: number;
  error?: string;
  updatedAt: number;
}

const TTL_MS = 10 * 60 * 1000;
const store = new Map<string, ProcessingStatus>();

export function setProgress(
  jobId: string,
  patch: Partial<Omit<ProcessingStatus, "updatedAt">>
) {
  const prev = store.get(jobId);
  store.set(jobId, { ...(prev ?? { stage: "idle", updatedAt: 0 }), ...patch, updatedAt: Date.now() });
}

export function getProgress(jobId: string): ProcessingStatus | null {
  const s = store.get(jobId);
  if (!s) return null;
  // expire old entries
  if (Date.now() - s.updatedAt > TTL_MS) {
    store.delete(jobId);
    return null;
  }
  return s;
}

// periodic sweep (best-effort)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store) {
      if (now - v.updatedAt > TTL_MS) store.delete(k);
    }
  }, 60 * 1000).unref?.();
}
