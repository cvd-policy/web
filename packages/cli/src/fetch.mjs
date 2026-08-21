// Fetches a policy document. Limits redirects, time and size, and refuses
// anything that is not https or that points inward.
import { Buffer } from "node:buffer";
import { lookup } from "node:dns/promises";
import { isPrivateAddress } from "@cvd-policy/core";

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;
const MAX_BYTES = 256 * 1024;

/**
 * Reads a response body, giving up once it passes the limit.
 *
 * Reading it whole and measuring afterwards is no limit at all: by the time the
 * check runs the bytes are already in memory, and a hostile or broken server
 * decides how many there are. Counting bytes off the stream stops it early.
 */
async function readCapped(response) {
  const stream = response.body;
  if (!stream) return "";

  const reader = stream.getReader();
  const chunks = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      total += value.byteLength;
      if (total > MAX_BYTES) throw new Error("document is larger than 256 KiB");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }

  return Buffer.concat(chunks).toString("utf8");
}

/**
 * Refuses an address inside the network running this tool.
 *
 * Section 8 of the specification puts it on consumers: a policy document comes
 * from a foreign server, and reaching a private, loopback, link-local or
 * metadata address on its say-so turns this tool into someone else's probe.
 * The redirect chain is the interesting part — a public host is free to send us
 * at 169.254.169.254 — so every hop is checked, not only the first.
 *
 * The name is resolved as well, because a public name may point inward. A name
 * that changes its answer between this check and the request still gets
 * through; stopping that needs the socket, which `fetch` does not hand over.
 */
async function refuseInward(target) {
  const host = new URL(target).hostname;
  const bare = host.replace(/^\[|\]$/g, "");

  if (isPrivateAddress(bare)) {
    throw new Error(`refusing to fetch a private address: ${host}`);
  }

  let addresses;
  try {
    addresses = await lookup(bare, { all: true });
  } catch {
    // Let the request fail on its own with a clearer message.
    return;
  }

  for (const { address } of addresses) {
    if (isPrivateAddress(address)) {
      throw new Error(`refusing to fetch ${host}: it resolves to ${address}`);
    }
  }
}

export async function fetchPolicy(target) {
  const base = target.startsWith("http") ? target : `https://${target}`;
  const url = new URL(base);
  if (url.protocol !== "https:") throw new Error("only https is supported");
  if (!url.pathname || url.pathname === "/") url.pathname = "/.well-known/cvd.json";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let current = url.toString();
    for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
      await refuseInward(current);

      const response = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: { accept: "application/json" },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) throw new Error(`redirect without a location (${response.status})`);
        current = new URL(location, current).toString();
        if (!current.startsWith("https://")) throw new Error("redirect left https");
        continue;
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const body = await readCapped(response);
      // The host we asked is the one this document speaks for, wherever it was
      // finally served from.
      return { body, url: current, discoveredFor: url.hostname };
    }
    throw new Error("too many redirects");
  } finally {
    clearTimeout(timer);
  }
}
