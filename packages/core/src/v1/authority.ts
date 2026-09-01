import { normalizeHost } from "./scope.js";
import type {
  AuthorityAssessment,
  AuthorityEvidence,
  ReasonCode,
  SecurityTxtRetrievalContext,
  ValidationIssue,
} from "./types.js";

const issue = (code: ReasonCode, path = ""): ValidationIssue => ({
  level: "error",
  code,
  path,
  message: code,
});

function parseHttpsUri(value: string): URL | null {
  try {
    const uri = new URL(value);
    if (uri.protocol !== "https:" || uri.username || uri.password || value.includes("#")) return null;
    return uri;
  } catch {
    return null;
  }
}

function validContact(value: string): boolean {
  try {
    const uri = new URL(value);
    if (uri.protocol === "https:") return parseHttpsUri(value) !== null;
    return (uri.protocol === "mailto:" || uri.protocol === "tel:") && uri.pathname.length > 0;
  } catch {
    return false;
  }
}

function cleartext(text: string): { text: string; signed: boolean } {
  if (!text.startsWith("-----BEGIN PGP SIGNED MESSAGE-----")) return { text, signed: false };
  const start = text.indexOf("\n\n");
  const end = text.indexOf("\n-----BEGIN PGP SIGNATURE-----");
  if (start < 0 || end < 0 || end <= start) throw new SyntaxError("invalid cleartext signature envelope");
  return {
    text: text.slice(start + 2, end).replace(/^- /gm, ""),
    signed: true,
  };
}

function parseFields(text: string): Map<string, string[]> {
  const fields = new Map<string, string[]>();
  for (const [index, rawLine] of text.replaceAll("\r\n", "\n").split("\n").entries()) {
    const line = rawLine.trimEnd();
    if (line === "" || line.startsWith("#")) continue;
    const separator = line.indexOf(":");
    if (separator < 1) throw new SyntaxError(`invalid security.txt field at line ${index + 1}`);
    const name = line.slice(0, separator).toLowerCase();
    if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new SyntaxError(`invalid security.txt field at line ${index + 1}`);
    const value = line.slice(separator + 1).trim();
    if (value === "") throw new SyntaxError(`empty security.txt field at line ${index + 1}`);
    const values = fields.get(name) ?? [];
    values.push(value);
    fields.set(name, values);
  }
  return fields;
}

function failure(
  code: ReasonCode,
  signed: boolean,
  humanPolicyUris: string[],
  path = "",
): AuthorityAssessment {
  return { established: false, issues: [issue(code, path)], signed, humanPolicyUris };
}

/** Assesses security.txt discovery evidence without fetching network resources. */
export function assessSecurityTxtAuthority(
  source: string,
  context: SecurityTxtRetrievalContext,
): AuthorityAssessment {
  let signed = false;
  let fields: Map<string, string[]>;
  try {
    const body = cleartext(source);
    signed = body.signed;
    fields = parseFields(body.text);
  } catch {
    return failure("security_txt_parse_error", signed, []);
  }

  const humanPolicyUris = fields.get("policy") ?? [];
  const contacts = fields.get("contact") ?? [];
  const expiresValues = fields.get("expires") ?? [];
  const policyValues = fields.get("cvd-policy") ?? [];
  if (contacts.length === 0) return failure("security_txt_contact_missing", signed, humanPolicyUris);
  if (!contacts.some(validContact)) return failure("security_txt_contact_invalid", signed, humanPolicyUris);
  if (expiresValues.length === 0) return failure("security_txt_expires_missing", signed, humanPolicyUris);
  if (expiresValues.length > 1) return failure("security_txt_expires_duplicate", signed, humanPolicyUris);
  if (policyValues.length === 0) return failure("security_txt_cvd_policy_missing", signed, humanPolicyUris);
  if (policyValues.length > 1) return failure("security_txt_cvd_policy_duplicate", signed, humanPolicyUris);

  const expires = Date.parse(expiresValues[0] ?? "");
  if (!Number.isFinite(expires)) {
    return failure("security_txt_expires_invalid", signed, humanPolicyUris);
  }
  if (expires <= context.retrievedAt.getTime()) {
    return failure("security_txt_expired", signed, humanPolicyUris);
  }
  const policyUri = parseHttpsUri(policyValues[0] ?? "");
  if (policyUri === null) {
    return failure("security_txt_cvd_policy_uri_invalid", signed, humanPolicyUris);
  }

  const requested = parseHttpsUri(context.requestedUri);
  const final = parseHttpsUri(context.finalUri);
  const redirects = context.redirectChain.map(parseHttpsUri);
  if (
    requested === null ||
    final === null ||
    redirects.some((uri) => uri === null) ||
    redirects.length > 5 ||
    new Set([context.requestedUri, ...context.redirectChain]).size !== context.redirectChain.length + 1 ||
    (redirects.at(-1)?.href ?? requested.href) !== final.href
  ) {
    return failure("security_txt_redirect_invalid", signed, humanPolicyUris);
  }

  const requestedHost = normalizeHost(requested.hostname).host;
  const finalHost = normalizeHost(final.hostname).host;
  const canonicals = fields.get("canonical") ?? [];
  if (
    (requestedHost !== finalHost || canonicals.length > 0) &&
    !canonicals.includes(context.requestedUri)
  ) {
    return failure("security_txt_canonical_mismatch", signed, humanPolicyUris);
  }

  const evidence: AuthorityEvidence = {
    established: true,
    discoveryHost: requestedHost,
    securityTxtUri: final.href,
    cvdPolicyUri: policyUri.href,
    securityTxtExpires: expiresValues[0] ?? "",
  };
  return { established: true, evidence, issues: [], signed, humanPolicyUris };
}
