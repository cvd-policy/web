import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { policyZip } from "../src/lib/policyZip.js";

const files = {
  cvdJson: '{"cvd_policy":"0.2"}',
  policyHtml: "<!doctype html><title>CVD Policy</title>",
  securityTxt: "Policy: https://example.com/security/cvd.html\n",
};

describe("policyZip", () => {
  it("keeps the discovered files in .well-known and the readable page out", () => {
    const archive = unzipSync(policyZip(files));

    expect(Object.keys(archive).sort()).toEqual([
      ".well-known/",
      ".well-known/cvd.json",
      ".well-known/security.txt",
      "security/",
      "security/cvd.html",
    ]);
  });

  it("carries each file through unchanged", () => {
    const archive = unzipSync(policyZip(files));

    expect(strFromU8(archive[".well-known/cvd.json"])).toBe(files.cvdJson);
    expect(strFromU8(archive[".well-known/security.txt"])).toBe(files.securityTxt);
    expect(strFromU8(archive["security/cvd.html"])).toBe(files.policyHtml);
  });
});
