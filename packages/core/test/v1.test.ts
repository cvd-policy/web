import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  assessSecurityTxtAuthority,
  evaluatePolicy,
  generatePolicy,
  mergeSecurityTxt,
  parsePolicyText,
  policyRetrievalIssues,
  securityTxt,
  validatePolicy,
  type AuthorityEvidence,
  type CvdPolicyDocument,
  type EvaluationQuery,
} from "../src/v1/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "vendor", "spec-v1");
const tests = join(root, "tests", "v1");
const read = <T>(...parts: string[]): T => {
  const file = join(root, ...parts);
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch (error) {
    throw new Error(`Cannot parse ${file}`, { cause: error });
  }
};
const readText = (...parts: string[]): string => readFileSync(join(root, ...parts), "utf8");
const now = new Date("2026-08-29T10:00:00Z");
const minimalPolicy = (): CvdPolicyDocument =>
  read("tests", "v1", "policy", "valid", "minimal-report-only.json");

function setPointer(document: unknown, pointer: string, value: unknown): void {
  const parts = pointer
    .slice(1)
    .split("/")
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"));
  let target = document as Record<string, unknown> | unknown[];
  for (const part of parts.slice(0, -1)) {
    target = Array.isArray(target)
      ? (target[Number(part)] as Record<string, unknown> | unknown[])
      : (target[part] as Record<string, unknown> | unknown[]);
  }
  const last = parts.at(-1) ?? "";
  if (Array.isArray(target)) target[Number(last)] = value;
  else target[last] = value;
}

function apply(document: unknown, values: Record<string, unknown>): unknown {
  const copy = structuredClone(document);
  for (const [pointer, value] of Object.entries(values)) setPointer(copy, pointer, value);
  return copy;
}

