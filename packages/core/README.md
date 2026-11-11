# @cvd-policy/core

Reference implementation of the CVD Policy Format. Framework-free, works in the
browser and in Node. Every published schema is embedded at build time, so
nothing is fetched at runtime.

Format versions 0.1 and 0.2 are both supported: a document is validated against
the version it declares, because a released version never changes. Their API
remains at the package root.

The Version 1 API is an experimental implementation of
`draft-behring-cvd-policy-01` (local, unpublished revision; see the vendored
[V1 specification](vendor/spec-v1/v1/SPEC.md)).
The proposed field and media type may change. It is isolated from the immutable
0.x API under this export:

```typescript
import {
  assessSecurityTxtAuthority,
  evaluatePolicy,
  generatePolicy,
  mergeSecurityTxt,
  parsePolicyText,
  securityTxt,
} from "@cvd-policy/core/v1";

const parsed = parsePolicyText(raw, { now: new Date() });
const authority = assessSecurityTxtAuthority(securityTxt, retrievalContext);
const decision = evaluatePolicy(
  parsed.policy,
  {
    activity: "automated_scanning",
    target: "https://example.com/",
    plan,
    policyRetrieval: {
      requestedUri: "https://example.com/cvd-policy.json",
      finalUri: "https://example.com/cvd-policy.json",
      redirectChain: [],
      statusCode: 200,
      mediaType: "application/cvd-policy+json",
    },
  },
  authority.established ? authority.evidence : null,
);
if (!decision.inputValid) {
  // Invalid target input: decision has issues but no evaluation status.
} else {
  // Only decision.status === "publisher-stated-permitted" is positive.
}
```

V1 `reasonCode` values are stable Core diagnostics, not normative interoperability
requirements. Invalid targets return `inputValid: false` with a
`target_url_invalid` issue and no evaluation status. Status-bearing evaluation also
requires policy retrieval evidence bound to the `CVD-Policy` URI. Only HTTPS
redirect chains ending in a `200 OK` JSON representation are accepted;
`application/json` requires the explicit `allowApplicationJson` option.

V1 has no report intake or submission API. `requested_fields` is advisory and
never authorizes collecting third-party data or unsafe proof of exploitation.

## CSAF capability declaration

The V1 entry point also exports `CSAF_EXTENSION_ID`, `CSAF_SPECIFICATION`,
`assessCsafCapability(input, options?)` and
`assessCsafHostDeclaration(input, authority, retrieval, options?)`. These assess
the policy's declaration of channels for CSAF 2.1 CSD04 Profile 9
(`csaf_vulnerability_report`); they do not validate reports or prove that a
host's intake works.

`assessCsafCapability` returns a discriminated result. When `coreValid` is false,
there is no capability state. When true, `state` is one of `not-advertised`,
`invalid`, `unsupported` or `advertised`; supported channels are available only
for the advertised result, alongside diagnostics. Its local declaration check
always excludes expiry from its local core preconditions. The host-declaration
gate checks expiry, so an expired policy is not currently usable.

`assessCsafHostDeclaration` returns `{ usable, capability, issues }`. It requires
currently valid policy and security.txt data and successful authority and
retrieval checks, including rejection of unsupported critical policy behavior.
It does not require a positive testing permission. Neither function performs
network lookups of the extension identifier or specification, sends reports,
or creates a submission endpoint. Malformed noncritical extension metadata does
not change core validity or permission evaluation; critical use remains
unsupported.

The policy evaluator must recheck `securityTxtExpires` in supplied
`established: true` authority evidence at evaluation time, preventing previously
established but now stale evidence from being reused. This corrects the existing
authority check; it is not a new CSAF permission rule. On the unchanged Web
baseline `0221629e2bb6702ccc24ddb84fcaf5dc7df87c8d`, the shared case
`expired-security-txt-blocks-host-use` used `now = 2026-11-08T12:00:00Z` and
`securityTxtExpires = 2026-11-01T00:00:00Z`. `evaluatePolicy` returned
`publisher-stated-permitted` (`testing_rule_permitted`) with no issues, although
the fixture expects `authority-not-established`. The responsible layer is
`evaluatePolicy`, which receives the authority evidence and must establish that
it is still current. The expiry check preserves core-validation and earlier
decision precedence. The host-declaration assessment applies the same current
expiry gate. The regression case now passes in the current Core: it reports
`security_txt_expired` and `authority-not-established`, matching the fixture.
The current Core also passes all 42 shared cases. These results are local
verification, not a published release or independent interoperability claim.

The shared CSAF helper artifacts are canonical in the Spec repository at
`extensions/csaf-vulnerability-report-v1/` (`csaf-policy-extension.schema.json`,
`csaf-policy-contract.json` and `csaf-policy-cases.json`). Vendored copies are
under `vendor/spec-v1/extensions/csaf-vulnerability-report-v1/`. The
structural schema checks URI syntax without restricting the specification to a
single value. Semantic assessment checks uniqueness, contact references and
support. RFC 3986 absolute URIs exclude literal fragments; the CSAF check also
handles the URI validator's empty-path limitation in AJV. See the vendored
[V1 specification](vendor/spec-v1/v1/SPEC.md) for the contract and rationale.

