import { test } from "node:test";
import assert from "node:assert/strict";

import { PLANS, getPlanLimits, isPlanId, resolvePlanId } from "../lib/plans";

test("locks free and pro plan limits", () => {
  assert.deepEqual(PLANS.free, {
    maxActiveProjects: 3,
    ideaRunsPerMonth: 10,
    finderSearchesPerMonth: 20,
    complaintsPerProject: 1000,
    maxActiveWatches: 1,
  });
  assert.deepEqual(PLANS.pro, {
    maxActiveProjects: 100,
    ideaRunsPerMonth: 500,
    finderSearchesPerMonth: 1000,
    complaintsPerProject: 20000,
    maxActiveWatches: 10,
  });
});

test("resolves stored plans and unknown values", () => {
  assert.equal(isPlanId("free"), true);
  assert.equal(isPlanId("pro"), true);
  assert.equal(isPlanId("enterprise"), false);
  assert.equal(resolvePlanId("pro", "user@example.com"), "pro");
  assert.equal(resolvePlanId("enterprise", "user@example.com"), "free");
  assert.equal(getPlanLimits("free").ideaRunsPerMonth, 10);
});

test("admin email always resolves to pro", () => {
  const previous = process.env.RIFT_ADMIN_EMAILS;
  process.env.RIFT_ADMIN_EMAILS = " founder@example.com, other@example.com ";
  try {
    assert.equal(resolvePlanId("free", "FOUNDER@example.com"), "pro");
    assert.equal(resolvePlanId(null, "other@example.com"), "pro");
  } finally {
    if (previous === undefined) delete process.env.RIFT_ADMIN_EMAILS;
    else process.env.RIFT_ADMIN_EMAILS = previous;
  }
});
