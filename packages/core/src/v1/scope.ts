import type { WebReportingScope } from "./types.js";

export interface NormalizedHost {
  host: string;
  ip: boolean;
}

export interface NormalizedTarget extends NormalizedHost {
  scheme: "http" | "https";
  port: number;
  path: string;
}

function parseUrl(value: string): URL {
  try {
    return new URL(value);
  } catch (cause) {
    throw new TypeError("invalid URL", { cause });
  }
}

export function normalizeHost(value: string): NormalizedHost {
  if (value === "" || /[*/?#@\s]/.test(value))
    throw new TypeError("invalid host");
  const unbracketed =
    value.startsWith("[") && value.endsWith("]") ? value.slice(1, -1) : value;
  if (unbracketed.includes(":")) {
    const url = parseUrl(`http://[${unbracketed}]/`);
    return { host: url.hostname.slice(1, -1).toLowerCase(), ip: true };
  }
  const withoutDot = unbracketed.endsWith(".")
    ? unbracketed.slice(0, -1)
    : unbracketed;
  const url = parseUrl(`http://${withoutDot}/`);
  if (url.port || url.username || url.password || url.pathname !== "/")
    throw new TypeError("invalid host");
  const host = url.hostname.toLowerCase();
  return { host, ip: /^\d+(?:\.\d+){3}$/.test(host) };
}

export function normalizeTarget(value: string): NormalizedTarget {
  const url = parseUrl(value);
  if (url.protocol !== "http:" && url.protocol !== "https:")
    throw new TypeError("unsupported target scheme");
  if (url.username || url.password)
    throw new TypeError("target userinfo is not allowed");
  const scheme = url.protocol.slice(0, -1) as "http" | "https";
  const rawHost = url.hostname.startsWith("[")
    ? url.hostname.slice(1, -1)
    : url.hostname;
  const normalized = normalizeHost(rawHost);
  return {
    ...normalized,
    scheme,
    port: url.port ? Number(url.port) : scheme === "https" ? 443 : 80,
    path: url.pathname,
  };
}

export function pathMatches(prefix: string, path: string): boolean {
  if (prefix === "/") return true;
  if (prefix.endsWith("/")) return path.startsWith(prefix);
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function scopeEntryMatches(
  entry: WebReportingScope,
  target: NormalizedTarget,
): boolean {
  let scopeHost: NormalizedHost;
  try {
    scopeHost = normalizeHost(entry.host);
  } catch {
    return false;
  }
  const hostMatches =
    target.host === scopeHost.host ||
    (!scopeHost.ip &&
      entry.include_subdomains &&
      target.host.endsWith(`.${scopeHost.host}`));
  if (!hostMatches || !entry.schemes.includes(target.scheme)) return false;
  const portMatches = entry.ports
    ? entry.ports.includes(target.port)
    : target.port === (target.scheme === "https" ? 443 : 80);
  return portMatches && pathMatches(entry.path_prefix, target.path);
}

export function matchingScopeIds(
  entries: WebReportingScope[],
  target: NormalizedTarget,
): {
  inIds: string[];
  outIds: string[];
} {
  const matching = entries.filter((entry) => scopeEntryMatches(entry, target));
  return {
    inIds: matching
      .filter((entry) => entry.state === "in")
      .map((entry) => entry.id)
      .sort(),
    outIds: matching
      .filter((entry) => entry.state === "out")
      .map((entry) => entry.id)
      .sort(),
  };
}
