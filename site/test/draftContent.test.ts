import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { CvdPolicyDocument } from "@cvd-policy/core/v1";
import { mergeSecurityTxt, securityTxt } from "@cvd-policy/core/v1";
import { describe, expect, it } from "vitest";

const site = join(dirname(fileURLToPath(import.meta.url)), "..");
const web = join(site, "..");
const read = (...parts: string[]) => readFileSync(join(site, ...parts), "utf8");

describe("Draft 00 website content", () => {
  it("renders the V1 candidate as the primary specification", () => {
    expect(read("src", "routes", "Spec.svelte")).toContain("vendor/spec/v1/SPEC.md");
    expect(read("vendor", "spec", "v1", "SPEC.md")).toContain("Format version:** `1`");
    expect(read("vendor", "spec", "v1", "SPEC.de.md")).toContain("Formatversion:** `1`");
  });

  it("keeps V1 and legacy examples visibly separate", () => {
    const v1 = readdirSync(join(site, "vendor", "spec", "v1", "examples"));
    const legacy = readdirSync(join(site, "vendor", "spec", "examples"));

    for (const file of v1) {
      expect(JSON.parse(read("vendor", "spec", "v1", "examples", file)).cvd_policy).toBe(1);
    }
    for (const file of legacy) {
      expect(JSON.parse(read("vendor", "spec", "examples", file)).cvd_policy).toMatch(/^0\.[12]$/);
    }
  });

  it("labels the package-root explainer as Legacy 0.x", () => {
    const route = read("src", "routes", "Explain.svelte");
    expect(route).toContain('from "@cvd-policy/core"');
    expect(route).toContain('t("explain.legacy_notice")');
    expect(route).not.toContain('router.navigate("/validate")');
    expect(read("src", "lib", "dict", "en.ts")).toContain('"nav.explain": "Legacy explainer"');
  });

  it("keeps generated public resources synchronized without stale files", () => {
    expect(readdirSync(join(site, "public", "examples", "v1")).sort()).toEqual(
      readdirSync(join(site, "vendor", "spec", "v1", "examples")).sort(),
    );
    expect(readdirSync(join(site, "public", "spec")).sort()).toEqual([
      "0.2.de.md",
      "0.2.md",
      "v1.de.md",
      "v1.md",
    ]);
  });

  it("links a human policy only in a newly generated security.txt", () => {
    const doc = JSON.parse(read("public", "cvd-policy.json")) as CvdPolicyDocument;
    const humanUri = "https://example.com/security/policy.html";
    const fresh = securityTxt(doc, {
      policyUri: "https://example.com/cvd-policy.json",
      securityTxtUri: "https://example.com/.well-known/security.txt",
      humanPolicyUris: [humanUri],
    });
    const existing = `Contact: mailto:security@example.com\nExpires: ${doc.expires}\nPolicy: https://example.com/existing-policy\n`;
    const merged = mergeSecurityTxt(existing, "https://example.com/cvd-policy.json");

    expect(fresh).toContain(`Policy: ${humanUri}`);
    expect(merged).toContain("Policy: https://example.com/existing-policy");
    expect(merged).not.toContain(humanUri);
  });

  it("offers every V1 policy section in the guided editor without legacy transport fields", () => {
    const route = read("src", "routes", "Generate.svelte");
    const editor = read("src", "components", "V1PolicyEditor.svelte");

    expect(route).toContain("<V1PolicyEditor bind:policy bind:valid={editorValid} />");
    expect(route).toContain('hidden={editorMode !== "guided"}');
    expect(route).toContain("JSON.stringify(nextPolicy, null, 2) !== guidedRaw");
    for (const field of [
      "organization",
      "contact",
      "research",
      "reporting_scope",
      "testing",
      "reporting",
      "response_targets",
      "disclosure",
      "critical_extensions",
      "extensions",
    ]) expect(editor).toContain(`policy.${field}`);
    expect(editor).toContain("savedConditions");
    expect(editor).toContain("valid = false");
    expect(editor).toContain('throw new Error("missing extension URI")');
    expect(editor).not.toContain("report_requirements");
    expect(editor).not.toContain("intake");
  });

  it("serves discovery and policy files with explicit matching media types", () => {
    const headers = read("public", "_headers");
    const caddy = readFileSync(join(web, "ops", "Caddyfile"), "utf8");

    expect(headers).toMatch(/\/cvd-policy\.json[\s\S]*Content-Type: application\/cvd-policy\+json/);
    expect(headers).toMatch(/\/\.well-known\/\*[\s\S]*Content-Type: text\/plain/);
    expect(caddy).toContain('Content-Type "application/cvd-policy+json"');
    expect(caddy).toContain('Content-Type "text/plain"');
  });
});
