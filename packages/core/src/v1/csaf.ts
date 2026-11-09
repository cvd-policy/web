import { fullFormats } from "ajv-formats/dist/formats.js";
import { authorityEvidenceIssues } from "./authority.js";
import { policyRetrievalIssues } from "./retrieval.js";
import { parsePolicyText, validatePolicy } from "./validate.js";
import type {
  AuthorityEvidence,
  CsafCapabilityAssessment,
  CsafCapabilityIssue,
  CsafChannel,
  CsafHostDeclarationAssessment,
  CvdPolicyDocument,
  PolicyRetrievalContext,
  ValidationIssue,
  ValidationOptions,
  ValidationResult,
} from "./types.js";

export const CSAF_EXTENSION_ID =
  "https://github.com/cvd-policy/spec/extensions/csaf-vulnerability-report-v1";
export const CSAF_SPECIFICATION =
  "https://docs.oasis-open.org/csaf/csaf/v2.1/csd04/csaf-v2.1-csd04.html";

const fullUriFormat = fullFormats.uri as unknown as (value: string) => boolean;
const emptyPathAbsoluteUri = /^([A-Za-z][A-Za-z0-9+.-]*:)(?:\?([^#]*))?$/;
const queryCharacters = /^(?:[A-Za-z0-9\-._~!$&'()*+,;=:@/?]|%[A-Fa-f0-9]{2})*$/;
const userInfoCharacters = /^(?:[A-Za-z0-9._~!$&'()*+,;=:-]|%[A-Fa-f0-9]{2})*$/;
const regNameCharacters = /^(?:[A-Za-z0-9._~!$&'()*+,;=-]|%[A-Fa-f0-9]{2})*$/;
const ipvFuture = /^[vV][A-Fa-f0-9]+\.[A-Za-z0-9._~!$&'()*+,;=:-]+$/;

function validAuthority(uri: string, colon: number): boolean {
  const authorityAndPath = uri.slice(colon + 3);
  const separator = authorityAndPath.search(/[/?]/);
  const authority = separator < 0 ? authorityAndPath : authorityAndPath.slice(0, separator);
  const pathAndQuery = separator < 0 ? "" : authorityAndPath.slice(separator);
  if (/[\[\]]/.test(pathAndQuery)) return false;

  const at = authority.indexOf("@");
  if (at !== authority.lastIndexOf("@")) return false;
  const userInfo = at < 0 ? "" : authority.slice(0, at);
  if (at >= 0 && !userInfoCharacters.test(userInfo)) return false;
  const hostPort = authority.slice(at + 1);

  if (hostPort.startsWith("[")) {
    const close = hostPort.indexOf("]");
    if (close < 0 || hostPort.indexOf("[", 1) >= 0 || hostPort.indexOf("]", close + 1) >= 0) return false;
    const port = hostPort.slice(close + 1);
    if (port !== "" && !/^:\d*$/.test(port)) return false;
    const literal = hostPort.slice(1, close);
    if (/^[vV]/.test(literal)) return ipvFuture.test(literal);
    return fullUriFormat(`${uri.slice(0, colon + 1)}//${authority}/`);
  }

  if (/[\[\]]/.test(hostPort)) return false;
  const portSeparator = hostPort.indexOf(":");
  const host = portSeparator < 0 ? hostPort : hostPort.slice(0, portSeparator);
  const port = portSeparator < 0 ? null : hostPort.slice(portSeparator + 1);
  return regNameCharacters.test(host) && (port === null || /^\d*$/.test(port));
}

function isAbsoluteUri(value: string): boolean {
  if (value.includes("#")) return false;
  const colon = value.indexOf(":");
  const hierarchyAndQuery = value.slice(colon + 1);
  // ajv-formats 3.0.1's single-slash branch accepts IP-literal brackets in a path.
  if (!hierarchyAndQuery.startsWith("//") && /[\[\]]/.test(hierarchyAndQuery)) return false;
  // With `//`, RFC 3986 requires this prefix to be an authority, never a path fallback.
  if (hierarchyAndQuery.startsWith("//") && !validAuthority(value, colon)) return false;
  if (fullUriFormat(value)) return true;

  // ajv-formats 3.0.1's full uri format rejects RFC 3986's empty path forms.
  const emptyPath = emptyPathAbsoluteUri.exec(value);
  return emptyPath !== null && (emptyPath[2] === undefined || queryCharacters.test(emptyPath[2]));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pointerPart(value: string): string {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
}

function capabilityIssue(
  code: string,
  path: string,
  message: string,
): CsafCapabilityIssue {
  return { code, path, message };
}

function validationIssue(
  code: ValidationIssue["code"],
  path: string,
  message: string,
): ValidationIssue {
  return { level: "error", code, path, message };
}

function coreValidation(input: unknown, options: ValidationOptions): ValidationResult {
  return typeof input === "string"
    ? parsePolicyText(input, options)
    : validatePolicy(input, options);
}

function validChannelUri(value: string): boolean {
  if (!isAbsoluteUri(value)) return false;
  const colon = value.indexOf(":");
  const scheme = value.slice(0, colon).toLowerCase();
  if (scheme === "mailto") return true;
  if (scheme !== "https") return false;

  const hierarchy = value.slice(colon + 1);
  if (!hierarchy.startsWith("//")) return false;
  const authorityAndPath = hierarchy.slice(2);
  const separator = authorityAndPath.search(/[/?]/);
  const authority = separator < 0 ? authorityAndPath : authorityAndPath.slice(0, separator);
  return authority.length > 0 && !authority.includes("@");
}

function inspectDeclaration(
  policy: CvdPolicyDocument,
  value: unknown,
): { issues: CsafCapabilityIssue[]; unsupported: CsafCapabilityIssue[]; channels: CsafChannel[] } {
  const path = `/extensions/${pointerPart(CSAF_EXTENSION_ID)}`;
  const issues: CsafCapabilityIssue[] = [];
  const unsupported: CsafCapabilityIssue[] = [];
  const declared = new Set<string>();
  const specifications = new Map<string, string>();

  if (!isRecord(value)) {
    return {
      issues: [capabilityIssue("extension-object-invalid", path, "The CSAF extension value must be an object.")],
      unsupported,
      channels: [],
    };
  }
  for (const key of Object.keys(value)) {
    if (key !== "channels") {
      issues.push(capabilityIssue(
        "extension-member-unknown",
        `${path}/${pointerPart(key)}`,
        `The CSAF extension does not allow the member '${key}'.`,
      ));
    }
  }
  if (!Object.hasOwn(value, "channels")) {
    issues.push(capabilityIssue("channels-missing", `${path}/channels`, "The CSAF extension requires channels."));
  }
  const entries = value["channels"];
  if (!Array.isArray(entries)) {
    issues.push(capabilityIssue("channels-invalid", `${path}/channels`, "The CSAF channels member must be an array."));
    return { issues, unsupported, channels: [] };
  }
  if (entries.length === 0) {
    issues.push(capabilityIssue("channels-empty", `${path}/channels`, "The CSAF channels array must not be empty."));
  }

  for (const [index, entry] of entries.entries()) {
    const entryPath = `${path}/channels/${index}`;
    if (!isRecord(entry)) {
      issues.push(capabilityIssue("channel-object-invalid", entryPath, "Each CSAF channel must be an object."));
      continue;
    }
    for (const key of Object.keys(entry)) {
      if (key !== "uri" && key !== "specification") {
        issues.push(capabilityIssue(
          "channel-member-unknown",
          `${entryPath}/${pointerPart(key)}`,
          `A CSAF channel does not allow the member '${key}'.`,
        ));
      }
    }

    const uri = entry["uri"];
    const specification = entry["specification"];
    if (typeof uri !== "string") {
      issues.push(capabilityIssue("channel-uri-invalid", `${entryPath}/uri`, "A CSAF channel uri must be a string."));
    } else {
      if (declared.has(uri)) {
        issues.push(capabilityIssue("channel-uri-duplicate", `${entryPath}/uri`, "A CSAF channel uri may occur only once."));
      }
      declared.add(uri);
      if (!validChannelUri(uri)) {
        issues.push(capabilityIssue("channel-uri-invalid", `${entryPath}/uri`, "The CSAF channel uri must be a valid absolute mailto or https URI."));
      }
      if (policy.contact.channels.filter((channel) => channel === uri).length !== 1) {
        issues.push(capabilityIssue("channel-reference-invalid", `${entryPath}/uri`, "The CSAF channel uri must exactly match one contact.channels entry."));
      }
    }
    if (typeof specification !== "string") {
      issues.push(capabilityIssue(
        "specification-invalid",
        `${entryPath}/specification`,
        "A CSAF channel specification must be a string.",
      ));
    } else if (!isAbsoluteUri(specification)) {
      issues.push(capabilityIssue(
        "specification-invalid",
        `${entryPath}/specification`,
        "The specification must be a syntactically valid absolute RFC 3986 URI without a fragment.",
      ));
    } else if (specification !== CSAF_SPECIFICATION) {
      unsupported.push(capabilityIssue(
        "specification-unsupported",
        `${entryPath}/specification`,
        "This syntactically valid specification URI is not supported.",
      ));
    }
    if (typeof uri === "string" && typeof specification === "string") {
      specifications.set(uri, specification);
    }
  }

  if (issues.length > 0) return { issues, unsupported, channels: [] };

  const critical = policy.critical_extensions?.includes(CSAF_EXTENSION_ID) ?? false;
  if (critical) {
    unsupported.unshift(capabilityIssue(
      "extension-critical",
      "/critical_extensions",
      "The CSAF extension cannot be marked critical.",
    ));
  }
  if (unsupported.length > 0) return { issues, unsupported, channels: [] };

  const channels = policy.contact.channels
    .filter((uri) => declared.has(uri))
    .map((uri) => ({ uri, specification: specifications.get(uri)! }));
  return { issues, unsupported, channels };
}

/**
 * Assesses CSAF metadata separately from core policy validity. Pass raw JSON text
 * when duplicate-member detection is required; duplicates cannot be recovered
 * from an already-parsed JavaScript object.
 */
export function assessCsafCapability(
  input: unknown,
  options: ValidationOptions = {},
): CsafCapabilityAssessment {
  const validation = coreValidation(input, { ...options, checkExpiry: false });
  if (!validation.valid || !validation.policy) {
    return { coreValid: false, issues: validation.issues };
  }

  const policy = validation.policy;
  if (!Object.hasOwn(policy.extensions ?? {}, CSAF_EXTENSION_ID)) {
    return { coreValid: true, state: "not-advertised", channels: [], issues: [] };
  }

  const assessed = inspectDeclaration(policy, policy.extensions?.[CSAF_EXTENSION_ID]);
  if (assessed.issues.length > 0) {
    return { coreValid: true, state: "invalid", channels: [], issues: assessed.issues };
  }
  if (assessed.unsupported.length > 0) {
    return { coreValid: true, state: "unsupported", channels: [], issues: assessed.unsupported };
  }
  return { coreValid: true, state: "advertised", channels: assessed.channels, issues: [] };
}

/** Assesses an advertised declaration for current use as a host statement. */
export function assessCsafHostDeclaration(
  input: unknown,
  authority: AuthorityEvidence | null,
  retrieval: PolicyRetrievalContext | undefined,
  options: ValidationOptions = {},
): CsafHostDeclarationAssessment {
  const now = options.now ?? new Date();
  const capability = assessCsafCapability(input, { ...options, now });
  if (!capability.coreValid) {
    return { usable: false, capability, issues: capability.issues };
  }

  const issues: ValidationIssue[] = [];
  if (capability.state === "not-advertised") {
    issues.push(validationIssue(
      "csaf_declaration_not_advertised",
      `/extensions/${pointerPart(CSAF_EXTENSION_ID)}`,
      "The policy does not advertise the CSAF vulnerability-report capability.",
    ));
  } else if (capability.state === "invalid" || capability.state === "unsupported") {
    const code = capability.state === "invalid"
      ? "csaf_declaration_invalid"
      : "csaf_declaration_unsupported";
    issues.push(...capability.issues.map((entry) => validationIssue(code, entry.path, entry.message)));
  }

  const current = coreValidation(input, { ...options, now, checkExpiry: true });
  if (!current.valid || !current.policy) {
    issues.push(...current.issues);
  } else if ((current.policy.critical_extensions ?? []).length > 0) {
    issues.push(validationIssue(
      "policy_critical_extension_unsupported",
      "/critical_extensions",
      "The policy contains critical behavior that this host assessment does not support.",
    ));
  }

  if (authority === null) {
    issues.push(validationIssue(
      "authority_evidence_missing",
      "",
      "Current host use requires established Authority evidence.",
    ));
  } else {
    issues.push(...authorityEvidenceIssues(authority, now));
    issues.push(...policyRetrievalIssues(retrieval, authority, options.allowApplicationJson === true));
  }

  return { usable: capability.state === "advertised" && issues.length === 0, capability, issues };
}
