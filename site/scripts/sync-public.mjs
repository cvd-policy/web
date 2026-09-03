// Copies the vendored schema and examples into public/, so both are served
// from this domain and nothing is fetched from anywhere else.
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const vendor = join(here, "..", "vendor", "spec");
const publicDir = join(here, "..", "public");
const v1Vendor = join(here, "..", "..", "packages", "core", "vendor", "spec-v1");

// Every published version stays reachable at its own URL, plus the profiles.
for (const version of ["0.1", "0.2"]) {
  const target = join(publicDir, "schema", version);
  mkdirSync(target, { recursive: true });
  copyFileSync(
    join(vendor, "schema", `cvd-policy-${version}.schema.json`),
    join(target, "cvd-policy.schema.json"),
  );
}

mkdirSync(join(publicDir, "schema"), { recursive: true });
copyFileSync(
  join(v1Vendor, "schema", "cvd-policy-1.schema.json"),
  join(publicDir, "schema", "cvd-policy-1.schema.json"),
);

const profileTarget = join(publicDir, "schema", "profiles");
mkdirSync(profileTarget, { recursive: true });
copyFileSync(
  join(vendor, "schema", "profiles", "report-0.1.schema.json"),
  join(profileTarget, "report-0.1.schema.json"),
);

const examplesTarget = join(publicDir, "examples");
mkdirSync(examplesTarget, { recursive: true });
for (const file of readdirSync(join(vendor, "examples")).filter((name) => name.endsWith(".json"))) {
  copyFileSync(join(vendor, "examples", file), join(examplesTarget, file));
}

console.log("public/schema and public/examples updated");
