import { readFileSync } from "node:fs";
import { explain, SUPPORTED_VERSIONS, validateReport, validateText } from "@cvd-policy/core";
import { describe } from "./messages.mjs";
import { fetchPolicy } from "./fetch.mjs";

// Read from the library rather than written out here, which is how the banner
// came to claim 0.1 long after 0.2 shipped.
const USAGE = `cvd-policy — CVD Policy Format ${SUPPORTED_VERSIONS.join(", ")}

  cvd-policy validate <file>       validate a file
  cvd-policy validate -            validate stdin
  cvd-policy check <url|domain>    fetch and validate a published policy
  cvd-policy explain <file>        print a document in plain language
  cvd-policy report <file>         validate a report against the report profile

Exit codes: 0 valid, 1 errors, 2 warnings only, 3 not reachable.
`;

const readStdin = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
};

/** 0 valid, 1 errors, 2 warnings only. */
function report(result, source) {
  const errors = result.issues.filter((issue) => issue.level === "error");
  const warnings = result.issues.filter((issue) => issue.level === "warning");
  const infos = result.issues.filter((issue) => issue.level === "info");

  console.log(`${result.valid ? "valid" : "invalid"}  ${source}`);
  for (const issue of [...errors, ...warnings, ...infos]) console.log(describe(issue));

  if (errors.length > 0) return 1;
  return warnings.length > 0 ? 2 : 0;
}

function printExplain(raw) {
  const doc = JSON.parse(raw);
  for (const section of explain(doc)) {
    console.log(`\n[${section.key}]  ${section.severity}`);
    for (const item of section.items) console.log(`  ${item.labelKey.padEnd(28)} ${item.value}`);
  }
}

export async function run(argv) {
  const [command, argument] = argv;

  if (!command || command === "--help" || command === "-h") {
    console.log(USAGE);
    return command ? 0 : 1;
  }

  try {
    if (command === "validate") {
      if (!argument) {
        console.error("validate needs a file or -");
        return 1;
      }
      const raw = argument === "-" ? await readStdin() : readFileSync(argument, "utf8");
      return report(validateText(raw), argument === "-" ? "stdin" : argument);
    }

    if (command === "check") {
      if (!argument) {
        console.error("check needs a URL or a domain");
        return 1;
      }
      const { body, url, discoveredFor } = await fetchPolicy(argument);
      const result = validateText(body, { retrievedFrom: url });
      console.log(`discovered for ${discoveredFor}`);
      return report(result, url);
    }

    if (command === "report") {
      if (!argument) {
        console.error("report needs a file or -");
        return 1;
      }
      const raw = argument === "-" ? await readStdin() : readFileSync(argument, "utf8");
      return report(validateReport(JSON.parse(raw)), argument === "-" ? "stdin" : argument);
    }

    if (command === "explain") {
      if (!argument) {
        console.error("explain needs a file");
        return 1;
      }
      printExplain(argument === "-" ? await readStdin() : readFileSync(argument, "utf8"));
      return 0;
    }
  } catch (error) {
    console.error(String(error instanceof Error ? error.message : error));
    return command === "check" ? 3 : 1;
  }

  console.error(`unknown command: ${command}`);
  console.log(USAGE);
  return 1;
}
