import type { ErrorObject } from "ajv";
import { v1 as validateSchema } from "../../generated/validators.js";
import { DuplicateMemberError, parseJsonText } from "./parse.js";
import {
  normalizeHost,
  normalizePath,
} from "./scope.js";
import type {
  CvdPolicyDocument,
  ReasonCode,
  ValidationIssue,
  ValidationOptions,
  ValidationResult,
} from "./types.js";

const GRANDFATHERED = new Set([
  "art-lojban",
  "cel-gaulish",
  "en-gb-oed",
  "i-ami",
  "i-bnn",
  "i-default",
  "i-enochian",
  "i-hak",
  "i-klingon",
  "i-lux",
  "i-mingo",
  "i-navajo",
  "i-pwn",
  "i-tao",
  "i-tay",
  "i-tsu",
  "no-bok",
  "no-nyn",
  "sgn-be-fr",
  "sgn-be-nl",
  "sgn-ch-de",
  "zh-guoyu",
  "zh-hakka",
  "zh-min",
  "zh-min-nan",
  "zh-xiang",
]);

const issue = (code: ReasonCode, path = ""): ValidationIssue => ({
  level: "error",
  code,
  path,
  message: code,
});

const escapePointer = (value: string): string =>
  value.replaceAll("~", "~0").replaceAll("/", "~1");

function schemaIssue(error: ErrorObject): ValidationIssue | null {
  if (["if", "allOf", "anyOf", "oneOf"].includes(error.keyword)) return null;
  const missing =
    error.keyword === "required"
      ? `/${escapePointer(String(error.params["missingProperty"]))}`
      : "";
  return issue("policy_schema_invalid", `${error.instancePath}${missing}`);
}

function isLanguageTag(value: string): boolean {
  if (GRANDFATHERED.has(value.toLowerCase())) return true;
  try {
    Intl.getCanonicalLocales(value);
    return true;
  } catch {
    return false;
  }
}

function uriHasForbiddenUserinfo(value: string, rejectFragment = false): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.username || url.password || (rejectFragment && url.hash));
  } catch {
    return true;
  }
}

export function semanticIssues(
  doc: CvdPolicyDocument,
  options: ValidationOptions = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const updated = Date.parse(doc.last_updated);
  const expires = Date.parse(doc.expires);
  const now = options.now ?? new Date();

  if (expires <= updated)
    issues.push(issue("policy_time_order_invalid", "/expires"));
  if (options.checkExpiry !== false && expires <= now.getTime()) {
    issues.push(issue("policy_expired", "/expires"));
  }

  if (doc.organization.uri && uriHasForbiddenUserinfo(doc.organization.uri)) {
    issues.push(issue("policy_uri_invalid", "/organization/uri"));
  }
  for (const [index, channel] of doc.contact.channels.entries()) {
    if (uriHasForbiddenUserinfo(channel, true))
      issues.push(issue("policy_uri_invalid", `/contact/channels/${index}`));
  }
  for (const [index, encryption] of (doc.contact.encryption ?? []).entries()) {
    if (uriHasForbiddenUserinfo(encryption))
      issues.push(issue("policy_uri_invalid", `/contact/encryption/${index}`));
  }
  for (const [index, language] of (
    doc.contact.preferred_languages ?? []
  ).entries()) {
    if (!isLanguageTag(language)) {
      issues.push(
        issue(
          "policy_language_tag_invalid",
          `/contact/preferred_languages/${index}`,
        ),
      );
    }
  }

  const ids = new Set<string>();
  const webById = new Map<string, "in" | "out">();
  for (const [index, entry] of (doc.reporting_scope.web ?? []).entries()) {
    if (ids.has(entry.id))
      issues.push(
        issue("policy_scope_id_duplicate", `/reporting_scope/web/${index}/id`),
      );
    ids.add(entry.id);
    webById.set(entry.id, entry.state);
    try {
      const normalized = normalizeHost(entry.host);
      normalizePath(entry.path_prefix);
      if (normalized.ip && entry.include_subdomains) {
        issues.push(
          issue(
            "policy_scope_invalid",
            `/reporting_scope/web/${index}/include_subdomains`,
          ),
        );
      }
    } catch {
      issues.push(
        issue("policy_scope_invalid", `/reporting_scope/web/${index}/host`),
      );
    }
  }
  for (const [index, entry] of (doc.reporting_scope.products ?? []).entries()) {
    if (ids.has(entry.id)) {
      issues.push(
        issue(
          "policy_scope_id_duplicate",
          `/reporting_scope/products/${index}/id`,
        ),
      );
    }
    ids.add(entry.id);
  }
  for (const [index, rule] of (doc.testing?.rules ?? []).entries()) {
    if (ids.has(rule.id))
      issues.push(
        issue("policy_scope_id_duplicate", `/testing/rules/${index}/id`),
      );
    ids.add(rule.id);
    for (const [targetIndex, targetId] of (rule.target_ids ?? []).entries()) {
      if (webById.get(targetId) !== "in") {
        issues.push(
          issue(
            "policy_target_reference_invalid",
            `/testing/rules/${index}/target_ids/${targetIndex}`,
          ),
        );
      }
    }
    if (
      (doc.research.posture === "report_only" ||
        doc.research.posture === "prohibited") &&
      rule.state === "permitted"
    ) {
      issues.push(
        issue("policy_posture_conflict", `/testing/rules/${index}/state`),
      );
    }
  }
  for (const [index, extension] of (doc.critical_extensions ?? []).entries()) {
    if (!Object.hasOwn(doc.extensions ?? {}, extension)) {
      issues.push(
        issue(
          "policy_critical_extension_missing",
          `/critical_extensions/${index}`,
        ),
      );
    }
  }

  const unique = new Map(
    issues.map((entry) => [`${entry.code}@${entry.path}`, entry]),
  );
  return [...unique.values()];
}

/** Validates an already-parsed value. Duplicate-member safety cannot be recovered here. */
export function validatePolicy(
  input: unknown,
  options: ValidationOptions = {},
): ValidationResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { valid: false, issues: [issue("policy_schema_invalid")] };
  }
  const record = input as Record<string, unknown>;
  if (
    Object.hasOwn(record, "cvd_policy") &&
    Number.isInteger(record["cvd_policy"]) &&
    record["cvd_policy"] !== 1
  ) {
    return {
      valid: false,
      issues: [issue("policy_version_unsupported", "/cvd_policy")],
    };
  }
  if (!validateSchema(input)) {
    const mapped = (validateSchema.errors ?? [])
      .map(schemaIssue)
      .filter((entry): entry is ValidationIssue => entry !== null);
    const unique = new Map(
      mapped.map((entry) => [`${entry.code}@${entry.path}`, entry]),
    );
    return { valid: false, issues: [...unique.values()] };
  }
  const policy = input as CvdPolicyDocument;
  const issues = semanticIssues(policy, options);
  return issues.length
    ? { valid: false, issues }
    : { valid: true, issues: [], policy };
}

/** Duplicate-aware policy text parsing followed by structural and semantic validation. */
export function parsePolicyText(
  text: string,
  options: ValidationOptions = {},
): ValidationResult {
  try {
    return validatePolicy(parseJsonText(text), options);
  } catch (error) {
    return {
      valid: false,
      issues: [
        issue(
          error instanceof DuplicateMemberError
            ? "policy_duplicate_member"
            : "policy_parse_error",
          error instanceof DuplicateMemberError ? error.path : "",
        ),
      ],
    };
  }
}
