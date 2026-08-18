import { describe, expect, it } from "vitest";
import { findPolicyUrl, parseSecurityTxt, securityTxtLines } from "../src/securitytxt.js";
import type { CvdPolicyDocument } from "../src/types.js";

const raw = `# comment
Contact: mailto:security@example.com
Policy: https://example.com/security-policy
CVD-Policy: https://example.com/.well-known/cvd.json
CVD-Policy: https://example.com/second.json
Expires: 2027-06-30T23:59:59Z
`;

describe("parseSecurityTxt", () => {
  it("collects fields case-insensitively", () => {
    const fields = parseSecurityTxt(raw);
    expect(fields["contact"]).toEqual(["mailto:security@example.com"]);
    expect(fields["cvd-policy"]).toHaveLength(2);
  });

  it("ignores comments, blank lines and lines without a value", () => {
    expect(Object.keys(parseSecurityTxt("# only a comment\n\nBroken\n"))).toEqual([]);
  });
});

describe("findPolicyUrl", () => {
  it("prefers the first occurrence", () => {
    expect(findPolicyUrl(parseSecurityTxt(raw))).toBe("https://example.com/.well-known/cvd.json");
  });

  it("returns null when the field is absent", () => {
    expect(findPolicyUrl(parseSecurityTxt("Contact: mailto:a@example.com"))).toBeNull();
  });
});

describe("securityTxtLines", () => {
  const doc = {
    cvd_policy: "0.1",
    canonical: "https://example.com/.well-known/cvd.json",
    expires: "2027-06-30T23:59:59Z",
    organization: { name: "Example Ltd." },
    contact: {
      channels: [
        { type: "form", value: "https://example.com/report" },
        { type: "email", value: "security@example.com", preferred: true },
      ],
      languages: ["en", "de"],
      encryption: [{ type: "pgp", value: "https://example.com/pgp-key.txt" }],
    },
    research: { posture: "report_only" },
    scope: { precedence: "out_overrides_in" },
    report_requirements: { required_fields: [] },
  } as unknown as CvdPolicyDocument;

  it("uses the preferred channel and adds a mailto scheme", () => {
    expect(securityTxtLines(doc)[0]).toBe("Contact: mailto:security@example.com");
  });

  it("ends with the CVD-Policy line", () => {
    const lines = securityTxtLines(doc);
    expect(lines[lines.length - 1]).toBe(
      "CVD-Policy: https://example.com/.well-known/cvd.json",
    );
    expect(lines).toContain("Preferred-Languages: en, de");
    expect(lines).toContain("Encryption: https://example.com/pgp-key.txt");
  });
});
