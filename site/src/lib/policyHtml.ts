import { explain } from "@cvd-policy/core";
import type { CvdPolicyDocument } from "@cvd-policy/core";
import { hasPlural, plural, t } from "./i18n.svelte.js";

const escape = (value: string) =>
  value.replace(/[&<>"]/g, (character) => `&${{ "&": "amp", "<": "lt", ">": "gt", '"': "quot" }[character]};`);

const renderValue = (item: { value: string; valueIsKey?: boolean; params?: Record<string, string | number> }) =>
  item.valueIsKey
    ? item.value
        .split(",")
        .map((key) =>
          hasPlural(key) ? plural(key, Number(item.params?.count ?? 0)) : t(key, item.params),
        )
        .join(", ")
    : item.value;

/**
 * Builds a standalone HTML page from a document, for the `Policy:` field in
 * security.txt. Self-contained: no scripts, no external resources.
 */
export function policyHtml(doc: CvdPolicyDocument, lang: string): string {
  const sections = explain(doc)
    .map((section) => {
      const rows = section.items
        .map(
          (item) =>
            `      <dt>${escape(t(item.labelKey))}</dt>\n      <dd>${escape(renderValue(item))}</dd>`,
        )
        .join("\n");
      return `    <section>\n      <h2>${escape(t(`explain.section.${section.key}`))}</h2>\n      <dl>\n${rows}\n      </dl>\n    </section>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="${escape(lang)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escape(doc.organization?.name ?? "")} — CVD Policy</title>
    <style>
      body { font-family: system-ui, sans-serif; line-height: 1.6; max-width: 44rem; margin: 3rem auto; padding: 0 1rem; color: #1a1a18; background: #fbfbf9; }
      h1 { font-size: 1.6rem; }
      h2 { font-size: 1rem; text-transform: uppercase; letter-spacing: 0.06em; color: #6b6b64; margin-top: 2rem; }
      dl { display: grid; grid-template-columns: 14rem 1fr; gap: 0.4rem 1rem; }
      dt { color: #6b6b64; }
      dd { margin: 0; }
      footer { margin-top: 3rem; font-size: 0.85rem; color: #6b6b64; }
      @media (prefers-color-scheme: dark) { body { background: #16171a; color: #e8e7e3; } dt, h2, footer { color: #9b9c9a; } }
    </style>
  </head>
  <body>
    <h1>${escape(doc.organization?.name ?? "")}</h1>
${sections}
    <footer>
      <p>${escape(t("home.not_3"))}</p>
      <p>CVD Policy Format 0.1 — <code>${escape(doc.canonical ?? "")}</code></p>
    </footer>
  </body>
</html>
`;
}
