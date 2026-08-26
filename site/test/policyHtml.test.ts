import { describe, expect, it } from "vitest";
import type { CvdPolicyDocument } from "@cvd-policy/core";
import { i18n } from "../src/lib/i18n.svelte.js";
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
    expect(policyHtml(doc)).toContain("CVD Policy Format 0.2");
    expect(policyHtml({ ...doc, cvd_policy: "0.1" })).toContain("CVD Policy Format 0.1");
  });

  it("is a standalone page with no script and no external resource", () => {
    const html = policyHtml(doc);
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/https?:\/\/(?!example\.com)/);
  });

  // It followed the interface, so reading the site in German gave a German policy.
  it("is English whatever language the interface is in", () => {
    // i18n.set writes to documentElement, which these tests run without.
    const had = "document" in globalThis;
    if (!had) {
      (globalThis as { document?: unknown }).document = { documentElement: {} };
    }

    i18n.set("de");
    try {
      const html = policyHtml(doc);
      expect(html).toContain('<html lang="en">');
      expect(html).toContain("Coordinated vulnerability disclosure policy");
      expect(html).not.toContain("Richtlinie zur koordinierten");
    } finally {
      i18n.set("en");
      if (!had) delete (globalThis as { document?: unknown }).document;
    }
  });

  it("escapes text that would otherwise close a tag", () => {
    const hostile = {
      ...doc,
      organization: { name: '</title><script>alert(1)</script>' },
    } as unknown as CvdPolicyDocument;

    const html = policyHtml(hostile);
    expect(html).not.toContain("<script>alert(1)");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes a quote so it cannot break out of an attribute", () => {
    const hostile = { ...doc, canonical: '"onload="alert(1)' } as CvdPolicyDocument;
    expect(policyHtml(hostile)).toContain("&quot;onload=&quot;");
  });
});
