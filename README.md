# CVD Policy Format — library, CLI and website

An open format for publishing a machine-readable statement about reportable
assets, testing rules, reporting preferences and disclosure coordination. It
does not prove ownership or grant legal authorization. Version 1 is an experimental
implementation of
[`draft-behring-cvd-policy-00`](https://datatracker.ietf.org/doc/html/draft-behring-cvd-policy-00).
Its proposed `CVD-Policy` field and `application/cvd-policy+json` media type may
change before standardization.

V1 discovery starts at `/.well-known/security.txt`; exactly one `CVD-Policy`
field names the exact policy URI. That field alone is not authority: assessment
also requires valid `Contact`, exactly one future `Expires`, valid HTTPS
retrieval and redirects, and `Canonical` consistency when applicable. There is
no standard default path for the JSON document.

**Funding:** This site is run by Skalvar Technologies UG (haftungsbeschränkt) in
Wismar, Germany, which earns its money developing IT security software. The
format, the library and this site work without our products and without us.

## Layout

```text
packages/core/     @cvd-policy/core — validation, generation, evaluation, reports
packages/cli/      @cvd-policy/cli — command line tool
site/              cvd-policy.eu — Vite + Svelte 5 + SCSS, static build
site/vendor/spec/  V1 site text plus frozen legacy 0.x artefacts
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

The site supports V1 generation and local validation and retains published 0.x
documents as explicitly marked legacy input. The library embeds every schema so
it never needs the network. Those artefacts are **copied into this repository
and committed**, so builds and runtime validation do not require a specification
checkout.

Every published format version is kept: `0.1` and `0.2` are compiled separately,
and a document is validated against the version it declares. A released version
never changes, so an old file keeps being judged by the rules it was written
for. The report profile `report-0.1` is embedded the same way.

```bash
git clone https://github.com/cvd-policy/spec ../cvd-policy-spec
npm run sync:spec           # refresh site/vendor/spec and the embedded schema
npm run sync:spec:check     # fail if the copies have drifted (used by CI)
```

Set `CVD_SPEC_DIR` if the specification sits elsewhere. `site/vendor/spec/v1/`
contains the V1 documents and examples rendered by the site;
`site/vendor/spec/` retains the legacy material. The isolated Core V1 schema and
corpus are separately vendored under `packages/core/vendor/spec-v1/` with the
exact source commit and run without a neighboring checkout.

## V1 library flow

```typescript
import {
  assessSecurityTxtAuthority,
  evaluatePolicy,
  parsePolicyText,
} from "@cvd-policy/core/v1";

const parsed = parsePolicyText(policyText, { now });
const authority = assessSecurityTxtAuthority(securityTxtText, securityTxtRetrieval);
if (!parsed.policy) throw new Error("invalid policy");
const decision = evaluatePolicy(parsed.policy, {
  activity: "automated_scanning",
  target: "https://api.example.com/",
  policyRetrieval,
}, authority.established ? authority.evidence : null);
```

Issues are stable codes with JSON Pointers, never finished prose, so the UI owns
the wording. See [packages/core/README.md](packages/core/README.md).

The package-root `validate`, `generate`, `evaluate`, `validateReport` and
`explain` APIs remain the Legacy 0.x interface. `report-0.1` is not a V1 report
transport.

On the command line:

```bash
npx @cvd-policy/cli@0.5.0-rc.1 validate cvd-policy.json
npx @cvd-policy/cli@0.5.0-rc.1 check example.com
npx @cvd-policy/cli@0.5.0-rc.1 validate old-cvd.json --legacy
```

## Two rules that outrank convenience

**V1 authority comes from exact discovery.** The target host must publish its
own `/.well-known/security.txt`, and exactly one `CVD-Policy` field identifies
the policy URI. The policy's storage host and parent/subdomain relationships do
not transfer authority. Anyone can list someone else's domain in a policy; that
is a claim, never permission.

**No tool submits a report on its own.** A report carries the details of an
unfixed vulnerability. V1 intentionally defines no report transport or intake
API; deciding where and whether to send a report remains a human action.

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

Format versions 0.1 and 0.2 remain published and valid for legacy documents.
Version 1 is the current experimental generator and discovery implementation of
`draft-behring-cvd-policy-00`.

Packages are versioned independently of the format. They tracked it up to
`0.2.0`, and no longer do: `@cvd-policy/core` and `@cvd-policy/cli` are at
`0.5.0-rc.1` while the V1 document format says `cvd_policy: 1`. A package version says what changed in
the package; `cvd_policy` inside a document says which rules the document was
written for. Reading either as the other will mislead.

The proposed `CVD-Policy` field and media type are not registered with IANA.
