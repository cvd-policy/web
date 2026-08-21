# @cvd-policy/core

Reference implementation of the CVD Policy Format. Framework-free, works in the
browser and in Node. Every published schema is embedded at build time, so
nothing is fetched at runtime.

Format versions 0.1 and 0.2 are both supported: a document is validated against
the version it declares, because a released version never changes.

```bash
npm i @cvd-policy/core
```

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

## Authority: which hosts a document may speak for

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

## Incoming reports

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

## Messages are codes, not text

Issues carry a stable `code` (`EXPIRES_PAST`, `POSTURE_CONTRADICTION`, …), a
JSON Pointer `path` and a `message` that is a translation key. Rendering happens
in the consuming application, so the library ships no localised strings.

## Licence

Apache-2.0. The specification and schema it implements are CC0-1.0.
