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

function setCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = href;
}

export interface HeadOptions {
  /** Page name, or empty on the start page. */
  page: string;
  description: string;
  path: string;
  lang: string;
}

export function applyHead({ page, description, path, lang }: HeadOptions): void {
  const title = page ? `${page} — ${SITE_NAME}` : SITE_NAME;
  const url = `${location.origin}${path}`;

  document.title = title;
  setMeta("name", "description", description);
  setCanonical(url);
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:url", url);
  setMeta("property", "og:locale", lang);
}
