// Copies the vendored schema and examples into public/, so both are served
// from this domain and nothing is fetched from anywhere else.
import { copyFileSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const vendor = join(here, "..", "vendor", "spec");
const publicDir = join(here, "..", "public");
const v1Vendor = join(here, "..", "..", "packages", "core", "vendor", "spec-v1");

function syncFiles(source, target, files) {
  mkdirSync(target, { recursive: true });
  const expected = new Set(files);
  for (const file of readdirSync(target)) {
    if (!expected.has(file)) unlinkSync(join(target, file));
  }
  for (const file of files) copyFileSync(join(source, file), join(target, file));
}

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
const legacyExamples = readdirSync(join(vendor, "examples")).filter((name) => name.endsWith(".json"));
mkdirSync(examplesTarget, { recursive: true });
const expectedLegacyExamples = new Set([...legacyExamples, "v1"]);
for (const file of readdirSync(examplesTarget)) {
  if (!expectedLegacyExamples.has(file)) unlinkSync(join(examplesTarget, file));
}
for (const file of legacyExamples) copyFileSync(join(vendor, "examples", file), join(examplesTarget, file));

const v1ExamplesTarget = join(examplesTarget, "v1");
const v1ExamplesSource = join(vendor, "v1", "examples");
syncFiles(
  v1ExamplesSource,
  v1ExamplesTarget,
  readdirSync(v1ExamplesSource).filter((name) => name.endsWith(".json")),
);

const specificationsTarget = join(publicDir, "spec");
mkdirSync(specificationsTarget, { recursive: true });
const specifications = [
  [join(vendor, "v1", "SPEC.md"), "v1.md"],
  [join(vendor, "v1", "SPEC.de.md"), "v1.de.md"],
  [join(vendor, "SPEC.md"), "0.2.md"],
  [join(vendor, "SPEC.de.md"), "0.2.de.md"],
];
const expectedSpecifications = new Set(specifications.map(([, target]) => target));
for (const file of readdirSync(specificationsTarget)) {
  if (!expectedSpecifications.has(file)) unlinkSync(join(specificationsTarget, file));
}
for (const [source, target] of specifications) {
  copyFileSync(source, join(specificationsTarget, target));
}

console.log("public specifications, schemas and examples updated");
