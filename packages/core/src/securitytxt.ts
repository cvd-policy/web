import { defaultAnswers } from "./generate.js";
import type { WizardAnswers } from "./generate.js";
import type { ContactChannel, CvdPolicyDocument } from "./types.js";

/** Field names mapped to all values found, in document order. */
export type SecurityTxtFields = Record<string, string[]>;

/** Parses a security.txt into fields. Comments and blank lines are dropped. */
export function parseSecurityTxt(raw: string): SecurityTxtFields {
  const fields: SecurityTxtFields = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf(":");
    if (separator === -1) continue;

    const name = trimmed.slice(0, separator).trim().toLowerCase();
    const value = trimmed.slice(separator + 1).trim();
    if (name === "" || value === "") continue;

    (fields[name] ??= []).push(value);
  }

  return fields;
}

/** Returns the first `CVD-Policy` value, or null if the field is absent. */
export function findPolicyUrl(fields: SecurityTxtFields): string | null {
  return fields["cvd-policy"]?.[0] ?? null;
}

/** The value a channel takes in a `Contact` field. security.txt wants a URI. */
function contactValue(channel: ContactChannel): string {
  return channel.type === "email" && !channel.value.startsWith("mailto:")
    ? `mailto:${channel.value}`
    : channel.value;
}

/** Lines to add to a security.txt for a given document. */
export function securityTxtLines(doc: CvdPolicyDocument): string[] {
  const lines: string[] = [];

  const preferred = doc.contact?.channels?.find((channel) => channel.preferred) ?? doc.contact?.channels?.[0];
  if (preferred && preferred.type !== "postal") lines.push(`Contact: ${contactValue(preferred)}`);

  if (doc.expires) lines.push(`Expires: ${doc.expires}`);

  const pgp = doc.contact?.encryption?.find((entry) => entry.type === "pgp");
  if (pgp) lines.push(`Encryption: ${pgp.value}`);

  if (doc.contact?.languages?.length) {
    lines.push(`Preferred-Languages: ${doc.contact.languages.join(", ")}`);
  }

  if (doc.canonical) lines.push(`CVD-Policy: ${doc.canonical}`);

  return lines;
}

/** The one line that is specific to this format. */
export function cvdPolicyLine(doc: CvdPolicyDocument): string {
  return `CVD-Policy: ${doc.canonical}`;
}

export interface SecurityTxtImport {
  /** The answers, with everything the file could supply already filled in. */
  answers: WizardAnswers;
  /** The fields that were used, lowercased, in the order they were read. */
  applied: string[];
  /**
   * The file is clear-signed. Adding the `CVD-Policy` field will break the
   * signature, which is worth knowing before the work starts rather than after.
   */
  signed: boolean;
}

/**
 * Reads an existing security.txt into wizard answers.
 *
 * An organisation that publishes a security.txt has already answered several
 * of the questions — who to contact, in which languages, until when. Reading
 * them back saves retyping and, more to the point, keeps the two files
 * agreeing with each other.
 *
 * A `Contact` that is neither a mailbox nor a web address is left out: the
 * format has no channel type that would hold it.
 */
export function answersFromSecurityTxt(
  raw: string,
  base: WizardAnswers = defaultAnswers(),
): SecurityTxtImport {
  const fields = parseSecurityTxt(raw);
  // Through JSON rather than structuredClone: the answers are plain data, and
  // the caller may hold them in a reactive proxy that structuredClone rejects.
  const answers = JSON.parse(JSON.stringify(base)) as WizardAnswers;
  const applied: string[] = [];

  const channels: ContactChannel[] = [];
  for (const value of fields["contact"] ?? []) {
    if (/^mailto:/i.test(value)) channels.push({ type: "email", value: value.slice(7) });
    else if (/^https?:\/\//i.test(value)) channels.push({ type: "form", value });
  }
  if (channels.length > 0) {
    const [first, ...rest] = channels;
    answers.contact.channels = first ? [{ ...first, preferred: true }, ...rest] : rest;
    applied.push("contact");
  }

  const expires = fields["expires"]?.[0];
  if (expires) {
    answers.expires = expires;
    applied.push("expires");
  }

  const languages = fields["preferred-languages"]?.[0];
  if (languages) {
    const list = languages.split(",").map((entry) => entry.trim()).filter(Boolean);
    if (list.length > 0) {
      answers.contact.languages = list;
      applied.push("preferred-languages");
    }
  }

  const encryption = fields["encryption"]?.[0];
  if (encryption) {
    answers.contact.pgpUrl = encryption;
    applied.push("encryption");
  }

  // Where the cvd.json will live: CVD-Policy says it outright, otherwise the
  // host serving the security.txt is the best available answer.
  const policy = findPolicyUrl(fields);
  const canonical = fields["canonical"]?.[0];
  if (policy) {
    answers.canonical = policy;
    applied.push("cvd-policy");
  } else if (canonical) {
    try {
      answers.canonical = new URL("/.well-known/cvd.json", canonical).toString();
      applied.push("canonical");
    } catch {
      // An unusable Canonical simply supplies nothing.
    }
  }

  // The host answers the first scope question too, as typing the domain does.
  const host = hostOf(answers.canonical);
  if (host) {
    answers.scope ??= { precedence: "out_overrides_in", web: [], products: [] };
    answers.scope.web ??= [];
    if (answers.scope.web.length === 0) answers.scope.web.push({ pattern: host, state: "in" });
  }

  return { answers, applied, signed: isSignedSecurityTxt(raw) };
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/** A field as it sits in the file, so an edit can find its way back to the line. */
interface FieldLine {
  index: number;
  name: string;
  value: string;
}

const FIELD = /^([A-Za-z0-9-]+)[ \t]*:[ \t]*(.*)$/;
const SIGNED = /^-----BEGIN PGP SIGNED MESSAGE-----/m;

/**
 * True for a clear-signed security.txt, which RFC 9116 permits.
 *
 * Every edit to such a file breaks its signature — there is no way to add a
 * field and keep it — so a tool that changes one has to say so.
 */
export function isSignedSecurityTxt(raw: string): boolean {
  return SIGNED.test(raw);
}

function fieldLines(lines: string[]): FieldLine[] {
  const found: FieldLine[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) return;

    const match = FIELD.exec(trimmed);
    const name = match?.[1];
    const value = match?.[2];
    if (name === undefined || value === undefined) return;

    found.push({ index, name: name.toLowerCase(), value: value.trim() });
  });

  return found;
}

