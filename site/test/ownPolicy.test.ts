import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { CvdPolicyDocument } from "@cvd-policy/core/v1";
import { validatePolicy } from "@cvd-policy/core/v1";
import { describe, expect, it } from "vitest";
import { policyHtml } from "../src/lib/policyHtml.js";

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
const doc = JSON.parse(read("../public/cvd-policy.json")) as CvdPolicyDocument;
const securityTxt = read("../public/.well-known/security.txt");

describe("the policy this site publishes about itself", () => {
  it("publishes a valid V1 document at the site's explicit URI", () => {
    expect(validatePolicy(doc).valid).toBe(true);
    expect(doc.cvd_policy).toBe(1);
    expect(securityTxt.match(/^CVD-Policy:/gm)).toHaveLength(1);
    expect(securityTxt).toContain("CVD-Policy: https://cvd-policy.eu/cvd-policy.json");
    expect(securityTxt).toContain(`Expires: ${doc.expires}`);
  });

  it("has a readable page built from this document", async () => {
    await expect(policyHtml(doc)).toMatchFileSnapshot(fileURLToPath(new URL("../public/security/cvd.html", import.meta.url)));
  });
});
