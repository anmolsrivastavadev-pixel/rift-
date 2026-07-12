/* Matching regenerated idea clusters back onto the ideas a user has invested in.
 *
 * Re-running "Find ideas" used to delete every opportunity in the project and
 * create fresh rows. SavedOpportunity, ValidationWorkspace and ShareLink all
 * cascade off Opportunity, so that silently destroyed saved ideas, pursue/park
 * decisions, validation checklists and public share links — on the product's
 * central loop (the weekly watch adds complaints and invites the user back, and
 * new complaints do nothing until a re-run).
 *
 * A re-run now writes the regenerated content back onto the SAME row, so its id
 * survives and everything hanging off that id survives with it.
 *
 * Identity is the evidence, not the title: Gemini rewrites titles between runs,
 * so title matching would fail exactly when it matters. Two ideas are the same
 * idea when they rest on substantially the same complaints.
 *
 * Pure and dependency-free so it can be tested directly (tests/opportunity-match.test.ts).
 */

/** A pairing must cover at least half of the smaller side. One complaint in
 *  common is coincidence, not identity — and a wrong match is worse than none,
 *  because it would rewrite a saved idea into a different idea. */
export const MATCH_MIN_OVERLAP = 0.5;

export type MatchInput = {
  /** Complaint ids behind each regenerated cluster, by cluster index. */
  clusterComplaintIds: string[][];
  /** Complaint ids each kept (user-invested) opportunity currently rests on. */
  keptComplaintsByOpportunity: Map<string, Set<string>>;
};

export type MatchResult = {
  /** Per cluster index: the kept opportunity id to update in place, or null to create. */
  clusterMatch: (string | null)[];
  /** Kept opportunities a cluster will be written onto. */
  matchedIds: string[];
  /** Complaints held by kept ideas that no cluster matched. Off limits: those
   *  ideas keep their receipts instead of having them stolen by a new idea. */
  unavailableComplaintIds: Set<string>;
};

export function matchClustersToKeptOpportunities({
  clusterComplaintIds,
  keptComplaintsByOpportunity,
}: MatchInput): MatchResult {
  // Score every possible pairing, then take them greedily, strongest first, so
  // the best evidence overlap wins and no idea is claimed twice.
  const candidates: { clusterIndex: number; opportunityId: string; ratio: number }[] = [];

  clusterComplaintIds.forEach((ids, clusterIndex) => {
    if (ids.length === 0) return;
    for (const [opportunityId, held] of keptComplaintsByOpportunity) {
      if (held.size === 0) continue;
      let overlap = 0;
      for (const id of ids) if (held.has(id)) overlap += 1;
      if (overlap === 0) continue;
      const ratio = overlap / Math.min(ids.length, held.size);
      if (ratio >= MATCH_MIN_OVERLAP) {
        candidates.push({ clusterIndex, opportunityId, ratio });
      }
    }
  });

  // Deterministic: ties break by cluster index, then opportunity id, so the same
  // inputs always produce the same pairing.
  candidates.sort(
    (a, b) =>
      b.ratio - a.ratio ||
      a.clusterIndex - b.clusterIndex ||
      a.opportunityId.localeCompare(b.opportunityId)
  );

  const clusterMatch: (string | null)[] = clusterComplaintIds.map(() => null);
  const taken = new Set<string>();
  for (const candidate of candidates) {
    if (clusterMatch[candidate.clusterIndex] !== null) continue;
    if (taken.has(candidate.opportunityId)) continue;
    clusterMatch[candidate.clusterIndex] = candidate.opportunityId;
    taken.add(candidate.opportunityId);
  }

  const unavailableComplaintIds = new Set<string>();
  for (const [opportunityId, held] of keptComplaintsByOpportunity) {
    if (taken.has(opportunityId)) continue;
    for (const complaintId of held) unavailableComplaintIds.add(complaintId);
  }

  return {
    clusterMatch,
    matchedIds: Array.from(taken),
    unavailableComplaintIds,
  };
}
