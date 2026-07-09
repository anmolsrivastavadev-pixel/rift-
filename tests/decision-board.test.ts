import { test } from "node:test";
import assert from "node:assert/strict";

import { DECISION_LABELS, computeTestingPriority, isValidDecisionStatus } from "../lib/decision-board";

test("validates persisted decision statuses", () => {
  assert.equal(isValidDecisionStatus("undecided"), true);
  assert.equal(isValidDecisionStatus("pursue"), true);
  assert.equal(isValidDecisionStatus("maybe"), false);
  assert.equal(DECISION_LABELS.reject, "Reject");
});

test("locks testing-priority boundary order", () => {
  assert.equal(computeTestingPriority({ opportunityScore: 95, mentions: 4, confidence: 99, riskFlags: [] }), "needs-more-evidence");
  assert.equal(computeTestingPriority({ opportunityScore: 79, mentions: 10, confidence: 90, riskFlags: ["a", "b", "c"] }), "high-risk");
  assert.equal(computeTestingPriority({ opportunityScore: 80, mentions: 8, confidence: 80, riskFlags: [] }), "strong-signal");
  assert.equal(computeTestingPriority({ opportunityScore: 65, mentions: 5, confidence: 70, riskFlags: [] }), "worth-testing");
  assert.equal(computeTestingPriority({ opportunityScore: 64, mentions: 5, confidence: 70, riskFlags: [] }), "needs-review");
});
