import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { validateReport } from "../src/report.js";

const specDir =
  process.env["CVD_SPEC_DIR"] ??
  join(import.meta.dirname, "..", "..", "..", "..", "cvd-policy-spec");
const available = existsSync(join(specDir, "tests", "reports"));

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const jsonFiles = (dir: string) => readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

const minimal = () => ({
  report: "0.1" as const,
  title: "Stored XSS in the ticket view",
  target: "support.example.com",
  description: "The subject is rendered without escaping.",
});

describe("validateReport", () => {
  it("accepts the three required fields and nothing else", () => {
    expect(validateReport(minimal()).valid).toBe(true);
  });

  it("does not require reproduction or impact, but says they are missing", () => {
    const result = validateReport(minimal());
    expect(result.valid).toBe(true);
    const notes = result.issues.filter((issue) => issue.level === "info").map((i) => i.code);
    expect(notes).toContain("REPORT_NO_REPRODUCTION");
    expect(notes).toContain("REPORT_NO_IMPACT");
  });

  it("rejects a report without a title", () => {
    const { title, ...rest } = minimal();
    expect(validateReport(rest).valid).toBe(false);
  });

  it("accepts an anonymous report", () => {
    expect(validateReport({ ...minimal(), reporter: undefined }).valid).toBe(true);
  });

  it("demands evidence only when exploitation is claimed", () => {
    expect(validateReport({ ...minimal(), exploitation: { state: "unknown" } }).valid).toBe(true);
    expect(validateReport({ ...minimal(), exploitation: { state: "yes" } }).valid).toBe(false);
    expect(
      validateReport({
        ...minimal(),
        exploitation: { state: "yes", evidence: "Seen in public scan data." },
      }).valid,
    ).toBe(true);
  });

  it("refuses a boolean where the three-state value belongs", () => {
    expect(validateReport({ ...minimal(), exploitation: { state: true } }).valid).toBe(false);
  });

  it("warns when credit is wanted but no name is given", () => {
    const result = validateReport({
      ...minimal(),
      reporter: { consent: { public_credit: true } },
    });
    expect(result.valid).toBe(true);
    expect(result.issues.map((issue) => issue.code)).toContain("REPORT_CREDIT_WITHOUT_NAME");
  });

  it("warns when contact may be shared but none was given", () => {
    const result = validateReport({
      ...minimal(),
      reporter: { name: "A", consent: { share_contact_with_affected_party: true } },
    });
    expect(result.issues.map((issue) => issue.code)).toContain("REPORT_SHARE_WITHOUT_CONTACT");
  });

  it("keeps unknown fields", () => {
    expect(validateReport({ ...minimal(), x_queue: "psirt" }).valid).toBe(true);
  });

  it("rejects anything that is not an object", () => {
    expect(validateReport("nope").valid).toBe(false);
  });
});

describe.skipIf(!available)("report corpus", () => {
  const validDir = join(specDir, "tests", "reports", "valid");
  const invalidDir = join(specDir, "tests", "reports", "invalid");
  const expected = available ? read(join(specDir, "tests", "reports", "expected.json")) : {};

  for (const file of available ? jsonFiles(validDir) : []) {
    it(`${file} validates`, () => {
      expect(validateReport(read(join(validDir, file))).valid).toBe(true);
    });
  }

  for (const file of available ? jsonFiles(invalidDir) : []) {
    it(`${file} is rejected with ${expected[file]?.code}`, () => {
      const result = validateReport(read(join(invalidDir, file)));
      expect(result.valid).toBe(false);
      expect(result.issues.map((issue) => issue.code)).toContain(expected[file].code);
    });
  }
});
