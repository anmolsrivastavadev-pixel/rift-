import { test } from "node:test";
import assert from "node:assert/strict";

import { SCORE_WEIGHTS, computeOpportunityScore } from "../lib/scoring";

test("locks the frozen scoring weights", () => {
  assert.deepEqual(SCORE_WEIGHTS, { count: 0.4, severity: 0.35, confidence: 0.25 });
});

test("characterizes the scoring formula for common complaint counts", () => {
  // These values lock the frozen scoring formula (see docs/AI_AGENT_INSTRUCTIONS.md). If this test fails, the formula changed -- that is the bug.
  const one = computeOpportunityScore({ complaintCount: 1, severity: 5, confidence: 50 });
  assert.equal(one.breakdown.subscores.count, 15);
  assert.equal(one.breakdown.subscores.severity, 44);
  assert.equal(one.breakdown.subscores.confidence, 50);
  assert.equal(one.score, 34);

  const ten = computeOpportunityScore({ complaintCount: 10, severity: 10, confidence: 100 });
  assert.equal(ten.breakdown.subscores.count, 52);
  assert.equal(ten.score, 81);

  const hundred = computeOpportunityScore({ complaintCount: 100, severity: 10, confidence: 100 });
  assert.equal(hundred.breakdown.subscores.count, 100);
  assert.equal(hundred.score, 100);
});

test("clamps scoring inputs and output", () => {
  const low = computeOpportunityScore({ complaintCount: -5, severity: -2, confidence: -20 });
  assert.equal(low.breakdown.inputs.complaintCount, -5);
  assert.equal(low.breakdown.inputs.severity, 1);
  assert.equal(low.breakdown.inputs.confidence, 0);
  assert.equal(low.breakdown.subscores.count, 0);
  assert.equal(low.breakdown.subscores.severity, 0);
  assert.equal(low.score, 0);

  const high = computeOpportunityScore({ complaintCount: 1000000, severity: 50, confidence: 150 });
  assert.equal(high.breakdown.inputs.severity, 10);
  assert.equal(high.breakdown.inputs.confidence, 100);
  assert.equal(high.breakdown.subscores.count, 100);
  assert.equal(high.score, 100);
});

test("rounds the final weighted score", () => {
  const result = computeOpportunityScore({ complaintCount: 10, severity: 6, confidence: 50 });
  assert.equal(result.breakdown.subscores.count, 52);
  assert.equal(result.breakdown.subscores.severity, 56);
  assert.equal(result.score, 53);
});
