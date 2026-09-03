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
  if (bare === "localhost") return true;

  // An IPv6 address always has a colon. Requiring it is what keeps a domain
  // such as `fd-tech.de` or `fcbank.com` from being read as a unique local
  // address — fc00::/7 and fe80::/10 are address prefixes, not name prefixes.
  if (bare.includes(":")) {
    const groups = ipv6Groups(bare);
    if (!groups) return true;
    const [first = 0] = groups;
    if (groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff) {
      const sixth = groups[6] ?? 0;
      const seventh = groups[7] ?? 0;
      return isPrivateAddress(`${sixth >> 8}.${sixth & 255}.${seventh >> 8}.${seventh & 255}`);
    }
    if (groups.slice(0, 6).every((group) => group === 0)) return true;
    if (first === 0x0064 && groups[1] === 0xff9b && groups.slice(2, 6).every((group) => group === 0)) {
      const sixth = groups[6] ?? 0;
      const seventh = groups[7] ?? 0;
      return isPrivateAddress(`${sixth >> 8}.${sixth & 255}.${seventh >> 8}.${seventh & 255}`);
    }
    return (
      groups.every((group) => group === 0) ||
      (groups.slice(0, 7).every((group) => group === 0) && groups[7] === 1) ||
      (first & 0xfe00) === 0xfc00 ||
      (first & 0xffc0) === 0xfe80 ||
      (first & 0xffc0) === 0xfec0 ||
      (first & 0xff00) === 0xff00 ||
      (first === 0x0064 && groups[1] === 0xff9b && groups[2] === 1) ||
      (first === 0x0100 && groups.slice(1, 4).every((group) => group === 0)) ||
      (first === 0x2001 && groups[1] === 0x0db8)
    );
  }

  const parts = bare.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  if (parts.some((n) => n < 0 || n > 255)) return true;
  const [a = 0, b = 0, c = 0] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function ipv6Groups(address: string): number[] | null {
  const pieces = address.split("::");
  if (pieces.length > 2) return null;
  const parse = (part: string): number[] | null => {
    if (!part) return [];
    const groups = part.split(":");
    const last = groups.at(-1);
    if (last?.includes(".")) {
      const bytes = last.split(".").map(Number);
      if (bytes.length !== 4 || bytes.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255)) return null;
      groups.splice(-1, 1, ((bytes[0] ?? 0) * 256 + (bytes[1] ?? 0)).toString(16), ((bytes[2] ?? 0) * 256 + (bytes[3] ?? 0)).toString(16));
    }
    if (groups.some((group) => !/^[0-9a-f]{1,4}$/i.test(group))) return null;
    return groups.map((group) => Number.parseInt(group, 16));
  };
  const left = parse(pieces[0] ?? "");
  const right = parse(pieces[1] ?? "");
  if (!left || !right) return null;
  const missing = 8 - left.length - right.length;
  if ((pieces.length === 1 && missing !== 0) || (pieces.length === 2 && missing < 1)) return null;
  return [...left, ...Array.from({ length: missing }, () => 0), ...right];
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
