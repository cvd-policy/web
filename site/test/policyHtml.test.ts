import { describe, expect, it } from "vitest";
import type { CvdPolicyDocument } from "@cvd-policy/core/v1";
import { CSAF_EXTENSION_ID, CSAF_SPECIFICATION, parsePolicyText } from "@cvd-policy/core/v1";
import { policyHtml } from "../src/lib/policyHtml.js";

const now = new Date("2026-09-03T00:00:00Z");
const doc: CvdPolicyDocument = {
  cvd_policy: 1,
  last_updated: "2026-09-03T00:00:00Z",
  expires: "2027-09-03T00:00:00Z",
  organization: { name: "Example Ltd." },
  contact: { channels: ["mailto:security@example.com"] },
  research: { posture: "report_only" },
  reporting_scope: {
    web: [{ id: "main-web", state: "in", host: "example.com", schemes: ["https"], path_prefix: "/", include_subdomains: false }],
  },
  reporting: { requested_fields: ["affected_asset"], proof_of_exploitation: "not_requested" },
};

function expectCoreValid(policy: CvdPolicyDocument): void {
  expect(parsePolicyText(JSON.stringify(policy), { now }).valid).toBe(true);
}

describe("policyHtml", () => {
  it("is standalone and identifies V1 draft status", () => {
    expectCoreValid(doc);
    const html = policyHtml(doc);
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).not.toMatch(/<script/i);
    expect(html).toContain("unpublished manuscript revision -01");
    expect(html).toContain("CVD Policy Format 1");
    expect(html).toContain("does not prove ownership or control");
    expect(html).toContain("do not provide legal authorization");
    expect(html).toContain("Response targets are not guarantees");
  });

  it("escapes publisher data", () => {
    const policy = { ...doc, organization: { name: '</title><script>alert(1)</script>' } };
    expectCoreValid(policy);
    const html = policyHtml(policy);
    expect(html).not.toContain("<script>alert(1)");
    expect(html).toContain("&lt;script&gt;");
  });

  it("describes the declared Profile 9 without turning policy fields into a report", () => {
    const policy = {
      ...doc,
      extensions: {
        [CSAF_EXTENSION_ID]: {
          channels: [{ uri: "mailto:security@example.com", specification: CSAF_SPECIFICATION }],
        },
      },
    };
    expectCoreValid(policy);
    const html = policyHtml(policy);

    expect(html).toContain("CSAF 2.1 CSD04 Profile 9");
    expect(html).toContain("mailto:security@example.com");
    expect(html).toContain(CSAF_SPECIFICATION);
    expect(html).toContain("does not define a submission endpoint");
    expect(html).toContain("not automatically");
    expect(html).toContain("not Report timestamps");
    expect(html).not.toContain("known_affected");
    expect(html).not.toContain("<dt>document.publisher</dt>");
    expect(html).not.toContain("tracking.initial_release_date");
  });

  it("labels unknown specifications unsupported and does not render them as accepted channels", () => {
    const policy = {
      ...doc,
      extensions: {
        [CSAF_EXTENSION_ID]: {
          channels: [{ uri: "mailto:security@example.com", specification: "https://example.net/other-profile" }],
        },
      },
    };
    expectCoreValid(policy);
    const html = policyHtml(policy);

    expect(html).toContain("unsupported");
    expect(html).not.toContain("Declared CSAF report channel: mailto:security@example.com");
    expect(html).toContain("https://example.net/other-profile");
  });

  it("distinguishes absent and invalid declarations", () => {
    expectCoreValid(doc);
    expect(policyHtml(doc)).toContain("CSAF capability: not advertised");
    const invalidPolicy = {
      ...doc,
      extensions: { [CSAF_EXTENSION_ID]: { channels: [] } },
    };
    expectCoreValid(invalidPolicy);
    const invalid = policyHtml(invalidPolicy);
    expect(invalid).toContain("CSAF capability: invalid");
    expect(invalid).not.toContain("Declared contact channel:");
  });

  it("shows no CSAF state when core policy validation fails", () => {
    const invalidPolicy = { ...doc, reporting_scope: {} };
    expect(parsePolicyText(JSON.stringify(invalidPolicy), { now }).valid).toBe(false);
    const html = policyHtml(invalidPolicy);
    expect(html).toContain("Core policy validation failed; no CSAF capability state is assessed.");
    expect(html).not.toContain("CSAF capability: not advertised");
  });
});