export interface SecurityTxtMerge {
  /** The file with `CVD-Policy` naming this document. */
  text: string;
  /** Whether the field was added, its value replaced, or already correct. */
  change: "added" | "replaced" | "unchanged";
  /** The value that stood there before, when one was replaced. */
  previous?: string;
  /** The file carries a PGP signature, which any edit invalidates. */
  signed: boolean;
}

/**
 * Puts the `CVD-Policy` field into a security.txt that already exists.
 *
 * Everything else is left as it was: comments, field order, blank lines and
 * the line ending the file already uses. A file that has the field keeps its
 * position and changes only its value; a repeated field is reduced to one, so
 * no reader is left choosing between two answers.
 *
 * The edit invalidates a PGP signature, which `signed` reports rather than
 * hides — the file has to be signed again afterwards.
 */
export function mergeSecurityTxt(raw: string, doc: CvdPolicyDocument): SecurityTxtMerge {
  const newline = raw.includes("\r\n") ? "\r\n" : "\n";
  const lines = raw.split(/\r?\n/);
  const signed = isSignedSecurityTxt(raw);

  const fields = fieldLines(lines);
  const [first, ...extra] = fields.filter((field) => field.name === "cvd-policy");

  if (first === undefined) {
    // After the last field, which on a signed file keeps it inside the block
    // the signature covers rather than after the signature.
    const last = fields[fields.length - 1];
    if (last === undefined) {
      const body = raw === "" || raw.endsWith("\n") ? raw : `${raw}${newline}`;
      return { text: `${body}${cvdPolicyLine(doc)}${newline}`, change: "added", signed };
    }
    lines.splice(last.index + 1, 0, cvdPolicyLine(doc));
    return { text: lines.join(newline), change: "added", signed };
  }

  if (first.value === doc.canonical && extra.length === 0) {
    return { text: raw, change: "unchanged", signed };
  }

  lines[first.index] = cvdPolicyLine(doc);
  for (const field of [...extra].reverse()) lines.splice(field.index, 1);

  return { text: lines.join(newline), change: "replaced", previous: first.value, signed };
}

/**
 * Where the security.txt belongs for the host that serves `doc.canonical`.
 *
 * RFC 9116 fixes the location, so this is a derivation and not a guess. Null
 * when `canonical` is not a URL — the validator reports that separately.
 */
export function securityTxtCanonical(doc: CvdPolicyDocument): string | null {
  try {
    return new URL("/.well-known/security.txt", doc.canonical).toString();
  } catch {
    return null;
  }
}

export interface SecurityTxtOptions {
  /** Absolute URL the file will be served from. Derived from `canonical` when omitted. */
  canonical?: string | null;
  /** Absolute URL of a page people can read, written as `Policy`. */
  policy?: string;
}

/**
 * A complete security.txt for a document, ready to publish.
 *
 * This is the other half of `securityTxtLines`: that one is for a host which
 * already has a security.txt and needs only the fields this format adds, this
 * one is for a host that has none. `Contact` and `Expires` are the two fields
 * RFC 9116 requires, and a valid document carries both.
 */
export function securityTxt(doc: CvdPolicyDocument, options: SecurityTxtOptions = {}): string {
  const lines: string[] = [];

  // Contact may repeat, in order of preference. A postal address has no field.
  const channels = (doc.contact?.channels ?? []).filter((channel) => channel.type !== "postal");
  const preferredFirst = [
    ...channels.filter((channel) => channel.preferred),
    ...channels.filter((channel) => !channel.preferred),
  ];
  for (const value of new Set(preferredFirst.map(contactValue))) lines.push(`Contact: ${value}`);

  if (doc.expires) lines.push(`Expires: ${doc.expires}`);

  for (const entry of doc.contact?.encryption ?? []) {
    if (entry.type === "pgp") lines.push(`Encryption: ${entry.value}`);
  }

  if (doc.contact?.languages?.length) {
    lines.push(`Preferred-Languages: ${doc.contact.languages.join(", ")}`);
  }

  const canonical = options.canonical === undefined ? securityTxtCanonical(doc) : options.canonical;
  if (canonical) lines.push(`Canonical: ${canonical}`);

  if (options.policy) lines.push(`Policy: ${options.policy}`);

  if (doc.canonical) lines.push(cvdPolicyLine(doc));

  return `${lines.join("\n")}\n`;
}
