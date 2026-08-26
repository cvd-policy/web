import { strToU8, zipSync } from "fflate";

export interface PolicyFiles {
  cvdJson: string;
  policyHtml: string;
  securityTxt: string;
}

/**
 * The whole set of files as one archive, laid out to unpack at a web root.
 *
 * Two directories, not one: `/.well-known/` holds what a consumer discovers by
 * path — `cvd.json` per section 3.2, and `security.txt` per RFC 9116, both of
 * which belong in that reserved namespace. The readable page is reached only
 * through the `Policy` field's absolute URL, so it sits on an ordinary path
 * instead of squatting a namespace RFC 8615 governs by registry.
 */
export function policyZip(files: PolicyFiles): Uint8Array<ArrayBuffer> {
  return zipSync({
    ".well-known": {
      "cvd.json": strToU8(files.cvdJson),
      "security.txt": strToU8(files.securityTxt),
    },
    security: {
      "cvd.html": strToU8(files.policyHtml),
    },
  });
}
