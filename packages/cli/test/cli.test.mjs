import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { run } from "../src/main.mjs";
import { fetchResource, publicAddresses } from "../src/fetch.mjs";

// Fixtures come from the specification repository; see corpus.test.ts.
const spec =
  process.env.CVD_SPEC_DIR ??
  join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "cvd-policy-spec");
const needsCorpus = { skip: existsSync(join(spec, "SPEC.md")) ? false : "specification repository not present" };
const silence = () => {
  const log = console.log;
  const error = console.error;
  console.log = () => {};
  console.error = () => {};
  return () => {
    console.log = log;
    console.error = error;
  };
};

const runQuiet = async (argv, options) => {
  const restore = silence();
  try {
    return await run(argv, options);
  } finally {
    restore();
  }
};

const runCaptured = async (argv, options) => {
  const output = [];
  const log = console.log;
  const error = console.error;
  console.log = (...values) => output.push(values.join(" "));
  console.error = (...values) => output.push(values.join(" "));
  try {
    return { code: await run(argv, options), output: output.join("\n") };
  } finally {
    console.log = log;
    console.error = error;
  }
};

const v1PolicyFile = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "core",
  "vendor",
  "spec-v1",
  "tests",
  "v1",
  "policy",
  "valid",
  "minimal-report-only.json",
);

const CSAF_EXTENSION_ID = "https://github.com/cvd-policy/spec/extensions/csaf-vulnerability-report-v1";
const CSAF_SPECIFICATION = "https://docs.oasis-open.org/csaf/csaf/v2.1/csd04/csaf-v2.1-csd04.html";
const fixedClock = () => new Date("2026-11-08T12:00:00Z");

function currentPolicy() {
  const policy = JSON.parse(readFileSync(v1PolicyFile, "utf8"));
  policy.last_updated = "2026-11-08T11:00:00Z";
  policy.expires = "2026-11-08T13:00:00Z";
  return policy;
}

function csafDeclaration() {
  return {
    channels: [{ uri: "mailto:security@example.com", specification: CSAF_SPECIFICATION }],
  };
}

function checkFetcher(policy, securityExpires) {
  const fetches = [];
  const fetcher = async (url) => {
    fetches.push(url);
    return {
      body: url.endsWith("security.txt")
        ? `Contact: mailto:security@example.com\nExpires: ${securityExpires}\nCVD-Policy: https://example.com/policy.json\n`
        : JSON.stringify(policy),
      requestedUri: url,
      finalUri: url,
      redirectChain: [],
      statusCode: 200,
      mediaType: url.endsWith("security.txt") ? "text/plain" : "application/cvd-policy+json",
    };
  };
  return { fetcher, fetches };
}

test("validate returns 0 for a valid example", needsCorpus, async () => {
  const file = join(spec, "examples", "01-manufacturer-report-only.json");
  assert.equal(await runQuiet(["validate", file, "--legacy"]), 0);
});

test("validate returns 1 for a document with errors", needsCorpus, async () => {
  const file = join(spec, "tests", "invalid", "07-expires-past.json");
  assert.equal(await runQuiet(["validate", file, "--legacy"]), 1);
});

test("validate returns 2 when only warnings remain", needsCorpus, async () => {
  const file = join(spec, "tests", "valid", "09-products-only.json");
  const code = await runQuiet(["validate", file, "--legacy"]);
  assert.ok(code === 0 || code === 2);
});

test("explain returns 0", needsCorpus, async () => {
  const file = join(spec, "examples", "04-prohibited.json");
  assert.equal(await runQuiet(["explain", file]), 0);
});

test("an unknown command returns 1", async () => {
  assert.equal(await runQuiet(["frobnicate"]), 1);
});

test("a missing file returns 1", async () => {
  assert.equal(await runQuiet(["validate", "does-not-exist.json"]), 1);
});

test("network fetch rejects URLs changed by normalization", async () => {
  await assert.rejects(
    fetchResource("https://EXAMPLE.com:443/a/../policy.json"),
    /changes during normalization/,
  );
});

test("validate uses V1 unless legacy is explicit", async () => {
  assert.equal(await runQuiet(["validate", v1PolicyFile]), 0);
});

