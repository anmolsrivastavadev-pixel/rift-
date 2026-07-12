import { test } from "node:test";
import assert from "node:assert/strict";

import {
  matchClustersToKeptOpportunities,
  MATCH_MIN_OVERLAP,
} from "../lib/opportunity-match";

function kept(entries: Record<string, string[]>): Map<string, Set<string>> {
  return new Map(
    Object.entries(entries).map(([id, complaints]) => [id, new Set(complaints)])
  );
}

test("the regression that caused data loss: a re-run refreshes the saved idea in place", () => {
  // The user saved idea "opp-saved", built from 4 complaints. They re-run after
  // the weekly watch added c5; the same problem clusters again, now with 5.
  const result = matchClustersToKeptOpportunities({
    clusterComplaintIds: [["c1", "c2", "c3", "c4", "c5"]],
    keptComplaintsByOpportunity: kept({ "opp-saved": ["c1", "c2", "c3", "c4"] }),
  });

  // It must be written back onto the SAME row — that id is what the user's
  // save, decision, checklist and share link all point at.
  assert.equal(result.clusterMatch[0], "opp-saved");
  assert.deepEqual(result.matchedIds, ["opp-saved"]);
  // Its complaints are released so the refreshed evidence can be relinked.
  assert.equal(result.unavailableComplaintIds.size, 0);
});

test("a kept idea no cluster matches keeps its idea AND its receipts", () => {
  const result = matchClustersToKeptOpportunities({
    clusterComplaintIds: [["c9", "c10"]],
    keptComplaintsByOpportunity: kept({ "opp-saved": ["c1", "c2", "c3"] }),
  });

  assert.equal(result.clusterMatch[0], null, "unrelated cluster creates a new idea");
  assert.deepEqual(result.matchedIds, []);
  // Its complaints must not be stolen by the new idea, or the saved idea would
  // survive showing zero evidence.
  assert.deepEqual(
    [...result.unavailableComplaintIds].sort(),
    ["c1", "c2", "c3"]
  );
});

test("weak overlap does not hijack a saved idea", () => {
  // One complaint in common out of many is coincidence, not identity. Matching
  // here would rewrite the user's saved idea into a different idea.
  const result = matchClustersToKeptOpportunities({
    clusterComplaintIds: [["c4", "c5", "c6", "c7", "c8", "c9"]],
    keptComplaintsByOpportunity: kept({
      "opp-saved": ["c1", "c2", "c3", "c4", "c5", "c6"],
    }),
  });
  // 3 of 6 shared = exactly the threshold, so this one DOES match.
  assert.equal(3 / 6, MATCH_MIN_OVERLAP);
  assert.equal(result.clusterMatch[0], "opp-saved");

  const weak = matchClustersToKeptOpportunities({
    clusterComplaintIds: [["c6", "c7", "c8", "c9"]],
    keptComplaintsByOpportunity: kept({ "opp-saved": ["c1", "c2", "c3", "c6"] }),
  });
  // 1 of 4 shared = 0.25, below the threshold → no hijack.
  assert.equal(weak.clusterMatch[0], null);
  assert.ok(weak.unavailableComplaintIds.has("c6"));
});

test("one kept idea is never claimed by two clusters; strongest overlap wins", () => {
  const result = matchClustersToKeptOpportunities({
    // Cluster 0 shares 2 of 4 (0.5). Cluster 1 shares 4 of 4 (1.0).
    clusterComplaintIds: [
      ["c1", "c2", "x1", "x2"],
      ["c1", "c2", "c3", "c4"],
    ],
    keptComplaintsByOpportunity: kept({ "opp-saved": ["c1", "c2", "c3", "c4"] }),
  });

  assert.equal(result.clusterMatch[1], "opp-saved", "the better match wins it");
  assert.equal(result.clusterMatch[0], null, "the weaker cluster becomes a new idea");
  assert.equal(result.matchedIds.length, 1);
});

test("several kept ideas each match their own cluster", () => {
  const result = matchClustersToKeptOpportunities({
    clusterComplaintIds: [
      ["b1", "b2", "b3"],
      ["a1", "a2", "a3"],
      ["z1"],
    ],
    keptComplaintsByOpportunity: kept({
      "opp-a": ["a1", "a2", "a3"],
      "opp-b": ["b1", "b2", "b3"],
    }),
  });

  assert.equal(result.clusterMatch[0], "opp-b");
  assert.equal(result.clusterMatch[1], "opp-a");
  assert.equal(result.clusterMatch[2], null);
  assert.equal(result.unavailableComplaintIds.size, 0, "both were matched, so nothing is held back");
});

test("no kept ideas: every cluster is a fresh idea (the first-run path is unchanged)", () => {
  const result = matchClustersToKeptOpportunities({
    clusterComplaintIds: [["c1", "c2"], ["c3"]],
    keptComplaintsByOpportunity: kept({}),
  });

  assert.deepEqual(result.clusterMatch, [null, null]);
  assert.deepEqual(result.matchedIds, []);
  assert.equal(result.unavailableComplaintIds.size, 0);
});

test("empty clusters and empty kept sets are handled", () => {
  const result = matchClustersToKeptOpportunities({
    clusterComplaintIds: [[], ["c1"]],
    keptComplaintsByOpportunity: kept({ "opp-empty": [], "opp-real": ["c1"] }),
  });

  assert.equal(result.clusterMatch[0], null);
  assert.equal(result.clusterMatch[1], "opp-real");
  // An idea holding no complaints can't be matched and has nothing to protect.
  assert.equal(result.unavailableComplaintIds.size, 0);
});

test("matching is deterministic across runs on identical input", () => {
  const input = {
    clusterComplaintIds: [
      ["c1", "c2"],
      ["c1", "c2"],
    ],
    keptComplaintsByOpportunity: kept({ "opp-a": ["c1", "c2"], "opp-b": ["c1", "c2"] }),
  };
  const a = matchClustersToKeptOpportunities(input);
  const b = matchClustersToKeptOpportunities(input);
  assert.deepEqual(a.clusterMatch, b.clusterMatch);
  // Perfect ties still resolve to a stable, one-to-one pairing.
  assert.equal(new Set(a.clusterMatch).size, 2);
});