describe("V1 vendored corpus", () => {
  it("records the exact specification commit", () => {
    expect(readText("SPEC_COMMIT")).toMatch(/^[0-9a-f]{40}\n$/);
  });

  it("accepts every valid policy", () => {
    for (const file of readdirSync(join(tests, "policy", "valid"))) {
      const result = parsePolicyText(readText("tests", "v1", "policy", "valid", file), { now });
      expect(result.issues, file).toEqual([]);
      expect(result.valid, file).toBe(true);
    }
  });

  it("rejects every invalid policy", () => {
    const expected = read<Record<string, { status: "invalid-policy" | "unsupported-policy" }>>(
      "tests", "v1", "expected.json",
    );
    for (const file of Object.keys(expected)) {
      const result = parsePolicyText(readText("tests", "v1", "policy", "invalid", file), { now });
      expect(result.valid, file).toBe(false);
    }
  });

  it("rejects invalid raw JSON and duplicate members", () => {
    const expected = read<Record<string, { status: "invalid-policy" }>>(
      "tests", "v1", "raw-expected.json",
    );
    for (const file of Object.keys(expected)) {
      const result = parsePolicyText(readText("tests", "v1", "policy", "raw-invalid", file), { now });
      expect(result.valid, file).toBe(false);
    }
  });

  it("matches every security.txt vector", () => {
    const cases = read<
      Array<{
        id: string;
        text: string;
        context: { requestedUri: string; finalUri: string; redirectChain: string[]; retrievedAt: string };
        expected: { established: boolean; discoveryHost?: string; cvdPolicyUri?: string };
      }>
    >("tests", "v1", "security-txt", "cases.json");
    for (const entry of cases) {
      const result = assessSecurityTxtAuthority(entry.text, {
        ...entry.context,
        retrievedAt: new Date(entry.context.retrievedAt),
      });
      expect(result.established, entry.id).toBe(entry.expected.established);
      if (result.established) {
        expect(result.evidence.discoveryHost, entry.id).toBe(entry.expected.discoveryHost);
        expect(result.evidence.cvdPolicyUri, entry.id).toBe(entry.expected.cvdPolicyUri);
      }
    }
  });

  it("keeps malformed and expired security.txt diagnostics distinct", () => {
    const context = {
      requestedUri: "https://example.com/.well-known/security.txt",
      finalUri: "https://example.com/.well-known/security.txt",
      redirectChain: [],
      retrievedAt: now,
    };
    const source = (expires: string) =>
      `Contact: mailto:security@example.com\nCVD-Policy: https://example.com/policy.json\nExpires: ${expires}\n`;

    const malformed = assessSecurityTxtAuthority(source("not-a-timestamp"), context);
    expect(malformed.established).toBe(false);
    if (!malformed.established) expect(malformed.issues[0]?.code).toBe("security_txt_expires_invalid");

    for (const value of [
      "2027-09-03",
      "09/03/2027",
      "2027-09-03T00:00:00",
      "2027-02-30T00:00:00Z",
    ]) {
      const nonRfc3339 = assessSecurityTxtAuthority(source(value), context);
      expect(nonRfc3339.established, value).toBe(false);
      if (!nonRfc3339.established) {
        expect(nonRfc3339.issues[0]?.code, value).toBe("security_txt_expires_invalid");
      }
    }

    const expired = assessSecurityTxtAuthority(source("2026-08-29T09:00:00Z"), context);
    expect(expired.established).toBe(false);
    if (!expired.established) expect(expired.issues[0]?.code).toBe("security_txt_expired");

    expect(assessSecurityTxtAuthority(source("2026-12-31T23:59:60Z"), context).established).toBe(false);
    expect(assessSecurityTxtAuthority(source("2016-12-31t23:59:60z"), {
      ...context,
      retrievedAt: new Date("2016-12-31T23:59:59Z"),
    }).established).toBe(true);
  });

  it("rejects URI text repaired by WHATWG URL parsing", () => {
    const context = {
      requestedUri: "https://example.com/.well-known/security.txt",
      finalUri: "https://example.com/.well-known/security.txt",
      redirectChain: [],
      retrievedAt: now,
    };
    for (const uri of ["https:example.com/policy.json", "https:/example.com/policy.json", "https://example.com/a b.json"]) {
      const result = assessSecurityTxtAuthority(
        `Contact: mailto:security@example.com\nExpires: 2027-02-28T08:00:00Z\nCVD-Policy: ${uri}\n`,
        context,
      );
      expect(result.established, uri).toBe(false);
    }
  });

  it("rejects an empty fragment in a security.txt CVD-Policy URI", () => {
    const result = assessSecurityTxtAuthority(
      "Contact: mailto:security@example.com\nCVD-Policy: https://example.com/policy.json#\nExpires: 2027-02-28T08:00:00Z\n",
      {
        requestedUri: "https://example.com/.well-known/security.txt",
        finalUri: "https://example.com/.well-known/security.txt",
        redirectChain: [],
        retrievedAt: now,
      },
    );
    expect(result.established).toBe(false);
    if (!result.established) expect(result.issues[0]?.code).toBe("security_txt_cvd_policy_uri_invalid");
  });

  it("requires discovery at the original Well-Known URI and a valid retrieval time", () => {
    const text = "Contact: mailto:security@example.com\nExpires: 2027-02-28T08:00:00Z\nCVD-Policy: https://example.com/policy.json\n";
    for (const requestedUri of [
      "https://example.com/security.txt",
      "https://example.com/.well-known/security.txt?source=test",
      "https://example.com/.well-known/security.txt?",
      "https://example.com/x/../.well-known/security.txt",
      "https://example.com/.WELL-KNOWN/SECURITY.TXT",
    ]) {
      expect(assessSecurityTxtAuthority(text, {
        requestedUri,
        finalUri: requestedUri,
        redirectChain: [],
        retrievedAt: now,
      }).established).toBe(false);
    }
    expect(assessSecurityTxtAuthority(text, {
      requestedUri: "https://example.com/.well-known/security.txt",
      finalUri: "https://example.com/.well-known/security.txt",
      redirectChain: [],
      retrievedAt: new Date(Number.NaN),
    }).established).toBe(false);
    expect(assessSecurityTxtAuthority(
      "Contact: mailto:security@example.com\nExpires: 2027-01-01T12:34:60Z\nCVD-Policy: https://example.com/policy.json\n",
      {
        requestedUri: "https://example.com/.well-known/security.txt",
        finalUri: "https://example.com/.well-known/security.txt",
        redirectChain: [],
        retrievedAt: now,
      },
    ).established).toBe(false);
  });

  it("accepts CRLF clear-signed discovery evidence", () => {
    const text = [
      "-----BEGIN PGP SIGNED MESSAGE-----",
      "Hash: SHA256",
      "",
      "Contact: mailto:security@example.com",
      "Expires: 2027-02-28T08:00:00Z",
      "CVD-Policy: https://example.com/policy.json",
      "-----BEGIN PGP SIGNATURE-----",
      "test",
      "-----END PGP SIGNATURE-----",
      "",
    ].join("\r\n");
    const result = assessSecurityTxtAuthority(text, {
      requestedUri: "https://example.com/.well-known/security.txt",
      finalUri: "https://example.com/.well-known/security.txt",
      redirectChain: [],
      retrievedAt: now,
    });

    expect(result.established).toBe(true);
    expect(result.signed).toBe(true);
  });

  it("accepts RFC 9116 contact URI schemes outside policy contact channels", () => {
    const result = assessSecurityTxtAuthority(
      "Contact: xmpp:security@example.com\nExpires: 2027-02-28T08:00:00Z\nCVD-Policy: https://example.com/policy.json\n",
      {
        requestedUri: "https://example.com/.well-known/security.txt",
        finalUri: "https://example.com/.well-known/security.txt",
        redirectChain: [],
        retrievedAt: now,
      },
    );
    expect(result.established).toBe(true);
  });

  it("rejects brackets outside an IP-literal authority", () => {
    const result = assessSecurityTxtAuthority(
      "Contact: mailto:security@example.com\nExpires: 2027-02-28T08:00:00Z\nCVD-Policy: https://example.com/a[b]\n",
      {
        requestedUri: "https://example.com/.well-known/security.txt",
        finalUri: "https://example.com/.well-known/security.txt",
        redirectChain: [],
        retrievedAt: now,
      },
    );
    expect(result.established).toBe(false);
  });

  it("matches every evaluation vector", () => {
    const cases = read<
      Array<{
        id: string;
        base: string;
        set: Record<string, unknown>;
        query: EvaluationQuery;
        authority: AuthorityEvidence | null;
        now: string;
        expected: { status?: string; inputValid?: false };
        options?: { allowApplicationJson?: boolean };
      }>
    >("tests", "v1", "evaluation", "cases.json");
    for (const entry of cases) {
      const policy = apply(read("tests", "v1", "policy", "valid", entry.base), entry.set);
      const result = evaluatePolicy(policy, entry.query, entry.authority, {
        now: new Date(entry.now),
        ...entry.options,
      });
      if (entry.expected.inputValid === false) {
        expect(result.inputValid, entry.id).toBe(false);
        if (!result.inputValid) expect(result.issues[0]?.code, entry.id).toBe("target_url_invalid");
        expect(result, entry.id).not.toHaveProperty("status");
      } else {
        expect(result.inputValid, entry.id).toBe(true);
        if (result.inputValid) {
          expect(result.status, entry.id).toBe(entry.expected.status);
          if (entry.id.startsWith("multiple-permits-one-satisfied")) {
            expect(result.matchedRuleIds, entry.id).toEqual(["a-permit", "z-permit"]);
            expect(result, entry.id).not.toHaveProperty("constraints");
          }
        }
      }
    }
  });

  it("dispatches missing and typed versions to the required statuses", () => {
    const query: EvaluationQuery = {
      activity: "manual_testing",
      target: "https://example.com/",
      policyRetrieval: {
        requestedUri: "https://example.com/cvd-policy.json",
        finalUri: "https://example.com/cvd-policy.json",
        redirectChain: [],
        statusCode: 200,
        mediaType: "application/cvd-policy+json",
      },
    };
    const authority: AuthorityEvidence = {
      established: true,
      discoveryHost: "example.com",
      securityTxtUri: "https://example.com/.well-known/security.txt",
      cvdPolicyUri: "https://example.com/cvd-policy.json",
      securityTxtExpires: "2027-02-28T08:00:00Z",
    };
    for (const [policy, status] of [
      [{}, "invalid-policy"],
      [{ cvd_policy: "1" }, "invalid-policy"],
      [{ cvd_policy: 2 }, "unsupported-policy"],
    ] as const) {
      const result = evaluatePolicy(policy, query, authority, { now });
      expect(result.inputValid).toBe(true);
      if (result.inputValid) expect(result.status).toBe(status);
    }
  });

  it("validates target input before policy evaluation", () => {
    const result = evaluatePolicy(
      { cvd_policy: "invalid" },
      { activity: "automated_scanning", target: "pkg:npm/example" },
      null,
      { now },
    );
    expect(result).toEqual({
      inputValid: false,
      issues: [{ level: "error", code: "target_url_invalid", path: "/target", message: "target_url_invalid" }],
    });
  });

  it("validates without a neighboring specification checkout", () => {
    const policy = read("tests", "v1", "policy", "valid", "minimal-report-only.json");
    expect(validatePolicy(policy, { now }).valid).toBe(true);
  });
});

