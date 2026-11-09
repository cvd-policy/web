import {
  CSAF_SPECIFICATION,
  assessCsafCapability,
  parseJsonText,
} from "@cvd-policy/core/v1";
import type { CvdPolicyDocument } from "@cvd-policy/core/v1";

export interface CsafDeclarationChannel {
  uri: string;
  specification: string;
}

export interface CsafDeclaration {
  channels: CsafDeclarationChannel[];
}

export function eligibleCsafChannels(channels: readonly string[]): string[] {
  const duplicated = new Set(channels.filter((channel, index) => channels.indexOf(channel) !== index));
  return channels.filter((channel) => {
    if (duplicated.has(channel)) return false;
    if (!channel || channel.trim() !== channel || /[^\x21-\x7e]|#/.test(channel)) return false;
    const match = /^([A-Za-z][A-Za-z0-9+.-]*):(.*)$/.exec(channel);
    if (!match) return false;
    const scheme = match[1]!.toLowerCase();
    const rest = match[2]!;
    try {
      new URL(channel);
      if (scheme === "mailto") {
        return Boolean(rest) && !/[^A-Za-z0-9\-._~!$&'()*+,;=:@/?%]/.test(rest) &&
          !/%(?![A-Fa-f0-9]{2})/.test(rest);
      }
      if (scheme !== "https" || !rest.startsWith("//")) return false;
      const authorityAndPath = rest.slice(2);
      const boundary = authorityAndPath.search(/[/?]/);
      const authority = boundary < 0 ? authorityAndPath : authorityAndPath.slice(0, boundary);
      const suffix = boundary < 0 ? "" : authorityAndPath.slice(boundary);
      return Boolean(authority) && !authority.includes("@") &&
        !/[^A-Za-z0-9\-._~!$&'()*+,;=:@/?%]/.test(suffix) &&
        !/%(?![A-Fa-f0-9]{2})/.test(suffix);
    } catch {
      return false;
    }
  });
}

export function createCsafDeclaration(channels: readonly string[]): CsafDeclaration {
  return {
    channels: channels.map((uri) => ({ uri, specification: CSAF_SPECIFICATION })),
  };
}

export function csafChannelsFromDeclaration(
  value: unknown,
  contactChannels: readonly string[],
  critical = false,
): string[] | null {
  if (critical || !value || typeof value !== "object" || Array.isArray(value)) return null;
  const extension = value as Record<string, unknown>;
  if (Object.keys(extension).length !== 1 || !Object.hasOwn(extension, "channels")) return null;
  const entries = extension["channels"];
  if (!Array.isArray(entries) || entries.length === 0) return null;

  const channels: string[] = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
    const channel = entry as Record<string, unknown>;
    if (
      Object.keys(channel).length !== 2 ||
      !Object.hasOwn(channel, "uri") ||
      !Object.hasOwn(channel, "specification") ||
      typeof channel["uri"] !== "string" ||
      channel["specification"] !== CSAF_SPECIFICATION
    ) return null;
    const uri = channel["uri"];
    if (
      channels.includes(uri) ||
      contactChannels.filter((channel) => channel === uri).length !== 1
    ) return null;
    channels.push(uri);
  }
  return channels;
}

/** Parses with the core's duplicate-member-aware parser before assessing local metadata. */
export function assessCsafCapabilityText(text: string): ReturnType<typeof assessCsafCapability> | null {
  try {
    return assessCsafCapability(parseJsonText(text));
  } catch {
    return null;
  }
}

export function csafExportBlock(
  capability: ReturnType<typeof assessCsafCapability> | null,
): "invalid" | "critical" | null {
  if (!capability?.coreValid) return null;
  if (capability.state === "invalid") return "invalid";
  if (capability.state === "unsupported" && capability.issues.some((issue) => issue.code === "extension-critical")) {
    return "critical";
  }
  return null;
}

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
