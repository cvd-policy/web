import {
  CSAF_EXTENSION_ID,
  CSAF_SPECIFICATION,
  assessCsafCapability,
  parsePolicyText,
} from "@cvd-policy/core/v1";
import { describe, expect, it } from "vitest";
import {
  assessCsafCapabilityText,
  csafExportBlock,
  csafChannelsFromDeclaration,
  createCsafDeclaration,
  createInitialV1Policy,
  eligibleCsafChannels,
  isoDateTime,
  joinLines,
  localDateTime,
  parsePorts,
  positiveInteger,
  positiveNumber,
  splitLines,
} from "../src/lib/v1Editor.js";

describe("V1 guided editor helpers", () => {
  it("starts with a valid report-only V1 document", () => {
    const policy = createInitialV1Policy(new Date("2026-09-05T12:00:00Z"));
    const result = parsePolicyText(JSON.stringify(policy), { now: new Date("2026-09-05T12:00:00Z") });

    expect(result.valid).toBe(true);
    expect(policy.cvd_policy).toBe(1);
    expect(policy.expires).toBe("2027-03-05T12:00:00.000Z");
    expect(policy).not.toHaveProperty("canonical");
    expect(policy).not.toHaveProperty("report_requirements");
  });

  it("round-trips line lists and parses port lists", () => {
    expect(splitLines(" en\n\nde-DE\nen \n")).toEqual(["en", "de-DE"]);
    expect(joinLines(["en", "de-DE"])).toBe("en\nde-DE");
    expect(parsePorts("443, 8443 9443")).toEqual([443, 8443, 9443]);
    expect(parsePorts("443, 443")).toEqual([443]);
    expect(parsePorts(" ")).toBeUndefined();
    expect(parsePorts("0, 443")).toBeUndefined();
    expect(parsePorts("443.5")).toBeUndefined();
    expect(parsePorts("65536")).toBeUndefined();
  });

  it("accepts only positive numbers and integers", () => {
    expect(positiveNumber("0.25")).toBe(0.25);
    expect(positiveNumber("0")).toBeUndefined();
    expect(positiveNumber("not-a-number")).toBeUndefined();
    expect(positiveInteger("3")).toBe(3);
    expect(positiveInteger("3.5")).toBeUndefined();
  });

  it("round-trips a local date-time through an RFC3339 instant", () => {
    const instant = "2026-09-05T12:34:56.000Z";
    expect(isoDateTime(localDateTime(instant))).toBe(instant);
  });

  it("offers only eligible mailto and HTTPS channels and creates the fixed declaration", () => {
    const contacts = [
      "mailto:security@example.com",
      "tel:+1-555-0100",
      "https://example.com/security/contact",
      "https://user:secret@example.com/contact",
      "https://example.com/contact#form",
      "not a URI",
    ];
    expect(eligibleCsafChannels(contacts)).toEqual([
      "mailto:security@example.com",
      "https://example.com/security/contact",
    ]);
    expect(eligibleCsafChannels(["mailto:security@example.com", "mailto:security@example.com"])).toEqual([]);

    const declaration = createCsafDeclaration([
      "mailto:security@example.com",
      "https://example.com/security/contact",
    ]);
    expect(declaration).toEqual({
      channels: [
        { uri: "mailto:security@example.com", specification: CSAF_SPECIFICATION },
        { uri: "https://example.com/security/contact", specification: CSAF_SPECIFICATION },
      ],
    });
    expect(Object.keys(declaration)).toEqual(["channels"]);
    expect(Object.keys(declaration.channels[0]!)).toEqual(["uri", "specification"]);
    expect(CSAF_EXTENSION_ID).toBe("https://github.com/cvd-policy/spec/extensions/csaf-vulnerability-report-v1");
  });

  it("round-trips the report-only declaration and preserves contact channel order", () => {
    const policy = createInitialV1Policy(new Date("2026-09-05T12:00:00Z"));
    policy.contact.channels = ["mailto:security@example.com", "https://example.com/report"];
    policy.extensions = {
      [CSAF_EXTENSION_ID]: createCsafDeclaration([
        "https://example.com/report",
        "mailto:security@example.com",
      ]),
    };

    const raw = JSON.stringify(policy);
    const parsed = parsePolicyText(raw, { now: new Date("2026-09-05T12:00:00Z") });
    const assessment = assessCsafCapabilityText(raw);

    expect(parsed.valid).toBe(true);
    expect(assessment?.coreValid).toBe(true);
    if (!assessment?.coreValid) throw new Error("expected a core-valid declaration");
    expect(assessment.state).toBe("advertised");
    expect(assessment.channels.map(({ uri }) => uri)).toEqual(policy.contact.channels);
    expect(parsed.policy?.extensions?.[CSAF_EXTENSION_ID]).toEqual(policy.extensions[CSAF_EXTENSION_ID]);
  });

  it("does not turn broken references, critical use, or unknown specifications into support", () => {
    const policy = createInitialV1Policy(new Date("2026-09-05T12:00:00Z"));
    const declaration = createCsafDeclaration(["mailto:removed@example.com"]);
    policy.extensions = { [CSAF_EXTENSION_ID]: declaration };

    const brokenReference = assessCsafCapability(policy);
    expect(brokenReference.coreValid).toBe(true);
    if (!brokenReference.coreValid) throw new Error("expected valid core policy");
    expect(brokenReference.state).toBe("invalid");
    expect(brokenReference.channels).toEqual([]);
    expect(csafChannelsFromDeclaration(declaration, policy.contact.channels)).toBeNull();

    policy.contact.channels.push("mailto:removed@example.com");
    expect(csafChannelsFromDeclaration(declaration, policy.contact.channels)).toEqual(["mailto:removed@example.com"]);
    policy.critical_extensions = [CSAF_EXTENSION_ID];
    const critical = assessCsafCapability(policy);
    expect(critical.coreValid && critical.state).toBe("unsupported");
    expect(critical.coreValid && critical.channels).toEqual([]);

    delete policy.critical_extensions;
    policy.extensions = {
      [CSAF_EXTENSION_ID]: {
        channels: [{ uri: "mailto:removed@example.com", specification: "https://example.net/other-csaf.html" }],
      },
    };
    const unknownSpecification = assessCsafCapability(policy);
    expect(unknownSpecification.coreValid && unknownSpecification.state).toBe("unsupported");
    expect(unknownSpecification.coreValid && unknownSpecification.channels).toEqual([]);
    expect(csafChannelsFromDeclaration(policy.extensions[CSAF_EXTENSION_ID], policy.contact.channels)).toBeNull();
  });

  it("blocks publication for invalid or critical CSAF while preserving unknown non-critical specifications", () => {
    const policy = createInitialV1Policy(new Date("2026-09-05T12:00:00Z"));
    const channel = "mailto:security@example.com";
    policy.extensions = { [CSAF_EXTENSION_ID]: createCsafDeclaration([channel]) };

    expect(csafExportBlock(assessCsafCapability(policy))).toBeNull();
    policy.critical_extensions = [CSAF_EXTENSION_ID];
    const critical = assessCsafCapability(policy);
    expect(critical.coreValid && critical.state).toBe("unsupported");
    expect(csafExportBlock(critical)).toBe("critical");

    delete policy.critical_extensions;
    policy.extensions = {
      [CSAF_EXTENSION_ID]: {
        channels: [{ uri: channel, specification: "https://example.net/other-csaf.html" }],
      },
    };
    expect(assessCsafCapability(policy).coreValid).toBe(true);
    expect(csafExportBlock(assessCsafCapability(policy))).toBeNull();

    policy.extensions = { [CSAF_EXTENSION_ID]: { channels: [] } };
    expect(csafExportBlock(assessCsafCapability(policy))).toBe("invalid");
  });

  it("refuses to assess duplicate JSON members and keeps malformed declarations separate from core validation", () => {
    const raw = `{"cvd_policy":1,"extensions":{"${CSAF_EXTENSION_ID}":{"channels":[],"channels":[]}}}`;
    expect(assessCsafCapabilityText(raw)).toBeNull();
    expect(parsePolicyText(raw).valid).toBe(false);

    const invalidCore = assessCsafCapabilityText('{"cvd_policy":1}');
    expect(invalidCore?.coreValid).toBe(false);
    expect(invalidCore).not.toHaveProperty("state");
  });
});
