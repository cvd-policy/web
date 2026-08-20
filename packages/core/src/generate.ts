import type {
  ContactChannel,
  CvdPolicyDocument,
  Disclosure,
  Intake,
  Posture,
  Precedence,
  ReportField,
  ReportRequirements,
  ScopeProduct,
  ScopeWebEntry,
  TestingRule,
  TestingState,
} from "./types.js";
import { SPEC_VERSION } from "./types.js";

export interface WizardAnswers {
  canonical: string;
  /** Absolute timestamp. Takes precedence over `expiresInMonths`. */
  expires?: string;
  expiresInMonths?: number;
  updated?: string;
  profiles?: string[];

  organization: {
    name: string;
    country?: string;
    role?: "manufacturer" | "operator" | "both" | "other";
    url?: string;
  };

  contact: {
    channels: ContactChannel[];
    languages?: string[];
    pgpUrl?: string;
    pgpFingerprint?: string;
    acknowledgeWithinHours?: number;
    updateIntervalDays?: number;
  };

  posture: Posture;
  statement?: string;

  scope?: {
    precedence?: Precedence;
    web?: ScopeWebEntry[];
    products?: ScopeProduct[];
  };

  testing?: {
    default?: TestingState;
    rules?: TestingRule[];
  };

  reportRequirements?: Partial<ReportRequirements>;

  /** Machine-readable intake, since 0.2. Empty url means: not offered. */
  intake?: {
    url?: string;
    schema?: string;
    profile?: string;
    anonymous?: boolean;
    maxBytes?: number;
    attachments?: "accepted" | "after_contact" | "not_accepted";
  };
  disclosure?: Partial<Disclosure> & { model?: Disclosure["model"] };
}

const DEFAULT_REQUIRED_FIELDS: ReportField[] = [
  "affected_asset",
  "description",
  "reproduction_steps",
  "impact",
];

/** Answers for the quick mode: a valid `report_only` document. */
export function defaultAnswers(): WizardAnswers {
  return {
    canonical: "",
    expiresInMonths: 12,
    organization: { name: "" },
    contact: { channels: [{ type: "email", value: "", preferred: true }], languages: ["en"] },
    posture: "report_only",
    scope: { precedence: "out_overrides_in", web: [], products: [] },
    testing: { default: "prohibited", rules: [] },
    reportRequirements: { required_fields: DEFAULT_REQUIRED_FIELDS },
    // Present but empty: the wizard binds into these, and `generate` only writes
    // them out once they carry something.
    disclosure: {},
    intake: {},
  };
}

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

/** Drops empty strings, empty arrays and undefined values. */
function compact<T extends Record<string, unknown>>(input: T): T {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    output[key] = value;
  }
  return output as T;
}

