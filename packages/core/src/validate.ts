import AjvModule from "ajv/dist/2020.js";
import type { ErrorObject, ValidateFunction } from "ajv";
import addFormatsModule from "ajv-formats";
import { LATEST_VERSION, schemas } from "./schema.generated.js";
import {
  hostOf,
  isAtOrUnder,
  isHostTarget,
  isPrivateAddress,
  isUnusablePattern,
  patternsOverlap,
  scopeStateFor,
} from "./scope.js";
import type { CvdPolicyDocument } from "./types.js";
import { SUPPORTED_VERSIONS } from "./types.js";

const Ajv = (AjvModule as unknown as { default?: typeof AjvModule }).default ?? AjvModule;
const addFormats =
  (addFormatsModule as unknown as { default?: typeof addFormatsModule }).default ?? addFormatsModule;

export interface ValidationIssue {
  level: "error" | "warning" | "info";
  /** Stable identifier such as `EXPIRES_PAST`. */
  code: string;
  /** JSON Pointer to the offending value. */
  path: string;
  /** Translation key, not finished text. */
  message: string;
  /** Values for interpolation into the translated text. */
  params?: Record<string, string | number>;
  hint?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  version: string | null;
}

export interface ValidateOptions {
  /** Reference time for date checks. Defaults to the current time. */
  now?: Date;
  /** URL the document was retrieved from, used to check `canonical`. */
  retrievedFrom?: string;
}

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Every published version is compiled: a 0.1 document is judged by the rules it
// was written for, not by the newest ones.
const compiled: Record<string, ValidateFunction> = Object.fromEntries(
  Object.entries(schemas).map(([version, definition]) => [version, ajv.compile(definition)]),
);

/** The schema a document asks for, falling back to the newest. */
function schemaFor(version: unknown): ValidateFunction {
  return (typeof version === "string" && compiled[version]) || compiled[LATEST_VERSION]!;
}

/** Milliseconds in a day. */
const DAY = 86_400_000;

const key = (code: string) => `issue.${code.toLowerCase()}`;

const issue = (
  level: ValidationIssue["level"],
  code: string,
  path: string,
  params?: Record<string, string | number>,
): ValidationIssue => ({ level, code, path, message: key(code), ...(params ? { params } : {}) });

/** Turns one Ajv error into a stable code and JSON Pointer. */
function mapSchemaError(error: ErrorObject): ValidationIssue | null {
  const at = error.instancePath;

  switch (error.keyword) {
    case "if":
    case "allOf":
    case "anyOf":
    case "oneOf":
      return null;

    case "required": {
      const missing = String(error.params["missingProperty"]);
      const path = `${at}/${missing}`;
      if (at === "" && missing === "testing") return issue("error", "TESTING_REQUIRED", path);
      return issue("error", "REQUIRED_MISSING", path, { field: missing });
    }

    case "const":
      if (at === "/cvd_policy") {
        return issue("error", "VERSION_UNSUPPORTED", at, {
          expected: SUPPORTED_VERSIONS.join(", "),
        });
      }
      return issue("error", "ENUM_INVALID", at);

    case "enum":
      if (at === "/research/posture") return issue("error", "POSTURE_UNKNOWN", at);
      return issue("error", "ENUM_INVALID", at, {
        allowed: (error.params["allowedValues"] as string[] | undefined)?.join(", ") ?? "",
      });

    case "pattern":
      if (at === "/canonical") return issue("error", "CANONICAL_NOT_HTTPS", at);
      if (at.startsWith("/report_requirements/intake/")) {
        return issue("error", "INTAKE_NOT_HTTPS", at);
      }
      return issue("error", "PATTERN_INVALID", at);

    case "format":
      if (at === "/canonical") return issue("error", "CANONICAL_NOT_HTTPS", at);
      if (at.startsWith("/report_requirements/intake/")) {
        return issue("error", "INTAKE_NOT_HTTPS", at);
      }
      return issue("error", "FORMAT_INVALID", at, { format: String(error.params["format"]) });

    case "maxItems":
      if (at === "/testing/rules") return issue("error", "POSTURE_CONTRADICTION", at);
      return issue("error", "MAX_ITEMS", at);

    case "minItems":
      return issue("error", "MIN_ITEMS", at);

    case "maxLength":
      return issue("error", "STRING_TOO_LONG", at, { limit: Number(error.params["limit"]) });

    case "minLength":
      return issue("error", "STRING_EMPTY", at);

    case "minimum":
    case "exclusiveMinimum":
      return issue("error", "NUMBER_TOO_SMALL", at, { limit: Number(error.params["limit"]) });

    case "maximum":
    case "exclusiveMaximum":
      return issue("error", "NUMBER_TOO_LARGE", at, { limit: Number(error.params["limit"]) });

    case "type":
      return issue("error", "TYPE_INVALID", at, { expected: String(error.params["type"]) });

    default:
      return issue("error", "SCHEMA_INVALID", at, { keyword: error.keyword });
  }
}

