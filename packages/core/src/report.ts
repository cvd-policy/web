import AjvModule from "ajv/dist/2020.js";
import type { ValidateFunction } from "ajv";
import addFormatsModule from "ajv-formats";
import { reportProfile } from "./schema.generated.js";
import type { ValidationIssue, ValidationResult } from "./validate.js";

const Ajv = (AjvModule as unknown as { default?: typeof AjvModule }).default ?? AjvModule;
const addFormats =
  (addFormatsModule as unknown as { default?: typeof addFormatsModule }).default ?? addFormatsModule;

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateProfile: ValidateFunction = ajv.compile(reportProfile);

/** A vulnerability report following the `report-0.1` profile. */
export interface CvdReport {
  report: "0.1";
  title: string;
  target: string;
  description: string;
  reproduction?: string;
  impact?: string;
  product?: string;
  version?: string;
  endpoint?: string;
  preconditions?: string[];
  weakness?: { cwe?: string[]; note?: string };
  identifiers?: { cve?: string[]; advisory?: string[] };
  expected_behaviour?: string;
  actual_behaviour?: string;
  references?: string[];
  exploitation?: { state: "yes" | "no" | "unknown"; evidence?: string; observed_at?: string };
  coordination?: Record<string, unknown>;
  reporter?: {
    name?: string;
    contact?: string;
    languages?: string[];
    consent?: {
      share_contact_with_affected_party?: boolean;
      public_credit?: boolean;
      credit_name?: string;
    };
  };
  attachments?: Array<{ filename: string; media_type?: string; size_bytes?: number; sha256?: string }>;
  submitted_at?: string;
  [key: string]: unknown;
}

const key = (code: string) => `issue.${code.toLowerCase()}`;
const issue = (
  level: ValidationIssue["level"],
  code: string,
  path: string,
  params?: Record<string, string | number>,
): ValidationIssue => ({ level, code, path, message: key(code), ...(params ? { params } : {}) });

/**
 * Validates an incoming report against the `report-0.1` profile.
 *
 * Only title, target and description are required. Everything else improves
 * triage but must never stop someone from reporting.
 */
export function validateReport(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return {
      valid: false,
      issues: [issue("error", "TYPE_INVALID", "", { expected: "object" })],
      version: null,
    };
  }

  const report = input as CvdReport;
  const issues: ValidationIssue[] = [];

  if (!validateProfile(report)) {
    for (const error of validateProfile.errors ?? []) {
      const at = error.instancePath;
      switch (error.keyword) {
        case "if":
        case "allOf":
          break;
        case "required":
          issues.push(
            issue("error", "REQUIRED_MISSING", `${at}/${String(error.params["missingProperty"])}`, {
              field: String(error.params["missingProperty"]),
            }),
          );
          break;
        case "const":
          issues.push(issue("error", "VERSION_UNSUPPORTED", at, { expected: "0.1" }));
          break;
        case "enum":
          issues.push(issue("error", "ENUM_INVALID", at));
          break;
        case "pattern":
          issues.push(issue("error", "PATTERN_INVALID", at));
          break;
        case "minLength":
          issues.push(issue("error", "STRING_EMPTY", at));
          break;
        case "format":
          issues.push(issue("error", "FORMAT_INVALID", at, { format: String(error.params["format"]) }));
          break;
        default:
          issues.push(issue("error", "SCHEMA_INVALID", at, { keyword: error.keyword }));
      }
    }
  }

  // Advice, never a reason to reject: a report without these is still a report.
  if (!report.reproduction) issues.push(issue("info", "REPORT_NO_REPRODUCTION", "/reproduction"));
  if (!report.impact) issues.push(issue("info", "REPORT_NO_IMPACT", "/impact"));
  if (!report.exploitation) issues.push(issue("info", "REPORT_NO_EXPLOITATION", "/exploitation"));

  const consent = report.reporter?.consent;
  if (consent?.public_credit && !report.reporter?.name && !consent.credit_name) {
    issues.push(issue("warning", "REPORT_CREDIT_WITHOUT_NAME", "/reporter/consent/public_credit"));
  }
  if (consent?.share_contact_with_affected_party && !report.reporter?.contact) {
    issues.push(
      issue("warning", "REPORT_SHARE_WITHOUT_CONTACT", "/reporter/consent/share_contact_with_affected_party"),
    );
  }

  const seen = new Set<string>();
  const unique = issues.filter((entry) => {
    const id = `${entry.code}@${entry.path}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  const RANK = { error: 0, warning: 1, info: 2 } as const;
  unique.sort((a, b) => RANK[a.level] - RANK[b.level]);

  return {
    valid: !unique.some((entry) => entry.level === "error"),
    issues: unique,
    version: typeof report.report === "string" ? report.report : null,
  };
}
