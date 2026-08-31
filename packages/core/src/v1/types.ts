export type ResearchPosture = "open" | "limited" | "report_only" | "prohibited";
export type ScopeState = "in" | "out";
export type TestingState = "permitted" | "prohibited";
export type CoreActivity =
  | "manual_testing"
  | "automated_scanning"
  | "fuzzing"
  | "credential_testing";
export type Activity = CoreActivity | string;

export interface Organization {
  name: string;
  uri?: string;
}

export interface Contact {
  channels: string[];
  preferred_languages?: string[];
  encryption?: string[];
}

export interface Research {
  posture: ResearchPosture;
  statement?: string;
}

export interface WebReportingScope {
  id: string;
  state: ScopeState;
  host: string;
  schemes: Array<"http" | "https">;
  ports?: number[];
  path_prefix: string;
  include_subdomains: boolean;
}

export interface ProductReportingScope {
  id: string;
  state: ScopeState;
  name: string;
  identifiers?: string[];
}

export interface ReportingScope {
  web?: WebReportingScope[];
  products?: ProductReportingScope[];
}

export interface TestingConditions {
  max_requests_per_second?: number;
  max_concurrent_requests?: number;
  required_user_agent_token?: string;
  test_accounts_only?: true;
}

export interface TestingRule {
  id: string;
  activity: Activity;
  state: TestingState;
  target_ids?: string[];
  conditions?: TestingConditions;
}

export interface Testing {
  rules: TestingRule[];
}

export type RequestedField =
  | "affected_asset"
  | "vulnerability_type"
  | "description"
  | "reproduction_steps"
  | "impact"
  | "environment"
  | "evidence"
  | "researcher_contact"
  | "disclosure_preference";

export interface ReportingPreferences {
  requested_fields: RequestedField[];
  proof_of_exploitation: "not_requested" | "requested_if_safe" | "prohibited";
}

export interface ResponseTargets {
  acknowledgement_days?: number;
  initial_assessment_days?: number;
  update_interval_days?: number;
}

export interface Disclosure {
  approach: "coordinated" | "case_by_case" | "no_preference";
  default_days?: number;
  statement?: string;
}

export interface CvdPolicyDocument {
  cvd_policy: 1;
  last_updated: string;
  expires: string;
  organization: Organization;
  contact: Contact;
  research: Research;
  reporting_scope: ReportingScope;
  testing?: Testing;
  reporting: ReportingPreferences;
  response_targets?: ResponseTargets;
  disclosure?: Disclosure;
  critical_extensions?: string[];
  extensions?: Record<string, unknown>;
}

export type ReasonCode =
  | "policy_parse_error"
  | "policy_duplicate_member"
  | "policy_schema_invalid"
  | "policy_version_unsupported"
  | "policy_time_order_invalid"
  | "policy_expired"
  | "policy_uri_invalid"
  | "policy_language_tag_invalid"
  | "policy_scope_invalid"
  | "policy_scope_id_duplicate"
  | "policy_target_reference_invalid"
  | "policy_posture_conflict"
  | "policy_critical_extension_missing"
  | "policy_critical_extension_unsupported"
  | "policy_activity_unsupported"
  | "security_txt_parse_error"
  | "security_txt_contact_missing"
  | "security_txt_contact_invalid"
  | "security_txt_expires_missing"
  | "security_txt_expires_duplicate"
  | "security_txt_expires_invalid"
  | "security_txt_expired"
  | "security_txt_cvd_policy_missing"
  | "security_txt_cvd_policy_duplicate"
  | "security_txt_cvd_policy_uri_invalid"
  | "security_txt_canonical_mismatch"
  | "security_txt_redirect_invalid"
  | "authority_evidence_missing"
  | "authority_host_mismatch"
  | "target_url_invalid"
  | "scope_target_not_covered"
  | "scope_target_excluded"
  | "testing_rule_missing"
  | "testing_rule_prohibited"
  | "testing_rule_permitted"
  | "conditions_missing"
  | "conditions_exceeded"
  | "conditions_user_agent_missing"
  | "conditions_test_accounts_unconfirmed";

export interface ValidationIssue {
  level: "error";
  code: ReasonCode;
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  policy?: CvdPolicyDocument;
}

export interface ValidationOptions {
  now?: Date;
  checkExpiry?: boolean;
}

export interface SecurityTxtRetrievalContext {
  requestedUri: string;
  finalUri: string;
  redirectChain: string[];
  retrievedAt: Date;
}

export interface AuthorityEvidence {
  established: true;
  discoveryHost: string;
  securityTxtUri: string;
  cvdPolicyUri: string;
  securityTxtExpires: string;
}

export interface AuthorityAssessmentSuccess {
  established: true;
  evidence: AuthorityEvidence;
  issues: [];
  signed: boolean;
  humanPolicyUris: string[];
}

export interface AuthorityAssessmentFailure {
  established: false;
  issues: ValidationIssue[];
  signed: boolean;
  humanPolicyUris: string[];
}

export type AuthorityAssessment =
  | AuthorityAssessmentSuccess
  | AuthorityAssessmentFailure;

export interface EvaluationPlan {
  requestsPerSecond?: number;
  concurrentRequests?: number;
  userAgent?: string;
  usesOnlyTestAccounts?: boolean;
}

export interface EvaluationQuery {
  activity: string;
  target: string;
  plan?: EvaluationPlan;
  understoodExtensions?: string[];
}

export type EvaluationStatus =
  | "publisher-stated-permitted"
  | "publisher-stated-prohibited"
  | "not-covered"
  | "authority-not-established"
  | "conditions-not-satisfied"
  | "invalid-policy"
  | "unsupported-policy";

export interface EvaluationConstraints {
  maxRequestsPerSecond?: number;
  maxConcurrentRequests?: number;
  requiredUserAgentToken?: string;
  testAccountsOnly?: true;
}

export interface EvaluationResult {
  inputValid: true;
  status: EvaluationStatus;
  reasonCode: ReasonCode;
  matchedRuleIds: string[];
  matchedTargetIds: string[];
  issues: ValidationIssue[];
  constraints?: EvaluationConstraints;
}

export interface EvaluationInputFailure {
  inputValid: false;
  issues: ValidationIssue[];
}

export type EvaluationOutcome = EvaluationResult | EvaluationInputFailure;
