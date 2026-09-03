import type {
  AuthorityEvidence,
  PolicyRetrievalContext,
  ValidationIssue,
} from "./types.js";
import { parseHttpsUri } from "./authority.js";

const invalid = (): ValidationIssue[] => [
  {
    level: "error",
    code: "policy_retrieval_invalid",
    path: "",
    message: "policy_retrieval_invalid",
  },
];

/** Checks that a representation is the one announced by security.txt. */
export function policyRetrievalIssues(
  retrieval: PolicyRetrievalContext | undefined,
  authority: AuthorityEvidence,
  allowApplicationJson = false,
): ValidationIssue[] {
  if (!retrieval || retrieval.statusCode !== 200) return invalid();
  const mediaType = retrieval.mediaType.split(";", 1)[0]?.trim().toLowerCase();
  if (
    mediaType !== "application/cvd-policy+json" &&
    !(allowApplicationJson && mediaType === "application/json")
  ) return invalid();

  const values = [retrieval.requestedUri, ...retrieval.redirectChain];
  if (retrieval.requestedUri !== authority.cvdPolicyUri) return invalid();
  try {
    const uris = values.map(parseHttpsUri);
    const final = parseHttpsUri(retrieval.finalUri);
    if (
      uris.some((uri) => uri === null) ||
      final === null ||
      retrieval.redirectChain.length > 5 ||
      new Set(values).size !== values.length ||
      (uris.at(-1)?.href ?? uris[0]?.href) !== final.href
    ) return invalid();
    return [];
  } catch {
    return invalid();
  }
}
