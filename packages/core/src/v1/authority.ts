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

const uriCharacters = /^[A-Za-z][A-Za-z0-9+.-]*:[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]*$/;

function validUriCharacters(value: string): boolean {
  if (!uriCharacters.test(value)) return false;
  if (!value.includes("[") && !value.includes("]")) return true;
  return /^[A-Za-z][A-Za-z0-9+.-]*:\/\/\[[A-Za-z0-9.:%-]+\](?::\d+)?[^\[\]]*$/.test(value);
}

export function parseHttpsUri(value: string): URL | null {
  try {
    if (
      !validUriCharacters(value) ||
      !/^https:\/\/[^/\\\s?#]+(?:[/?][^\\\s#]*)?$/i.test(value) ||
      /%(?![0-9a-f]{2})/i.test(value)
    ) return null;
    const uri = new URL(value);
    if (uri.protocol !== "https:" || uri.username || uri.password || value.includes("#")) return null;
    return uri;
  } catch {
    return null;
  }
}

const leapSecondDates = new Set([
  "1972-06-30", "1972-12-31", "1973-12-31", "1974-12-31", "1975-12-31", "1976-12-31",
  "1977-12-31", "1978-12-31", "1979-12-31", "1981-06-30", "1982-06-30", "1983-06-30",
  "1985-06-30", "1987-12-31", "1989-12-31", "1990-12-31", "1992-06-30", "1993-06-30",
  "1994-06-30", "1995-12-31", "1997-06-30", "1998-12-31", "2005-12-31", "2008-12-31",
  "2012-06-30", "2015-06-30", "2016-12-31",
]);

function rfc3339Timestamp(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?([Zz]|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return null;
  const [, yearText = "", monthText = "", dayText = "", hourText = "", minuteText = "", secondText = "", fraction = "", zone = "Z"] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (
    month < 1 || month > 12 || day < 1 || day > (days[month - 1] ?? 0) ||
    hour > 23 || minute > 59 || second > 60
  ) return null;

  let offsetMinutes = 0;
  if (zone.toUpperCase() !== "Z") {
    const sign = zone[0] === "+" ? 1 : -1;
    const offsetHour = Number(zone.slice(1, 3));
    const offsetMinute = Number(zone.slice(4, 6));
    if (offsetHour > 23 || offsetMinute > 59) return null;
    offsetMinutes = sign * (offsetHour * 60 + offsetMinute);
  }

  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, Math.min(second, 59), Number(`${fraction}000`.slice(0, 3)));
  const timestamp = date.getTime() - offsetMinutes * 60_000;
  if (second !== 60) return timestamp;
  const utc = new Date(timestamp);
  const utcDate = `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, "0")}-${String(utc.getUTCDate()).padStart(2, "0")}`;
  if (utc.getUTCHours() !== 23 || utc.getUTCMinutes() !== 59 || !leapSecondDates.has(utcDate)) return null;
  return timestamp + 1_000;
}

function validContact(value: string): boolean {
  try {
    if (
      !validUriCharacters(value) ||
      /%(?![0-9a-f]{2})/i.test(value)
    ) return false;
    const uri = new URL(value);
    if (uri.protocol === "https:") return parseHttpsUri(value) !== null;
    return uri.protocol.length > 1;
  } catch {
    return false;
  }
}

function cleartext(text: string): { text: string; signed: boolean } {
  const normalized = text.replaceAll("\r\n", "\n");
  if (!normalized.startsWith("-----BEGIN PGP SIGNED MESSAGE-----")) {
    return { text: normalized, signed: false };
  }
  const start = normalized.indexOf("\n\n");
  const end = normalized.indexOf("\n-----BEGIN PGP SIGNATURE-----");
  if (start < 0 || end < 0 || end <= start) throw new SyntaxError("invalid cleartext signature envelope");
  return {
    text: normalized.slice(start + 2, end).replace(/^- /gm, ""),
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

  const expiresValue = expiresValues[0] ?? "";
  const expires = rfc3339Timestamp(expiresValue);
  if (expires === null) {
    return failure("security_txt_expires_invalid", signed, humanPolicyUris);
  }
  const retrievedAt = context.retrievedAt.getTime();
  if (!Number.isFinite(retrievedAt)) {
    return failure("security_txt_expires_invalid", signed, humanPolicyUris);
  }
  if (expires <= retrievedAt) {
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
    !/^[hH][tT][tT][pP][sS]:\/\/(?:\[[^\]]+\](?::\d+)?|[^/?#]+)\/\.well-known\/security\.txt$/.test(context.requestedUri) ||
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
    cvdPolicyUri: policyValues[0] ?? "",
    securityTxtExpires: expiresValues[0] ?? "",
  };
  return { established: true, evidence, issues: [], signed, humanPolicyUris };
}
