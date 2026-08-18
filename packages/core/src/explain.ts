import type { CvdPolicyDocument } from "./types.js";

export interface ExplainItem {
  /** Translation key for the label. */
  labelKey: string;
  /** Either a literal value or a translation key when `valueIsKey` is set. */
  value: string;
  valueIsKey?: boolean;
  params?: Record<string, string | number>;
}

export interface ExplainSection {
  key: string;
  severity: "neutral" | "permissive" | "restrictive";
  items: ExplainItem[];
}

const SEVERITY_BY_POSTURE = {
  open: "permissive",
  limited: "neutral",
  report_only: "neutral",
  prohibited: "restrictive",
} as const;

/**
 * Turns a document into display sections. Deliberately carries no rating:
 * no score, no maturity level, no comparison between organisations.
 */
export function explain(doc: CvdPolicyDocument): ExplainSection[] {
  const sections: ExplainSection[] = [];

  sections.push({
    key: "header",
    severity: "neutral",
    items: [
      { labelKey: "explain.organization", value: doc.organization?.name ?? "" },
      ...(doc.organization?.country
        ? [{ labelKey: "explain.country", value: doc.organization.country }]
        : []),
      { labelKey: "explain.valid_until", value: doc.expires ?? "" },
      ...(doc.updated ? [{ labelKey: "explain.updated", value: doc.updated }] : []),
    ],
  });

  const posture = doc.research?.posture;
  sections.push({
    key: "research",
    severity: posture ? SEVERITY_BY_POSTURE[posture] : "neutral",
    items: [
      { labelKey: "explain.posture", value: `posture.${posture}.headline`, valueIsKey: true },
      ...(doc.research?.statement
        ? [{ labelKey: "explain.statement", value: doc.research.statement }]
        : []),
    ],
  });

  const web = doc.scope?.web ?? [];
  const products = doc.scope?.products ?? [];
  sections.push({
    key: "scope",
    severity: "neutral",
    items: [
      {
        labelKey: "explain.in_scope_domains",
        value: String(web.filter((entry) => entry.state === "in").length),
      },
      {
        labelKey: "explain.in_scope_products",
        value: String(products.filter((product) => (product.state ?? "in") === "in").length),
      },
      {
        labelKey: "explain.out_of_scope",
        value: String(web.filter((entry) => entry.state === "out").length),
      },
      {
        labelKey: "explain.precedence",
        value: `precedence.${doc.scope?.precedence}`,
        valueIsKey: true,
      },
    ],
  });

  const preferred =
    doc.contact?.channels?.find((channel) => channel.preferred) ?? doc.contact?.channels?.[0];
  sections.push({
    key: "contact",
    severity: "neutral",
    items: [
      ...(preferred ? [{ labelKey: "explain.report_to", value: preferred.value }] : []),
      {
        labelKey: "explain.encryption",
        value: (doc.contact?.encryption ?? []).length > 0 ? "explain.pgp_available" : "explain.none",
        valueIsKey: true,
      },
      ...(doc.contact?.languages?.length
        ? [{ labelKey: "explain.languages", value: doc.contact.languages.join(", ") }]
        : []),
      ...(doc.contact?.response_target?.acknowledge_within_hours
        ? [
            {
              labelKey: "explain.response_within",
              value: "explain.hours",
              valueIsKey: true,
              params: { count: doc.contact.response_target.acknowledge_within_hours },
            },
          ]
        : []),
    ],
  });

  if (doc.testing) {
    const rules = doc.testing.rules ?? [];
    sections.push({
      key: "testing",
      severity: doc.testing.default === "allowed" ? "permissive" : "restrictive",
      items: [
        {
          labelKey: "explain.testing_default",
          value: `testing.default.${doc.testing.default}`,
          valueIsKey: true,
        },
        ...rules.map((rule) => ({
          labelKey: `activity.${rule.activity}`,
          value: `testing.state.${rule.state}`,
          valueIsKey: true,
          params: {
            conditions: rule.conditions ? Object.keys(rule.conditions).length : 0,
            rps: rule.conditions?.max_requests_per_second ?? 0,
          },
        })),
      ],
    });
  }

  const requirements = doc.report_requirements;
  if (requirements) {
    sections.push({
      key: "report_requirements",
      severity: "neutral",
      items: [
        {
          labelKey: "explain.required_fields",
          value: requirements.required_fields.map((field) => `field.${field}`).join(","),
          valueIsKey: true,
        },
        ...(requirements.proof_of_exploitation
          ? [
              {
                labelKey: "explain.proof_of_exploitation",
                value: `proof.${requirements.proof_of_exploitation}`,
                valueIsKey: true,
              },
            ]
          : []),
      ],
    });
  }

  if (doc.disclosure) {
    sections.push({
      key: "disclosure",
      severity: "neutral",
      items: [
        { labelKey: "explain.model", value: `disclosure.${doc.disclosure.model}`, valueIsKey: true },
        ...(doc.disclosure.deadline_days
          ? [
              {
                labelKey: "explain.deadline",
                value: "explain.days",
                valueIsKey: true,
                params: { count: doc.disclosure.deadline_days },
              },
            ]
          : []),
        ...(doc.disclosure.advisory_url
          ? [{ labelKey: "explain.advisories", value: doc.disclosure.advisory_url }]
          : []),
      ],
    });
  }

  return sections;
}
