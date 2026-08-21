import { describe, expect, it } from "vitest";
import { validate, validateText } from "../src/validate.js";
import type { CvdPolicyDocument } from "../src/types.js";

const now = new Date("2026-08-18T00:00:00Z");

const base = (): CvdPolicyDocument => ({
  cvd_policy: "0.1",
  canonical: "https://example.com/.well-known/cvd.json",
  expires: "2027-06-30T23:59:59Z",
  organization: { name: "Example Ltd." },
  contact: { channels: [{ type: "email", value: "security@example.com" }] },
  research: { posture: "report_only" },
  scope: { precedence: "out_overrides_in", web: [{ pattern: "example.com", state: "in" }] },
  report_requirements: { required_fields: ["affected_asset"] },
});

const codes = (doc: unknown, options = {}) =>
  validate(doc, { now, ...options }).issues.map((issue) => issue.code);

describe("validate", () => {
  it("accepts a minimal document", () => {
    const result = validate(base(), { now });
    expect(result.valid).toBe(true);
    expect(result.version).toBe("0.1");
  });

  it("rejects anything that is not an object", () => {
    expect(codes("{}")).toContain("TYPE_INVALID");
    expect(codes([])).toContain("TYPE_INVALID");
    expect(codes(null)).toContain("TYPE_INVALID");
  });

  it("flags an elapsed expires as an error", () => {
    const doc = { ...base(), expires: "2026-01-01T00:00:00Z" };
    const result = validate(doc, { now });
    expect(result.valid).toBe(false);
    expect(result.issues.find((i) => i.code === "EXPIRES_PAST")?.path).toBe("/expires");
  });

  it("warns when expires is more than twelve months away", () => {
    expect(codes({ ...base(), expires: "2030-01-01T00:00:00Z" })).toContain("EXPIRES_FAR");
  });

  it("warns when canonical does not match the retrieval location", () => {
    expect(codes(base(), { retrievedFrom: "https://other.example/.well-known/cvd.json" })).toContain(
      "CANONICAL_MISMATCH",
    );
    expect(codes(base(), { retrievedFrom: "https://example.com/.well-known/cvd.json" })).not.toContain(
      "CANONICAL_MISMATCH",
    );
  });

  it("warns about an empty scope", () => {
    const doc = base();
    doc.scope = { precedence: "out_overrides_in" };
    expect(codes(doc)).toContain("SCOPE_EMPTY");
  });

  it("reports overlapping scope entries as information", () => {
    const doc = base();
    doc.scope.web = [
      { pattern: "*.example.com", state: "in" },
      { pattern: "shop.example.com", state: "out", reason: "third_party" },
    ];
    expect(codes(doc)).toContain("SCOPE_OVERLAP");
  });

  it("reports a product whose support has ended", () => {
    const doc = base();
    doc.scope.products = [{ name: "Legacy", supported_until: "2024-12-31" }];
    expect(codes(doc)).toContain("PRODUCT_SUPPORT_PAST");
  });

  it("rejects testing rules that contradict the posture", () => {
    const doc = base();
    doc.testing = { default: "prohibited", rules: [{ activity: "fuzzing", state: "allowed" }] };
    expect(codes(doc)).toContain("POSTURE_CONTRADICTION");
  });

  it("requires testing when the posture invites it", () => {
    const doc = { ...base(), research: { posture: "open" as const } };
    expect(codes(doc)).toContain("TESTING_REQUIRED");
  });

  it("warns about a rule whose targets are all out of scope", () => {
    const doc = base();
    doc.research = { posture: "limited" };
    doc.testing = {
      default: "prohibited",
      rules: [
        {
          activity: "manual_testing",
          state: "allowed",
          conditions: { targets: ["staging.example.com"] },
        },
      ],
    };
    expect(codes(doc)).toContain("TESTING_UNREACHABLE");
  });

  it("warns when an open posture has no encryption option", () => {
    const doc = base();
    doc.research = { posture: "open" };
    doc.testing = { default: "prohibited" };
    expect(codes(doc)).toContain("CONTACT_MISSING_ENCRYPTION");
  });

  it("sorts errors before warnings and information", () => {
    const doc = { ...base(), expires: "2026-01-01T00:00:00Z" };
    doc.scope = { precedence: "out_overrides_in" };
    const levels = validate(doc, { now }).issues.map((issue) => issue.level);
    expect(levels).toEqual([...levels].sort((a, b) => (a === "error" ? -1 : b === "error" ? 1 : 0)));
  });

  it("keeps unknown fields", () => {
    const doc = { ...base(), x_internal: "queue", signature: { alg: "unknown" } };
    expect(validate(doc, { now }).valid).toBe(true);
  });
});