test("validate reports each CSAF capability state without changing its exit code", async () => {
  const base = currentPolicy();
  const advertised = structuredClone(base);
  advertised.extensions = {
    [CSAF_EXTENSION_ID]: csafDeclaration(),
  };
  const invalid = structuredClone(advertised);
  invalid.extensions[CSAF_EXTENSION_ID].channels = [];
  const unsupported = structuredClone(advertised);
  unsupported.extensions[CSAF_EXTENSION_ID].channels[0].specification = "https://example.com/another-spec";

  const cases = [
    ["not-advertised", base],
    ["advertised", advertised],
    ["invalid", invalid],
    ["unsupported", unsupported],
  ];
  const directory = mkdtempSync(join(tmpdir(), "cvd-policy-cli-"));
  try {
    for (const [state, policy] of cases) {
      const file = join(directory, `${state}.json`);
      writeFileSync(file, JSON.stringify(policy));
      const result = await runCaptured(["validate", file], { now: fixedClock });
      assert.equal(result.code, 0, state);
      assert.match(result.output, new RegExp(`CSAF capability: ${state}`));
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("validate does not report not-advertised after a core validation failure", async () => {
  const policy = currentPolicy();
  policy.cvd_policy = 2;
  const directory = mkdtempSync(join(tmpdir(), "cvd-policy-cli-"));
  try {
    const file = join(directory, "invalid-core.json");
    writeFileSync(file, JSON.stringify(policy));
    const result = await runCaptured(["validate", file], { now: fixedClock });
    assert.equal(result.code, 1);
    assert.doesNotMatch(result.output, /CSAF capability: (?:not-advertised|advertised|invalid|unsupported)/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("validate reports local capability for an expired but otherwise valid policy", async () => {
  const policy = currentPolicy();
  policy.expires = "2026-11-08T11:59:00Z";
  policy.extensions = { [CSAF_EXTENSION_ID]: csafDeclaration() };
  const directory = mkdtempSync(join(tmpdir(), "cvd-policy-cli-"));
  try {
    const file = join(directory, "expired-policy.json");
    writeFileSync(file, JSON.stringify(policy));
    const result = await runCaptured(["validate", file], { now: fixedClock });
    assert.equal(result.code, 1);
    assert.match(result.output, /invalid/);
    assert.match(result.output, /CSAF capability: advertised/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("check discovers V1 through well-known security.txt", async () => {
  const policy = readFileSync(v1PolicyFile, "utf8");
  const fetcher = async (url) => {
    if (url === "https://example.com/.well-known/security.txt") {
      return {
        body: "Contact: mailto:security@example.com\nExpires: 2027-02-28T08:00:00Z\nCVD-Policy: https://policies.example.com/current\n",
        requestedUri: url, finalUri: url, redirectChain: [], statusCode: 200, mediaType: "text/plain",
      };
    }
    assert.equal(url, "https://policies.example.com/current");
    return { body: policy, requestedUri: url, finalUri: url, redirectChain: [], statusCode: 200, mediaType: "application/cvd-policy+json" };
  };
  const restore = silence();
  try { assert.equal(await run(["check", "example.com"], { fetcher }), 0); }
  finally { restore(); }
});

test("check reports a usable CSAF host declaration without claiming intake verification", async () => {
  const policy = currentPolicy();
  policy.extensions = { [CSAF_EXTENSION_ID]: csafDeclaration() };
  const { fetcher, fetches } = checkFetcher(policy, "2026-11-08T13:00:00Z");
  const result = await runCaptured(["check", "example.com"], { fetcher, now: fixedClock });
  assert.equal(result.code, 0);
  assert.match(result.output, /CSAF capability: advertised/);
  assert.match(result.output, /CSAF host declaration: usable \(intake not tested\)/);
  assert.match(result.output, /intake not tested/);
  assert.deepEqual(fetches, [
    "https://example.com/.well-known/security.txt",
    "https://example.com/policy.json",
  ]);
});

test("check rejects a security.txt that expires between retrieval and host assessment", async () => {
  const policy = currentPolicy();
  policy.expires = "2026-11-08T14:00:00Z";
  policy.extensions = { [CSAF_EXTENSION_ID]: csafDeclaration() };
  const { fetcher, fetches } = checkFetcher(policy, "2026-11-08T12:30:00Z");
  const times = [
    new Date("2026-11-08T12:00:00Z"),
    new Date("2026-11-08T13:00:00Z"),
  ];
  const result = await runCaptured(["check", "example.com"], {
    fetcher,
    now: () => times.shift(),
  });
  assert.equal(result.code, 0);
  assert.match(result.output, /CSAF host declaration: not usable/);
  assert.doesNotMatch(result.output, /CSAF host declaration: usable \(intake not tested\)/);
  assert.match(result.output, /security_txt_expired/);
  assert.deepEqual(fetches, [
    "https://example.com/.well-known/security.txt",
    "https://example.com/policy.json",
  ]);
});

test("check displays an expired policy's local capability but never marks its host use usable", async () => {
  const policy = currentPolicy();
  policy.expires = "2026-11-08T11:59:00Z";
  policy.extensions = { [CSAF_EXTENSION_ID]: csafDeclaration() };
  const { fetcher, fetches } = checkFetcher(policy, "2026-11-08T13:00:00Z");
  const result = await runCaptured(["check", "example.com"], {
    fetcher,
    now: fixedClock,
  });
  assert.equal(result.code, 1);
  assert.match(result.output, /CSAF capability: advertised/);
  assert.match(result.output, /CSAF host declaration: not usable/);
  assert.doesNotMatch(result.output, /CSAF host declaration: usable \(intake not tested\)/);
  assert.equal(fetches.length, 2);
});

test("check never reports critical CSAF or other critical extensions as usable", async () => {
  for (const critical of [CSAF_EXTENSION_ID, "https://example.com/unknown-extension"]) {
    const policy = currentPolicy();
    policy.extensions = {
      [CSAF_EXTENSION_ID]: csafDeclaration(),
      ...(critical === CSAF_EXTENSION_ID ? {} : { [critical]: {} }),
    };
    policy.critical_extensions = [critical];
    const { fetcher, fetches } = checkFetcher(policy, "2026-11-08T13:00:00Z");
    const result = await runCaptured(["check", "example.com"], {
      fetcher,
      now: fixedClock,
    });
    assert.equal(result.code, 0, critical);
    assert.match(result.output, /CSAF host declaration: not usable/, critical);
    assert.doesNotMatch(result.output, /CSAF host declaration: usable\b/, critical);
    assert.equal(fetches.length, 2, critical);
  }
});

test("check warns only when application/json compatibility is explicit", async () => {
  const policyFile = join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "core",
    "vendor",
    "spec-v1",
    "tests",
    "v1",
    "policy",
    "valid",
    "minimal-report-only.json",
  );
  const policy = readFileSync(policyFile, "utf8");
  const fetcher = async (url) => ({
    body: url.endsWith("security.txt")
      ? "Contact: mailto:security@example.com\nExpires: 2027-02-28T08:00:00Z\nCVD-Policy: https://example.com/policy.json\n"
      : policy,
    requestedUri: url,
    finalUri: url,
    redirectChain: [],
    statusCode: 200,
    mediaType: url.endsWith("security.txt") ? "text/plain" : "application/json",
  });
  const restore = silence();
  try {
    assert.equal(await run(["check", "example.com"], { fetcher }), 1);
    assert.equal(
      await run(["check", "example.com", "--allow-application-json"], { fetcher }),
      2,
    );
  } finally {
    restore();
  }
});

test("check accepts domains beginning with http", async () => {
  let requested = "";
  const fetcher = async (url) => {
    requested = url;
    return { body: "", requestedUri: url, finalUri: url, redirectChain: [], statusCode: 404, mediaType: "text/plain" };
  };
  await runQuiet(["check", "httpbin.org"], { fetcher });
  assert.equal(requested, "https://httpbin.org/.well-known/security.txt");
});

test("check preserves an explicit domain port", async () => {
  let requested = "";
  const fetcher = async (url) => {
    requested = url;
    return { body: "", requestedUri: url, finalUri: url, redirectChain: [], statusCode: 404, mediaType: "text/plain" };
  };
  await runQuiet(["check", "example.com:8443"], { fetcher });
  assert.equal(requested, "https://example.com:8443/.well-known/security.txt");
});

test("safe DNS resolution retains every public address for connection fallback", async () => {
  const addresses = await publicAddresses(new URL("https://example.com/"), async () => [
    { address: "192.168.1.1", family: 4 },
    { address: "2606:4700::1111", family: 6 },
    { address: "1.1.1.1", family: 4 },
  ]);
  assert.deepEqual(addresses, [
    { address: "2606:4700::1111", family: 6 },
    { address: "1.1.1.1", family: 4 },
  ]);
});

// Section 8 of the specification: a consumer MUST NOT reach private, loopback,
// link-local or metadata addresses. `check` follows redirects, so a public host
// could otherwise use this tool to read the network it runs in.
test("check refuses to reach inward", async () => {
  for (const target of [
    "https://127.0.0.1/.well-known/cvd.json",
    "https://192.168.1.1/",
    "https://169.254.169.254/",
    "https://[::1]/",
    "https://[::ffff:7f00:1]/",
    "https://[fe90::1]/",
    "localhost",
  ]) {
    assert.equal(await runQuiet(["check", target]), 3, target);
  }
});

test("check still refuses anything that is not https", async () => {
  assert.equal(await runQuiet(["check", "http://example.com/"]), 3);
});
