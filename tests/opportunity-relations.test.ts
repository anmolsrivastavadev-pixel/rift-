import { test } from "node:test";
import assert from "node:assert/strict";

import { selectPrevNext, type NeighbourCandidate } from "../lib/opportunity-relations";

const ordered: NeighbourCandidate[] = [
  { id: "top", createdAt: new Date("2026-01-03") },
  { id: "mid", createdAt: new Date("2026-01-02") },
  { id: "low", createdAt: new Date("2026-01-01") },
];

test("walks neighbours by array position: next toward index 0, prev toward the end", () => {
  assert.deepEqual(selectPrevNext("mid", ordered), { prev: "low", next: "top" });
});

test("returns null at the ends of the list", () => {
  assert.deepEqual(selectPrevNext("top", ordered), { prev: "mid", next: null });
  assert.deepEqual(selectPrevNext("low", ordered), { prev: null, next: "mid" });
});

test("returns nulls when the id is not in the list", () => {
  assert.deepEqual(selectPrevNext("missing", ordered), { prev: null, next: null });
  assert.deepEqual(selectPrevNext("top", []), { prev: null, next: null });
});
