import { matchingScopeIds, normalizeHost, normalizeTarget } from "./scope.js";
import { policyRetrievalIssues } from "./retrieval.js";
import { parsePolicyText, validatePolicy } from "./validate.js";
import type {
  AuthorityEvidence,
  CvdPolicyDocument,
  EvaluationOutcome,
  EvaluationQuery,
  EvaluationResult,
  EvaluationStatus,
  ReasonCode,
  TestingConditions,
  TestingRule,
  ValidationOptions,
} from "./types.js";

const CORE_ACTIVITIES = new Set(["manual_testing", "automated_scanning", "fuzzing", "credential_testing"]);

function result(
  status: EvaluationStatus,
  reasonCode: ReasonCode,
  matchedRuleIds: string[] = [],
  matchedTargetIds: string[] = [],
): EvaluationResult {
  return {
    inputValid: true,
    status,
    reasonCode,
    matchedRuleIds,
    matchedTargetIds,
    issues: [],
  };
}

function conditionFailure(
  conditions: TestingConditions | undefined,
  query: EvaluationQuery,
): ReasonCode | null {
  if (!conditions) return null;
  const plan = query.plan ?? {};
  if (
    (conditions.max_requests_per_second !== undefined && plan.requestsPerSecond === undefined) ||
    (conditions.max_concurrent_requests !== undefined && plan.concurrentRequests === undefined)
  ) {
    return "conditions_missing";
  }
  if (
    (conditions.max_requests_per_second !== undefined &&
      (plan.requestsPerSecond ?? Infinity) > conditions.max_requests_per_second) ||
    (conditions.max_concurrent_requests !== undefined &&
      (plan.concurrentRequests ?? Infinity) > conditions.max_concurrent_requests)
  ) {
    return "conditions_exceeded";
  }
  if (
    conditions.required_user_agent_token !== undefined &&
    !plan.userAgent?.includes(conditions.required_user_agent_token)
  ) {
    return "conditions_user_agent_missing";
  }
  if (conditions.test_accounts_only && plan.usesOnlyTestAccounts !== true) {
    return "conditions_test_accounts_unconfirmed";
  }
  return null;
}

function applicableRules(
  policy: CvdPolicyDocument,
  query: EvaluationQuery,
  matchedTargetIds: string[],
): TestingRule[] {
  return (policy.testing?.rules ?? []).filter(
    (rule) =>
      rule.activity === query.activity &&
      (rule.target_ids === undefined || rule.target_ids.some((id) => matchedTargetIds.includes(id))),
  );
}

/** Evaluates publisher statements. Only publisher-stated-permitted is positive. */
export function evaluatePolicy(
  input: unknown,
  query: EvaluationQuery,
  authority: AuthorityEvidence | null,
  options: ValidationOptions = {},
): EvaluationOutcome {
  let target;
  try {
    target = normalizeTarget(query.target);
  } catch {
    return {
      inputValid: false,
      issues: [{
        level: "error",
        code: "target_url_invalid",
        path: "/target",
        message: "target_url_invalid",
      }],
    };
  }

  const validation =
    typeof input === "string" ? parsePolicyText(input, options) : validatePolicy(input, options);
  if (!validation.valid || !validation.policy) {
    const first = validation.issues[0];
    const unsupported = first?.code === "policy_version_unsupported";
    return {
      ...result(
        unsupported ? "unsupported-policy" : "invalid-policy",
        first?.code ?? "policy_schema_invalid",
      ),
      issues: validation.issues,
    };
  }
  const policy = validation.policy;
  const understood = new Set(query.understoodExtensions ?? []);
  if ((policy.critical_extensions ?? []).some((extension) => !understood.has(extension))) {
    return result("unsupported-policy", "policy_critical_extension_unsupported");
  }
  if (!CORE_ACTIVITIES.has(query.activity) && !understood.has(query.activity)) {
    return result("unsupported-policy", "policy_activity_unsupported");
  }
  if (authority === null) return result("authority-not-established", "authority_evidence_missing");
  if (policyRetrievalIssues(
    query.policyRetrieval,
    authority,
    options.allowApplicationJson === true,
  ).length > 0) {
    return result("authority-not-established", "policy_retrieval_invalid");
  }

  let discoveryHost;
  try {
    discoveryHost = normalizeHost(authority.discoveryHost).host;
  } catch {
    return result("authority-not-established", "authority_host_mismatch");
  }
  if (discoveryHost !== target.host) {
    return result("authority-not-established", "authority_host_mismatch");
  }

  const matched = matchingScopeIds(policy.reporting_scope.web ?? [], target);
  const matchedTargetIds = [...new Set([...matched.inIds, ...matched.outIds])].sort();
  if (matched.outIds.length > 0) {
    return result("not-covered", "scope_target_excluded", [], matchedTargetIds);
  }
  if (matched.inIds.length === 0) {
    return result("not-covered", "scope_target_not_covered");
  }
  if (policy.research.posture === "prohibited" || policy.research.posture === "report_only") {
    return result("publisher-stated-prohibited", "testing_rule_prohibited", [], matched.inIds);
  }

  const rules = applicableRules(policy, query, matched.inIds);
  const prohibitedIds = rules
    .filter((rule) => rule.state === "prohibited")
    .map((rule) => rule.id)
    .sort();
  if (prohibitedIds.length > 0) {
    return result(
      "publisher-stated-prohibited",
      "testing_rule_prohibited",
      prohibitedIds,
      matched.inIds,
    );
  }
  const permitted = rules.filter((rule) => rule.state === "permitted");
  if (permitted.length === 0) {
    return result("not-covered", "testing_rule_missing", [], matched.inIds);
  }
  const satisfiedIds = permitted
    .filter((rule) => conditionFailure(rule.conditions, query) === null)
    .map((rule) => rule.id)
    .sort();
  if (satisfiedIds.length > 0) {
    return result(
      "publisher-stated-permitted",
      "testing_rule_permitted",
      satisfiedIds,
      matched.inIds,
    );
  }
  return result(
    "conditions-not-satisfied",
    conditionFailure(permitted[0]?.conditions, query) ?? "conditions_missing",
    permitted.map((rule) => rule.id).sort(),
    matched.inIds,
  );
}
