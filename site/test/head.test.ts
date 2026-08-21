import { describe, expect, it } from "vitest";
// The build script and the sitemap read the same sources the app does.
import { headFor, readDict, readRoutes } from "../scripts/routes.mjs";

const routes: string[] = readRoutes();
const dict: Record<string, string> = readDict("en");

describe("per-route head", () => {
  it("covers every navigable route", () => {
    expect(routes.length).toBeGreaterThan(1);
    expect(routes[0]).toBe("/");
  });

  it("gives each route its own title", () => {
    const titles = routes.map((route) => headFor(route, dict).title);
    expect(new Set(titles).size).toBe(routes.length);
    for (const title of titles) expect(title).toContain("CVD Policy Format");
  });

  it("gives each route a non-empty description", () => {
    for (const route of routes) {
      const { description } = headFor(route, dict);
      expect(description.length, route).toBeGreaterThan(20);
    }
  });

  it("does not fall back to the home description on pages that have their own", () => {
    // Every page in the sitemap used to ship the home page's description and a
    // canonical link pointing at "/", which reads as "these are all duplicates".
    const home = headFor("/", dict).description;
    const withOwnLead = routes.filter((route) => route !== "/" && dict[`${route.slice(1)}.lead`]);

    expect(withOwnLead.length).toBeGreaterThan(3);
    for (const route of withOwnLead) {
      expect(headFor(route, dict).description, route).not.toBe(home);
    }
  });

  it("has a page for an address that matches nothing", () => {
    expect(dict["notfound.title"]).toBeTruthy();
    expect(dict["notfound.lead"]).toBeTruthy();
  });
});
