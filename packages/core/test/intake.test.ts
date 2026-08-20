import { describe, expect, it } from "vitest";
import { validate } from "../src/validate.js";
import { generate, defaultAnswers, answersFrom } from "../src/generate.js";
import { explain } from "../src/explain.js";
import { SPEC_VERSION, SUPPORTED_VERSIONS } from "../src/types.js";
import type { CvdPolicyDocument } from "../src/types.js";

const now = new Date("2026-08-18T00:00:00Z");

const base = (): CvdPolicyDocument => ({
  cvd_policy: "0.2",
  canonical: "https://example.com/.well-known/cvd.json",
  expires: "2027-06-30T23:59:59Z",
  organization: { name: "Example Ltd." },
  contact: { channels: [{ type: "email", value: "security@example.com" }] },
  research: { posture: "report_only" },
  scope: { precedence: "out_overrides_in", web: [{ pattern: "example.com", state: "in" }] },
  report_requirements: { required_fields: ["description"] },
});

const codes = (doc: unknown) => validate(doc, { now }).issues.map((issue) => issue.code);

describe("versions", () => {
  it("knows both published versions", () => {
    expect(SUPPORTED_VERSIONS).toEqual(["0.1", "0.2"]);
  });

  it("still accepts a 0.1 document", () => {
    const old = { ...base(), cvd_policy: "0.1" } as CvdPolicyDocument;
    expect(validate(old, { now }).valid).toBe(true);
  });

  it("judges a 0.1 document by the 0.1 rules, so intake is merely unknown there", () => {
    const old = base();
    old.cvd_policy = "0.1";
    old.report_requirements.intake = { url: "https://example.com/submit" };
    const result = validate(old, { now });
    expect(result.valid).toBe(true);
    expect(result.issues.map((issue) => issue.code)).toContain("INTAKE_NEEDS_VERSION");
  });

  it("rejects a version that was never published", () => {
    const future = { ...base(), cvd_policy: "0.3" } as unknown as CvdPolicyDocument;
    expect(codes(future)).toContain("VERSION_UNSUPPORTED");
  });
});

describe("intake", () => {
  it("accepts a complete block", () => {
    const doc = base();
    doc.report_requirements.intake = {
      url: "https://example.com/report/submit",
      schema: "https://example.com/report/schema.json",
      profile: "report-0.1",
      anonymous: true,
      max_bytes: 5_242_880,
      attachments: "after_contact",
    };
    expect(validate(doc, { now }).valid).toBe(true);
  });

  it("rejects a plain-http endpoint", () => {
    const doc = base();
    doc.report_requirements.intake = { url: "http://example.com/report/submit" };
    expect(codes(doc)).toContain("INTAKE_NOT_HTTPS");
  });

  it("rejects credentials in the endpoint", () => {
    const doc = base();
    doc.report_requirements.intake = { url: "https://user:pw@example.com/submit" };
    const result = validate(doc, { now });
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("INTAKE_HAS_CREDENTIALS");
  });

  it("notes a provider endpoint without complaining about it", () => {
    const doc = base();
    doc.report_requirements.intake = { url: "https://intake.provider.example/t/7f3a/submit" };
    const result = validate(doc, { now });
    expect(result.valid).toBe(true);
    const note = result.issues.find((issue) => issue.code === "INTAKE_THIRD_PARTY");
    expect(note?.level).toBe("info");
  });

  it("says nothing when the endpoint is the publisher's own", () => {
    const doc = base();
    doc.report_requirements.intake = { url: "https://reports.example.com/submit" };
    expect(codes(doc)).not.toContain("INTAKE_THIRD_PARTY");
  });

  it("points out a profile without a schema", () => {
    const doc = base();
    doc.report_requirements.intake = { url: "https://example.com/submit", profile: "report-0.1" };
    expect(codes(doc)).toContain("INTAKE_PROFILE_WITHOUT_SCHEMA");
  });
});

describe("generate with intake", () => {
  const answers = () => {
    const a = defaultAnswers();
    a.canonical = "https://example.com/.well-known/cvd.json";
    a.organization.name = "Example Ltd.";
    a.contact.channels = [{ type: "email", value: "security@example.com", preferred: true }];
    a.scope = { precedence: "out_overrides_in", web: [{ pattern: "example.com", state: "in" }] };
    return a;
  };

  it("writes the current version", () => {
    expect(generate(answers(), { now }).cvd_policy).toBe(SPEC_VERSION);
  });

  it("omits intake when no endpoint was given", () => {
    const a = answers();
    a.intake = { url: "   ", profile: "report-0.1" };
    expect(generate(a, { now }).report_requirements.intake).toBeUndefined();
  });

  it("writes intake and validates", () => {
    const a = answers();
    a.intake = {
      url: "https://intake.provider.example/t/7f3a/submit",
      profile: "report-0.1",
      anonymous: true,
    };
    const doc = generate(a, { now });
    expect(doc.report_requirements.intake?.url).toBe("https://intake.provider.example/t/7f3a/submit");
    expect(validate(doc, { now }).valid).toBe(true);
  });

  it("carries intake back into answers for editing", () => {
    const a = answers();
    a.intake = { url: "https://example.com/submit", anonymous: false };
    const round = answersFrom(generate(a, { now }));
    expect(round.intake?.url).toBe("https://example.com/submit");
    expect(round.intake?.anonymous).toBe(false);
  });
});

describe("explain with intake", () => {
  const requirements = (doc: CvdPolicyDocument) =>
    explain(doc).find((section) => section.key === "report_requirements");

  it("states that structured submission is offered", () => {
    const doc = base();
    doc.report_requirements.intake = { url: "https://example.com/submit", anonymous: true };
    const items = requirements(doc)?.items ?? [];
    expect(items.some((item) => item.value === "explain.intake_offered")).toBe(true);
    expect(items.some((item) => item.labelKey === "explain.anonymous_reports")).toBe(true);
  });

  it("states plainly when it is not offered", () => {
    const items = requirements(base())?.items ?? [];
    expect(items.some((item) => item.labelKey === "explain.structured_intake")).toBe(true);
    expect(items.some((item) => item.value === "explain.intake_offered")).toBe(false);
  });
});
