import { describe, expect, it } from "vitest";
import type { CvdPolicyDocument } from "@cvd-policy/core/v1";
import { policyHtml } from "../src/lib/policyHtml.js";

const doc: CvdPolicyDocument = {
  cvd_policy: 1,
  last_updated: "2026-09-03T00:00:00Z",
  expires: "2027-09-03T00:00:00Z",
  organization: { name: "Example Ltd." },
  contact: { channels: ["mailto:security@example.com"] },
  research: { posture: "report_only" },
  reporting_scope: {},
  reporting: { requested_fields: ["affected_asset"], proof_of_exploitation: "not_requested" },
};

describe("policyHtml", () => {
  it("is standalone and identifies V1 draft status", () => {
    const html = policyHtml(doc);
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).not.toMatch(/<script/i);
    expect(html).toContain("draft-behring-cvd-policy-00");
    expect(html).toContain("CVD Policy Format 1");
    expect(html).toContain("does not prove ownership or control");
    expect(html).toContain("do not provide legal authorization");
    expect(html).toContain("Response targets are not guarantees");
  });

  it("escapes publisher data", () => {
    const html = policyHtml({ ...doc, organization: { name: '</title><script>alert(1)</script>' } });
    expect(html).not.toContain("<script>alert(1)");
    expect(html).toContain("&lt;script&gt;");
  });
});