describe("V1 publishing", () => {
  it("generates a validated document without publication metadata", () => {
    const { cvd_policy: _version, ...input } = minimalPolicy();
    const policy = generatePolicy(input, { now });

    expect(policy.cvd_policy).toBe(1);
    expect(policy).not.toHaveProperty("canonical");
    expect(parsePolicyText(JSON.stringify(policy), { now }).valid).toBe(true);
  });

  it("generates security.txt with exactly one explicit policy URI", () => {
    const text = securityTxt(minimalPolicy(), {
      policyUri: "https://policies.example.com/acme/current",
      securityTxtUri: "https://example.com/.well-known/security.txt",
      humanPolicyUris: ["https://example.com/security"],
    });

    expect(text).toContain("Contact: mailto:security@example.com\n");
    expect(text).toContain("Canonical: https://example.com/.well-known/security.txt\n");
    expect(text).toContain("Policy: https://example.com/security\n");
    expect(text.match(/^CVD-Policy:/gm)).toHaveLength(1);
    expect(text).toContain("CVD-Policy: https://policies.example.com/acme/current\n");
  });

  it("rejects malformed percent encoding in generated URI fields", () => {
    expect(() => securityTxt(minimalPolicy(), { policyUri: "https://example.com/%ZZ" })).toThrow();
    expect(() =>
      securityTxt(minimalPolicy(), {
        policyUri: "https://example.com/policy.json",
        securityTxtUri: "https://example.com/%",
      }),
    ).toThrow();
    expect(() =>
      securityTxt(minimalPolicy(), {
        policyUri: "https://example.com/policy.json",
        humanPolicyUris: ["https://example.com/%GG"],
      }),
    ).toThrow();
    expect(() => securityTxt(minimalPolicy(), { policyUri: "https://example.com/<policy>" })).toThrow();
  });

  it("merges only CVD-Policy and refuses signed files", () => {
    const source = [
      "# keep this",
      "Contact: mailto:security@example.com",
      "Policy: https://example.com/one",
      "CVD-Policy: https://example.com/old-one.json",
      "Policy: https://example.com/two",
      "CVD-Policy: https://example.com/old-two.json",
      "",
    ].join("\r\n");
    const merged = mergeSecurityTxt(source, "https://policies.example.com/current");

    expect(merged).toContain("# keep this\r\n");
    expect(merged.match(/^Policy:/gm)).toHaveLength(2);
    expect(merged.match(/^CVD-Policy:/gm)).toHaveLength(1);
    expect(merged).toContain("CVD-Policy: https://policies.example.com/current");
    expect(() =>
      mergeSecurityTxt(
        "-----BEGIN PGP SIGNED MESSAGE-----\n\nContact: mailto:security@example.com\n",
        "https://example.com/policy.json",
      ),
    ).toThrow(/re-sign/);
  });

  it("accepts application/json only in compatibility mode", () => {
    const authority: AuthorityEvidence = {
      established: true,
      discoveryHost: "example.com",
      securityTxtUri: "https://example.com/.well-known/security.txt",
      cvdPolicyUri: "https://example.com/policy.json",
      securityTxtExpires: "2027-02-28T08:00:00Z",
    };
    const retrieval = {
      requestedUri: authority.cvdPolicyUri,
      finalUri: authority.cvdPolicyUri,
      redirectChain: [],
      statusCode: 200,
      mediaType: "application/json; charset=utf-8",
    };

    expect(policyRetrievalIssues(retrieval, authority)).toHaveLength(1);
    expect(policyRetrievalIssues(retrieval, authority, true)).toEqual([]);
  });

  it("requires the exact announced policy URI before redirects", () => {
    const authority: AuthorityEvidence = {
      established: true,
      discoveryHost: "example.com",
      securityTxtUri: "https://example.com/.well-known/security.txt",
      cvdPolicyUri: "https://example.com/policy.json",
      securityTxtExpires: "2027-02-28T08:00:00Z",
    };
    const retrieval = {
      requestedUri: "https:example.com/policy.json",
      finalUri: "https://example.com/policy.json",
      redirectChain: [],
      statusCode: 200,
      mediaType: "application/cvd-policy+json",
    };
    expect(policyRetrievalIssues(retrieval, authority)).toHaveLength(1);

    const announced = "https://EXAMPLE.com:443/a/../policy.json";
    const assessed = assessSecurityTxtAuthority(
      `Contact: mailto:security@example.com\nExpires: 2027-02-28T08:00:00Z\nCVD-Policy: ${announced}\n`,
      {
        requestedUri: "https://example.com/.well-known/security.txt",
        finalUri: "https://example.com/.well-known/security.txt",
        redirectChain: [],
        retrievedAt: now,
      },
    );
    expect(assessed.established).toBe(true);
    if (assessed.established) expect(assessed.evidence.cvdPolicyUri).toBe(announced);
  });
});
