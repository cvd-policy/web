/**
 * Where a validation issue lives in the wizard.
 *
 * Issues carry a JSON pointer into the document; the wizard is a set of steps
 * holding form controls. This is the one place that knows how the two line up,
 * so a reader clicking an error lands on the field that caused it.
 */
export interface IssueTarget {
  /** Step key, matching the wizard's own list. */
  step: string;
  /** id of the control to focus, when the path names one. */
  field?: string;
}

/** First match wins, so intake has to come before report_requirements. */
const STEP_BY_PREFIX: [RegExp, string][] = [
  [/^\/(organization|canonical|cvd_policy|updated)/, "org"],
  [/^\/(research|statement)/, "posture"],
  [/^\/contact/, "contact"],
  [/^\/scope/, "scope"],
  [/^\/testing/, "testing"],
  [/^\/report_requirements\/intake/, "intake"],
  [/^\/report_requirements/, "report"],
  [/^\/disclosure/, "disclosure"],
  [/^\/expires/, "validity"],
];

const FIELD_BY_PATH: Record<string, string> = {
  "/organization/name": "org-name",
  "/organization/country": "org-country",
  "/organization/role": "org-role",
  "/organization/url": "org-url",
  "/canonical": "org-canonical",
  "/expires": "expires",
  "/statement": "statement",
  "/contact/languages": "languages",
  "/testing/default": "testing-default",
  "/scope/precedence": "precedence",
  "/report_requirements/proof_of_exploitation": "proof",
  "/report_requirements/max_attachment_mb": "max-mb",
  "/report_requirements/template": "template",
  "/report_requirements/intake/url": "intake-url",
  "/report_requirements/intake/schema": "intake-schema",
  "/report_requirements/intake/profile": "intake-profile",
  "/report_requirements/intake/max_bytes": "intake-max",
  "/disclosure/deadline_days": "deadline",
};

/** Paths carrying a list index, which the control ids repeat. */
const FIELD_BY_INDEXED_PATH: [RegExp, string][] = [
  [/^\/scope\/web\/(\d+)(\/pattern)?$/, "pattern-"],
  [/^\/scope\/web\/(\d+)\/reason$/, "reason-"],
  [/^\/scope\/products\/(\d+)(\/name)?$/, "product-name-"],
  [/^\/scope\/products\/(\d+)\/supported_until$/, "product-until-"],
  [/^\/testing\/rules\/(\d+)(\/activity)?$/, "activity-"],
  [/^\/testing\/rules\/(\d+)\/conditions\/targets$/, "targets-"],
  [/^\/testing\/rules\/(\d+)\/note$/, "note-"],
];

/**
 * The step and control an issue points at, or undefined when the path belongs
 * to no step — a document-level issue has nothing to scroll to.
 */
export function issueTarget(path: string): IssueTarget | undefined {
  const step = STEP_BY_PREFIX.find(([pattern]) => pattern.test(path))?.[1];
  if (step === undefined) return undefined;

  const direct = FIELD_BY_PATH[path];
  if (direct) return { step, field: direct };

  for (const [pattern, prefix] of FIELD_BY_INDEXED_PATH) {
    const match = path.match(pattern);
    if (match) return { step, field: `${prefix}${match[1]}` };
  }

  // A step with no field still beats leaving the reader where they were.
  return { step };
}
