# Changelog

Releases of `@cvd-policy/core` and `@cvd-policy/cli`, which are versioned
together and published from this repository. These numbers are not format
versions: the packages stopped tracking the specification at 0.3.0, and the
format they implement is `0.1` and `0.2`. The site is not published to the
registry and carries no version of its own.

## 0.4.0

`security.txt` now carries a human-readable policy, and the site hands over the
whole `.well-known` directory in one file.

- `securityTxt` and `mergeSecurityTxt` write RFC 9116's `Policy` field, its own
  pointer at a policy page for people, when given one as `options.policy`.
  Neither invents the value: nothing fixes the name `cvd.html` and no
  specification requires such a page to exist, so a library that assumed one
  would be sending reporters to a 404 on every host that never uploaded it.
  `mergeSecurityTxt` sets both fields while still leaving comments, field order,
  blank lines and line endings as it found them.
- New export `humanPolicyUrl(doc)` offers the conventional location beside
  `canonical` for callers that do publish the page — the generator passes it,
  because the generator hands the file over in the same breath.
- On a clear-signed file, PGP armor headers are no longer mistaken for
  security.txt fields. `Hash: SHA256` and `Version: GnuPG v2` parse as fields
  like any other, so an addition placed after the last one landed inside the
  signature block — outside what the signature covers, in a file whose whole
  point is that it is signed. Fields are now taken from the signed body alone,
  and a body with no fields yet takes the addition before the signature rather
  than after it.
- The generator offers `.well-known.zip` — `cvd.json`, `cvd.html` and
  `security.txt` under a `.well-known/` directory, ready to unpack at a web
  root. It is the primary download now that the `security.txt` names the page
  beside it: the three files have to be published together, and taking them one
  at a time is how a publisher ends up advertising a page they never uploaded.
  The singles remain for anyone who wants one on its own.
- Wizard steps read their answers from the shared store instead of a prop, and
  the domain field is driven by its own `oninput` rather than a two-way bind.
  Typing into a step could otherwise be discarded as the answers were reassigned
  beneath it.
- `LICENSE` names its copyright holder. All three copies shipped the stock
  Apache-2.0 appendix with `Copyright [yyyy] [name of copyright owner]` left
  unfilled, so both published packages declared a licence that attributed the
  work to nobody.

## 0.3.1

Ajv builds validators with `new Function`, which `script-src 'self'` refuses;
the module threw while loading and the page rendered blank on the first deploy.
Nothing local caught it — Node enforces no CSP, and `vite dev` does not apply
`public/_headers`.

- Validators for all three schemas are compiled ahead of time by
  `scripts/build-validators.mjs`, which refuses to write a file in which
  `new Function`, `eval` or `require` survives. Ajv's compiler is no longer
  shipped; the bundle drops from 358 kB to 294 kB.
- `site/test/csp.test.ts` fails if a bundle regains `new Function` or the policy
  gains an escape hatch, and `npm run preview:csp -w site` serves the build under
  the real headers.

## 0.3.0

Two obligations that section 8 of the specification puts on consumers, which the
reference implementation did not honour, and `security.txt` support in the site.

- `fetchPolicy` counts bytes off the stream and stops at 256 KiB. It previously
  read the response whole and compared the length afterwards, by which point a
  hostile server had already decided how much memory to use.
- Every redirect hop is checked by literal host and by resolved address, so a
  public host can no longer send `check` at a private, loopback, link-local or
  metadata address. A name answering differently between the check and the
  request still gets through; closing that needs the socket.
- `isPrivateAddress` no longer reads any host beginning `fc` or `fd` as a unique
  local address, and no longer misses IPv4-mapped IPv6.
- `securityTxt`, `mergeSecurityTxt` and `answersFromSecurityTxt` in core: write a
  complete RFC 9116 file, set `CVD-Policy` in one that exists, and read a file
  back into wizard answers. Both the import and the merge report that editing a
  clear-signed file breaks its signature.
- One head per route is written at build time; every route had shipped the same
  static head, telling search engines that all eight pages were duplicates of the
  start page. Unknown paths resolve to a real 404 with `noindex` instead of
  rendering the home page under their own URL with a 200.
- `_headers` granted CORS to `/schema/0.1` by name, so the current 0.2 schema
  could not be fetched by a browser-based tool. `decodeDraft` inflated
  attacker-supplied deflate uncapped. CI checked out `cvd-policy/spec` with no
  ref, so a commit there could redden every open pull request here.
- The dictionaries were audited against what the code emits.
  `POSTURE_CONTRADICTION` had no entry at all, so a document whose posture
  contradicts its testing rules showed `issue.posture_contradiction` as its only
  error.

## 0.2.0

Support for CVD Policy Format 0.2 in the library, the CLI and the site. Each
published format version is compiled separately and a document is validated
against the version it declares.

## 0.1.0

First release: reference library, command line tool and website for CVD Policy
Format 0.1.
