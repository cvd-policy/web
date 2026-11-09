import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  assessCsafCapability,
  assessCsafHostDeclaration,
  evaluatePolicy,
  parsePolicyText,
  validatePolicy,
  CSAF_EXTENSION_ID,
  CSAF_SPECIFICATION,
  type AuthorityEvidence,
  type CvdPolicyDocument,
  type EvaluationQuery,
} from "../src/v1/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "vendor", "spec-v1");
const extensionArtifacts = join(root, "extensions", "csaf-vulnerability-report-v1");
const contract = JSON.parse(
  readFileSync(join(extensionArtifacts, "csaf-policy-contract.json"), "utf8"),
) as { extension_identifier: string; supported_specification: string };
const sharedCases = JSON.parse(
  readFileSync(join(extensionArtifacts, "csaf-policy-cases.json"), "utf8"),
) as {
  cases: Array<{
    id: string;
    input: {
      policy?: unknown;
      policy_text?: string;
      now: string;
      query: EvaluationQuery;
      authority: AuthorityEvidence | null;
    };
    expected: {
      assessment: "not-advertised" | "invalid" | "unsupported" | "advertised" | null;
      declared_channels_in_contact_preference_order: string[];
      testing_permission_status: string;
      usable_as_current_host_csaf_statement: boolean;
      declaration_network_requests: number;
    };
  }>;
};
const uriCases = JSON.parse(
  readFileSync(join(root, "tests", "v1", "csaf-reporting", "extra-cases.json"), "utf8"),
) as { cases: Array<{ id: string; specification: string; expected: "invalid" | "unsupported" }> };
const base = JSON.parse(
  readFileSync(join(root, "tests", "v1", "policy", "valid", "minimal-report-only.json"), "utf8"),
) as CvdPolicyDocument;
const now = new Date("2026-11-08T12:00:00Z");
const policy = (): CvdPolicyDocument => structuredClone(base);
const declaration = (uri = "mailto:security@example.com", specification = CSAF_SPECIFICATION) => ({
  channels: [{ uri, specification }],
});
const withDeclaration = (value = declaration()): CvdPolicyDocument => {
  const result = policy();
  result.extensions = { [CSAF_EXTENSION_ID]: value };
  return result;
};
const authority: AuthorityEvidence = {
  established: true,
  discoveryHost: "example.com",
  securityTxtUri: "https://example.com/.well-known/security.txt",
  cvdPolicyUri: "https://example.com/cvd-policy.json",
  securityTxtExpires: "2027-05-07T00:00:00Z",
};
const retrieval = {
  requestedUri: authority.cvdPolicyUri,
  finalUri: authority.cvdPolicyUri,
  redirectChain: [],
  statusCode: 200,
  mediaType: "application/cvd-policy+json",
};

