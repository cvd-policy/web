import { explain } from "@cvd-policy/core";
import type { CvdPolicyDocument } from "@cvd-policy/core";
import { translator } from "./i18n.svelte.js";
import type { Lang, Translator } from "./i18n.svelte.js";

/** Always English: it used to follow the interface, which is not the publisher's. */
const PAGE_LANG = "en" as const satisfies Lang;

const escape = (value: string) =>
  value.replace(/[&<>"]/g, (character) => `&${{ "&": "amp", "<": "lt", ">": "gt", '"': "quot" }[character]};`);

const renderValue = (
  text: Translator,
  item: { value: string; valueIsKey?: boolean; params?: Record<string, string | number> },
) =>
  item.valueIsKey
    ? item.value
        .split(",")
        .map((key) =>
          text.hasPlural(key)
            ? text.plural(key, Number(item.params?.count ?? 0))
            : text.t(key, item.params),
        )
        .join(", ")
    : item.value;

/**
 * Builds a standalone HTML page from a document, for the `Policy:` field in
 * security.txt. Self-contained: no scripts, no external resources.
 *
 * Always English, whatever the interface is set to.
 */
export function policyHtml(doc: CvdPolicyDocument): string {
  const text = translator(PAGE_LANG);
  const { t } = text;
  const sections = explain(doc)
    .map((section) => {
      const rows = section.items
        .map(
          (item) =>
            `      <dt>${escape(t(item.labelKey))}</dt>\n      <dd>${escape(renderValue(text, item))}</dd>`,
        )
        .join("\n");
      return `    <section>\n      <h2>${escape(t(`explain.section.${section.key}`))}</h2>\n      <dl>\n${rows}\n      </dl>\n    </section>`;
    })
    .join("\n");

  const expires = doc.expires
    ? `\n      <p class="expires">${escape(t("explain.page_expires"))} ${escape(doc.expires.slice(0, 10))}</p>`
    : "";

  return `<!doctype html>
<html lang="${PAGE_LANG}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escape(doc.organization?.name ?? "")} — ${escape(t("explain.page_subtitle"))}</title>
    <meta name="robots" content="index, follow" />
    <style>
      /* One file: it lands on the publisher's domain with nothing beside it. */
      :root {
        color-scheme: light dark;
        --ink: #1a1a18; --muted: #6b6b64; --bg: #fbfbf9;
        --rule: #e2e0da; --accent: #2d5f5d;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --ink: #e8e7e3; --muted: #9b9c9a; --bg: #16171a;
          --rule: #32363d; --accent: #7fb3b0;
        }
      }
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
        line-height: 1.6; color: var(--ink); background: var(--bg);
        max-width: 46rem; margin: 0 auto;
        padding: clamp(1.75rem, 5vw, 4rem) 1.25rem 4rem;
        -webkit-text-size-adjust: 100%;
      }
      header { border-bottom: 2px solid var(--ink); padding-bottom: 1.1rem; }
      h1 { font-size: clamp(1.45rem, 4vw, 2rem); line-height: 1.2; letter-spacing: -0.01em; margin: 0 0 0.3rem; }
      .subtitle { margin: 0; color: var(--muted); }
      .expires { margin: 0.6rem 0 0; font-size: 0.875rem; color: var(--muted); }
      section { margin-top: 2.5rem; }
      h2 {
        font-size: 0.75rem; font-weight: 650; text-transform: uppercase;
        letter-spacing: 0.09em; color: var(--accent); margin: 0 0 0.75rem;
      }
      dl { display: grid; grid-template-columns: minmax(10rem, 15rem) 1fr; margin: 0; border-top: 1px solid var(--rule); }
      dt, dd { padding: 0.6rem 0; border-bottom: 1px solid var(--rule); }
      dt { color: var(--muted); padding-right: 1.5rem; }
      dd { margin: 0; overflow-wrap: anywhere; }
      /* Two columns cannot hold a label and a sentence on a phone. */
      @media (max-width: 34rem) {
        dl { grid-template-columns: 1fr; border-top: 0; }
        dt {
          padding: 0.85rem 0 0.1rem; border-bottom: 0;
          font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em;
        }
        dd { padding: 0 0 0.85rem; }
      }
      footer { margin-top: 3.5rem; padding-top: 1.25rem; border-top: 1px solid var(--rule); font-size: 0.85rem; color: var(--muted); }
      footer p { margin: 0.35rem 0; }
      footer code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.9em; overflow-wrap: anywhere; }
      @media print {
        body { max-width: none; padding: 0; background: #fff; color: #000; }
        h2 { color: #000; }
        section { break-inside: avoid; }
        dt, dd { border-color: #ccc; }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>${escape(doc.organization?.name ?? "")}</h1>
      <p class="subtitle">${escape(t("explain.page_subtitle"))}</p>${expires}
    </header>
${sections}
    <footer>
      <p>${escape(t("home.not_3"))}</p>
      <p>CVD Policy Format ${escape(doc.cvd_policy ?? "")} — <code>${escape(doc.canonical ?? "")}</code></p>
    </footer>
  </body>
</html>
`;
}
