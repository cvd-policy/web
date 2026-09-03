import { readFileSync } from "node:fs";
import { explain, SUPPORTED_VERSIONS, validateReport, validateText } from "@cvd-policy/core";
import {
  assessSecurityTxtAuthority,
  parsePolicyText,
  policyRetrievalIssues,
} from "@cvd-policy/core/v1";
import { describe } from "./messages.mjs";
import { fetchPolicy, fetchResource, fetchSecurityTxt } from "./fetch.mjs";

const USAGE = `cvd-policy — CVD Policy Format V1 and legacy ${SUPPORTED_VERSIONS.join(", ")}

  cvd-policy validate <file> [--legacy]                 validate a local policy
  cvd-policy validate - [--legacy]                      validate stdin
  cvd-policy check <domain> [--allow-application-json]  discover and validate V1
  cvd-policy check <url|domain> --legacy                fetch and validate 0.x
  cvd-policy explain <file>                             explain a legacy document
  cvd-policy report <file>                              validate a legacy report

Exit codes: 0 valid, 1 invalid, 2 compatibility warning, 3 not reachable.
`;

const readStdin = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
};

const readUtf8 = (file) => new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(file));

function report(result, source) {
  const errors = result.issues.filter((issue) => issue.level === "error");
  const warnings = result.issues.filter((issue) => issue.level === "warning");
  const infos = result.issues.filter((issue) => issue.level === "info");

  console.log(`${result.valid ? "valid" : "invalid"}  ${source}`);
  for (const issue of [...errors, ...warnings, ...infos]) console.log(describe(issue));

  if (errors.length > 0) return 1;
  return warnings.length > 0 ? 2 : 0;
}

function reportV1(issues, source) {
  console.log(`${issues.length === 0 ? "valid" : "invalid"}  ${source}`);
  for (const issue of issues) {
    console.log(`${issue.code}${issue.path ? `  ${issue.path}` : ""}`);
  }
  return issues.length === 0 ? 0 : 1;
}

function printRedirects(label, retrieval) {
  console.log(`${label}: ${retrieval.requestedUri}`);
  for (const uri of retrieval.redirectChain) console.log(`  -> ${uri}`);
}

function printExplain(raw) {
  const doc = JSON.parse(raw);
  for (const section of explain(doc)) {
    console.log(`\n[${section.key}]  ${section.severity}`);
    for (const item of section.items) console.log(`  ${item.labelKey.padEnd(28)} ${item.value}`);
  }
}

async function checkV1(target, allowApplicationJson, fetcher) {
  const security = await fetchSecurityTxt(target, { fetcher });
  const securityRetrievedAt = new Date();
  printRedirects("security.txt", security);
  if (security.statusCode !== 200) return reportV1([
    { code: "security_txt_parse_error", path: "", message: `HTTP ${security.statusCode}` },
  ], security.finalUri);

  const authority = assessSecurityTxtAuthority(security.body, {
    requestedUri: security.requestedUri,
    finalUri: security.finalUri,
    redirectChain: security.redirectChain,
    retrievedAt: securityRetrievedAt,
  });
  if (!authority.established) return reportV1(authority.issues, security.finalUri);

  const policy = await fetcher(authority.evidence.cvdPolicyUri, {
    accept: allowApplicationJson
      ? "application/cvd-policy+json, application/json;q=0.5"
      : "application/cvd-policy+json",
  });
  const policyRetrievedAt = new Date();
  printRedirects("CVD policy", policy);
  const retrievalIssues = policyRetrievalIssues(
    policy,
    authority.evidence,
    allowApplicationJson,
  );
  const parsed = parsePolicyText(policy.body, { now: policyRetrievedAt });
  const issues = [...retrievalIssues, ...parsed.issues];
  const result = reportV1(issues, policy.finalUri);
  if (result !== 0) return result;

  const mediaType = policy.mediaType.split(";", 1)[0]?.trim().toLowerCase();
  if (mediaType === "application/json") {
    console.log("warning: application/json accepted in explicit compatibility mode");
    return 2;
  }
  return 0;
}

export async function run(argv, { fetcher = fetchResource } = {}) {
  const [command, ...args] = argv;
  const legacy = args.includes("--legacy");
  const allowApplicationJson = args.includes("--allow-application-json");
  const argument = args.find((value) => !value.startsWith("--"));

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
      const raw = argument === "-" ? await readStdin() : readUtf8(argument);
      return legacy
        ? report(validateText(raw), argument === "-" ? "stdin" : argument)
        : reportV1(parsePolicyText(raw).issues, argument === "-" ? "stdin" : argument);
    }

    if (command === "check") {
      if (!argument) {
        console.error("check needs a domain");
        return 1;
      }
      if (!legacy) return await checkV1(argument, allowApplicationJson, fetcher);
      const { body, url, discoveredFor } = await fetchPolicy(argument, { fetcher });
      console.log(`discovered for ${discoveredFor}`);
      return report(validateText(body, { retrievedFrom: url }), url);
    }

    if (command === "report") {
      if (!argument) {
        console.error("report needs a file or -");
        return 1;
      }
      const raw = argument === "-" ? await readStdin() : readUtf8(argument);
      return report(validateReport(JSON.parse(raw)), argument === "-" ? "stdin" : argument);
    }

    if (command === "explain") {
      if (!argument) {
        console.error("explain needs a file");
        return 1;
      }
      printExplain(argument === "-" ? await readStdin() : readUtf8(argument));
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