/** Checks the specification's rules that JSON Schema cannot express. */
function semanticIssues(doc: CvdPolicyDocument, options: ValidateOptions): ValidationIssue[] {
  const now = options.now ?? new Date();
  const found: ValidationIssue[] = [];

  const expires = Date.parse(doc.expires ?? "");
  if (!Number.isNaN(expires)) {
    if (expires <= now.getTime()) {
      found.push(issue("error", "EXPIRES_PAST", "/expires", { expires: doc.expires }));
    } else if (expires - now.getTime() > 365 * DAY) {
      found.push(issue("warning", "EXPIRES_FAR", "/expires", { expires: doc.expires }));
    }
  }

  if (options.retrievedFrom && typeof doc.canonical === "string") {
    const normalise = (url: string) => url.trim().replace(/\/+$/, "").toLowerCase();
    if (normalise(doc.canonical) !== normalise(options.retrievedFrom)) {
      found.push(
        issue("warning", "CANONICAL_MISMATCH", "/canonical", {
          canonical: doc.canonical,
          retrieved: options.retrievedFrom,
        }),
      );
    }
  }

  const web = doc.scope?.web ?? [];
  const products = doc.scope?.products ?? [];
  if (web.length === 0 && products.length === 0) {
    found.push(issue("warning", "SCOPE_EMPTY", "/scope"));
  }

  web.forEach((entry, index) => {
    const earlier = web.findIndex(
      (other, otherIndex) =>
        otherIndex < index && other.state !== entry.state && patternsOverlap(other.pattern, entry.pattern),
    );
    if (earlier !== -1) {
      found.push(
        issue("info", "SCOPE_OVERLAP", `/scope/web/${index}`, {
          pattern: entry.pattern,
          other: web[earlier]?.pattern ?? "",
        }),
      );
    }
  });

  // A document speaks for its own domain. Entries naming someone else's hosts
  // are claims about third-party systems and cannot grant permission.
  if (typeof doc.canonical === "string" && doc.canonical !== "") {
    const canonicalHost = hostOf(doc.canonical);

    web.forEach((entry, index) => {
      const path = `/scope/web/${index}/pattern`;

      if (typeof entry.pattern === "string" && isUnusablePattern(entry.pattern)) {
        found.push(issue("warning", "SCOPE_PATTERN_UNUSABLE", path, { pattern: entry.pattern }));
        return;
      }

      if (typeof entry.pattern === "string" && isPrivateAddress(hostOf(entry.pattern))) {
        found.push(issue("warning", "SCOPE_PRIVATE_ADDRESS", path, { pattern: entry.pattern }));
        return;
      }

      if (entry.state !== "in" || !isHostTarget(entry.pattern)) return;

      // Same rule the evaluator applies, so a clean document is one that tools
      // will actually act on.
      if (!isAtOrUnder(canonicalHost, entry.pattern)) {
        found.push(
          issue("warning", "SCOPE_FOREIGN_HOST", path, {
            pattern: entry.pattern,
            own: canonicalHost,
          }),
        );
      }
    });
  }

  products.forEach((product, index) => {
    if (product.supported_until && Date.parse(product.supported_until) < now.getTime()) {
      found.push(
        issue("info", "PRODUCT_SUPPORT_PAST", `/scope/products/${index}/supported_until`, {
          name: product.name,
          date: product.supported_until,
        }),
      );
    }
  });

  // A published file with credentials in it is a leak, not a location.
  if (typeof doc.canonical === "string" && /^[a-z][a-z0-9+.-]*:\/\/[^/]*@/i.test(doc.canonical)) {
    found.push(issue("error", "CANONICAL_HAS_CREDENTIALS", "/canonical"));
  }

  // A published endpoint that needs a secret is a leaked secret.
  const intake = doc.report_requirements?.intake;
  if (intake) {
    const credentials = /^[a-z][a-z0-9+.-]*:\/\/[^/]*@/i;
    for (const [field, value] of [
      ["url", intake.url],
      ["schema", intake.schema],
    ] as const) {
      if (typeof value === "string" && credentials.test(value)) {
        found.push(
          issue("error", "INTAKE_HAS_CREDENTIALS", `/report_requirements/intake/${field}`),
        );
      }
    }

    // Delegation is the normal case, but the author should see where reports go.
    if (
      typeof doc.canonical === "string" &&
      typeof intake.url === "string" &&
      hostOf(intake.url) !== "" &&
      !isAtOrUnder(hostOf(doc.canonical), intake.url)
    ) {
      found.push(
        issue("info", "INTAKE_THIRD_PARTY", "/report_requirements/intake/url", {
          host: hostOf(intake.url),
          own: hostOf(doc.canonical),
        }),
      );
    }

    if (doc.cvd_policy === "0.1") {
      found.push(
        issue("warning", "INTAKE_NEEDS_VERSION", "/cvd_policy", { expected: "0.2" }),
      );
    }

    if (intake.profile !== undefined && intake.schema === undefined) {
      found.push(
        issue("info", "INTAKE_PROFILE_WITHOUT_SCHEMA", "/report_requirements/intake", {
          profile: intake.profile,
        }),
      );
    }
  }

  const posture = doc.research?.posture;
  const rules = doc.testing?.rules ?? [];

  if ((posture === "prohibited" || posture === "report_only") && rules.length > 0) {
    found.push(issue("error", "POSTURE_CONTRADICTION", "/testing/rules", { posture }));
  }

  if ((posture === "open" || posture === "limited") && !doc.testing) {
    found.push(issue("error", "TESTING_REQUIRED", "/testing", { posture }));
  }

  if ((posture === "prohibited" || posture === "report_only") && doc.testing?.default === "allowed") {
    found.push(issue("warning", "TESTING_IGNORED", "/testing/default", { posture }));
  }

  // `allowed` with nothing ruled out permits every activity, destructive ones
  // included. Saying so is legitimate, but it is rarely what was meant.
  if (
    doc.testing?.default === "allowed" &&
    !rules.some((rule) => rule.state === "prohibited") &&
    (posture === "open" || posture === "limited")
  ) {
    found.push(issue("warning", "TESTING_DEFAULT_BROAD", "/testing/default", { posture }));
  }

  // Only the first rule for an activity applies. A later one is dead text, and
  // a reader who assumes the opposite draws the wrong conclusion.
  rules.forEach((rule, index) => {
    const first = rules.findIndex((other) => other.activity === rule.activity);
    if (first !== index) {
      found.push(
        issue("warning", "TESTING_RULE_DUPLICATE", `/testing/rules/${index}/activity`, {
          activity: rule.activity,
          first,
        }),
      );
    }
  });

  rules.forEach((rule, index) => {
    if (rule.state !== "allowed") return;
    const targets = rule.conditions?.targets ?? [];

    // An empty list reads as "no targets" to a person and as "no restriction"
    // to a parser. Neither reading should be left to chance.
    if (rule.conditions?.targets && targets.length === 0) {
      found.push(
        issue("warning", "CONDITION_TARGETS_EMPTY", `/testing/rules/${index}/conditions/targets`, {
          activity: rule.activity,
        }),
      );
    }

    const ownDomain = typeof doc.canonical === "string" ? doc.canonical : "";
    const foreign = ownDomain
      ? targets.filter((target) => isHostTarget(target) && !isAtOrUnder(ownDomain, target))
      : [];

    if (foreign.length > 0) {
      found.push(
        issue("warning", "TESTING_TARGET_FOREIGN", `/testing/rules/${index}/conditions/targets`, {
          activity: rule.activity,
          target: foreign[0] ?? "",
          own: hostOf(ownDomain),
        }),
      );
    }

    // A foreign target is out of scope by definition. Reporting both would be
    // two warnings for one mistake, and the foreign one says more.
    if (foreign.length === targets.length && foreign.length > 0) return;

    const unreachable = targets.filter((target) => scopeStateFor(doc.scope, target) === "out");
    if (targets.length > 0 && unreachable.length === targets.length) {
      found.push(
        issue("warning", "TESTING_UNREACHABLE", `/testing/rules/${index}`, {
          activity: rule.activity,
          target: unreachable[0] ?? "",
        }),
      );
    }
  });

  if (posture === "open" && (doc.contact?.encryption ?? []).length === 0) {
    found.push(issue("warning", "CONTACT_MISSING_ENCRYPTION", "/contact"));
  }

  return found;
}

