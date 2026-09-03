// Fetches foreign resources with bounded redirects, time and size while
// binding every connection to a DNS answer checked by the client.
import https from "node:https";
import { Buffer } from "node:buffer";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { isPrivateAddress } from "@cvd-policy/core";

const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 10_000;
const MAX_BYTES = 256 * 1024;
const decoder = new TextDecoder("utf-8", { fatal: true });

function httpsUrl(target) {
  if (
    !/^https:\/\/[^/\\\s?#]+(?:[/?][^\\\s#]*)?$/i.test(target) ||
    /%(?![0-9a-f]{2})/i.test(target)
  ) throw new Error("only syntactically valid absolute https URLs are supported");
  const url = new URL(target);
  if (url.protocol !== "https:" || url.username || url.password || target.includes("#")) {
    throw new Error("only absolute https URLs without userinfo or fragments are supported");
  }
  return url;
}

export async function publicAddresses(url, lookupFn = lookup) {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) {
    if (isPrivateAddress(host)) throw new Error(`refusing to fetch a private address: ${url.hostname}`);
    return [{ address: host, family: isIP(host) }];
  }

  const addresses = await lookupFn(host, { all: true, verbatim: true });
  const usable = addresses.filter(({ address }) => !isPrivateAddress(address));
  if (usable.length === 0) throw new Error(`refusing to fetch ${url.hostname}: it has no public address`);
  return usable;
}

async function requestOnce(url, { accept, maxBytes, signal }) {
  const selected = await publicAddresses(url);
  return new Promise((resolve, reject) => {
    const request = https.request(url, {
      method: "GET",
      signal,
      autoSelectFamily: true,
      headers: accept ? { accept, "user-agent": "cvd-policy-cli" } : { "user-agent": "cvd-policy-cli" },
      lookup: (_hostname, options, callback) => options?.all
        ? callback(null, selected)
        : callback(null, selected[0].address, selected[0].family),
    }, (response) => {
      const statusCode = response.statusCode ?? 0;
      if (statusCode >= 300 && statusCode < 400 && response.headers.location) {
        response.destroy();
        resolve({ body: "", statusCode, mediaType: "", location: response.headers.location });
        return;
      }
      const chunks = [];
      let bytes = 0;
      response.on("data", (chunk) => {
        bytes += chunk.length;
        if (bytes > maxBytes) {
          response.destroy(new Error(`document is larger than ${maxBytes} bytes`));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => {
        try {
          resolve({
            body: decoder.decode(Buffer.concat(chunks)),
            statusCode: response.statusCode ?? 0,
            mediaType: String(response.headers["content-type"] ?? ""),
            location: response.headers.location,
          });
        } catch {
          reject(new Error("response is not valid UTF-8"));
        }
      });
      response.on("error", reject);
    });
    request.on("error", reject);
    request.end();
  });
}

export async function fetchResource(target, { accept, maxBytes = MAX_BYTES } = {}) {
  const requestedUri = target;
  const initialUri = httpsUrl(target).href;
  if (requestedUri !== initialUri) {
    throw new Error("refusing a URL that changes during normalization");
  }
  const redirectChain = [];
  const seen = new Set([initialUri]);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let current = initialUri;
    for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
      const response = await requestOnce(httpsUrl(current), {
        accept,
        maxBytes,
        signal: controller.signal,
      });
      if (response.statusCode >= 300 && response.statusCode < 400 && response.location) {
        if (redirect === MAX_REDIRECTS) throw new Error("too many redirects");
        const next = httpsUrl(new URL(response.location, current).href).href;
        if (seen.has(next)) throw new Error("redirect loop");
        seen.add(next);
        redirectChain.push(next);
        current = next;
        continue;
      }
      return {
        body: response.body,
        requestedUri,
        finalUri: current,
        redirectChain,
        statusCode: response.statusCode,
        mediaType: response.mediaType,
      };
    }
    throw new Error("too many redirects");
  } finally {
    clearTimeout(timer);
  }
}

function targetBase(target) {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(target) ? target : `https://${target}`;
}

export async function fetchSecurityTxt(target, { fetcher = fetchResource } = {}) {
  const origin = httpsUrl(targetBase(target));
  return fetcher(new URL("/.well-known/security.txt", origin).href, {
    accept: "text/plain, application/octet-stream;q=0.5",
    maxBytes: 64 * 1024,
  });
}

/** Legacy 0.x direct policy retrieval, retained only for `check --legacy`. */
export async function fetchPolicy(target, { fetcher = fetchResource } = {}) {
  const url = httpsUrl(targetBase(target));
  if (!url.pathname || url.pathname === "/") url.pathname = "/.well-known/cvd.json";
  const result = await fetcher(url.href, { accept: "application/json" });
  if (result.statusCode !== 200) throw new Error(`HTTP ${result.statusCode}`);
  return { body: result.body, url: result.finalUri, discoveredFor: url.hostname };
}
