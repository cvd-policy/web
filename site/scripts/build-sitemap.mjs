// Writes public/sitemap.xml from the routes the router actually knows, so a
// new page cannot be forgotten here.
//
//   SITE_URL=https://cvd-policy.eu node scripts/build-sitemap.mjs
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readRoutes } from "./routes.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const site = (process.env["SITE_URL"] ?? "https://cvd-policy.eu").replace(/\/+$/, "");

const routes = readRoutes();

// The start page is what people link to; the tools change with the library.
const priority = (route) => (route === "/" ? "1.0" : route === "/imprint" ? "0.3" : "0.7");
const changefreq = (route) => (route === "/imprint" ? "yearly" : "monthly");

const lastmod = new Date().toISOString().slice(0, 10);

const urls = routes
  .map(
    (route) =>
      `  <url>\n` +
      `    <loc>${site}${route === "/" ? "/" : route}</loc>\n` +
      `    <lastmod>${lastmod}</lastmod>\n` +
      `    <changefreq>${changefreq(route)}</changefreq>\n` +
      `    <priority>${priority(route)}</priority>\n` +
      `  </url>`,
  )
  .join("\n");

writeFileSync(
  join(here, "..", "public", "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
);

writeFileSync(
  join(here, "..", "public", "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`,
);

console.log(`sitemap.xml written with ${routes.length} routes, robots.txt points at it`);
