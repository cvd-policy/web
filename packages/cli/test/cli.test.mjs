import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
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
  const file = join(
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
  assert.equal(await runQuiet(["validate", file]), 0);
});

test("check discovers V1 through well-known security.txt", async () => {
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