The synchronized sources come from Spec commit
`955f01c67391c832c970661329c7da5fdbf011af`. The contract and 42 shared cases
match their canonical files byte for byte; 17 additional URI-focused cases are
kept separate. The schema's fragment-exclusion pattern corrects the RFC 3986
absolute-URI requirement for literal fragments.

The vendored `SPEC_COMMIT` provenance marker must identify a real commit that
contains the synchronized source artifacts. For final provenance, first commit
the Spec changes, then synchronize again with `CVD_SPEC_DIR` set to the absolute
Spec checkout path. Do not use `HEAD` to imply provenance for uncommitted source
changes, and do not invent a commit hash.

CSAF capability assessment is part of the package from `0.6.0`; `0.5.0-rc.1`
does not include it.

```typescript
import { validate, validateReport, generate, evaluate, explain } from "@cvd-policy/core";

const result = validate(JSON.parse(raw));
// { valid: false, issues: [{ level: "error", code: "EXPIRES_PAST", path: "/expires", … }] }

const decision = evaluate(doc, "automated_scanning", "api.example.com");
// { allowed: true, reason: "RULE_ALLOWED", conditions: { max_requests_per_second: 5 } }

const report = validateReport(JSON.parse(incoming));
// { valid: true, issues: [{ level: "info", code: "REPORT_NO_REPRODUCTION", … }] }
```

## What each function does

| Function             | Purpose                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `validate`           | Schema for the declared version, plus the semantic rules           |
| `validateReport`     | An incoming report against the `report-0.1` profile                |
| `validateText`       | Same, for unparsed JSON text                                       |
| `generate`           | Builds a document from wizard answers                              |
| `answersFrom`        | Reads a document back into answers, for editing                    |
| `evaluate`           | Decides whether an activity against a target is permitted          |
| `scopeStateFor`      | Resolves whether a target is in scope                              |
| `explain`            | Display sections, no rating of any kind                            |
| `securityTxtLines`   | The lines to add to a `security.txt`                               |
| `securityTxt`        | A complete `security.txt`, for a host that has none yet            |
| `mergeSecurityTxt`   | Sets `CVD-Policy` in an existing file, leaving the rest alone      |
| `securityTxtCanonical` | Where the `security.txt` belongs, from `canonical`               |
| `parseSecurityTxt`   | Parses a `security.txt` into fields                                |

## Legacy 0.x authority

Anyone can list someone else's host in `scope` or in a rule's
`conditions.targets`, so a claim is not permission. A document has authority
over a host when the host is at or under `canonical`, or when that host pointed
at the document itself — which only its owner can arrange.

```typescript
// No context: authority comes from canonical alone.
evaluate(doc, "manual_testing", "bank.example.com");
// -> { allowed: false, reason: "FOREIGN_TARGET" }   for a doc on blog.example.com

// The host's own security.txt or well-known path produced this document.
evaluate(doc, "manual_testing", "bank.example.com", { discoveredFor: "bank.example.com" });
// -> { allowed: true, ... }
```

Pass `discoveredFor` with the host whose discovery produced the document, and
never reuse it for another host. This blocks a policy planted on a taken-over
subdomain while still supporting one document served centrally, or hosted by a
provider for a customer. `foreignTargetConfirmed: true` remains for the case
where you fetched the target's own policy and it agrees.

`validate` applies the same rule, so its `SCOPE_FOREIGN_HOST` and
`TESTING_TARGET_FOREIGN` warnings predict what evaluators will do.

## Legacy 0.x incoming reports

Since format version 0.2 a policy may carry `report_requirements.intake`: an
endpoint that accepts a structured report, the schema it expects, and whether
anonymous submission is allowed. `validateReport` checks a report against the
`report-0.1` profile.

Three fields are required — title, target, description. Missing steps to
reproduce or impact produce `info`, never an error, because they are not always
available and a missing field must never stop someone from reporting. Claimed
exploitation without evidence *is* an error, and exploitation is a three-state
value so that an unticked box is never stored as a denial.

**This library never sends anything.** `intake` says where a report may go;
deciding to send it is a judgement a person makes, and the specification
requires the receiving host to be shown first.

## Issue codes and messages

Existing validation and permission issues carry stable codes such as
`EXPIRES_PAST` and `POSTURE_CONTRADICTION`, JSON Pointer paths, and messages that
are translation keys. Callers should use `code` and `path` for program logic.
New CSAF capability issues, including host-assessment issues, also have stable
codes and paths, and may include human-readable English messages. This does not
change the meaning of existing issues.

## Licence

Apache-2.0. The specification and schema it implements are CC0-1.0.
