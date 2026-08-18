import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { validate } from "../src/validate.js";

// The corpus lives in the specification repository, which is CC0 and versioned
// on its own. Clone it next to this one, or point CVD_SPEC_DIR at it.
const specDir =
  process.env["CVD_SPEC_DIR"] ??
  join(import.meta.dirname, "..", "..", "..", "..", "cvd-policy-spec");
const available = existsSync(join(specDir, "SPEC.md"));

const now = new Date("2026-08-18T00:00:00Z");
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const jsonFiles = (dir: string) => readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

if (!available) {
  console.warn(`Conformance corpus not found at ${specDir} — those tests are skipped.`);
}

describe.skipIf(!available)("examples", () => {
  const dir = join(specDir, "examples");
  for (const file of available ? jsonFiles(dir) : []) {
    it(`${file} validates`, () => {
      const result = validate(read(join(dir, file)), { now });
      expect(result.issues.filter((issue) => issue.level === "error")).toEqual([]);
      expect(result.valid).toBe(true);
    });
  }
});

describe.skipIf(!available)("tests/valid", () => {
  const dir = join(specDir, "tests", "valid");
  for (const file of available ? jsonFiles(dir) : []) {
    it(`${file} validates`, () => {
      const result = validate(read(join(dir, file)), { now });
      expect(result.issues.filter((issue) => issue.level === "error")).toEqual([]);
    });
  }
});

describe.skipIf(!available)("tests/invalid", () => {
  const dir = join(specDir, "tests", "invalid");
  const expected = available
    ? (read(join(specDir, "tests", "expected.json")) as Record<string, { code: string; schema: boolean }>)
    : {};

  for (const file of available ? jsonFiles(dir) : []) {
    it(`${file} is rejected with ${expected[file]?.code}`, () => {
      const result = validate(read(join(dir, file)), { now });
      expect(result.valid).toBe(false);
      expect(result.issues.map((issue) => issue.code)).toContain(expected[file]!.code);
    });
  }
});
