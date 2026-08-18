# CVD Policy Format — library, CLI and website

An open format for stating how an organisation handles vulnerability reports:
whether security research is welcome, on what, under which conditions, how to
report, and how disclosure is handled. One JSON file at
`/.well-known/cvd.json`, plus one field in `security.txt`.

**Funding:** This site is run by Skalvar Technologies UG (haftungsbeschränkt) in
Wismar, Germany, which earns its money developing IT security software. The
format, the library and this site work without our products and without us.

## Layout

```text
packages/core/     @cvd-policy/core — validation, generation, evaluation
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
npm test              # library and command line tool
npm run site:dev      # http://localhost:5173
npm run site:build    # static output in site/dist
```

## Working with the specification

The site renders `SPEC.md`, serves the JSON Schema and loads the examples; the
library embeds the schema so it never needs the network. Those artefacts are
**copied into this repository and committed**, so a static host can build the
site without cloning anything else.

```bash
git clone https://github.com/cvd-policy/spec ../cvd-policy-spec
npm run sync:spec           # refresh site/vendor/spec and the embedded schema
npm run sync:spec:check     # fail if the copies have drifted (used by CI)
```

Set `CVD_SPEC_DIR` if the specification sits elsewhere. The conformance tests —
the corpus of valid and invalid documents — run against that repository
directly and **skip with a notice when it is absent**, since duplicating 45
fixtures here would only invite drift.

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

Version 0.1, draft. The `CVD-Policy` field is not registered with IANA; that
application only makes sense once real use exists.
