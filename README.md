# CVD Policy Format — library, CLI and website

An open format for stating how an organisation handles vulnerability reports:
whether security research is welcome, on what, under which conditions, how to
report, and how disclosure is handled. One JSON file at
`/.well-known/cvd.json`, plus one field in `security.txt`.

Since format version 0.2, a policy can also name an endpoint that accepts a
**structured report**, so incoming reports need not be parsed out of an email.

**Funding:** This site is run by Skalvar Technologies UG (haftungsbeschränkt) in
Wismar, Germany, which earns its money developing IT security software. The
format, the library and this site work without our products and without us.

## Layout

```text
packages/core/     @cvd-policy/core — validation, generation, evaluation, reports
packages/cli/      @cvd-policy/cli — command line tool
site/              cvd-policy.eu — Vite + Svelte 5 + SCSS, static build
site/vendor/spec/  Specification artefacts, copied in (see below)
```

The specification lives in its own repository, **cvd-policy/spec**, under CC0:
it has to be quotable and versionable without depending on a website staying
online, and without inheriting this repository's licence.

## Getting started

```bash
npm install
npm test              # library, command line tool and site
npm run site:dev      # http://localhost:5173
npm run site:build    # static output in site/dist
```

The build writes one HTML file per route, each with its own title, description
and canonical URL, plus a `404.html`. Without that every address served the same
head, which tells a crawler that every page is a copy of the start page. Adding
a route to `ROUTES` is enough: the sitemap and the prerendered pages both read
from there.

## Working with the specification

The site renders the published 0.x `SPEC.md`, serves its schemas and loads its
examples. It is intentionally not migrated to the Version 1 pre-standard
candidate. The library embeds every schema so it never needs the network. Those
artefacts are **copied into this repository and committed**, so builds and
runtime validation do not require a specification checkout.

Every published format version is kept: `0.1` and `0.2` are compiled separately,
and a document is validated against the version it declares. A released version
never changes, so an old file keeps being judged by the rules it was written
for. The report profile `report-0.1` is embedded the same way.

```bash
git clone https://github.com/cvd-policy/spec ../cvd-policy-spec
npm run sync:spec           # refresh site/vendor/spec and the embedded schema
npm run sync:spec:check     # fail if the copies have drifted (used by CI)
```

Set `CVD_SPEC_DIR` if the specification sits elsewhere. Published 0.x
conformance tests can run against that repository directly. The isolated V1
schema and corpus are vendored under `packages/core/vendor/spec-v1/` with the
exact source commit and run without a neighboring checkout.

## What the library does

```typescript
import { validate, validateReport, generate, evaluate, explain } from "@cvd-policy/core";

validate(doc);          // schema for the declared version, plus semantic rules
validateReport(report);  // an incoming report against the report-0.1 profile
evaluate(doc, "automated_scanning", "api.example.com");
```

Issues are stable codes with JSON Pointers, never finished prose, so the UI owns
the wording. See [packages/core/README.md](packages/core/README.md).

On the command line:

```bash
npx @cvd-policy/cli validate cvd.json
npx @cvd-policy/cli check https://example.com
npx @cvd-policy/cli report incoming.json
```

## Two rules that outrank convenience

**A document speaks only for hosts it has authority over** — the host it is
published on and anything under it, plus any host that pointed at it from its
own `security.txt`. Anyone can list someone else's domain in a policy; that is a
claim, never permission.

**No tool submits a report on its own.** A report carries the details of an
unfixed vulnerability. `intake` says where such a report may go; deciding to
send it is a judgement a person makes. The specification requires the receiving
host to be shown first, and forbids attaching files automatically.

## Principles

These take precedence over any feature decision.

1. **Everything runs in the browser.** No backend, no API, no database. A policy
   entered into the site never leaves the device.
2. **No tracking.** No analytics, no cookies, no external fonts, no CDN scripts,
   and therefore no consent banner.
3. **No lead capture.** No forms, no email prompts. Contact details are plain
   text.
4. **The format works without the operator.** Every output the site produces can
   be made without any reference to a provider. "Enter your own address" ranks
   equally with every other option.
5. **Funding is disclosed.** One sentence, identical in this README, in the site
   footer and in the imprint.

## Licences

- `spec/` — CC0-1.0. Copy it, host it, change it.
- Everything else — Apache-2.0.
- Name and trademarks: see [TRADEMARK.md](TRADEMARK.md).

## Status

Format version 0.2, draft; 0.1 remains published and valid. Version 1 is an
opt-in pre-standard candidate exposed only as `@cvd-policy/core/v1`; the CLI and
website remain on the published 0.x line.

Packages are versioned independently of the format. They tracked it up to
`0.2.0`, and no longer do: `@cvd-policy/core` and `@cvd-policy/cli` are at
`0.4.0` while the format stays at 0.2. A package version says what changed in
the package; `cvd_policy` inside a document says which rules the document was
written for. Reading either as the other will mislead.

The `CVD-Policy` field is not registered with IANA; that application only makes
sense once real use exists.
