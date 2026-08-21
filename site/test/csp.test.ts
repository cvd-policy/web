import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const assets = join(dist, "assets");

// Like the conformance corpus in core, this needs a build to look at and says
// so rather than passing vacuously.
const built = existsSync(assets);
const describeBuilt = built ? describe : describe.skip;

if (!built) {
  console.warn("site/dist is absent — CSP checks skipped. Run `npm run build` at the root.");
}

describeBuilt("the shipped bundle under the production CSP", () => {
  const bundles = built
    ? readdirSync(assets)
        .filter((name) => name.endsWith(".js"))
        .map((name) => ({ name, code: readFileSync(join(assets, name), "utf8") }))
    : [];

  it("has JavaScript to check", () => {
    expect(bundles.length).toBeGreaterThan(0);
  });

  // The bug this file exists for: Ajv compiles a schema by building a function
  // from a string. `script-src 'self'` refuses, the module throws while
  // loading, and the whole page is blank. Nothing else catches it — Node has no
  // CSP and `vite dev` never applies public/_headers — so it is caught here.
  it("builds no code from strings, which script-src 'self' forbids", () => {
    for (const { name, code } of bundles) {
      expect(code, `${name} calls new Function`).not.toMatch(/new Function\s*\(/);
      expect(code, `${name} calls eval`).not.toMatch(/[^.\w]eval\s*\(/);
    }
  });

  it("keeps the CSP free of the escape hatches that hide such a bug", () => {
    const headers = readFileSync(join(root, "public", "_headers"), "utf8");
    const csp = /Content-Security-Policy:\s*(.+)/.exec(headers)?.[1] ?? "";

    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toContain("unsafe-inline");
  });

  it("ships the files a host needs beside the pages", () => {
    for (const file of ["_headers", "_redirects", "404.html", "index.html"]) {
      expect(existsSync(join(dist, file)), file).toBe(true);
    }
  });
});
