import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  assessSecurityTxtAuthority,
  evaluatePolicy,
  parsePolicyText,
  validatePolicy,
  type AuthorityEvidence,
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

    const expired = assessSecurityTxtAuthority(source("2026-08-29T09:00:00Z"), context);
    expect(expired.established).toBe(false);
    if (!expired.established) expect(expired.issues[0]?.code).toBe("security_txt_expired");
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
