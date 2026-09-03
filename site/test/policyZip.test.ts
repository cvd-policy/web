import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
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
});
