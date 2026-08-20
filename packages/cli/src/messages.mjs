// English texts for the issue codes the core library reports.
const TEXTS = {
  REQUIRED_MISSING: "the field {field} is missing",
  TESTING_REQUIRED: "this posture invites testing, so testing rules are required",
  VERSION_UNSUPPORTED: "unknown version, expected {expected}",
  ENUM_INVALID: "value is not defined, allowed: {allowed}",
  POSTURE_UNKNOWN: "posture is not defined (open, limited, report_only, prohibited)",
  POSTURE_CONTRADICTION: "testing rules contradict a posture that does not invite testing",
  CANONICAL_NOT_HTTPS: "canonical must be an absolute https URL",
  PATTERN_INVALID: "value does not have the expected shape",
  FORMAT_INVALID: "value is not a valid {format}",
  TYPE_INVALID: "expected {expected}",
  MAX_ITEMS: "too many entries",
  MIN_ITEMS: "at least one entry is required",
  SCHEMA_INVALID: "value breaks the rule {keyword}",
  JSON_PARSE: "not valid JSON: {detail}",
  EXPIRES_PAST: "the expiry date is in the past ({expires})",
  EXPIRES_FAR: "the expiry date is more than twelve months away ({expires})",
  CANONICAL_MISMATCH: "canonical is {canonical}, fetched from {retrieved}",
  CANONICAL_HAS_CREDENTIALS: "canonical contains a username or password",
  SCOPE_PATTERN_UNUSABLE: "{pattern} does not name a host and matches nothing",
  TESTING_IGNORED: "testing rules are ignored for the posture {posture}",
  TESTING_DEFAULT_BROAD: "everything not listed is allowed and nothing is ruled out",
  CONDITION_TARGETS_EMPTY: "the rule for {activity} has an empty target list",
  STRING_TOO_LONG: "longer than {limit} characters",
  STRING_EMPTY: "value must not be empty",
  NUMBER_TOO_SMALL: "number is too small (limit {limit})",
  NUMBER_TOO_LARGE: "number is too large (limit {limit})",
  SCOPE_PRIVATE_ADDRESS: "{pattern} is a private or loopback address",
  INTAKE_NOT_HTTPS: "the intake endpoint must be an absolute https URL",
  INTAKE_HAS_CREDENTIALS: "the intake endpoint contains a username or password",
  INTAKE_THIRD_PARTY: "reports go to {host}, which is outside {own}",
  INTAKE_NEEDS_VERSION: "the document carries intake but declares an older version; set cvd_policy to {expected}",
  INTAKE_PROFILE_WITHOUT_SCHEMA: "profile {profile} is named but no schema URL is given",
  REPORT_NO_REPRODUCTION: "no steps to reproduce (allowed, but triage is slower)",
  REPORT_NO_IMPACT: "no impact given (allowed, but triage is slower)",
  REPORT_NO_EXPLOITATION: "no statement whether this is being exploited",
  REPORT_CREDIT_WITHOUT_NAME: "public credit was asked for, but no name was given",
  REPORT_SHARE_WITHOUT_CONTACT: "sharing contact details was allowed, but none were given",
  SCOPE_EMPTY: "the scope lists neither domains nor products",
  SCOPE_OVERLAP: "{pattern} overlaps with the earlier entry {other}",
  SCOPE_FOREIGN_HOST: "{pattern} is not at or under {own}, where this document is published",
  TESTING_TARGET_FOREIGN: "the rule for {activity} names {target}, which {own} does not cover",
  PRODUCT_SUPPORT_PAST: "support for {name} ended on {date}",
  TESTING_RULE_DUPLICATE: "a second rule for {activity}; only the first one applies",
  TESTING_UNREACHABLE: "the rule for {activity} allows testing, but {target} is out of scope",
  CONTACT_MISSING_ENCRYPTION: "open posture without a way to send encrypted reports",
};

/** Renders one issue as a single line. */
export function describe(issue) {
  const template = TEXTS[issue.code] ?? issue.code;
  const text = template.replace(/\{(\w+)\}/g, (match, name) =>
    issue.params && name in issue.params ? String(issue.params[name]) : match,
  );
  return `${issue.level.padEnd(7)} ${issue.path || "/"}  ${text}  [${issue.code}]`;
}
