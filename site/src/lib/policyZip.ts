import { strToU8, zipSync } from "fflate";

export interface PolicyFiles {
  policyJson: string;
  policyHtml: string;
  securityTxt: string;
  policyUri: string;
  securityTxtUri: string;
  humanPolicyUri: string;
}

function pathParts(uri: URL): string[] | null {
  if (uri.protocol !== "https:" || uri.username || uri.password || uri.search || uri.hash) return null;
  if (uri.pathname.endsWith("/") || uri.pathname.includes("//")) return null;

  try {
    const parts = uri.pathname.slice(1).split("/").map(decodeURIComponent);
    if (
      parts.length === 0 ||
      parts.some((part) => !part || part === "." || part === ".." || /[\\/\u0000-\u001f\u007f]/.test(part))
    ) return null;
    return parts;
  } catch {
    return null;
  }
}

function archivePath(uri: URL): string | null {
  return pathParts(uri)?.join("/") ?? null;
}

function uriFilename(uri: string, fallback: string): string {
  try {
    return pathParts(new URL(uri))?.at(-1) ?? fallback;
  } catch {
    return fallback;
  }
}

export const policyFilename = (policyUri: string): string => uriFilename(policyUri, "cvd-policy.json");
export const humanPolicyFilename = (humanPolicyUri: string): string => uriFilename(humanPolicyUri, "cvd-policy.html");

/** Returns an exact web-root archive only when every artifact has one safe origin. */
export function policyZip(files: PolicyFiles): Uint8Array<ArrayBuffer> | null {
  const rawUris = [files.policyUri, files.securityTxtUri, files.humanPolicyUri];
  try {
    if (rawUris.some((uri) => {
      const rawPath = uri.match(/^https:\/\/[^/?#]+([^?#]*)/i)?.[1] ?? "";
      return rawPath.split("/").some((part) => decodeURIComponent(part) === "..");
    })) return null;
  } catch {
    return null;
  }

  const uris = rawUris.map((uri) => new URL(uri));
  if (uris.some((uri) => uri.origin !== uris[0].origin)) return null;

  const paths = uris.map(archivePath);
  if (paths.some((path) => path === null) || new Set(paths).size !== paths.length) return null;

  return zipSync({
    [paths[0] as string]: strToU8(files.policyJson),
    [paths[1] as string]: strToU8(files.securityTxt),
    [paths[2] as string]: strToU8(files.policyHtml),
  });
}
