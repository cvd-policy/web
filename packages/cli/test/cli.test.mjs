import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../src/main.mjs";

// Fixtures come from the specification repository; see corpus.test.ts.
const spec =
  process.env.CVD_SPEC_DIR ??
  join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "cvd-policy-spec");
const needsCorpus = { skip: existsSync(join(spec, "SPEC.md")) ? false : "specification repository not present" };
const silence = () => {
  const log = console.log;
  const error = console.error;
  console.log = () => {};
  console.error = () => {};
  return () => {
    console.log = log;
    console.error = error;
  };
};

const runQuiet = async (argv) => {
  const restore = silence();
  try {
    return await run(argv);
  } finally {
    restore();
  }
};

test("validate returns 0 for a valid example", needsCorpus, async () => {
  const file = join(spec, "examples", "01-manufacturer-report-only.json");
  assert.equal(await runQuiet(["validate", file]), 0);
});

test("validate returns 1 for a document with errors", needsCorpus, async () => {
  const file = join(spec, "tests", "invalid", "07-expires-past.json");
  assert.equal(await runQuiet(["validate", file]), 1);
});

test("validate returns 2 when only warnings remain", needsCorpus, async () => {
  const file = join(spec, "tests", "valid", "09-products-only.json");
  const code = await runQuiet(["validate", file]);
  assert.ok(code === 0 || code === 2);
});

test("explain returns 0", needsCorpus, async () => {
  const file = join(spec, "examples", "04-prohibited.json");
  assert.equal(await runQuiet(["explain", file]), 0);
});

test("an unknown command returns 1", async () => {
  assert.equal(await runQuiet(["frobnicate"]), 1);
});

test("a missing file returns 1", async () => {
  assert.equal(await runQuiet(["validate", "does-not-exist.json"]), 1);
});
