import { test } from "node:test";
import assert from "node:assert/strict";

import { buildReceiptHint, buildReceiptHref, buildReceiptLabel, isComplaintSourceKind, sanitiseReceiptUrl } from "../lib/complaint-sources";

test("sanitises receipt URLs", () => {
  assert.equal(sanitiseReceiptUrl("https://example.com/post"), "https://example.com/post");
  assert.equal(sanitiseReceiptUrl(" http://example.com/post "), "http://example.com/post");
  assert.equal(sanitiseReceiptUrl("javascript:alert(1)"), null);
  assert.equal(sanitiseReceiptUrl("not a url"), null);
  assert.equal(sanitiseReceiptUrl(`https://example.com/${"a".repeat(2050)}`), null);
});

test("builds labels, hints, and app-store review hrefs", () => {
  assert.equal(isComplaintSourceKind("github"), true);
  assert.equal(isComplaintSourceKind("unknown"), false);
  assert.equal(buildReceiptLabel("reddit", "https://reddit.com/r/test"), "View on Reddit");
  assert.equal(buildReceiptLabel("unknown", "https://example.com"), "View source");
  assert.equal(buildReceiptLabel("reddit", "ftp://example.com"), null);
  assert.equal(buildReceiptHref("appstore", "https://apps.apple.com/app/id123"), "https://apps.apple.com/app/id123?see-all=reviews");
  assert.equal(buildReceiptHref("appstore", "https://apps.apple.com/app/id123?foo=bar"), "https://apps.apple.com/app/id123?foo=bar&see-all=reviews");
  assert.equal(buildReceiptHint("appstore", "A very specific review title"), "Apple doesn't link to single reviews — look for the one titled “A very specific review title”. The quote above is that review, word for word.");
  assert.equal(buildReceiptHint("reddit", "A title"), null);
});
