import { test } from "node:test";
import assert from "node:assert/strict";

import { cleanComplaints } from "../lib/cleaning";

test("normalizes whitespace and drops duplicates", () => {
  const cleaned = cleanComplaints([
    { id: "a", body: "  Billing   failed\r\nagain  " },
    { id: "b", body: "billing failed\nagain" },
    { id: "c", body: "Search is broken" },
  ]);

  assert.deepEqual(cleaned, [
    { id: "a", text: "Billing failed\nagain" },
    { id: "c", text: "Search is broken" },
  ]);
});

test("drops very short complaints and caps long text", () => {
  const cleaned = cleanComplaints([
    { id: "x", body: "ok" },
    { id: "long", body: "a".repeat(2100) },
  ]);

  assert.equal(cleaned.length, 1);
  assert.equal(cleaned[0]?.id, "long");
  assert.equal(cleaned[0]?.text.length, 2000);
});