describe("CSAF policy capability", () => {
  it("exports the fixed declaration and specification identifiers", () => {
    expect(CSAF_EXTENSION_ID).toBe(contract.extension_identifier);
    expect(CSAF_SPECIFICATION).toBe(contract.supported_specification);
  });

  it("matches the 42 shared policy and host-assessment cases", () => {
    expect(sharedCases.cases).toHaveLength(42);
    for (const entry of sharedCases.cases) {
      const input = entry.input.policy_text ?? entry.input.policy;
      const now = new Date(entry.input.now);
      const options = { now };
      const capability = assessCsafCapability(input, options);
      if (entry.expected.assessment === null) {
        expect(capability.coreValid, entry.id).toBe(false);
        expect(capability, entry.id).not.toHaveProperty("state");
        expect(capability, entry.id).not.toHaveProperty("channels");
      } else {
        expect(capability.coreValid, entry.id).toBe(true);
        if (capability.coreValid) {
          expect(capability.state, entry.id).toBe(entry.expected.assessment);
        }
      }
      expect(
        capability.coreValid && capability.state === "advertised"
          ? capability.channels.map((channel) => channel.uri)
          : [],
        entry.id,
      ).toEqual(entry.expected.declared_channels_in_contact_preference_order);

      const host = assessCsafHostDeclaration(
        input,
        entry.input.authority,
        entry.input.query.policyRetrieval,
        options,
      );
      expect(host.usable, entry.id).toBe(entry.expected.usable_as_current_host_csaf_statement);

      const permission = evaluatePolicy(input, entry.input.query, entry.input.authority, options);
      expect(permission.inputValid, entry.id).toBe(true);
      if (permission.inputValid) {
        expect(permission.status, entry.id).toBe(entry.expected.testing_permission_status);
      }
      expect(entry.expected.declaration_network_requests, entry.id).toBe(0);

      const parsed = typeof input === "string"
        ? parsePolicyText(input, options)
        : validatePolicy(input, options);
      if (parsed.valid && parsed.policy?.critical_extensions?.includes(CSAF_EXTENSION_ID)) {
        const understood = {
          ...entry.input.query,
          understoodExtensions: [
            ...(entry.input.query.understoodExtensions ?? []),
            CSAF_EXTENSION_ID,
          ],
        };
        const recognized = evaluatePolicy(input, understood, entry.input.authority, options);
        expect(recognized, entry.id).toMatchObject({
          inputValid: true,
          status: "unsupported-policy",
        });
      }
    }
  });

  it("requires valid core policy before assigning a capability state", () => {
    const input = { cvd_policy: 1 };
    const options = { now, checkExpiry: false };
    const core = validatePolicy(input, options);
    const invalid = assessCsafCapability(input, options);
    expect(core.valid).toBe(false);
    expect(invalid).toEqual({ coreValid: false, issues: core.issues });
    expect(invalid).not.toHaveProperty("state");
    expect(invalid).not.toHaveProperty("channels");
    expect(assessCsafCapability(policy(), { now, checkExpiry: true })).toMatchObject({
      coreValid: true,
      state: "not-advertised",
      channels: [],
    });
  });

  it("returns supported channels in contact order and permits report-only policies", () => {
    const input = withDeclaration({
      channels: [
        { uri: "https://example.com/security/contact", specification: CSAF_SPECIFICATION },
        { uri: "mailto:security@example.com", specification: CSAF_SPECIFICATION },
      ],
    });
    input.contact.channels.push("https://example.com/security/contact");

    expect(assessCsafCapability(input, { now })).toEqual({
      coreValid: true,
      state: "advertised",
      channels: [
        { uri: "mailto:security@example.com", specification: CSAF_SPECIFICATION },
        { uri: "https://example.com/security/contact", specification: CSAF_SPECIFICATION },
      ],
      issues: [],
    });
    expect(assessCsafHostDeclaration(input, authority, retrieval, { now }).usable).toBe(true);
    expect(assessCsafHostDeclaration(input, null, retrieval, { now })).toMatchObject({
      usable: false,
      issues: [{ code: "authority_evidence_missing" }],
    });
    expect(assessCsafHostDeclaration(input, authority, { ...retrieval, statusCode: 204 }, { now }))
      .toMatchObject({ usable: false, issues: [{ code: "policy_retrieval_invalid" }] });
  });

  it("treats syntax-valid unknown absolute specifications as unsupported atomically", () => {
    const input = withDeclaration({
      channels: [
        { uri: "mailto:security@example.com", specification: CSAF_SPECIFICATION },
        { uri: "https://example.com/security/contact", specification: "urn:example:unknown" },
      ],
    });
    input.contact.channels.push("https://example.com/security/contact");
    expect(assessCsafCapability(input, { now })).toMatchObject({
      coreValid: true,
      state: "unsupported",
      channels: [],
    });

    const duplicateUri = withDeclaration({
      channels: [
        { uri: "mailto:security@example.com", specification: CSAF_SPECIFICATION },
        { uri: "mailto:security@example.com", specification: "urn:example:unknown" },
      ],
    });
    expect(assessCsafCapability(duplicateUri, { now })).toMatchObject({
      coreValid: true,
      state: "invalid",
      channels: [],
    });

    const malformed = withDeclaration({
      channels: [{ uri: "mailto:other@example.com", specification: "urn:example:unknown" }],
    });
    expect(assessCsafCapability(malformed, { now })).toMatchObject({
      coreValid: true,
      state: "invalid",
      channels: [],
    });
  });

  it("matches the shared RFC 3986 specification URI edge cases", () => {
    for (const entry of uriCases.cases) {
      const result = assessCsafCapability(
        withDeclaration(declaration(undefined, entry.specification)),
        { now },
      );
      expect(result.coreValid, entry.id).toBe(true);
      if (result.coreValid) {
        expect(result.state, entry.id).toBe(entry.expected);
        expect(result.channels, entry.id).toEqual([]);
      }
    }
  });

  it("validates double-slash authorities before accepting an absolute specification URI", () => {
    for (const specification of [
      "foo://h:/x",
      "foo://h:99999/x",
      "foo://user:pass@h/path",
      "foo://[v1.a]/",
      "foo://",
      "foo:/",
      "foo:////////",
      "foo:/path",
      "foo://[::1]/",
      "foo:///path",
    ]) {
      expect(assessCsafCapability(withDeclaration(declaration(undefined, specification)), { now }))
        .toMatchObject({ coreValid: true, state: "unsupported", channels: [] });
    }
    for (const specification of [
      "foo://user@@h/x",
      "foo://h:abc/x",
      "foo://[v1.]/",
      "foo://h/[::1]",
      "foo://h/?q=[x]",
      "foo:///[]",
      "foo:/[::1]",
      "foo:/user@[::1]",
      "foo:/[v1.host]",
    ]) {
      expect(assessCsafCapability(withDeclaration(declaration(undefined, specification)), { now }))
        .toMatchObject({ coreValid: true, state: "invalid", channels: [] });
    }
  });

  it("compares contact channel strings exactly without URI normalization", () => {
    const input = withDeclaration(declaration("mailto:security%40example.com"));
    expect(assessCsafCapability(input, { now })).toMatchObject({
      coreValid: true,
      state: "invalid",
      channels: [],
    });

    const telephone = policy();
    telephone.contact.channels.push("tel:+12025550123");
    telephone.extensions = {
      [CSAF_EXTENSION_ID]: declaration("tel:+12025550123"),
    };
    expect(assessCsafCapability(telephone, { now })).toMatchObject({
      coreValid: true,
      state: "invalid",
      channels: [],
    });
  });

  it("rejects malformed declaration channel URIs without changing core validity", () => {
    const malformedUri = "mailto://user@@h/x";
    const input = withDeclaration(declaration(malformedUri));
    input.contact.channels.push(malformedUri);

    expect(validatePolicy(input, { now }).valid).toBe(true);
    expect(assessCsafCapability(input, { now })).toMatchObject({
      coreValid: true,
      state: "invalid",
      channels: [],
      issues: [{ code: "channel-uri-invalid" }],
    });
  });

  it("keeps invalid noncritical metadata separate from core validity and permission", () => {
    const input = withDeclaration({ channels: [] });
    const validated = validatePolicy(input, { now });
    expect(validated.valid).toBe(true);
    expect(assessCsafCapability(input, { now })).toMatchObject({ state: "invalid", channels: [] });

    const result = evaluatePolicy(input, {
      activity: "manual_testing",
      target: "https://example.com/",
      policyRetrieval: retrieval,
    }, authority, { now });
    expect(result).toMatchObject({ inputValid: true, status: "publisher-stated-prohibited" });
  });

  it("rejects duplicate JSON member names before capability assessment", () => {
    const input = policy();
    const prefix = JSON.stringify(input).slice(0, -1);
    const text = `${prefix},"extensions":{${JSON.stringify(CSAF_EXTENSION_ID)}:{"channels":[],"channels":[]}}}`;

    expect(parsePolicyText(text, { now }).issues[0]?.code).toBe("policy_duplicate_member");
    expect(assessCsafCapability(text, { now })).toMatchObject({
      coreValid: false,
      issues: [{ code: "policy_duplicate_member" }],
    });
  });

  it("compares JSON-decoded strings and rejects known critical use even when understood", () => {
    const input = withDeclaration();
    let text = JSON.stringify(input);
    const extensionIndex = text.indexOf('"extensions"');
    text = `${text.slice(0, extensionIndex)}${text.slice(extensionIndex).replace(
      '"uri":"mailto:security@example.com"',
      '"uri":"mailto:\\u0073ecurity@example.com"',
    ).replace(
      '"https://github.com/cvd-policy/spec/extensions/csaf-vulnerability-report-v1":{',
      '"https:\\/\\/github.com\\/cvd-policy\\/spec\\/extensions\\/csaf-vulnerability-report-v1":{',
    ).replace(
      '"specification":"https://docs.oasis-open.org/csaf/csaf/v2.1/csd04/csaf-v2.1-csd04.html"',
      '"specification":"h\\u0074tps://docs.oasis-open.org/csaf/csaf/v2.1/csd04/csaf-v2.1-csd04.html"',
    )}`;
    expect(assessCsafCapability(text, { now })).toMatchObject({ state: "advertised" });

    input.critical_extensions = [CSAF_EXTENSION_ID];
    expect(assessCsafCapability(input, { now })).toMatchObject({
      state: "unsupported",
      channels: [],
    });
    const result = evaluatePolicy(input, {
      activity: "manual_testing",
      target: "https://example.com/",
      understoodExtensions: [CSAF_EXTENSION_ID],
      policyRetrieval: retrieval,
    }, authority, { now });
    expect(result).toMatchObject({ inputValid: true, status: "unsupported-policy" });
    expect(evaluatePolicy(input, {
      activity: "manual_testing",
      target: "https://example.com/",
      understoodExtensions: [CSAF_EXTENSION_ID],
      policyRetrieval: retrieval,
    }, {
      ...authority,
      securityTxtExpires: "2026-11-08T11:59:59Z",
    }, { now })).toMatchObject({ inputValid: true, status: "unsupported-policy" });

    const expiredCritical = structuredClone(input);
    expiredCritical.expires = "2026-11-08T11:59:59Z";
    expect(evaluatePolicy(expiredCritical, {
      activity: "manual_testing",
      target: "https://example.com/",
      understoodExtensions: [CSAF_EXTENSION_ID],
      policyRetrieval: retrieval,
    }, {
      ...authority,
      securityTxtExpires: "2026-11-08T11:59:59Z",
    }, { now })).toMatchObject({ inputValid: true, status: "invalid-policy", reasonCode: "policy_expired" });
  });

  it("does not fetch the extension or specification during local assessment", () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(() => {
      throw new Error("CSAF metadata assessment must not access the network");
    });
    try {
      const input = withDeclaration();
      assessCsafCapability(input, { now });
      assessCsafHostDeclaration(input, authority, retrieval, { now });
      evaluatePolicy(input, {
        activity: "manual_testing",
        target: "https://example.com/",
        policyRetrieval: retrieval,
      }, authority, { now });
      expect(fetch).not.toHaveBeenCalled();
    } finally {
      fetch.mockRestore();
    }
  });

  it("requires current policy and Authority evidence for host use", () => {
    const input = withDeclaration();
    const expiredPolicy = structuredClone(input);
    expiredPolicy.expires = "2026-11-08T11:59:59Z";
    expect(assessCsafCapability(expiredPolicy, { now, checkExpiry: true })).toMatchObject({
      coreValid: true,
      state: "advertised",
    });
    expect(assessCsafHostDeclaration(expiredPolicy, authority, retrieval, { now })).toMatchObject({
      usable: false,
      capability: { state: "advertised" },
      issues: [{ code: "policy_expired" }],
    });
    expect(assessCsafHostDeclaration(expiredPolicy, authority, retrieval, { now, checkExpiry: false }).usable)
      .toBe(false);

    const expiredAuthority = {
      ...authority,
      securityTxtExpires: "2026-11-08T11:59:59Z",
    };
    expect(assessCsafHostDeclaration(input, expiredAuthority, retrieval, { now })).toMatchObject({
      usable: false,
      capability: { state: "advertised" },
      issues: [{ code: "security_txt_expired" }],
    });
  });

  it("revalidates Authority expiry in permission evaluation after earlier policy failures", () => {
    const staleAuthority = {
      ...authority,
      securityTxtExpires: "2026-11-08T11:59:59Z",
    };
    const query = {
      activity: "manual_testing",
      target: "https://example.com/",
      policyRetrieval: retrieval,
    };
    expect(evaluatePolicy(policy(), query, staleAuthority, { now })).toMatchObject({
      inputValid: true,
      status: "authority-not-established",
      reasonCode: "security_txt_expired",
    });
    expect(evaluatePolicy(policy(), {
      ...query,
      policyRetrieval: { ...retrieval, statusCode: 204 },
    }, staleAuthority, { now })).toMatchObject({
      inputValid: true,
      status: "authority-not-established",
      reasonCode: "policy_retrieval_invalid",
    });

    const expiredPolicy = policy();
    expiredPolicy.expires = "2026-11-08T11:59:59Z";
    expect(evaluatePolicy(expiredPolicy, query, staleAuthority, { now })).toMatchObject({
      inputValid: true,
      status: "invalid-policy",
      reasonCode: "policy_expired",
    });
  });
});
