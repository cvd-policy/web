import type { CvdPolicyDocument } from "./types.js";

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

/** Lines to add to a security.txt for a given document. */
export function securityTxtLines(doc: CvdPolicyDocument): string[] {
  const lines: string[] = [];

  const preferred = doc.contact?.channels?.find((channel) => channel.preferred) ?? doc.contact?.channels?.[0];
  if (preferred) {
    const value =
      preferred.type === "email" && !preferred.value.startsWith("mailto:")
        ? `mailto:${preferred.value}`
        : preferred.value;
    if (preferred.type !== "postal") lines.push(`Contact: ${value}`);
  }

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
