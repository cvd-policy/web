import { strToU8, zipSync } from "fflate";

export interface WellKnownFiles {
  cvdJson: string;
  policyHtml: string;
  securityTxt: string;
}

/** Builds the ready-to-upload .well-known directory as a ZIP archive. */
export function wellKnownZip(files: WellKnownFiles): Uint8Array<ArrayBuffer> {
  return zipSync({
    ".well-known": {
      "cvd.json": strToU8(files.cvdJson),
      "cvd-policy.html": strToU8(files.policyHtml),
      "security.txt": strToU8(files.securityTxt),
    },
  });
}
