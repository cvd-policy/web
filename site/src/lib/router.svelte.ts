export const ROUTES = [
  "/",
  "/spec",
  "/generate",
  "/validate",
  "/explain",
  "/tools",
  "/faq",
  "/imprint",
] as const;

export type Route = (typeof ROUTES)[number];

const normalise = (path: string): Route => {
  const trimmed = path.replace(/\/+$/, "") || "/";
  return (ROUTES as readonly string[]).includes(trimmed) ? (trimmed as Route) : "/";
};

let path = $state<Route>(normalise(location.pathname));
let fragment = $state(location.hash.slice(1));

window.addEventListener("popstate", () => {
  path = normalise(location.pathname);
  fragment = location.hash.slice(1);
});

export const router = {
  get path(): Route {
    return path;
  },
  /** The part of the URL after `#`. Never sent to a server. */
  get fragment(): string {
    return fragment;
  },
  navigate(to: string, options: { fragment?: string; replace?: boolean } = {}) {
    const target = normalise(to);
    const url = target + (options.fragment ? `#${options.fragment}` : "");
    history[options.replace ? "replaceState" : "pushState"]({}, "", url);
    path = target;
    fragment = options.fragment ?? "";
    window.scrollTo({ top: 0 });
  },
  setFragment(value: string) {
    history.replaceState({}, "", value ? `${path}#${value}` : path);
    fragment = value;
  },
};

/** True for links this router should handle instead of the browser. */
export function isInternalLink(anchor: HTMLAnchorElement): boolean {
  return (
    anchor.origin === location.origin &&
    !anchor.hasAttribute("download") &&
    anchor.target !== "_blank" &&
    (ROUTES as readonly string[]).includes(anchor.pathname.replace(/\/+$/, "") || "/")
  );
}
