import { describe, expect, it } from "vitest";
import { canonicalFor, defaultAnswers, generate } from "../src/generate.js";
import { validate } from "../src/validate.js";

const now = new Date("2026-08-18T00:00:00Z");

const quickAnswers = () => {
  const answers = defaultAnswers();
  answers.canonical = "https://example.com/.well-known/cvd.json";
  answers.organization.name = "Example Ltd.";
  answers.contact.channels = [{ type: "email", value: "security@example.com", preferred: true }];
  answers.scope = {
    precedence: "out_overrides_in",
    web: [{ pattern: "example.com", state: "in" }],
  };
  return answers;
};

describe("generate", () => {
  it("produces a valid document from the quick-mode answers", () => {
    const doc = generate(quickAnswers(), { now });
    expect(validate(doc, { now }).valid).toBe(true);
  });

  it("defaults expires to twelve months out", () => {
    const doc = generate(quickAnswers(), { now });
    expect(doc.expires).toBe("2027-08-18T00:00:00Z");
    expect(doc.updated).toBe("2026-08-18");
  });

  it("omits testing when the posture does not invite it", () => {
    const answers = quickAnswers();
    answers.testing = { default: "allowed", rules: [{ activity: "fuzzing", state: "allowed" }] };
    expect(generate(answers, { now }).testing).toBeUndefined();
  });

  it("keeps testing when the posture invites it", () => {
    const answers = quickAnswers();
    answers.posture = "limited";
    answers.testing = { default: "prohibited", rules: [{ activity: "manual_testing", state: "allowed" }] };
    const doc = generate(answers, { now });
    expect(doc.testing?.rules).toHaveLength(1);
    expect(validate(doc, { now }).valid).toBe(true);
  });

  it("produces a valid document for every posture", () => {
    for (const posture of ["open", "limited", "report_only", "prohibited"] as const) {
      const answers = quickAnswers();
      answers.posture = posture;
      answers.contact.pgpUrl = "https://example.com/pgp-key.txt";
      const result = validate(generate(answers, { now }), { now });
      expect(result.issues.filter((issue) => issue.level === "error"), posture).toEqual([]);
    }
  });

  it("drops empty channels and empty optional values", () => {
    const answers = quickAnswers();
    answers.contact.channels = [
      { type: "email", value: "security@example.com" },
      { type: "form", value: "" },
    ];
    answers.statement = "   ";
    const doc = generate(answers, { now });
    expect(doc.contact.channels).toHaveLength(1);
    expect(doc.research.statement).toBeUndefined();
  });

  it("carries a service channel through without preferring it", () => {
    const answers = quickAnswers();
    answers.contact.channels = [
      { type: "email", value: "security@example.com", preferred: true },
      { type: "service", value: "https://intake.example-provider.tld/example" },
    ];
    const doc = generate(answers, { now });
    expect(doc.contact.channels[1]?.type).toBe("service");
    expect(doc.contact.channels[1]?.preferred).toBeUndefined();
  });
});

describe("canonicalFor", () => {
  it("builds the well-known URL from a domain", () => {
    expect(canonicalFor("example.com")).toBe("https://example.com/.well-known/cvd.json");
    expect(canonicalFor("https://example.com/some/path")).toBe(
      "https://example.com/.well-known/cvd.json",
    );
    expect(canonicalFor("  ")).toBe("");
  });
});
