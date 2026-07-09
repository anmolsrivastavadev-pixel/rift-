import { test } from "node:test";
import assert from "node:assert/strict";

import { buildPainTrendCaption, computePainTrend } from "../lib/pain-trend";

const now = new Date("2026-01-01T00:00:00.000Z");
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

test("returns insufficient when fewer than five dated complaints are in the window", () => {
  const result = computePainTrend([daysAgo(10), daysAgo(20), daysAgo(200), null], now);
  assert.equal(result.trend, "insufficient");
  assert.equal(result.datedCount, 3);
  assert.equal(buildPainTrendCaption(result), "Not enough dated complaints in the last 12 months to read a trend.");
});

test("classifies growing, fading, and steady windows", () => {
  assert.equal(computePainTrend([daysAgo(10), daysAgo(20), daysAgo(30), daysAgo(40), daysAgo(200), daysAgo(220)], now).trend, "growing");
  assert.equal(computePainTrend([daysAgo(10), daysAgo(20), daysAgo(200), daysAgo(220), daysAgo(240), daysAgo(260)], now).trend, "fading");
  assert.equal(computePainTrend([daysAgo(10), daysAgo(20), daysAgo(30), daysAgo(200), daysAgo(220), daysAgo(240)], now).trend, "steady");
});

test("ignores future and older-than-window dates", () => {
  const result = computePainTrend([new Date("2026-02-01T00:00:00.000Z"), daysAgo(400), daysAgo(20), daysAgo(200)], now);
  assert.equal(result.recentCount, 1);
  assert.equal(result.priorCount, 1);
});
