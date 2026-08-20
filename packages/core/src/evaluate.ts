import { authorityAnchors, isAuthoritativeFor, isHostTarget, scopeStateFor } from "./scope.js";
import { KNOWN_ACTIVITIES } from "./types.js";
import type { CvdPolicyDocument, TestingConditions } from "./types.js";
import { isSupportedVersion } from "./types.js";

export type EvaluationReason =
  | "DOCUMENT_EXPIRED"
  | "VERSION_UNKNOWN"
  | "POSTURE_NO_TESTING"
  | "FOREIGN_TARGET"
  | "OUT_OF_SCOPE"
  | "ACTIVITY_UNKNOWN"
  | "RULE_PROHIBITED"
  | "RULE_ALLOWED"
  | "DEFAULT_PROHIBITED"
  | "DEFAULT_ALLOWED";

export interface Evaluation {
  allowed: boolean;
  reason: EvaluationReason;
  /** Conditions that must hold for the whole activity, if it is allowed. */
  conditions?: TestingConditions;
}

export interface EvaluateOptions {
  now?: Date;
  /**
   * The host whose own discovery path produced this document — its security.txt
   * `CVD-Policy` field, or its `/.well-known/cvd.json`. Naming it lets one
   * document serve several hosts, because each of them pointed at it.
   */
  discoveredFor?: string;
  /**
   * Set only when the target's own policy was fetched and agrees. Without it, a
   * document cannot grant permission for hosts it has no authority over.
   */
  foreignTargetConfirmed?: boolean;
}

/**
 * Decides whether an activity against a target is permitted, following the
 * order of evaluation in the specification. Unknown activities are prohibited.
 */
export function evaluate(
  doc: CvdPolicyDocument,
  activity: string,
  target: string,
  options: EvaluateOptions = {},
): Evaluation {
  const now = options.now ?? new Date();

  const expires = Date.parse(doc.expires ?? "");
  if (Number.isNaN(expires) || expires <= now.getTime()) {
    return { allowed: false, reason: "DOCUMENT_EXPIRED" };
  }

  if (!isSupportedVersion(doc.cvd_policy)) {
    return { allowed: false, reason: "VERSION_UNKNOWN" };
  }

  const posture = doc.research?.posture;
  if (posture === "prohibited" || posture === "report_only") {
    return { allowed: false, reason: "POSTURE_NO_TESTING" };
  }

  // Anyone can list someone else's host in their scope, so a claim is not
  // permission. A document speaks for the host it is published on, for hosts
  // under it, and for any host that pointed at it from its own discovery path.
  const anchors = authorityAnchors(doc.canonical ?? "", options.discoveredFor);
  if (
    !options.foreignTargetConfirmed &&
    isHostTarget(target) &&
    !isAuthoritativeFor(anchors, target)
  ) {
    return { allowed: false, reason: "FOREIGN_TARGET" };
  }

  if (scopeStateFor(doc.scope, target) === "out") {
    return { allowed: false, reason: "OUT_OF_SCOPE" };
  }

  const rule = (doc.testing?.rules ?? []).find((entry) => entry.activity === activity);

  if (!rule) {
    if (!KNOWN_ACTIVITIES.includes(activity as (typeof KNOWN_ACTIVITIES)[number])) {
      return { allowed: false, reason: "ACTIVITY_UNKNOWN" };
    }
    return doc.testing?.default === "allowed"
      ? { allowed: true, reason: "DEFAULT_ALLOWED" }
      : { allowed: false, reason: "DEFAULT_PROHIBITED" };
  }

  if (rule.state === "prohibited") {
    return { allowed: false, reason: "RULE_PROHIBITED" };
  }

  const targets = rule.conditions?.targets;
  if (targets && targets.length > 0 && !targets.includes(target)) {
    return { allowed: false, reason: "OUT_OF_SCOPE" };
  }

  return {
    allowed: true,
    reason: "RULE_ALLOWED",
    ...(rule.conditions ? { conditions: rule.conditions } : {}),
  };
}
