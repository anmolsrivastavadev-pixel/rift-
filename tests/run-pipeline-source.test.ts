import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../actions/opportunities.ts", import.meta.url), "utf8");

// Regression guard for the production 500 on "Find ideas" (July 2026):
// setJobProgress is a hoisted function that reads the closure `let`s below —
// calling it before their declarators run throws a TDZ ReferenceError that
// escapes runPipeline's try/catch and crashes the whole server action.
test("runPipeline declares its closure state before the first setJobProgress call", () => {
  const firstCall = source.indexOf("await setJobProgress(");
  assert.ok(firstCall !== -1, "expected runPipeline to call setJobProgress");
  for (const decl of [
    "let runId",
    "let allCount",
    "let lastWrittenStage",
    "let lastWrittenBucket",
  ]) {
    const declAt = source.indexOf(decl);
    assert.ok(declAt !== -1, `expected declaration: ${decl}`);
    assert.ok(
      declAt < firstCall,
      `${decl} must be declared before the first setJobProgress call (TDZ crash otherwise)`
    );
  }
});
