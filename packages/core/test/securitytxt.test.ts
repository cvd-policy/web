import { describe, expect, it } from "vitest";
import {
  answersFromSecurityTxt,
  findPolicyUrl,
  humanPolicyUrl,
  isSignedSecurityTxt,
  mergeSecurityTxt,
  parseSecurityTxt,
  securityTxt,
  securityTxtCanonical,
  securityTxtLines,
} from "../src/securitytxt.js";
import { defaultAnswers } from "../src/generate.js";
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
    expect(
      Object.keys(parseSecurityTxt("# only a comment\n\nBroken\n")),
    ).toEqual([]);
  });
});

describe("findPolicyUrl", () => {
  it("prefers the first occurrence", () => {
    expect(findPolicyUrl(parseSecurityTxt(raw))).toBe(
      "https://example.com/.well-known/cvd.json",
    );
  });

  it("returns null when the field is absent", () => {
    expect(
      findPolicyUrl(parseSecurityTxt("Contact: mailto:a@example.com")),
    ).toBeNull();
  });
});

const doc = {
  cvd_policy: "0.1",
  canonical: "https://example.com/.well-known/cvd.json",
  expires: "2027-06-30T23:59:59Z",
  organization: { name: "Example Ltd." },
  contact: {
    channels: [
      { type: "form", value: "https://example.com/report" },
      { type: "email", value: "security@example.com", preferred: true },
      { type: "postal", value: "Example Ltd., 10115 Berlin" },
    ],
    languages: ["en", "de"],
    encryption: [{ type: "pgp", value: "https://example.com/pgp-key.txt" }],
  },
  research: { posture: "report_only" },
  scope: { precedence: "out_overrides_in" },
  report_requirements: { required_fields: [] },
} as unknown as CvdPolicyDocument;

