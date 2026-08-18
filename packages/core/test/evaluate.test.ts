import { describe, expect, it } from "vitest";
import { evaluate } from "../src/evaluate.js";
import { isAtOrUnder, matchesPattern, scopeStateFor } from "../src/scope.js";
import type { CvdPolicyDocument } from "../src/types.js";

const now = new Date("2026-08-18T00:00:00Z");

const doc = (): CvdPolicyDocument => ({
  cvd_policy: "0.1",
  canonical: "https://example.com/.well-known/cvd.json",
  expires: "2027-06-30T23:59:59Z",
  organization: { name: "Example Ltd." },
  contact: { channels: [{ type: "email", value: "security@example.com" }] },
  research: { posture: "limited" },
  scope: {
    precedence: "out_overrides_in",
    web: [
      { pattern: "*.example.com", state: "in" },
      { pattern: "shop.example.com", state: "out", reason: "third_party" },
    ],
  },
  testing: {
    default: "prohibited",
    rules: [
      {
        activity: "automated_scanning",
        state: "allowed",
        conditions: { max_requests_per_second: 5 },
      },
      { activity: "dos", state: "prohibited" },
    ],
  },
  report_requirements: { required_fields: ["affected_asset"] },
});

describe("matchesPattern", () => {
  it("matches exact hosts", () => {
    expect(matchesPattern("example.com", "example.com")).toBe(true);
    expect(matchesPattern("example.com", "www.example.com")).toBe(false);
  });

  it("matches wildcards including the bare domain", () => {
    expect(matchesPattern("*.example.com", "api.example.com")).toBe(true);
    expect(matchesPattern("*.example.com", "deep.api.example.com")).toBe(true);
    expect(matchesPattern("*.example.com", "example.com")).toBe(true);
    expect(matchesPattern("*.example.com", "counterexample.com")).toBe(false);
  });

  it("compares a path as a prefix", () => {
    expect(matchesPattern("example.com/api", "https://example.com/api/v1")).toBe(true);
    expect(matchesPattern("example.com/api", "https://example.com/admin")).toBe(false);
  });
});

describe("scopeStateFor", () => {
  it("treats an unmatched target as out of scope", () => {
    expect(scopeStateFor(doc().scope, "other.example")).toBe("out");
  });

  it("lets out override in", () => {
    expect(scopeStateFor(doc().scope, "shop.example.com")).toBe("out");
    expect(scopeStateFor(doc().scope, "api.example.com")).toBe("in");
  });

  it("honours explicit order", () => {
    const scope = {
      precedence: "explicit_order" as const,
      web: [
        { pattern: "*.example.com", state: "out" as const },
        { pattern: "lab.example.com", state: "in" as const },
      ],
    };
    expect(scopeStateFor(scope, "lab.example.com")).toBe("in");
    expect(scopeStateFor(scope, "www.example.com")).toBe("out");
  });

  it("matches products by name and purl", () => {
    const scope = {
      precedence: "out_overrides_in" as const,
      products: [{ name: "SC-4000", purl: "pkg:generic/example/sc4000" }],
    };
    expect(scopeStateFor(scope, "pkg:generic/example/sc4000")).toBe("in");
    expect(scopeStateFor(scope, "SC-4000")).toBe("in");
  });
});

describe("evaluate", () => {
  it("allows a rule that matches, and reports its conditions", () => {
    const result = evaluate(doc(), "automated_scanning", "api.example.com", { now });
    expect(result.allowed).toBe(true);
    expect(result.conditions?.max_requests_per_second).toBe(5);
  });

  it("prohibits an activity a rule rules out", () => {
    expect(evaluate(doc(), "dos", "api.example.com", { now })).toMatchObject({
      allowed: false,
      reason: "RULE_PROHIBITED",
    });
  });

  it("prohibits unknown activities even when the default allows", () => {
    const permissive = doc();
    permissive.testing = { default: "allowed" };
    expect(evaluate(permissive, "quantum_probing", "api.example.com", { now })).toMatchObject({
      allowed: false,
      reason: "ACTIVITY_UNKNOWN",
    });
  });

  it("falls back to the default for known activities", () => {
    const permissive = doc();
    permissive.testing = { default: "allowed" };
    expect(evaluate(permissive, "manual_testing", "api.example.com", { now })).toMatchObject({
      allowed: true,
      reason: "DEFAULT_ALLOWED",
    });
  });

  it("treats an expired document as absent", () => {
    expect(evaluate(doc(), "manual_testing", "api.example.com", { now: new Date("2028-01-01") })).toMatchObject({
      allowed: false,
      reason: "DOCUMENT_EXPIRED",
    });
  });

  it("refuses to guess at an unknown version", () => {
    const future = { ...doc(), cvd_policy: "0.9" } as unknown as CvdPolicyDocument;
    expect(evaluate(future, "manual_testing", "api.example.com", { now })).toMatchObject({
      reason: "VERSION_UNKNOWN",
    });
  });

  it("stops at a posture that does not invite testing", () => {
    const reportOnly = doc();
    reportOnly.research = { posture: "report_only" };
    expect(evaluate(reportOnly, "manual_testing", "api.example.com", { now })).toMatchObject({
      allowed: false,
      reason: "POSTURE_NO_TESTING",
    });
  });

  it("stops at a target outside the scope", () => {
    expect(evaluate(doc(), "automated_scanning", "shop.example.com", { now })).toMatchObject({
      allowed: false,
      reason: "OUT_OF_SCOPE",
    });
  });

  it("honours the targets condition of a rule", () => {
    const restricted = doc();
    restricted.testing = {
      default: "prohibited",
      rules: [
        {
          activity: "manual_testing",
          state: "allowed",
          conditions: { targets: ["lab.example.com"] },
        },
      ],
    };
    restricted.scope.web = [{ pattern: "*.example.com", state: "in" }];
    expect(evaluate(restricted, "manual_testing", "api.example.com", { now }).allowed).toBe(false);
    expect(evaluate(restricted, "manual_testing", "lab.example.com", { now }).allowed).toBe(true);
  });
});

