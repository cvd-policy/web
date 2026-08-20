/** Type definitions for a CVD Policy document, version 0.1. */

export type Posture = "open" | "limited" | "report_only" | "prohibited";
export type ScopeState = "in" | "out";
export type TestingState = "allowed" | "prohibited";
export type Precedence = "out_overrides_in" | "explicit_order";

export interface Organization {
  name: string;
  country?: string;
  role?: "manufacturer" | "operator" | "both" | "other";
  url?: string;
}

export interface ContactChannel {
  type: "email" | "form" | "service" | "postal";
  value: string;
  preferred?: boolean;
}

export interface Encryption {
  type: "pgp" | "smime" | "other";
  value: string;
  fingerprint?: string;
}

export interface Contact {
  channels: ContactChannel[];
  languages?: string[];
  encryption?: Encryption[];
  response_target?: {
    acknowledge_within_hours?: number;
    update_interval_days?: number;
  };
}

export interface Research {
  posture: Posture;
  statement?: string;
}

export interface ScopeWebEntry {
  pattern: string;
  state: ScopeState;
  reason?: "third_party" | "legacy" | "not_operated" | "other";
  note?: string;
}

export interface ScopeProduct {
  name: string;
  purl?: string;
  versions?: string;
  supported_until?: string;
  sbom?: string;
  state?: ScopeState;
}

export interface Scope {
  precedence: Precedence;
  web?: ScopeWebEntry[];
  products?: ScopeProduct[];
}

export interface TestingConditions {
  max_requests_per_second?: number;
  user_agent_contains?: string;
  targets?: string[];
  window?: {
    timezone?: string;
    days?: Array<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun">;
    from?: string;
    to?: string;
  };
  account_request?: string;
}

export interface TestingRule {
  activity: string;
  state: TestingState;
  note?: string;
  conditions?: TestingConditions;
}

export interface Testing {
  default: TestingState;
  rules?: TestingRule[];
}

export type ReportField =
  | "affected_asset"
  | "description"
  | "reproduction_steps"
  | "impact"
  | "discovery_date"
  | "reporter_contact"
  | "proposed_fix";

export interface Intake {
  /** Endpoint that accepts a structured report. https only, no credentials. */
  url: string;
  /** JSON Schema the endpoint accepts. */
  schema?: string;
  /** Named report profile the schema builds on, e.g. `report-0.1`. */
  profile?: string;
  /** Whether a report without reporter details is accepted. */
  anonymous?: boolean;
  max_bytes?: number;
  attachments?: "accepted" | "after_contact" | "not_accepted";
}

export interface ReportRequirements {
  required_fields: ReportField[];
  proof_of_exploitation?: "required" | "optional" | "prohibited";
  formats?: Array<"text" | "markdown" | "pdf" | "csaf" | "cvrf" | "vex">;
  max_attachment_mb?: number;
  template?: string;
  /** Since 0.2. */
  intake?: Intake;
}

export interface Disclosure {
  model: "coordinated" | "full_after_deadline" | "vendor_only" | "no_disclosure";
  deadline_days?: number;
  advisory_url?: string;
  credit?: "offered" | "on_request" | "none";
}

export interface CvdPolicyDocument {
  cvd_policy: SpecVersion;
  canonical: string;
  expires: string;
  updated?: string;
  profiles?: string[];
  organization: Organization;
  contact: Contact;
  research: Research;
  scope: Scope;
  testing?: Testing;
  report_requirements: ReportRequirements;
  disclosure?: Disclosure;
  [key: string]: unknown;
}

/** Activity identifiers the specification lists. Others are permitted. */
export const KNOWN_ACTIVITIES = [
  "manual_testing",
  "automated_scanning",
  "fuzzing",
  "brute_force",
  "dos",
  "social_engineering",
  "phishing",
  "physical",
  "spam",
  "data_exfiltration",
  "account_takeover",
  "third_party_pivot",
  "supply_chain",
  "persistence",
] as const;

export type KnownActivity = (typeof KNOWN_ACTIVITIES)[number];

/** Every published version stays readable; a release never changes. */
export const SUPPORTED_VERSIONS = ["0.1", "0.2"] as const;

export type SpecVersion = (typeof SUPPORTED_VERSIONS)[number];

/** The version `generate` writes. */
export const SPEC_VERSION: SpecVersion = "0.2";

export const isSupportedVersion = (value: unknown): value is SpecVersion =>
  typeof value === "string" && (SUPPORTED_VERSIONS as readonly string[]).includes(value);
