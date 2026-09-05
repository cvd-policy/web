import type { CvdPolicyDocument } from "@cvd-policy/core/v1";

export function createInitialV1Policy(now = new Date()): CvdPolicyDocument {
  const expires = new Date(now);
  expires.setUTCMonth(expires.getUTCMonth() + 6);
  return {
    cvd_policy: 1,
    last_updated: now.toISOString(),
    expires: expires.toISOString(),
    organization: { name: "Example Organization", uri: "https://example.com" },
    contact: { channels: ["mailto:security@example.com"], preferred_languages: ["en"] },
    research: { posture: "report_only" },
    reporting_scope: {
      web: [{ id: "main-web", state: "in", host: "example.com", schemes: ["https"], path_prefix: "/", include_subdomains: false }],
    },
    reporting: { requested_fields: ["affected_asset", "description"], proof_of_exploitation: "not_requested" },
  };
}

export const splitLines = (value: string): string[] =>
  [...new Set(value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean))];

export const joinLines = (values?: string[]): string => values?.join("\n") ?? "";

export function parsePorts(value: string): number[] | undefined {
  const tokens = value.split(/[\s,]+/).filter(Boolean);
  if (!tokens.length) return undefined;
  const ports = tokens.map(Number);
  return ports.every((port) => Number.isInteger(port) && port >= 1 && port <= 65_535)
    ? [...new Set(ports)]
    : undefined;
}

export function positiveNumber(value: string): number | undefined {
  const parsed = Number(value);
  return value.trim() && Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function positiveInteger(value: string): number | undefined {
  const parsed = positiveNumber(value);
  return parsed !== undefined && Number.isInteger(parsed) ? parsed : undefined;
}

export function localDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 19);
}

export function isoDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}
