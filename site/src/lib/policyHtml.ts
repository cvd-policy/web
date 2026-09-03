import type { CvdPolicyDocument } from "@cvd-policy/core/v1";

const escape = (value: string) =>
  value.replace(/[&<>\"]/g, (character) => `&${{ "&": "amp", "<": "lt", ">": "gt", '\"': "quot" }[character]};`);

function rows(value: unknown, path = ""): string {
  if (Array.isArray(value)) {
    return value.map((item, index) => rows(item, `${path}[${index}]`)).join("\n");
  }
  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => rows(item, path ? `${path}.${key}` : key))
      .join("\n");
  }
  return `      <dt>${escape(path)}</dt>\n      <dd>${escape(String(value))}</dd>`;
}

/** Builds a standalone, script-free human rendering of a V1 policy. */
export function policyHtml(doc: CvdPolicyDocument): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escape(doc.organization.name)} - Coordinated vulnerability disclosure policy</title>
    <style>
      :root { color-scheme: light dark; --ink: #1a1a18; --muted: #6b6b64; --bg: #fbfbf9; --rule: #e2e0da; --accent: #2d5f5d; }
      @media (prefers-color-scheme: dark) { :root { --ink: #e8e7e3; --muted: #9b9c9a; --bg: #16171a; --rule: #32363d; --accent: #7fb3b0; } }
      * { box-sizing: border-box; }
      body { font-family: system-ui, sans-serif; line-height: 1.6; color: var(--ink); background: var(--bg); max-width: 52rem; margin: 0 auto; padding: clamp(1.75rem, 5vw, 4rem) 1.25rem 4rem; }
      header { border-bottom: 2px solid var(--ink); padding-bottom: 1.1rem; }
      h1 { font-size: clamp(1.45rem, 4vw, 2rem); line-height: 1.2; margin: 0 0 0.3rem; }
      p { color: var(--muted); }
      dl { display: grid; grid-template-columns: minmax(12rem, 18rem) 1fr; margin-top: 2rem; border-top: 1px solid var(--rule); }
      dt, dd { padding: 0.6rem 0; border-bottom: 1px solid var(--rule); overflow-wrap: anywhere; }
      dt { color: var(--muted); padding-right: 1.5rem; }
      dd { margin: 0; }
      footer { margin-top: 3rem; color: var(--muted); font-size: 0.85rem; }
      @media (max-width: 36rem) { dl { grid-template-columns: 1fr; } dt { border: 0; padding-bottom: 0; } dd { padding-top: 0; } }
    </style>
  </head>
  <body>
    <header>
      <h1>${escape(doc.organization.name)}</h1>
      <p>Coordinated vulnerability disclosure policy</p>
    </header>
    <dl>
${rows(doc)}
    </dl>
    <footer>Experimental implementation of draft-behring-cvd-policy-00. CVD Policy Format ${doc.cvd_policy}.</footer>
  </body>
</html>
`;
}
