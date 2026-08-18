// Copies the vendored schema and examples into public/, so both are served
// from this domain and nothing is fetched from anywhere else.
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const vendor = join(here, "..", "vendor", "spec");
const publicDir = join(here, "..", "public");

const schemaTarget = join(publicDir, "schema", "0.1");
mkdirSync(schemaTarget, { recursive: true });
copyFileSync(
  join(vendor, "schema", "cvd-policy-0.1.schema.json"),
  join(schemaTarget, "cvd-policy.schema.json"),
);

const examplesTarget = join(publicDir, "examples");
mkdirSync(examplesTarget, { recursive: true });
for (const file of readdirSync(join(vendor, "examples")).filter((name) => name.endsWith(".json"))) {
  copyFileSync(join(vendor, "examples", file), join(examplesTarget, file));
}

console.log("public/schema and public/examples updated");