describe("validateText", () => {
  it("reports unparsable input", () => {
    const result = validateText("{ not json", { now });
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.code).toBe("JSON_PARSE");
  });

  it("parses and validates", () => {
    expect(validateText(JSON.stringify(base()), { now }).valid).toBe(true);
  });
});

describe("claims about foreign hosts", () => {
  it("warns about a scope entry outside the document's own domain", () => {
    const doc = base();
    doc.scope.web = [{ pattern: "*.victim.example", state: "in" }];
    expect(codes(doc)).toContain("SCOPE_FOREIGN_HOST");
  });

  it("stays quiet for hosts under the one the document is published on", () => {
    const doc = base();
    doc.canonical = "https://example.com/.well-known/cvd.json";
    doc.scope.web = [
      { pattern: "example.com", state: "in" },
      { pattern: "*.example.com", state: "in" },
      { pattern: "staging.example.com", state: "in" },
    ];
    expect(codes(doc)).not.toContain("SCOPE_FOREIGN_HOST");
  });

  it("flags a sibling host the document does not cover", () => {
    const doc = base();
    doc.canonical = "https://saas.example.com/.well-known/cvd.json";
    doc.scope.web = [{ pattern: "staging.example.com", state: "in" }];
    expect(codes(doc)).toContain("SCOPE_FOREIGN_HOST");
  });

  it("does not complain about excluded foreign hosts", () => {
    const doc = base();
    doc.scope.web = [
      { pattern: "example.com", state: "in" },
      { pattern: "cdn.provider.example", state: "out", reason: "third_party" },
    ];
    expect(codes(doc)).not.toContain("SCOPE_FOREIGN_HOST");
  });

  it("warns about a rule target outside the own domain", () => {
    const doc = base();
    doc.research = { posture: "limited" };
    doc.scope.web = [{ pattern: "*.example.com", state: "in" }];
    doc.testing = {
      default: "prohibited",
      rules: [
        {
          activity: "manual_testing",
          state: "allowed",
          conditions: { targets: ["api.victim.example"] },
        },
      ],
    };
    expect(codes(doc)).toContain("TESTING_TARGET_FOREIGN");
  });

  it("ignores product targets that are not hosts", () => {
    const doc = base();
    doc.research = { posture: "limited" };
    doc.scope.products = [{ name: "SC-4000", purl: "pkg:generic/example/sc4000" }];
    doc.testing = {
      default: "prohibited",
      rules: [
        {
          activity: "fuzzing",
          state: "allowed",
          conditions: { targets: ["pkg:generic/example/sc4000"] },
        },
      ],
    };
    expect(codes(doc)).not.toContain("TESTING_TARGET_FOREIGN");
  });
});

describe("duplicate testing rules", () => {
  const withRules = (rules: CvdPolicyDocument["testing"]) => {
    const doc = base();
    doc.research = { posture: "limited" };
    doc.testing = rules;
    return doc;
  };

  it("warns about a second rule for the same activity", () => {
    const doc = withRules({
      default: "prohibited",
      rules: [
        {
          activity: "manual_testing",
          state: "allowed",
          conditions: { targets: ["example.com"] },
        },
        { activity: "manual_testing", state: "allowed" },
      ],
    });
    expect(codes(doc)).toContain("TESTING_RULE_DUPLICATE");
  });

  it("stays quiet when every activity appears once", () => {
    const doc = withRules({
      default: "prohibited",
      rules: [
        { activity: "manual_testing", state: "allowed" },
        { activity: "dos", state: "prohibited" },
      ],
    });
    expect(codes(doc)).not.toContain("TESTING_RULE_DUPLICATE");
  });

  it("reports the foreign target once, not twice for one mistake", () => {
    const doc = base();
    doc.research = { posture: "limited" };
    doc.scope.web = [{ pattern: "*.example.com", state: "in" }];
    doc.testing = {
      default: "prohibited",
      rules: [
        {
          activity: "manual_testing",
          state: "allowed",
          conditions: { targets: ["api.victim.example"] },
        },
      ],
    };
    const reported = codes(doc);
    expect(reported).toContain("TESTING_TARGET_FOREIGN");
    expect(reported).not.toContain("TESTING_UNREACHABLE");
  });

  it("still reports an unreachable rule that names only own hosts", () => {
    const doc = base();
    doc.research = { posture: "limited" };
    doc.scope.web = [{ pattern: "www.example.com", state: "in" }];
    doc.testing = {
      default: "prohibited",
      rules: [
        {
          activity: "manual_testing",
          state: "allowed",
          conditions: { targets: ["gone.example.com"] },
        },
      ],
    };
    expect(codes(doc)).toContain("TESTING_UNREACHABLE");
  });
});

