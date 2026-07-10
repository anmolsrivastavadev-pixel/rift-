import { test } from "node:test";
import assert from "node:assert/strict";

import { DECISION_LABELS, isValidDecisionStatus } from "../lib/decision-board";

test("validates persisted decision statuses", () => {
  assert.equal(isValidDecisionStatus("undecided"), true);
  assert.equal(isValidDecisionStatus("pursue"), true);
  assert.equal(isValidDecisionStatus("maybe"), false);
  assert.equal(DECISION_LABELS.reject, "Reject");
});
