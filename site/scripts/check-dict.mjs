// Compares the dictionaries beyond what the type system covers.
//
// TypeScript already guarantees that every English key exists in German. It
// says nothing about the values — a translation that drops a {placeholder}
// silently loses information at runtime, and an empty string renders as
// nothing at all. Both happened during 0.2.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dictDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "lib", "dict");
const ENTRY = /^ {2}"([^"]+)":\s*(?:\n\s*)?("(?:[^"\\]|\\.)*")/gm;

function load(name) {
  const text = readFileSync(join(dictDir, name), "utf8");
  const entries = {};
  for (const match of text.matchAll(ENTRY)) entries[match[1]] = JSON.parse(match[2]);
  return entries;
}

const en = load("en.ts");
const languages = { de: load("de.ts") };

const placeholders = (value) => [...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

let failures = 0;
const fail = (message) => {
  failures += 1;
  console.error(`  FAIL ${message}`);
};

for (const [code, dict] of Object.entries(languages)) {
  for (const key of Object.keys(en)) {
    if (!(key in dict)) {
      fail(`${code}: ${key} is missing`);
      continue;
    }
    if (!dict[key].trim()) fail(`${code}: ${key} is empty`);

    const expected = placeholders(en[key]).join(",");
    const actual = placeholders(dict[key]).join(",");
    if (expected !== actual) {
      fail(`${code}: ${key} uses {${actual}} where English uses {${expected}}`);
    }
  }

  for (const key of Object.keys(dict)) {
    if (!(key in en)) fail(`${code}: ${key} has no English original`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} problem(s) in the dictionaries.`);
  process.exit(1);
}

console.log(
  `Dictionaries agree: ${Object.keys(en).length} keys, ` +
    `${Object.keys(languages).join(", ")} complete, placeholders match.`,
);
