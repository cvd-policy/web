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
const read = <T>(...parts: string[]): T => JSON.parse(readFileSync(join(root, ...parts), "utf8")) as T;
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

  it("rejects every invalid policy with the declared code", () => {
    const expected = read<Record<string, { code: string }>>("tests", "v1", "expected.json");
    for (const [file, outcome] of Object.entries(expected)) {
      const result = parsePolicyText(readText("tests", "v1", "policy", "invalid", file), { now });
      expect(result.valid, file).toBe(false);
      expect(result.issues.map((entry) => entry.code), file).toContain(outcome.code);
    }
  });

  it("rejects invalid raw JSON and duplicate members", () => {
    const expected = read<Record<string, { code: string }>>("tests", "v1", "raw-expected.json");
    for (const [file, outcome] of Object.entries(expected)) {
      const result = parsePolicyText(readText("tests", "v1", "policy", "raw-invalid", file), { now });
      expect(result.valid, file).toBe(false);
      expect(result.issues[0]?.code, file).toBe(outcome.code);
    }
  });

  it("matches every security.txt vector", () => {
    const cases = read<
      Array<{
        id: string;
        text: string;
        context: { requestedUri: string; finalUri: string; redirectChain: string[]; retrievedAt: string };
        expected: { established: boolean; code?: string; discoveryHost?: string; cvdPolicyUri?: string };
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
      } else {
        expect(result.issues[0]?.code, entry.id).toBe(entry.expected.code);
      }
    }
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
        expected: { status: string; reasonCode: string };
      }>
    >("tests", "v1", "evaluation", "cases.json");
    for (const entry of cases) {
      const policy = apply(read("tests", "v1", "policy", "valid", entry.base), entry.set);
      const result = evaluatePolicy(policy, entry.query, entry.authority, { now: new Date(entry.now) });
      expect(result.status, entry.id).toBe(entry.expected.status);
      expect(result.reasonCode, entry.id).toBe(entry.expected.reasonCode);
    }
  });

  it("validates without a neighboring specification checkout", () => {
    const policy = read("tests", "v1", "policy", "valid", "minimal-report-only.json");
    expect(validatePolicy(policy, { now }).valid).toBe(true);
  });
});