const RANK = { error: 0, warning: 1, info: 2 } as const;

/** Validates a parsed document against the schema and the semantic rules. */
export function validate(input: unknown, options: ValidateOptions = {}): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    issues.push(issue("error", "TYPE_INVALID", "", { expected: "object" }));
    return { valid: false, issues, version: null };
  }

  const doc = input as CvdPolicyDocument;
  const version = typeof doc.cvd_policy === "string" ? doc.cvd_policy : null;

  const validateSchema = schemaFor(doc.cvd_policy);
  if (!validateSchema(doc)) {
    for (const error of validateSchema.errors ?? []) {
      const mapped = mapSchemaError(error);
      if (mapped) issues.push(mapped);
    }
  }

  for (const semantic of semanticIssues(doc, options)) issues.push(semantic);

  // Two checks can reach the same conclusion at the same place — the schema and
  // the semantic rule both catch a posture that contradicts its testing rules.
  // Keep the one carrying parameters: dropping it leaves the placeholder in the
  // rendered message, so the reader sees "the posture {posture}".
  const byId = new Map<string, ValidationIssue>();
  for (const entry of issues) {
    const id = `${entry.code}@${entry.path}`;
    const kept = byId.get(id);
    if (!kept || (!kept.params && entry.params)) byId.set(id, entry);
  }

  const unique = [...byId.values()];
  unique.sort((a, b) => RANK[a.level] - RANK[b.level]);

  return {
    valid: !unique.some((entry) => entry.level === "error"),
    issues: unique,
    version,
  };
}

/** Parses JSON text and validates it. Reports unparsable input as an issue. */
export function validateText(raw: string, options: ValidateOptions = {}): ValidationResult {
  try {
    return validate(JSON.parse(raw), options);
  } catch (error) {
    return {
      valid: false,
      issues: [
        issue("error", "JSON_PARSE", "", { detail: error instanceof Error ? error.message : "" }),
      ],
      version: null,
    };
  }
}
