// Writes one HTML file per route, plus a 404 page.
//
// Without this every route shipped the same head: the same title, the same
// description, and a canonical link pointing at the start page. A crawler that
// does not run JavaScript was being told that all eight pages in the sitemap
// are copies of the home page. head.ts fixes it after the app boots, which is
// exactly the audience that did not need fixing.
//
//   SITE_URL=https://cvd-policy.eu node scripts/build-routes.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { headFor, readDict, readRoutes } from "./routes.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "..", "dist");
const site = (process.env["SITE_URL"] ?? "https://cvd-policy.eu").replace(/\/+$/, "");

const escape = (value) =>
  value.replace(/[&<>"]/g, (c) => `&${{ "&": "amp", "<": "lt", ">": "gt", '"': "quot" }[c]};`);

const shell = readFileSync(join(dist, "index.html"), "utf8");

/** Replaces the head tags that differ per route, leaving the rest untouched. */
function pageFor({ title, description, url, index }) {
  let html = shell
    .replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`)
    .replace(
      /(<meta\s+name="description"\s+content=")(?:[^"]*)(")/s,
      `$1${escape(description)}$2`,
    )
    .replace(/(<meta\s+property="og:title"\s+content=")(?:[^"]*)(")/, `$1${escape(title)}$2`)
    .replace(
      /(<meta\s+property="og:description"\s+content=")(?:[^"]*)(")/s,
      `$1${escape(description)}$2`,
    )
    .replace(/(<meta\s+property="og:url"\s+content=")(?:[^"]*)(")/, `$1${escape(url)}$2`);

  html = index
    ? html.replace(
        /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
        `<link rel="canonical" href="${escape(url)}" />`,
      )
    : // A page that says "this does not exist" has nothing to be canonical for.
      html.replace(
        /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
        `<meta name="robots" content="noindex" />`,
      );

  return html;
}

// Fail loudly rather than shipping eight identical heads again: if the shell
// stops carrying these tags, every replacement above turns into a silent no-op.
for (const tag of [/<title>/, /<meta\s+name="description"/, /<link\s+rel="canonical"/]) {
  if (!tag.test(shell)) throw new Error(`index.html has no ${tag.source} to rewrite`);
}

const dict = readDict("en");
const routes = readRoutes();
let written = 0;

for (const route of routes) {
  const { title, description } = headFor(route, dict);
  const url = `${site}${route === "/" ? "/" : route}`;
  const html = pageFor({ title, description, url, index: true });

  if (route === "/") {
    writeFileSync(join(dist, "index.html"), html);
  } else {
    const dir = join(dist, route.slice(1));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), html);
  }
  written += 1;
}

writeFileSync(
  join(dist, "404.html"),
  pageFor({
    title: `${dict["notfound.title"] ?? "Page not found"} — CVD Policy Format`,
    description: dict["notfound.lead"] ?? "",
    url: `${site}/404`,
    index: false,
  }),
);

console.log(`${written} routes prerendered, 404.html written`);
