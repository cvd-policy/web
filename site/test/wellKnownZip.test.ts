import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { wellKnownZip } from "../src/lib/wellKnownZip.js";

const files = {
  cvdJson: '{"cvd_policy":"0.2"}',
  policyHtml: "<!doctype html><title>CVD Policy</title>",
  securityTxt: "Policy: https://example.com/.well-known/cvd-policy.html\n",
};

describe("wellKnownZip", () => {
  it("puts all generated files in .well-known", () => {
    const archive = unzipSync(wellKnownZip(files));

    expect(Object.keys(archive).sort()).toEqual([
      ".well-known/",
      ".well-known/cvd-policy.html",
      ".well-known/cvd.json",
      ".well-known/security.txt",
    ]);
    expect(strFromU8(archive[".well-known/cvd.json"])).toBe(files.cvdJson);
    expect(strFromU8(archive[".well-known/cvd-policy.html"])).toBe(
      files.policyHtml,
    );
    expect(strFromU8(archive[".well-known/security.txt"])).toBe(
      files.securityTxt,
    );
  });
});
