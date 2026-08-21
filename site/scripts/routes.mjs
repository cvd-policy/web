// The routes and the copy, read out of the sources the app itself uses.
//
// Both are TypeScript, so a build script cannot import them. Parsing is the
// same trick check-dict.mjs uses, and it keeps a new page from being forgotten
// in the sitemap or shipped without its own title.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, "..", "src");

/** Every navigable route, in the order the router declares them. */
export function readRoutes() {
  const router = readFileSync(join(srcDir, "lib", "router.svelte.ts"), "utf8");
  const block = router.match(/export const ROUTES = \[(.*?)\]/s);
  if (!block) throw new Error("ROUTES not found in router.svelte.ts");

  const routes = [...block[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  if (routes.length === 0) throw new Error("ROUTES is empty");
  return routes;
}

const ENTRY = /^ {2}"([^"]+)":\s*(?:\n\s*)?("(?:[^"\\]|\\.)*")/gm;

/** One dictionary as a plain object. */
export function readDict(language) {
  const text = readFileSync(join(srcDir, "lib", "dict", `${language}.ts`), "utf8");
  const entries = {};
  for (const match of text.matchAll(ENTRY)) entries[match[1]] = JSON.parse(match[2]);
  return entries;
}

/**
 * Title and description for a route.
 *
 * Mirrors the `$effect` in App.svelte on purpose: without a server there is no
 * single place that can produce both the prerendered head and the live one, so
 * the two are kept deliberately identical and short enough to compare by eye.
 */
export function headFor(route, dict) {
  const slug = route.slice(1) || "home";
  const page = route === "/" ? "" : (dict[`nav.${slug}`] ?? "");
  return {
    title: page ? `${page} — CVD Policy Format` : "CVD Policy Format",
    description: dict[`${slug}.lead`] ?? dict["home.lead"] ?? "",
  };
}