describe("authoring mistakes worth catching", () => {
  it("rejects credentials in canonical", () => {
    const doc = { ...base(), canonical: "https://user:pw@example.com/.well-known/cvd.json" };
    const result = validate(doc, { now });
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("CANONICAL_HAS_CREDENTIALS");
  });

  it("flags a pattern that names no host", () => {
    const doc = base();
    doc.scope.web = [{ pattern: "*", state: "in" }];
    expect(codes(doc)).toContain("SCOPE_PATTERN_UNUSABLE");
  });

  it("flags private and loopback addresses in scope", () => {
    for (const pattern of ["192.168.0.1", "127.0.0.1", "10.1.2.3", "169.254.1.1"]) {
      const doc = base();
      doc.scope.web = [{ pattern, state: "in" }];
      expect(codes(doc), pattern).toContain("SCOPE_PRIVATE_ADDRESS");
    }
  });

  it("keeps the parameters when two checks report the same thing", () => {
    // The schema and the semantic rule both catch this, at the same path. The
    // schema knows nothing about the posture, so if its parameterless issue is
    // the one kept, the message renders as "the posture {posture}".
    const doc = base();
    doc.research.posture = "report_only";
    doc.testing = { default: "prohibited", rules: [{ activity: "manual_testing", state: "allowed" }] };

    const found = validate(doc).issues.filter((issue) => issue.code === "POSTURE_CONTRADICTION");
    expect(found).toHaveLength(1);
    expect(found[0]?.params?.["posture"]).toBe("report_only");
  });

  it("flags a subdomain document that speaks for the wider domain", () => {
    const doc = base();
    doc.canonical = "https://blog.example.com/.well-known/cvd.json";
    doc.scope.web = [{ pattern: "*.example.com", state: "in" }];
    expect(codes(doc)).toContain("SCOPE_FOREIGN_HOST");
  });

  it("does not flag a document published at the main domain", () => {
    const doc = base();
    doc.scope.web = [{ pattern: "*.example.com", state: "in" }];
    expect(codes(doc)).not.toContain("SCOPE_FOREIGN_HOST");
  });

  it("flags testing rules that the posture ignores", () => {
    const doc = base();
    doc.testing = { default: "allowed" };
    expect(codes(doc)).toContain("TESTING_IGNORED");
  });

  it("flags a default of allowed with nothing ruled out", () => {
    const doc = base();
    doc.research = { posture: "limited" };
    doc.testing = { default: "allowed" };
    expect(codes(doc)).toContain("TESTING_DEFAULT_BROAD");
  });

  it("stays quiet when a permissive default rules out the destructive activities", () => {
    const doc = base();
    doc.research = { posture: "limited" };
    doc.testing = {
      default: "allowed",
      rules: [
        { activity: "dos", state: "prohibited" },
        { activity: "social_engineering", state: "prohibited" },
      ],
    };
    expect(codes(doc)).not.toContain("TESTING_DEFAULT_BROAD");
  });

  it("flags an empty target list", () => {
    const doc = base();
    doc.research = { posture: "limited" };
    doc.testing = {
      default: "prohibited",
      rules: [{ activity: "manual_testing", state: "allowed", conditions: { targets: [] } }],
    };
    expect(codes(doc)).toContain("CONDITION_TARGETS_EMPTY");
  });

  it("names the limit that was broken", () => {
    const long = { ...base(), research: { posture: "report_only" as const, statement: "x".repeat(1001) } };
    expect(codes(long)).toContain("STRING_TOO_LONG");

    const doc = base();
    doc.research = { posture: "limited" };
    doc.testing = {
      default: "prohibited",
      rules: [
        { activity: "fuzzing", state: "allowed", conditions: { max_requests_per_second: 0 } },
      ],
    };
    expect(codes(doc)).toContain("NUMBER_TOO_SMALL");
  });
});