/** Builds a document from wizard answers. The result still has to be validated. */
export function generate(answers: WizardAnswers, options: { now?: Date } = {}): CvdPolicyDocument {
  const now = options.now ?? new Date();
  const expires =
    answers.expires ?? addMonths(now, answers.expiresInMonths ?? 12).toISOString().replace(/\.\d{3}Z$/, "Z");

  const channels = answers.contact.channels.filter((channel) => channel.value.trim() !== "");
  const encryption = answers.contact.pgpUrl
    ? [
        compact({
          type: "pgp" as const,
          value: answers.contact.pgpUrl,
          fingerprint: answers.contact.pgpFingerprint,
        }),
      ]
    : [];

  const responseTarget = compact({
    acknowledge_within_hours: answers.contact.acknowledgeWithinHours,
    update_interval_days: answers.contact.updateIntervalDays,
  });

  const invitesTesting = answers.posture === "open" || answers.posture === "limited";

  const doc: CvdPolicyDocument = {
    cvd_policy: SPEC_VERSION,
    canonical: answers.canonical.trim(),
    expires,
    updated: answers.updated ?? isoDate(now),
    ...(answers.profiles?.length ? { profiles: answers.profiles } : {}),

    organization: compact({
      name: answers.organization.name.trim(),
      country: answers.organization.country,
      role: answers.organization.role,
      url: answers.organization.url,
    }),

    contact: compact({
      channels,
      languages: answers.contact.languages,
      encryption,
      response_target: Object.keys(responseTarget).length > 0 ? responseTarget : undefined,
    }) as CvdPolicyDocument["contact"],

    research: compact({
      posture: answers.posture,
      statement: answers.statement?.trim(),
    }) as CvdPolicyDocument["research"],

    scope: compact({
      precedence: answers.scope?.precedence ?? "out_overrides_in",
      web: answers.scope?.web?.filter((entry) => entry.pattern.trim() !== ""),
      products: answers.scope?.products?.filter((product) => product.name.trim() !== ""),
    }) as CvdPolicyDocument["scope"],

    report_requirements: {
      required_fields: answers.reportRequirements?.required_fields ?? DEFAULT_REQUIRED_FIELDS,
      ...compact({
        proof_of_exploitation: answers.reportRequirements?.proof_of_exploitation,
        formats: answers.reportRequirements?.formats,
        max_attachment_mb: answers.reportRequirements?.max_attachment_mb,
        template: answers.reportRequirements?.template,
        intake: answers.intake?.url?.trim()
          ? (compact({
              url: answers.intake.url.trim(),
              schema: answers.intake.schema?.trim(),
              profile: answers.intake.profile,
              anonymous: answers.intake.anonymous,
              max_bytes: answers.intake.maxBytes,
              attachments: answers.intake.attachments,
            }) as Intake)
          : undefined,
      }),
    },
  };

  if (invitesTesting) {
    doc.testing = {
      default: answers.testing?.default ?? "prohibited",
      ...(answers.testing?.rules?.length ? { rules: answers.testing.rules } : {}),
    };
  }

  if (answers.disclosure?.model) {
    doc.disclosure = compact({
      model: answers.disclosure.model,
      deadline_days: answers.disclosure.deadline_days,
      advisory_url: answers.disclosure.advisory_url,
      credit: answers.disclosure.credit,
    }) as Disclosure;
  }

  return doc;
}

/** Reads an existing document back into wizard answers, for editing. */
export function answersFrom(doc: Partial<CvdPolicyDocument>): WizardAnswers {
  const answers = defaultAnswers();
  const pgp = doc.contact?.encryption?.find((entry) => entry.type === "pgp");

  return {
    ...answers,
    canonical: doc.canonical ?? "",
    ...(doc.expires ? { expires: doc.expires } : {}),
    ...(doc.updated ? { updated: doc.updated } : {}),
    ...(doc.profiles ? { profiles: doc.profiles } : {}),
    organization: { name: "", ...doc.organization },
    contact: {
      channels: doc.contact?.channels?.length ? doc.contact.channels : answers.contact.channels,
      languages: doc.contact?.languages ?? answers.contact.languages,
      ...(pgp ? { pgpUrl: pgp.value, pgpFingerprint: pgp.fingerprint } : {}),
      ...(doc.contact?.response_target?.acknowledge_within_hours
        ? { acknowledgeWithinHours: doc.contact.response_target.acknowledge_within_hours }
        : {}),
      ...(doc.contact?.response_target?.update_interval_days
        ? { updateIntervalDays: doc.contact.response_target.update_interval_days }
        : {}),
    },
    posture: doc.research?.posture ?? "report_only",
    ...(doc.research?.statement ? { statement: doc.research.statement } : {}),
    scope: {
      precedence: doc.scope?.precedence ?? "out_overrides_in",
      web: doc.scope?.web ?? [],
      products: doc.scope?.products ?? [],
    },
    testing: {
      default: doc.testing?.default ?? "prohibited",
      rules: doc.testing?.rules ?? [],
    },
    reportRequirements: doc.report_requirements ?? answers.reportRequirements,
    ...(doc.report_requirements?.intake
      ? {
          intake: {
            url: doc.report_requirements.intake.url,
            schema: doc.report_requirements.intake.schema,
            profile: doc.report_requirements.intake.profile,
            anonymous: doc.report_requirements.intake.anonymous,
            maxBytes: doc.report_requirements.intake.max_bytes,
            attachments: doc.report_requirements.intake.attachments,
          },
        }
      : {}),
    ...(doc.disclosure ? { disclosure: doc.disclosure } : {}),
  };
}

/** Derives the well-known URL for a domain the user typed. */
export function canonicalFor(domain: string): string {
  const host = domain.trim().replace(/^[a-z][a-z0-9+.-]*:\/\//i, "").replace(/\/.*$/, "");
  return host ? `https://${host}/.well-known/cvd.json` : "";
}
