import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { explain } from "../src/explain.js";
import type { CvdPolicyDocument } from "../src/types.js";

// The vendored copies ship with this repository, so these run anywhere.
const examplesDir = join(import.meta.dirname, "..", "..", "..", "site", "vendor", "spec", "examples");
const example = (name: string) =>
  JSON.parse(readFileSync(join(examplesDir, name), "utf8")) as CvdPolicyDocument;

describe("explain", () => {
  it("marks a prohibited posture as restrictive", () => {
    const research = explain(example("04-prohibited.json")).find((s) => s.key === "research");
    expect(research?.severity).toBe("restrictive");
    expect(research?.items[0]?.value).toBe("posture.prohibited.headline");
  });

  it("marks an open posture as permissive", () => {
    const research = explain(example("03-open-research.json")).find((s) => s.key === "research");
    expect(research?.severity).toBe("permissive");
  });

  it("keeps report_only neutral rather than weak", () => {
    const research = explain(example("01-manufacturer-report-only.json")).find(
      (s) => s.key === "research",
    );
    expect(research?.severity).toBe("neutral");
  });

  it("omits the testing section when there is none", () => {
    const keys = explain(example("04-prohibited.json")).map((section) => section.key);
    expect(keys).not.toContain("testing");
  });

  it("counts scope entries", () => {
    const scope = explain(example("01-manufacturer-report-only.json")).find((s) => s.key === "scope");
    expect(scope?.items[0]?.value).toBe("1");
    expect(scope?.items[1]?.value).toBe("1");
    expect(scope?.items[2]?.value).toBe("2");
  });

  it("produces no score, rating or comparison", () => {
    const serialised = JSON.stringify(explain(example("05-full-cra-profile.json")));
    for (const word of ["score", "rating", "maturity", "rank"]) {
      expect(serialised.toLowerCase()).not.toContain(word);
    }
  });
});
