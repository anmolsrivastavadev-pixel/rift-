import { test } from "node:test";
import assert from "node:assert/strict";

import { buildEvidenceCaption, computeEvidenceStrength } from "../lib/evidence-strength";

test("classifies thin, moderate, and strong evidence", () => {
  const thin = computeEvidenceStrength(Array.from({ length: 4 }, () => ({ sourceKind: null, sourceDate: null })));
  assert.equal(thin.strength, "thin");
  assert.equal(thin.ownDataOnly, true);

  const moderate = computeEvidenceStrength(Array.from({ length: 5 }, () => ({ sourceKind: null, sourceDate: null })));
  assert.equal(moderate.strength, "moderate");

  const strong = computeEvidenceStrength([
    ...Array.from({ length: 8 }, () => ({ sourceKind: "reddit", sourceDate: null })),
    ...Array.from({ length: 7 }, () => ({ sourceKind: "appstore", sourceDate: null })),
  ]);
  assert.equal(strong.strength, "strong");
  assert.equal(strong.sourceCount, 2);
  assert.equal(strong.ownDataOnly, false);
});

test("builds captions from total, source count, and date span", () => {
  const ownData = computeEvidenceStrength([{ sourceKind: null, sourceDate: new Date("2025-01-01") }]);
  assert.equal(buildEvidenceCaption(ownData), "Backed by 1 complaint you added.");

  const sourced = computeEvidenceStrength([
    { sourceKind: "reddit", sourceDate: new Date("2025-01-01") },
    { sourceKind: "appstore", sourceDate: new Date("2025-04-01") },
  ]);
  assert.equal(sourced.spanMonths, 3);
  assert.equal(buildEvidenceCaption(sourced), "Backed by 2 complaints from 2 sources over 3 months.");
  assert.equal(buildEvidenceCaption(computeEvidenceStrength([])), "No linked complaints yet.");
});