describe("foreign targets", () => {
  const claiming = (): CvdPolicyDocument => {
    const claim = doc();
    claim.scope.web = [{ pattern: "*.victim.example", state: "in" }];
    claim.testing = {
      default: "prohibited",
      rules: [
        {
          activity: "automated_scanning",
          state: "allowed",
          conditions: { targets: ["api.victim.example"] },
        },
      ],
    };
    return claim;
  };

  it("refuses a target outside the document's own domain", () => {
    expect(evaluate(claiming(), "automated_scanning", "api.victim.example", { now })).toMatchObject({
      allowed: false,
      reason: "FOREIGN_TARGET",
    });
  });

  it("allows it only once the caller confirms the target's own policy", () => {
    expect(
      evaluate(claiming(), "automated_scanning", "api.victim.example", {
        now,
        foreignTargetConfirmed: true,
      }).allowed,
    ).toBe(true);
  });

  it("refuses a sibling host the document is not published under", () => {
    const sibling = doc();
    sibling.canonical = "https://saas.example.com/.well-known/cvd.json";
    sibling.scope.web = [{ pattern: "staging.example.com", state: "in" }];
    sibling.testing = { default: "allowed" };
    expect(evaluate(sibling, "manual_testing", "staging.example.com", { now })).toMatchObject({
      reason: "FOREIGN_TARGET",
    });
  });

  it("accepts that sibling once the host itself points at the document", () => {
    const sibling = doc();
    sibling.canonical = "https://saas.example.com/.well-known/cvd.json";
    sibling.scope.web = [{ pattern: "staging.example.com", state: "in" }];
    sibling.testing = { default: "allowed" };
    expect(
      evaluate(sibling, "manual_testing", "staging.example.com", {
        now,
        discoveredFor: "staging.example.com",
      }).allowed,
    ).toBe(true);
  });

  it("refuses a host above the subdomain the document sits on", () => {
    const takeover = doc();
    takeover.canonical = "https://blog.example.com/.well-known/cvd.json";
    takeover.scope.web = [{ pattern: "*.example.com", state: "in" }];
    takeover.testing = { default: "allowed" };
    expect(evaluate(takeover, "manual_testing", "bank.example.com", { now })).toMatchObject({
      reason: "FOREIGN_TARGET",
    });
  });

  it("lets a document at the main domain speak for hosts under it", () => {
    const apex = doc();
    apex.canonical = "https://example.com/.well-known/cvd.json";
    apex.scope.web = [{ pattern: "*.example.com", state: "in" }];
    apex.testing = { default: "allowed" };
    expect(evaluate(apex, "manual_testing", "bank.example.com", { now }).allowed).toBe(true);
  });

  it("supports a third party hosting the document for a customer", () => {
    const hosted = doc();
    hosted.canonical = "https://intake.provider.example/customers/example-ltd/cvd.json";
    hosted.scope.web = [{ pattern: "*.customer.example", state: "in" }];
    hosted.testing = { default: "allowed" };
    expect(evaluate(hosted, "manual_testing", "www.customer.example", { now }).allowed).toBe(false);
    expect(
      evaluate(hosted, "manual_testing", "www.customer.example", {
        now,
        discoveredFor: "customer.example",
      }).allowed,
    ).toBe(true);
  });

  it("leaves product targets alone", () => {
    const products = doc();
    products.scope = {
      precedence: "out_overrides_in",
      products: [{ name: "SC-4000", purl: "pkg:generic/example/sc4000" }],
    };
    products.testing = { default: "allowed" };
    expect(evaluate(products, "manual_testing", "pkg:generic/example/sc4000", { now }).allowed).toBe(
      true,
    );
  });
});

describe("host normalisation", () => {
  it("ignores case, trailing dot, port and userinfo", () => {
    expect(matchesPattern("example.com", "EXAMPLE.COM")).toBe(true);
    expect(matchesPattern("example.com", "example.com.")).toBe(true);
    expect(matchesPattern("example.com", "example.com:8443")).toBe(true);
    expect(matchesPattern("example.com", "https://user:pw@example.com/x")).toBe(true);
  });

  it("matches whole path segments, not string prefixes", () => {
    expect(matchesPattern("example.com/api", "example.com/api")).toBe(true);
    expect(matchesPattern("example.com/api", "example.com/api/v1")).toBe(true);
    expect(matchesPattern("example.com/api", "example.com/api2")).toBe(false);
  });

  it("ignores a query string on the target", () => {
    expect(matchesPattern("example.com/api", "https://example.com/api?x=1")).toBe(true);
  });

  it("requires addresses to match exactly, with no label hierarchy", () => {
    expect(isAtOrUnder("10.0.0.1", "10.0.0.1")).toBe(true);
    expect(isAtOrUnder("10.0.0.1", "192.168.0.1")).toBe(false);
    expect(isAtOrUnder("0.0.1", "10.0.0.1")).toBe(false);
  });

  it("covers a host and everything under it, and nothing beside it", () => {
    expect(isAtOrUnder("example.com", "example.com")).toBe(true);
    expect(isAtOrUnder("example.com", "a.b.example.com")).toBe(true);
    expect(isAtOrUnder("blog.example.com", "bank.example.com")).toBe(false);
    expect(isAtOrUnder("example.com", "evil-example.com")).toBe(false);
    expect(isAtOrUnder("co.uk", "victim.co.uk")).toBe(true);
  });
});
