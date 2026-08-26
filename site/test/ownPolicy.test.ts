import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { CvdPolicyDocument } from "@cvd-policy/core";
import { validate } from "@cvd-policy/core";
import { describe, expect, it } from "vitest";
import { policyHtml } from "../src/lib/policyHtml.js";

/**
 * The policy this site publishes about itself.
 *
 * It is a static file, so it can go stale without anyone noticing — it sat at
 * format 0.1 for a while after the generator had moved to 0.2. These tests are
 * the guard: the document has to be valid, and the readable page beside it has
 * to be the one this document produces.
 */
const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");

const doc = JSON.parse(read("../public/.well-known/cvd.json")) as CvdPolicyDocument;
const securityTxt = read("../public/.well-known/security.txt");

describe("the policy this site publishes about itself", () => {
  it("is valid", () => {
    const result = validate(doc);
    expect(result.issues.filter((issue) => issue.level === "error")).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("is written for the current format version", () => {
    expect(doc.cvd_policy).toBe("0.2");
  });

  it("has a security.txt agreeing with it", () => {
    expect(securityTxt).toContain(`CVD-Policy: ${doc.canonical}`);
    expect(securityTxt).toContain(`Expires: ${doc.expires}`);
  });

  it("names a readable page it actually serves", () => {
    // Where the field points is where the repository keeps the file, or the
    // field is a promise the site does not keep. That the file exists at all is
    // the next test's business, which writes it.
    expect(securityTxt).toMatch(/^Policy: https:\/\/cvd-policy\.eu\/security\/cvd\.html$/m);
  });

  it("has a readable page built from this very document", async () => {
    await expect(policyHtml(doc)).toMatchFileSnapshot(
      fileURLToPath(new URL("../public/security/cvd.html", import.meta.url)),
    );
  });
});
