import { test } from "node:test";
import assert from "node:assert/strict";

import {
  MAX_BODY_LENGTH,
  MIN_BODY_LENGTH,
  createTitleFromBody,
  normaliseBodyForKey,
  normaliseComplaintBody,
  parseComplaintsFromText,
} from "../lib/text-import";

test("parses blank-line-separated complaints and derives titles", () => {
  const rows = parseComplaintsFromText("First complaint takes too long to resolve.\n\nSecond complaint is hard to understand.");
  assert.equal(rows.length, 2);
  assert.equal(rows[0]?.body, "First complaint takes too long to resolve.");
  assert.equal(rows[0]?.title, "First complaint takes too long to resolve.");
  assert.equal(rows[1]?.title, "Second complaint is hard to understand.");
});

test("falls back to per-line parsing and strips list markers", () => {
  const rows = parseComplaintsFromText("1. Checkout fails every Friday\n- Support replies are too slow\n* ok");
  assert.deepEqual(rows.map((row) => row.body), [
    "Checkout fails every Friday",
    "Support replies are too slow",
  ]);
  assert.equal(MIN_BODY_LENGTH, 10);
});

test("dedupes case-insensitively after whitespace normalization", () => {
  const rows = parseComplaintsFromText("Slow   billing flow\nslow billing flow\nSLOW billing flow");
  assert.equal(rows.length, 1);
  assert.equal(normaliseBodyForKey(" Slow\t\tbilling\nflow "), "slow billing flow");
});

test("caps bodies and title length", () => {
  const longBody = "word ".repeat(1200);
  const rows = parseComplaintsFromText(longBody);
  assert.equal(rows[0]?.body.length, MAX_BODY_LENGTH);
  assert.equal(createTitleFromBody(longBody, 3), "word word word");
  assert.equal(normaliseComplaintBody("+ Too many duplicate setup steps"), "Too many duplicate setup steps");
});
