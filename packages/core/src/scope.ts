import type { Scope, ScopeState } from "./types.js";

/**
 * Splits a pattern or target into a lowercase host and an optional path prefix.
 * Scheme, userinfo, port, query, fragment and a trailing dot are dropped: none
 * of them changes which host is meant.
 */
function split(value: string): { host: string; path: string } {
  const withoutScheme = String(value ?? "")
    .trim()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
    .replace(/^[^/@]*@/, "");

  const stop = withoutScheme.search(/[/?#]/);
  const authority = stop === -1 ? withoutScheme : withoutScheme.slice(0, stop);
  const rest = stop === -1 ? "" : withoutScheme.slice(stop);

  const host = authority
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");

  const path = rest.startsWith("/") ? rest.split(/[?#]/)[0] ?? "" : "";
  return { host, path };
}

/** True for an IPv4 or bracketed IPv6 literal, which has no domain structure. */
export function isIpLiteral(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[");
}

/** True for a pattern that names no reachable host, such as `*` or a lone dot. */
export function isUnusablePattern(pattern: string): boolean {
  const host = hostOf(pattern);
  return host === "" || host === "*" || !host.includes(".");
}

/** True for loopback, private, link-local and unspecified addresses. */
export function isPrivateAddress(host: string): boolean {
  const bare = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (bare === "localhost" || bare === "::1" || bare === "::" || bare.startsWith("fe80:") || bare.startsWith("fc") || bare.startsWith("fd")) {
    return true;
  }
  const parts = bare.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  const [a = 0, b = 0] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

/**
 * Matches a scope pattern against a target. A leading `*.` covers the domain
 * itself and any host under it; a path in the pattern matches whole segments.
 */
export function matchesPattern(pattern: string, target: string): boolean {
  const p = split(pattern);
  const t = split(target);
  if (p.host === "" || t.host === "") return false;

  const hostMatches = p.host.startsWith("*.")
    ? t.host === p.host.slice(2) || t.host.endsWith(p.host.slice(1))
    : t.host === p.host;

  if (!hostMatches) return false;
  if (p.path === "") return true;

  const prefix = p.path.replace(/\/$/, "");
  return t.path === prefix || t.path.startsWith(`${prefix}/`);
}

/** True if two patterns can match the same target. */
export function patternsOverlap(a: string, b: string): boolean {
  return matchesPattern(a, b) || matchesPattern(b, a);
}

/** Returns the host of a pattern, URL or bare hostname, without a wildcard. */
export function hostOf(value: string): string {
  return split(value).host.replace(/^\*\./, "");
}

/**
 * True when `target` is the anchor host itself or sits under it. Addresses have
 * no hierarchy, so they must match exactly.
 */
export function isAtOrUnder(anchor: string, target: string): boolean {
  const a = hostOf(anchor);
  const t = hostOf(target);
  if (a === "" || t === "") return false;
  if (isIpLiteral(a) || isIpLiteral(t)) return a === t;
  return t === a || t.endsWith(`.${a}`);
}

/** True when a value names a host rather than a product, purl or free text. */
export function isHostTarget(value: string): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed === "") return false;
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return false;
  return /^[*a-z0-9._-]+(\/.*)?$/i.test(trimmed) && hostOf(trimmed).includes(".");
}

/**
 * Hosts a document can speak for: the one it is published on, plus any host
 * that pointed at it from its own discovery path. A host delegating this way is
 * its owner's decision; nothing else grants authority over a host.
 */
export function authorityAnchors(canonical: string, discoveredFor?: string): string[] {
  return [hostOf(canonical ?? ""), hostOf(discoveredFor ?? "")].filter((host) => host !== "");
}

/** True when a document with these anchors can speak for the target. */
export function isAuthoritativeFor(anchors: string[], target: string): boolean {
  return anchors.some((anchor) => isAtOrUnder(anchor, target));
}

/**
 * Resolves whether a target is in scope. A target no entry matches is out of
 * scope; there is no implicit `in`.
 */
export function scopeStateFor(scope: Scope | undefined, target: string): ScopeState {
  if (!scope) return "out";

  const webMatches = (scope.web ?? []).filter((entry) => matchesPattern(entry.pattern, target));
  const productMatches = (scope.products ?? []).filter(
    (product) => product.purl === target || product.name === target,
  );

  const states: ScopeState[] = [
    ...webMatches.map((entry) => entry.state),
    ...productMatches.map((product) => product.state ?? "in"),
  ];

  if (states.length === 0) return "out";
  if (scope.precedence === "explicit_order") return states[states.length - 1] as ScopeState;
  return states.includes("out") ? "out" : "in";
}
