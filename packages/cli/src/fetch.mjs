// Fetches a policy document. Limits redirects, time and size, and refuses
// anything that is not https.
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;
const MAX_BYTES = 256 * 1024;

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

      const body = await response.text();
      if (body.length > MAX_BYTES) throw new Error("document is larger than 256 KiB");
      // The host we asked is the one this document speaks for, wherever it was
      // finally served from.
      return { body, url: current, discoveredFor: url.hostname };
    }
    throw new Error("too many redirects");
  } finally {
    clearTimeout(timer);
  }
}
