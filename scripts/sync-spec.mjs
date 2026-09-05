// Copies the specification artefacts this repository builds against into
// site/vendor/spec and packages/core/src/schema.generated.ts.
//
// The copies are committed, so the site builds on a static host without the
// specification repository being present. Run this after every spec release:
//
//   npm run sync:spec                        # expects ../cvd-policy-spec
//   CVD_SPEC_DIR=/path/to/spec npm run sync:spec
//
// `npm run sync:spec -- --check` fails when the copies have drifted, which is
// what CI uses.
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  rmSync,
} from "node:fs";
import { join, dirname, relative } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const specDir =
  process.env["CVD_SPEC_DIR"] ?? join(root, "..", "cvd-policy-spec");
const check = process.argv.includes("--check");

if (!existsSync(join(specDir, "SPEC.md"))) {
  const message =
    `No specification at ${specDir}.\n` +
    `Clone github.com/cvd-policy/spec next to this repository, or set CVD_SPEC_DIR.`;

  // Looking for drift is pointless without the source, and not a failure:
  // this repository builds on its own by design.
  if (check) {
    console.warn(`${message}\nSkipping the drift check.`);
    process.exit(0);
  }

  console.error(message);
  process.exit(1);
}

const vendor = join(root, "site", "vendor", "spec");
const changed = [];

function write(target, content) {
  if (existsSync(target) && readFileSync(target, "utf8") === content) return;
  changed.push(target.slice(root.length + 1).replace(/\\/g, "/"));
  if (!check) {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
}

function treeFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? treeFiles(join(dir, entry.name))
        : [join(dir, entry.name)],
    )
    .sort();
}

function syncTree(source, target) {
  if (!check) mkdirSync(target, { recursive: true });
  const relativeSources = new Set(
    treeFiles(source).map((file) => relative(source, file)),
  );
  for (const sourceFile of treeFiles(source)) {
    const name = relative(source, sourceFile);
    const targetFile = join(target, name);
    write(targetFile, readFileSync(sourceFile, "utf8"));
  }
  for (const targetFile of treeFiles(target)) {
    const name = relative(target, targetFile);
    if (relativeSources.has(name)) continue;
    changed.push(targetFile.slice(root.length + 1).replace(/\\/g, "/"));
    if (!check) rmSync(targetFile);
  }
}

// Frozen 0.x documents and artefacts remain available as legacy resources.
mkdirSync(join(vendor, "examples"), { recursive: true });
mkdirSync(join(vendor, "schema"), { recursive: true });

for (const file of ["SPEC.md", "SPEC.de.md"]) {
  write(join(vendor, file), readFileSync(join(specDir, file), "utf8"));
}

for (const file of [
  "cvd-policy-0.1.schema.json",
  "cvd-policy-0.2.schema.json",
]) {
  write(
    join(vendor, "schema", file),
    readFileSync(join(specDir, "schema", file), "utf8"),
  );
}

mkdirSync(join(vendor, "schema", "profiles"), { recursive: true });
write(
  join(vendor, "schema", "profiles", "report-0.1.schema.json"),
  readFileSync(
    join(specDir, "schema", "profiles", "report-0.1.schema.json"),
    "utf8",
  ),
);

const examples = readdirSync(join(specDir, "examples")).filter((name) =>
  name.endsWith(".json"),
);
for (const file of examples) {
  write(
    join(vendor, "examples", file),
    readFileSync(join(specDir, "examples", file), "utf8"),
  );
}

if (!check) {
  // Drop examples that the specification no longer ships.
  for (const file of readdirSync(join(vendor, "examples"))) {
    if (!examples.includes(file)) rmSync(join(vendor, "examples", file));
  }
}

// The site presents V1 first, separately from the frozen 0.x material.
const siteV1 = join(vendor, "v1");
const siteMarkdown = (path) => readFileSync(path, "utf8").replace(/[ \t]+$/gm, "");
write(
  join(siteV1, "SPEC.md"),
  siteMarkdown(join(specDir, "v1", "SPEC.md")),
);
write(
  join(siteV1, "SPEC.de.md"),
  siteMarkdown(join(specDir, "v1", "SPEC.de.md")),
);
syncTree(
  join(specDir, "tests", "v1", "policy", "valid"),
  join(siteV1, "examples"),
);

// The library embeds every schema, so it never needs the network at runtime.
// A published version is frozen, so an old document keeps being judged by the
// rules it was written for.
const load = (...parts) => {
  const source = join(specDir, "schema", ...parts);
  try {
    return JSON.parse(readFileSync(source, "utf8"));
  } catch (cause) {
    throw new Error(`Invalid JSON schema: ${source}`, { cause });
  }
};
const embedded = {
  0.1: load("cvd-policy-0.1.schema.json"),
  0.2: load("cvd-policy-0.2.schema.json"),
};
const reportProfile = load("profiles", "report-0.1.schema.json");

write(
  join(root, "packages", "core", "src", "schema.generated.ts"),
  `// Generated by scripts/sync-spec.mjs. Do not edit.\n` +
    `export const schemas = ${JSON.stringify(embedded, null, 2)} as const;\n\n` +
    `export const LATEST_VERSION = "0.2";\n\n` +
    `export const reportProfile = ${JSON.stringify(reportProfile, null, 2)} as const;\n`,
);

// Version 1 is additive and isolated from the frozen 0.x schemas and API.
const v1Schema = load("cvd-policy-1.schema.json");
const v1Source = join(specDir, "tests", "v1");
const v1Vendor = join(root, "packages", "core", "vendor", "spec-v1");
syncTree(v1Source, join(v1Vendor, "tests", "v1"));
write(
  join(v1Vendor, "schema", "cvd-policy-1.schema.json"),
  readFileSync(join(specDir, "schema", "cvd-policy-1.schema.json"), "utf8"),
);
write(
  join(v1Vendor, "v1", "SPEC.md"),
  readFileSync(join(specDir, "v1", "SPEC.md"), "utf8"),
);
write(
  join(v1Vendor, "v1", "requirements.json"),
  readFileSync(join(specDir, "v1", "requirements.json"), "utf8"),
);
const specCommit = execFileSync("git", ["-C", specDir, "rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
write(join(v1Vendor, "SPEC_COMMIT"), `${specCommit}\n`);
write(
  join(root, "packages", "core", "src", "v1", "schema.generated.ts"),
  `// Generated by scripts/sync-spec.mjs. Do not edit.\n` +
    `export const FORMAT_VERSION = 1 as const;\n\n` +
    `export const schema = ${JSON.stringify(v1Schema, null, 2)} as const;\n`,
);

if (check && changed.length > 0) {
  console.error(
    `Out of date with ${specDir}:\n  ${changed.join("\n  ")}\nRun: npm run sync:spec`,
  );
  process.exit(1);
}

console.log(
  check
    ? `Up to date with ${specDir}.`
    : changed.length === 0
      ? "Already up to date."
      : `Updated ${changed.length} file(s):\n  ${changed.join("\n  ")}`,
);
