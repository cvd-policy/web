import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { CSAF_EXTENSION_ID, CSAF_SPECIFICATION, assessCsafCapability, parsePolicyText } from "@cvd-policy/core/v1";
import type { CvdPolicyDocument } from "@cvd-policy/core/v1";
import { policyHtml } from "../src/lib/policyHtml.js";
import { humanPolicyFilename, policyFilename, policyZip } from "../src/lib/policyZip.js";

const files = {
  policyJson: '{"cvd_policy":1}',
  policyHtml: "<!doctype html><title>CVD Policy</title>",
  securityTxt: "CVD-Policy: https://example.com/policies/current.json\n",
  policyUri: "https://example.com/policies/current.json",
  securityTxtUri: "https://example.com/.well-known/security.txt",
  humanPolicyUri: "https://example.com/security/cvd-policy.html",
};

describe("policyZip", () => {
  it("uses the exact safe paths from the configured URIs", () => {
    const archive = unzipSync(policyZip(files)!);
    expect(Object.keys(archive).sort()).toEqual([
      ".well-known/security.txt",
      "policies/current.json",
      "security/cvd-policy.html",
    ]);
    expect(strFromU8(archive["policies/current.json"])).toBe(files.policyJson);
  });

  it("refuses archives spanning more than one origin", () => {
    expect(policyZip({ ...files, policyUri: "https://policies.example.net/current.json" })).toBeNull();
  });

  it("refuses paths that cannot be safely unpacked", () => {
    expect(policyZip({ ...files, policyUri: "https://example.com/%2e%2e/current.json" })).toBeNull();
    expect(policyZip({ ...files, policyUri: "https://example.com/a//current.json" })).toBeNull();
    expect(policyZip({ ...files, humanPolicyUri: "https://example.com/security/" })).toBeNull();
    expect(policyZip({ ...files, policyUri: "https://example.com/a%2Fb/policy.json" })).toBeNull();
  });

  it("derives safe filenames from explicit URI paths", () => {
    expect(policyFilename(files.policyUri)).toBe("current.json");
    expect(policyFilename("https://example.com/policy")).toBe("policy");
    expect(humanPolicyFilename("https://example.com/security/policy-page")).toBe("policy-page");
    expect(policyFilename("https://example.com/current%20policy.json")).toBe("current policy.json");
    expect(policyFilename("https://example.com/")).toBe("cvd-policy.json");
  });

  it("keeps the declaration in ZIP JSON and its limits in the human-readable policy", () => {
    const policy: CvdPolicyDocument = {
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
      extensions: {
        [CSAF_EXTENSION_ID]: {
          channels: [{ uri: "mailto:security@example.com", specification: CSAF_SPECIFICATION }],
        },
      },
    };
    const policyJson = JSON.stringify(policy);
    const now = new Date("2026-09-03T00:00:00Z");
    expect(parsePolicyText(policyJson, { now }).valid).toBe(true);
    const htmlContent = policyHtml(policy);
    const archive = policyZip({ ...files, policyJson, policyHtml: htmlContent });
    expect(archive).not.toBeNull();
    const unpacked = unzipSync(archive!);
    const unpackedJson = strFromU8(unpacked["policies/current.json"]!);
    const parsed = parsePolicyText(unpackedJson, { now });
    expect(parsed.valid).toBe(true);
    expect(parsed.policy?.extensions?.[CSAF_EXTENSION_ID]).toEqual(policy.extensions?.[CSAF_EXTENSION_ID]);
    expect(assessCsafCapability(parsed.policy).coreValid).toBe(true);
    const html = strFromU8(unpacked["security/cvd-policy.html"]!);
    expect(html).toContain("CSAF 2.1 CSD04 Profile 9");
    expect(html).toContain("does not define a submission endpoint");
  });
});
