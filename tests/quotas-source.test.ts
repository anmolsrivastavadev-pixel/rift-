import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const quotasSource = readFileSync(new URL("../lib/quotas.ts", import.meta.url), "utf8");

test("quota month windows are UTC calendar months", () => {
  assert.match(quotasSource, /function monthStartUtc\(now = new Date\(\)\): Date/);
  assert.match(quotasSource, /Date\.UTC\(now\.getUTCFullYear\(\), now\.getUTCMonth\(\), 1\)/);
  assert.match(quotasSource, /timeZone: "UTC"/);
});

test("idea-run and finder quotas count rows since the UTC month start", () => {
  assert.match(quotasSource, /prisma\.aIRun\.count\(\{[\s\S]*createdAt: \{ gte: monthStartUtc\(\) \}/);
  // Finder quota counts BOTH inserted searches and zero-result searches
  // (tracked as finder_search_empty product events) from the month start.
  assert.match(quotasSource, /sourceType: "finder", createdAt: \{ gte: since \}/);
  assert.match(quotasSource, /type: "finder_search_empty", createdAt: \{ gte: since \}/);
  assert.match(quotasSource, /const since = monthStartUtc\(\)/);
});
