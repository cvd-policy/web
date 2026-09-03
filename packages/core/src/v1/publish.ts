import {
  isSignedSecurityTxt,
  upsertSecurityTxtField,
} from "../securitytxt.js";
import { validatePolicy } from "./validate.js";
import type {
  CvdPolicyDocument,
  ValidationIssue,
  ValidationOptions,
} from "./types.js";

export type CvdPolicyInput = Omit<CvdPolicyDocument, "cvd_policy">;

export class PolicyGenerationError extends Error {
  constructor(readonly issues: ValidationIssue[]) {
    super("generated V1 policy is invalid");
    this.name = "PolicyGenerationError";
  }
}

function httpsUri(value: string): string {
  if (
    !/^https:\/\/[A-Za-z0-9\-._~%!$&'()*+,;=:\[\]]+(?:[/?][A-Za-z0-9\-._~:/?@[\]!$&'()*+,;=%]*)?$/i.test(value) ||
    /%(?![0-9a-f]{2})/i.test(value)
  ) {
    throw new TypeError("expected a URI with valid percent encoding");
  }
  const uri = new URL(value);
  if (
    uri.protocol !== "https:" ||
    uri.username ||
    uri.password ||
    value.includes("#")
  ) {
    throw new TypeError("expected an absolute HTTPS URI without userinfo or fragment");
  }
  return uri.href;
}

/** Creates and validates a V1 document without adding publication metadata. */
export function generatePolicy(
  input: CvdPolicyInput,
  options: ValidationOptions = {},
): CvdPolicyDocument {
  const result = validatePolicy({ cvd_policy: 1, ...input }, options);
  if (!result.valid || !result.policy) {
    throw new PolicyGenerationError(result.issues);
  }
  return result.policy;
}

export interface SecurityTxtOptions {
  policyUri: string;
  securityTxtUri?: string;
  humanPolicyUris?: string[];
}

/** Creates a complete RFC 9116 file that discovers the V1 policy. */
export function securityTxt(
  policy: CvdPolicyDocument,
  options: SecurityTxtOptions,
): string {
  const lines = policy.contact.channels.map((value) => `Contact: ${value}`);
  lines.push(`Expires: ${policy.expires}`);
  for (const value of policy.contact.encryption ?? []) {
    lines.push(`Encryption: ${value}`);
  }
  if (policy.contact.preferred_languages?.length) {
    lines.push(
      `Preferred-Languages: ${policy.contact.preferred_languages.join(", ")}`,
    );
  }
  if (options.securityTxtUri) {
    lines.push(`Canonical: ${httpsUri(options.securityTxtUri)}`);
  }
  for (const value of options.humanPolicyUris ?? []) {
    lines.push(`Policy: ${httpsUri(value)}`);
  }
  lines.push(`CVD-Policy: ${httpsUri(options.policyUri)}`);
  return `${lines.join("\n")}\n`;
}

/** Replaces every CVD-Policy field while preserving all other file content. */
export function mergeSecurityTxt(raw: string, policyUri: string): string {
  if (isSignedSecurityTxt(raw)) {
    throw new Error("cannot modify a signed security.txt; re-sign it manually");
  }
  return upsertSecurityTxtField(raw, "CVD-Policy", httpsUri(policyUri));
}
