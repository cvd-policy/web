# @cvd-policy/core

Reference implementation of the CVD Policy Format 0.1. Framework-free, works in
the browser and in Node. The schema is embedded at build time, so nothing is
fetched at runtime.

```bash
npm i @cvd-policy/core
```

```typescript
import { validate, generate, evaluate, explain, securityTxtLines } from "@cvd-policy/core";

const result = validate(JSON.parse(raw));
// { valid: false, issues: [{ level: "error", code: "EXPIRES_PAST", path: "/expires", … }] }

const decision = evaluate(doc, "automated_scanning", "api.example.com");
// { allowed: true, reason: "RULE_ALLOWED", conditions: { max_requests_per_second: 5 } }
```

## What each function does

| Function             | Purpose                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `validate`           | Schema plus the semantic rules JSON Schema cannot express          |
| `validateText`       | Same, for unparsed JSON text                                       |
| `generate`           | Builds a document from wizard answers                              |
| `answersFrom`        | Reads a document back into answers, for editing                    |
| `evaluate`           | Decides whether an activity against a target is permitted          |
| `scopeStateFor`      | Resolves whether a target is in scope                              |
| `explain`            | Display sections, no rating of any kind                            |
| `securityTxtLines`   | The lines to add to a `security.txt`                               |
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

## Messages are codes, not text

Issues carry a stable `code` (`EXPIRES_PAST`, `POSTURE_CONTRADICTION`, …), a
JSON Pointer `path` and a `message` that is a translation key. Rendering happens
in the consuming application, so the library ships no localised strings.

## Licence

Apache-2.0. The specification and schema it implements are CC0-1.0.
