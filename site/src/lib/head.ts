// Keeps title, description, canonical and Open Graph tags in step with the
// route, so a bookmark or a shared link says which page it is.
const SITE_NAME = "CVD Policy Format";

function setMeta(key: "name" | "property", value: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${key}="${value}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(key, value);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function setCanonical(href: string | null) {
  const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  // A page that does not exist has nothing to be canonical for, and leaving a
  // stale link behind would point search engines at the wrong address.
  if (href === null) {
    existing?.remove();
    return;
  }

  const link = existing ?? document.createElement("link");
  link.rel = "canonical";
  link.href = href;
  if (!existing) document.head.appendChild(link);
}

export interface HeadOptions {
  /** Page name, or empty on the start page. */
  page: string;
  description: string;
  path: string;
  lang: string;
  /** False on a page that should not be indexed, such as a 404. */
  index?: boolean;
}

export function applyHead({ page, description, path, lang, index = true }: HeadOptions): void {
  const title = page ? `${page} — ${SITE_NAME}` : SITE_NAME;
  const url = `${location.origin}${path}`;

  document.title = title;
  setMeta("name", "description", description);
  setCanonical(index ? url : null);
  setMeta("name", "robots", index ? "index, follow" : "noindex");
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:url", url);
  setMeta("property", "og:locale", lang);
}
