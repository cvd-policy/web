// Serves the built site with the real Content-Security-Policy.
//
// `vite dev` never applies site/public/_headers, so the CSP the public gets is
// the one thing local work never exercises. That gap shipped a blank page once:
// Ajv builds validators with `new Function`, `script-src 'self'` refuses, and
// the application died while loading. Everything looked fine in dev and in the
// tests, because neither has a CSP.
//
//   npm run build && npm run preview:csp -w site
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "..", "dist");
const port = Number(process.env["PORT"] ?? 5199);

if (!existsSync(dist)) {
  console.error("site/dist is not there. Run `npm run build` at the repository root first.");
  process.exit(1);
}

const headerFile = readFileSync(join(here, "..", "public", "_headers"), "utf8");

// Every rule that sets a policy. Reading only the first served the site-wide
// one everywhere, so a path rule was never the one being previewed.
const policies = [...headerFile.matchAll(/^(\/\S*)\n((?:[ \t]+\S.*\n)+)/gm)]
  .map(([, path, block]) => ({
    path,
    csp: /Content-Security-Policy:\s*(.+)/.exec(block)?.[1]?.trim(),
  }))
  .filter((rule) => rule.csp);

const site = policies.find((rule) => rule.path === "/*")?.csp;
if (!site) throw new Error("no site-wide Content-Security-Policy in public/_headers");

/** Last matching rule wins, as on the hosts this mirrors. */
const cspFor = (path) => {
  const match = policies
    .filter((rule) => rule.path !== "/*")
    .filter((rule) =>
      rule.path.endsWith("/*") ? path.startsWith(rule.path.slice(0, -1)) : path === rule.path,
    )
    .at(-1);
  return match?.csp ?? site;
};

const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".ico": "image/x-icon", ".webmanifest": "application/manifest+json", ".txt": "text/plain",
};

createServer((request, response) => {
  const path = decodeURIComponent((request.url ?? "/").split("?")[0]);
  const direct = join(dist, path);
  let file = direct;
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");

  const found = existsSync(file) && statSync(file).isFile();
  if (!found) file = join(dist, "404.html");

  response.writeHead(found ? 200 : 404, {
    "content-type": `${TYPES[extname(file)] ?? "application/octet-stream"}; charset=utf-8`,
    "content-security-policy": cspFor(path),
  });
  response.end(readFileSync(file));
}).listen(port, () => {
  console.log(`site/dist on http://localhost:${port} under the production CSP`);
  for (const rule of policies) console.log(`${rule.path}\n  ${rule.csp}`);
});