describe("securityTxtLines", () => {
  it("uses the preferred channel and adds a mailto scheme", () => {
    expect(securityTxtLines(doc)[0]).toBe(
      "Contact: mailto:security@example.com",
    );
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

describe("securityTxtCanonical", () => {
  it("derives the well-known location from the canonical URL", () => {
    expect(securityTxtCanonical(doc)).toBe(
      "https://example.com/.well-known/security.txt",
    );
  });

  it("keeps host and port, and drops any other path", () => {
    const other = {
      ...doc,
      canonical: "https://example.com:8443/policy/cvd.json",
    };
    expect(securityTxtCanonical(other)).toBe(
      "https://example.com:8443/.well-known/security.txt",
    );
  });

  it("returns null when canonical is not a URL", () => {
    expect(securityTxtCanonical({ ...doc, canonical: "nonsense" })).toBeNull();
  });
});

describe("securityTxt", () => {
  it("writes a file the parser reads back", () => {
    const fields = parseSecurityTxt(securityTxt(doc));
    expect(fields["contact"]).toEqual([
      "mailto:security@example.com",
      "https://example.com/report",
    ]);
    expect(fields["expires"]).toEqual(["2027-06-30T23:59:59Z"]);
    expect(fields["canonical"]).toEqual([
      "https://example.com/.well-known/security.txt",
    ]);
    expect(findPolicyUrl(fields)).toBe(
      "https://example.com/.well-known/cvd.json",
    );
  });

  it("has the two fields RFC 9116 requires, and ends with a newline", () => {
    const file = securityTxt(doc);
    expect(file.startsWith("Contact: ")).toBe(true);
    expect(file).toMatch(/^Expires: .+$/m);
    expect(file.endsWith("\n")).toBe(true);
  });

  it("leaves out a postal address, which security.txt has no field for", () => {
    expect(securityTxt(doc)).not.toContain("Berlin");
  });

  it("writes no Policy field unless one is given", () => {
    // The page is a convention, not something a document states. Naming one
    // the publisher never uploaded would send reporters to a 404.
    // Anchored: the CVD-Policy line contains "Policy:" as a substring.
    expect(securityTxt(doc)).not.toMatch(/^Policy:/m);
    expect(
      securityTxt(doc, { policy: "https://example.com/security" }),
    ).toMatch(/^Policy: https:\/\/example\.com\/security$/m);
  });

  it("offers the conventional page URL for callers that publish one", () => {
    expect(securityTxt(doc, { policy: humanPolicyUrl(doc) })).toMatch(
      /^Policy: https:\/\/example\.com\/security\/cvd\.html$/m,
    );
    expect(humanPolicyUrl({ ...doc, canonical: "not a url" })).toBeUndefined();
  });

  it("takes an explicit canonical, and omits the field when told to", () => {
    expect(
      securityTxt(doc, { canonical: "https://cdn.example.net/security.txt" }),
    ).toContain("Canonical: https://cdn.example.net/security.txt");
    expect(securityTxt(doc, { canonical: null })).not.toContain("Canonical:");
  });
});

describe("mergeSecurityTxt", () => {
  const existing = [
    "# Our security contact",
    "Contact: mailto:security@example.com",
    "Expires: 2027-06-30T23:59:59Z",
    "Preferred-Languages: en",
    "",
  ].join("\n");

  /** What a caller publishing the readable page passes in. */
  const policy = "https://example.com/security/cvd.html";

  it("writes no Policy field unless one is given", () => {
    expect(mergeSecurityTxt(existing, doc).text).not.toMatch(/^Policy:/m);
  });

  it("adds the field after the last one, keeping comments and order", () => {
    const merged = mergeSecurityTxt(existing, doc, { policy });
    expect(merged.change).toBe("added");
    expect(merged.text).toBe(
      [
        "# Our security contact",
        "Contact: mailto:security@example.com",
        "Expires: 2027-06-30T23:59:59Z",
        "Preferred-Languages: en",
        "CVD-Policy: https://example.com/.well-known/cvd.json",
        "Policy: https://example.com/security/cvd.html",
        "",
      ].join("\n"),
    );
  });

  it("adds the human-readable policy URL it is given", () => {
    const merged = mergeSecurityTxt(existing, doc, { policy });

    expect(merged.text).toContain(
      "Policy: https://example.com/security/cvd.html",
    );
    expect(merged.text).toContain(
      "CVD-Policy: https://example.com/.well-known/cvd.json",
    );
  });

  it("replaces a stale value in place and reports the old one", () => {
    const stale = existing.replace(
      "Preferred-Languages: en",
      "CVD-Policy: https://old.example.com/cvd.json\nPreferred-Languages: en",
    );
    const merged = mergeSecurityTxt(stale, doc);
    expect(merged.change).toBe("replaced");
    expect(merged.previous).toBe("https://old.example.com/cvd.json");
    // Still the fourth line: the value changed, the position did not.
    expect(merged.text.split("\n")[3]).toBe(
      "CVD-Policy: https://example.com/.well-known/cvd.json",
    );
    expect(merged.text.split("\n")[4]).toBe("Preferred-Languages: en");
  });

  it("adds Policy when the file already names the machine-readable document", () => {
    const current = `${existing}CVD-Policy: https://example.com/.well-known/cvd.json\n`;
    const merged = mergeSecurityTxt(current, doc, { policy });
    expect(merged.change).toBe("added");
    expect(merged.text).toContain(
      "Policy: https://example.com/security/cvd.html",
    );
  });

  it("reduces a repeated field to one", () => {
    const twice = `${existing}CVD-Policy: https://a.example.com/cvd.json\nCVD-Policy: https://b.example.com/cvd.json\n`;
    const merged = mergeSecurityTxt(twice, doc);
    expect(merged.text.match(/^CVD-Policy:/gm)).toHaveLength(1);
    expect(merged.text).toContain(
      "CVD-Policy: https://example.com/.well-known/cvd.json",
    );
  });

  it("keeps CRLF line endings when the file uses them", () => {
    const merged = mergeSecurityTxt(existing.replace(/\n/g, "\r\n"), doc);
    expect(merged.text).toContain("\r\n");
    expect(merged.text).not.toMatch(/[^\r]\n/);
  });

  it("stays inside the signed block, and says the signature no longer holds", () => {
    const raw = [
      "-----BEGIN PGP SIGNED MESSAGE-----",
      "Hash: SHA256",
      "",
      "Contact: mailto:security@example.com",
      "Expires: 2027-06-30T23:59:59Z",
      "-----BEGIN PGP SIGNATURE-----",
      "",
      "wsBcBAEBCgAQBQJmAAAACRC0000000000",
      "-----END PGP SIGNATURE-----",
      "",
    ].join("\n");

    const merged = mergeSecurityTxt(raw, doc, { policy });
    expect(merged.signed).toBe(true);
    const lines = merged.text.split("\n");
    expect(
      lines.indexOf("CVD-Policy: https://example.com/.well-known/cvd.json"),
    ).toBe(5);
    expect(lines[6]).toBe(
      "Policy: https://example.com/security/cvd.html",
    );
    expect(lines[7]).toBe("-----BEGIN PGP SIGNATURE-----");
  });

  it("keeps additions before the signature when the signed body has no fields", () => {
    const signed = [
      "-----BEGIN PGP SIGNED MESSAGE-----",
      "Hash: SHA256",
      "",
      "-----BEGIN PGP SIGNATURE-----",
      "",
      "signature",
      "-----END PGP SIGNATURE-----",
      "",
    ].join("\n");

    const lines = mergeSecurityTxt(signed, doc, { policy }).text.split("\n");
    expect(
      lines.indexOf("Policy: https://example.com/security/cvd.html"),
    ).toBe(4);
    expect(lines[5]).toBe("-----BEGIN PGP SIGNATURE-----");
  });

  it("does not treat PGP signature armor headers as security.txt fields", () => {
    const signed = [
      "-----BEGIN PGP SIGNED MESSAGE-----",
      "Hash: SHA256",
      "",
      "Contact: mailto:security@example.com",
      "Expires: 2027-06-30T23:59:59Z",
      "-----BEGIN PGP SIGNATURE-----",
      "Version: GnuPG v2",
      "",
      "signature",
      "-----END PGP SIGNATURE-----",
      "",
    ].join("\n");

    const lines = mergeSecurityTxt(signed, doc, { policy }).text.split("\n");
    expect(
      lines.indexOf("Policy: https://example.com/security/cvd.html"),
    ).toBe(6);
    expect(lines[7]).toBe("-----BEGIN PGP SIGNATURE-----");
    expect(lines[8]).toBe("Version: GnuPG v2");
  });

  it("handles a file with nothing in it", () => {
    expect(mergeSecurityTxt("", doc, { policy }).text).toBe(
      "CVD-Policy: https://example.com/.well-known/cvd.json\n" +
        "Policy: https://example.com/security/cvd.html\n",
    );
  });

  it("handles a file of only comments", () => {
    const merged = mergeSecurityTxt("# nothing here yet\n", doc, { policy });
    expect(merged.change).toBe("added");
    expect(merged.text).toBe(
      "# nothing here yet\n" +
        "CVD-Policy: https://example.com/.well-known/cvd.json\n" +
        "Policy: https://example.com/security/cvd.html\n",
    );
  });
});

describe("answersFromSecurityTxt", () => {
  const raw = [
    "# ours",
    "Contact: mailto:security@example.com",
    "Contact: https://example.com/report",
    "Contact: tel:+49-30-000000",
    "Expires: 2027-06-30T23:59:59Z",
    "Encryption: https://example.com/pgp-key.txt",
    "Preferred-Languages: en, de",
    "Canonical: https://example.com/.well-known/security.txt",
    "",
  ].join("\n");

  it("carries the contacts over, the first one preferred", () => {
    const { answers } = answersFromSecurityTxt(raw);
    expect(answers.contact.channels).toEqual([
      { type: "email", value: "security@example.com", preferred: true },
      { type: "form", value: "https://example.com/report" },
    ]);
  });

  it("leaves out a contact no channel type can hold", () => {
    const { answers } = answersFromSecurityTxt(raw);
    expect(JSON.stringify(answers.contact.channels)).not.toContain("tel:");
  });

  it("carries expiry, languages and the key over", () => {
    const { answers, applied } = answersFromSecurityTxt(raw);
    expect(answers.expires).toBe("2027-06-30T23:59:59Z");
    expect(answers.contact.languages).toEqual(["en", "de"]);
    expect(answers.contact.pgpUrl).toBe("https://example.com/pgp-key.txt");
    expect(applied).toContain("preferred-languages");
  });

  it("puts the cvd.json on the host that serves the security.txt", () => {
    const { answers, applied } = answersFromSecurityTxt(raw);
    expect(answers.canonical).toBe("https://example.com/.well-known/cvd.json");
    expect(applied).toContain("canonical");
  });

  it("prefers an explicit CVD-Policy over the derived location", () => {
    const { answers, applied } = answersFromSecurityTxt(
      `${raw}CVD-Policy: https://example.com/policy/cvd.json\n`,
    );
    expect(answers.canonical).toBe("https://example.com/policy/cvd.json");
    expect(applied).toContain("cvd-policy");
  });

  it("seeds the first scope entry from the host", () => {
    expect(answersFromSecurityTxt(raw).answers.scope?.web).toEqual([
      { pattern: "example.com", state: "in" },
    ]);
  });

  it("keeps answers already given, and reports nothing applied for an empty file", () => {
    const base = {
      ...defaultAnswers(),
      organization: { name: "Example Ltd." },
    };
    const { answers, applied } = answersFromSecurityTxt("# nothing\n", base);
    expect(answers.organization.name).toBe("Example Ltd.");
    expect(applied).toEqual([]);
  });

  it("reports a signature at import, not only after the edit", () => {
    // Whoever drops the file in is the person who has to sign it again. Telling
    // them at the end, once the work is done, is telling them too late.
    const clearSigned = [
      "-----BEGIN PGP SIGNED MESSAGE-----",
      "Hash: SHA256",
      "",
      "Contact: mailto:security@example.com",
      "Expires: 2027-06-30T23:59:59Z",
      "-----BEGIN PGP SIGNATURE-----",
      "",
      "wsBcBAEBCgAQBQJmAAAA",
      "-----END PGP SIGNATURE-----",
      "",
    ].join("\n");

    expect(answersFromSecurityTxt(clearSigned).signed).toBe(true);
    expect(answersFromSecurityTxt(raw).signed).toBe(false);
    expect(isSignedSecurityTxt(clearSigned)).toBe(true);
    expect(isSignedSecurityTxt(raw)).toBe(false);
  });

  it("does not write through to the answers it was given", () => {
    const base = defaultAnswers();
    answersFromSecurityTxt(raw, base);
    expect(base.canonical).toBe("");
    expect(base.contact.channels).toEqual([
      { type: "email", value: "", preferred: true },
    ]);
  });
});
