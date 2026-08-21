import { describe, expect, it } from "vitest";
import type { CvdPolicyDocument } from "@cvd-policy/core";
import { policyHtml } from "../src/lib/policyHtml.js";

const doc = {
  cvd_policy: "0.2",
  canonical: "https://example.com/.well-known/cvd.json",
  expires: "2027-06-30T23:59:59Z",
  organization: { name: "Example Ltd." },
  contact: { channels: [{ type: "email", value: "security@example.com", preferred: true }] },
  research: { posture: "report_only" },
  scope: { precedence: "out_overrides_in", web: [{ pattern: "example.com", state: "in" }] },
  report_requirements: { required_fields: ["affected_asset"] },
} as unknown as CvdPolicyDocument;

describe("policyHtml", () => {
  it("names the version the document actually declares", () => {
    // It said 0.1 for every document, on a page meant to be published at the
    // Policy: URL — so the wrong number ended up on other people's sites.
    expect(policyHtml(doc, "en")).toContain("CVD Policy Format 0.2");
    expect(policyHtml({ ...doc, cvd_policy: "0.1" }, "en")).toContain("CVD Policy Format 0.1");
  });

  it("is a standalone page with no script and no external resource", () => {
    const html = policyHtml(doc, "en");
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/https?:\/\/(?!example\.com)/);
  });

  it("carries the document's own language", () => {
    expect(policyHtml(doc, "de")).toContain('<html lang="de">');
  });

  it("escapes text that would otherwise close a tag", () => {
    const hostile = {
      ...doc,
      organization: { name: '</title><script>alert(1)</script>' },
    } as unknown as CvdPolicyDocument;

    const html = policyHtml(hostile, "en");
    expect(html).not.toContain("<script>alert(1)");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes a quote so it cannot break out of an attribute", () => {
    expect(policyHtml(doc, '"onload="alert(1)')).toContain("&quot;onload=&quot;");
  });
});
