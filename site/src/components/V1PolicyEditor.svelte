<script lang="ts">
  import type {
    CvdPolicyDocument,
    ProductReportingScope,
    RequestedField,
    TestingConditions,
    TestingRule,
    WebReportingScope,
  } from "@cvd-policy/core/v1";
  import { t } from "../lib/i18n.svelte.js";
  import {
    isoDateTime,
    joinLines,
    localDateTime,
    parsePorts,
    positiveInteger,
    positiveNumber,
    splitLines,
  } from "../lib/v1Editor.js";

  let {
    policy = $bindable(),
    valid = $bindable(true),
  }: { policy: CvdPolicyDocument; valid?: boolean } = $props();

  const requestedFields: RequestedField[] = [
    "affected_asset",
    "vulnerability_type",
    "description",
    "reproduction_steps",
    "impact",
    "environment",
    "evidence",
    "researcher_contact",
    "disclosure_preference",
  ];
  const activities: Array<"manual_testing" | "automated_scanning" | "fuzzing" | "credential_testing"> = [
    "manual_testing", "automated_scanning", "fuzzing", "credential_testing",
  ];
  let extensionRows = $state(
    Object.entries(policy.extensions ?? {}).map(([uri, value]) => ({
      uri,
      value: JSON.stringify(value, null, 2),
      critical: policy.critical_extensions?.includes(uri) ?? false,
    })),
  );
  let extensionError = $state("");
  const savedConditions = new WeakMap<TestingRule, TestingConditions>();

  function nextId(prefix: string): string {
    const ids = new Set([
      ...(policy.reporting_scope.web ?? []).map((entry) => entry.id),
      ...(policy.reporting_scope.products ?? []).map((entry) => entry.id),
      ...(policy.testing?.rules ?? []).map((entry) => entry.id),
    ]);
    let index = 1;
    while (ids.has(`${prefix}-${index}`)) index += 1;
    return `${prefix}-${index}`;
  }

  function addWebScope() {
    const entry: WebReportingScope = {
      id: nextId("web"), state: "in", host: "example.com", schemes: ["https"], path_prefix: "/", include_subdomains: false,
    };
    (policy.reporting_scope.web ??= []).push(entry);
  }

  function removeWebScope(index: number) {
    if (scopeCount() <= 1) return;
    policy.reporting_scope.web?.splice(index, 1);
    if (!policy.reporting_scope.web?.length) delete policy.reporting_scope.web;
    normalizeTestingTargets();
  }

  function addProductScope() {
    const entry: ProductReportingScope = { id: nextId("product"), state: "in", name: "Product name" };
    (policy.reporting_scope.products ??= []).push(entry);
  }

  function removeProductScope(index: number) {
    if (scopeCount() <= 1) return;
    policy.reporting_scope.products?.splice(index, 1);
    if (!policy.reporting_scope.products?.length) delete policy.reporting_scope.products;
  }

  function setScheme(entry: WebReportingScope, scheme: "http" | "https", checked: boolean) {
    if (!checked && entry.schemes.length === 1 && entry.schemes[0] === scheme) return;
    entry.schemes = checked
      ? [...new Set([...entry.schemes, scheme])]
      : entry.schemes.filter((value) => value !== scheme);
  }

  function setWebId(entry: WebReportingScope, value: string) {
    const previous = entry.id;
    entry.id = value;
    for (const rule of policy.testing?.rules ?? []) {
      if (rule.target_ids?.includes(previous)) {
        rule.target_ids = [...new Set(rule.target_ids.map((id) => id === previous ? value : id))];
      }
    }
  }

  function setWebState(entry: WebReportingScope, state: WebReportingScope["state"]) {
    entry.state = state;
    normalizeTestingTargets();
  }

  function enableTesting(enabled: boolean) {
    if (!enabled) {
      delete policy.testing;
      return;
    }
    policy.testing = { rules: [] };
    addTestingRule();
  }

  function addTestingRule() {
    policy.testing ??= { rules: [] };
    const target = testingTargetIds()[0];
    const rule: TestingRule = {
      id: nextId("testing"),
      activity: "manual_testing",
      state: "prohibited",
      ...(target ? { target_ids: [target] } : {}),
    };
    policy.testing.rules.push(rule);
  }

  function setRuleState(rule: TestingRule, state: TestingRule["state"]) {
    if (state === "permitted" && !canPermitTesting()) return;
    rule.state = state;
    if (state === "prohibited") {
      if (rule.conditions) savedConditions.set(rule, { ...rule.conditions });
      delete rule.conditions;
    }
    else {
      const saved = savedConditions.get(rule);
      if (saved) rule.conditions = { ...saved };
      const target = testingTargetIds()[0];
      rule.target_ids ??= target ? [target] : [];
      ensureRequiredConditions(rule);
    }
  }

  function setRuleActivity(rule: TestingRule, activity: string) {
    rule.activity = activity;
    ensureRequiredConditions(rule);
  }

  function isCoreActivity(activity: string): boolean {
    return activities.some((value) => value === activity);
  }

  function testingTargetIds(): string[] {
    return (policy.reporting_scope.web ?? []).filter((entry) => entry.state === "in").map((entry) => entry.id);
  }

  function canPermitTesting(): boolean {
    return testingTargetIds().length > 0 && ["open", "limited"].includes(policy.research.posture);
  }

  function normalizeTestingTargets() {
    const valid = new Set(testingTargetIds());
    for (const rule of policy.testing?.rules ?? []) {
      const targets = rule.target_ids?.filter((id) => valid.has(id)) ?? [];
      if (targets.length) rule.target_ids = targets;
      else delete rule.target_ids;
      if (rule.state === "permitted" && !targets.length) setRuleState(rule, "prohibited");
    }
  }

  function setRuleTarget(rule: TestingRule, targetId: string, checked: boolean) {
    const targets = rule.target_ids ?? [];
    const next = checked ? [...new Set([...targets, targetId])] : targets.filter((id) => id !== targetId);
    if (next.length) rule.target_ids = next;
    else delete rule.target_ids;
  }

  function setResearchPosture(value: string) {
    if (value !== "open" && value !== "limited" && value !== "report_only" && value !== "prohibited") return;
    policy.research.posture = value;
    if (value === "report_only" || value === "prohibited") {
      for (const rule of policy.testing?.rules ?? []) {
        if (rule.state === "permitted") setRuleState(rule, "prohibited");
      }
    }
  }

  function ensureRequiredConditions(rule: TestingRule) {
    if (rule.state !== "permitted") return;
    if (["automated_scanning", "fuzzing", "credential_testing"].includes(rule.activity)) {
      rule.conditions ??= { max_requests_per_second: 1, max_concurrent_requests: 1 };
      rule.conditions.max_requests_per_second ??= 1;
      rule.conditions.max_concurrent_requests ??= 1;
      if (rule.activity === "credential_testing") rule.conditions.test_accounts_only = true;
    }
  }

  function enableConditions(rule: TestingRule, enabled: boolean) {
    if (enabled) rule.conditions = { max_requests_per_second: 1, max_concurrent_requests: 1 };
    else delete rule.conditions;
  }

  function removeTestingRule(index: number) {
    if (!policy.testing) return;
    policy.testing.rules.splice(index, 1);
    if (!policy.testing.rules.length) delete policy.testing;
  }

  function scopeCount(): number {
    return (policy.reporting_scope.web?.length ?? 0) + (policy.reporting_scope.products?.length ?? 0);
  }

  function setCondition(rule: TestingRule, key: keyof TestingConditions, value: number | string | true | undefined) {
    rule.conditions ??= {};
    if (value === undefined || value === "") {
      delete rule.conditions[key];
      if (!Object.keys(rule.conditions).length) delete rule.conditions;
    } else Object.assign(rule.conditions, { [key]: value });
  }

  function setRequestedField(field: RequestedField, checked: boolean) {
    policy.reporting.requested_fields = checked
      ? [...new Set([...policy.reporting.requested_fields, field])]
      : policy.reporting.requested_fields.filter((value) => value !== field);
  }

  function enableResponseTargets(enabled: boolean) {
    if (enabled) policy.response_targets = { acknowledgement_days: 3 };
    else delete policy.response_targets;
  }

  function setResponseTarget(
    key: "acknowledgement_days" | "initial_assessment_days" | "update_interval_days",
    value: number | undefined,
  ) {
    if (!policy.response_targets) return;
    if (value === undefined) {
      delete policy.response_targets[key];
      if (!Object.keys(policy.response_targets).length) delete policy.response_targets;
    } else policy.response_targets[key] = value;
  }

  function enableDisclosure(enabled: boolean) {
    if (enabled) policy.disclosure = { approach: "coordinated", default_days: 90 };
    else delete policy.disclosure;
  }

  function updateExtensions() {
    try {
      const extensions: Record<string, unknown> = {};
      const critical: string[] = [];
      for (const row of extensionRows) {
        if (!row.uri.trim()) throw new Error("missing extension URI");
        if (Object.hasOwn(extensions, row.uri.trim())) throw new Error("duplicate extension URI");
        extensions[row.uri.trim()] = JSON.parse(row.value);
        if (row.critical) critical.push(row.uri.trim());
      }
      if (Object.keys(extensions).length) policy.extensions = extensions;
      else delete policy.extensions;
      if (critical.length) policy.critical_extensions = critical;
      else delete policy.critical_extensions;
      extensionError = "";
      valid = true;
    } catch {
      extensionError = t("generate.editor_extension_error");
      valid = false;
    }
  }
</script>

<div class="stack wizard-form">
  <section class="editor-section">
    <div class="editor-section-heading">
      <div><p class="editor-kicker">01</p><h2>{t("generate.editor_identity")}</h2></div>
      <p class="help">{t("generate.editor_identity_help")}</p>
    </div>
    <div class="form-grid">
      <div class="field"><label for="org-name">{t("generate.editor_org_name")}</label><input id="org-name" bind:value={policy.organization.name} maxlength="200" required /></div>
      <div class="field"><label for="org-uri">{t("generate.editor_org_uri")} <span class="u-normal">({t("common.optional")})</span></label><input id="org-uri" type="url" value={policy.organization.uri ?? ""} oninput={(event) => event.currentTarget.value ? policy.organization.uri = event.currentTarget.value : delete policy.organization.uri} /></div>
      <div class="field"><label for="last-updated">{t("generate.editor_last_updated")}</label><input id="last-updated" type="datetime-local" step="1" value={localDateTime(policy.last_updated)} onchange={(event) => policy.last_updated = isoDateTime(event.currentTarget.value)} /><button class="btn btn-sm btn-quiet u-mt1" type="button" onclick={() => policy.last_updated = new Date().toISOString()}>{t("generate.editor_set_now")}</button></div>
      <div class="field"><label for="expires">{t("generate.editor_expires")}</label><input id="expires" type="datetime-local" step="1" value={localDateTime(policy.expires)} onchange={(event) => policy.expires = isoDateTime(event.currentTarget.value)} /></div>
    </div>
  </section>

  <section class="editor-section">
    <div class="editor-section-heading"><div><p class="editor-kicker">02</p><h2>{t("generate.editor_contact")}</h2></div><p class="help">{t("generate.editor_contact_help")}</p></div>
    <div class="field"><label for="contact-channels">{t("generate.editor_channels")}</label><textarea id="contact-channels" class="textarea-short" value={joinLines(policy.contact.channels)} oninput={(event) => policy.contact.channels = splitLines(event.currentTarget.value)}></textarea><p class="help">{t("generate.editor_channels_help")}</p></div>
    <div class="form-grid">
      <div class="field"><label for="languages">{t("generate.editor_languages")} <span class="u-normal">({t("common.optional")})</span></label><textarea id="languages" class="textarea-short" value={joinLines(policy.contact.preferred_languages)} oninput={(event) => { const values = splitLines(event.currentTarget.value); if (values.length) policy.contact.preferred_languages = values; else delete policy.contact.preferred_languages; }}></textarea></div>
      <div class="field"><label for="encryption">{t("generate.editor_encryption")} <span class="u-normal">({t("common.optional")})</span></label><textarea id="encryption" class="textarea-short" value={joinLines(policy.contact.encryption)} oninput={(event) => { const values = splitLines(event.currentTarget.value); if (values.length) policy.contact.encryption = values; else delete policy.contact.encryption; }}></textarea></div>
    </div>
  </section>

  <section class="editor-section">
    <div class="editor-section-heading"><div><p class="editor-kicker">03</p><h2>{t("generate.editor_research")}</h2></div><p class="help">{t("generate.editor_research_help")}</p></div>
    <div class="field"><label for="posture">{t("generate.editor_posture")}</label><select id="posture" value={policy.research.posture} onchange={(event) => setResearchPosture(event.currentTarget.value)}><option value="open">{t("generate.editor_posture_open")}</option><option value="limited">{t("generate.editor_posture_limited")}</option><option value="report_only">{t("generate.editor_posture_report_only")}</option><option value="prohibited">{t("generate.editor_posture_prohibited")}</option></select></div>
    <div class="field"><label for="research-statement">{t("generate.editor_statement")} <span class="u-normal">({t("common.optional")})</span></label><textarea id="research-statement" class="textarea-prose" maxlength="2000" value={policy.research.statement ?? ""} oninput={(event) => event.currentTarget.value ? policy.research.statement = event.currentTarget.value : delete policy.research.statement}></textarea></div>
  </section>

  <section class="editor-section">
    <div class="editor-section-heading"><div><p class="editor-kicker">04</p><h2>{t("generate.editor_scope")}</h2></div><p class="help">{t("generate.editor_scope_help")}</p></div>
    <div class="row"><h3 class="u-m0 u-grow">{t("generate.editor_web_scope")}</h3><button class="btn btn-sm" type="button" onclick={addWebScope}>{t("generate.editor_add_web")}</button></div>
    {#each policy.reporting_scope.web ?? [] as entry, index (`web-${index}`)}
      <fieldset class="editor-entry"><legend>{t("generate.editor_web_entry", { n: index + 1 })}</legend>
        <div class="form-grid"><div class="field"><label for={`web-id-${index}`}>{t("generate.editor_id")}</label><input id={`web-id-${index}`} value={entry.id} oninput={(event) => setWebId(entry, event.currentTarget.value)} /></div><div class="field"><label for={`web-state-${index}`}>{t("generate.editor_state")}</label><select id={`web-state-${index}`} value={entry.state} onchange={(event) => setWebState(entry, event.currentTarget.value === "out" ? "out" : "in")}><option value="in">{t("generate.editor_in")}</option><option value="out">{t("generate.editor_out")}</option></select></div><div class="field"><label for={`web-host-${index}`}>{t("generate.editor_host")}</label><input id={`web-host-${index}`} bind:value={entry.host} /></div><div class="field"><label for={`web-path-${index}`}>{t("generate.editor_path")}</label><input id={`web-path-${index}`} bind:value={entry.path_prefix} /></div><div class="field"><label for={`web-ports-${index}`}>{t("generate.editor_ports")} <span class="u-normal">({t("common.optional")})</span></label><input id={`web-ports-${index}`} inputmode="numeric" value={entry.ports?.join(", ") ?? ""} oninput={(event) => { const ports = parsePorts(event.currentTarget.value); if (ports) entry.ports = ports; else delete entry.ports; }} /></div></div>
        <div class="check-grid"><label class="inline-check"><input type="checkbox" checked={entry.schemes.includes("https")} onchange={(event) => setScheme(entry, "https", event.currentTarget.checked)} /> HTTPS</label><label class="inline-check"><input type="checkbox" checked={entry.schemes.includes("http")} onchange={(event) => setScheme(entry, "http", event.currentTarget.checked)} /> HTTP</label><label class="inline-check"><input type="checkbox" bind:checked={entry.include_subdomains} /> {t("generate.editor_subdomains")}</label></div>
        <button class="btn btn-sm btn-quiet" type="button" onclick={() => removeWebScope(index)} disabled={scopeCount() <= 1}>{t("common.remove")}</button>
      </fieldset>
    {/each}
    <div class="row u-mt6"><h3 class="u-m0 u-grow">{t("generate.editor_product_scope")}</h3><button class="btn btn-sm" type="button" onclick={addProductScope}>{t("generate.editor_add_product")}</button></div>
    {#each policy.reporting_scope.products ?? [] as entry, index (`product-${index}`)}
      <fieldset class="editor-entry"><legend>{t("generate.editor_product_entry", { n: index + 1 })}</legend>
        <div class="form-grid"><div class="field"><label for={`product-id-${index}`}>{t("generate.editor_id")}</label><input id={`product-id-${index}`} bind:value={entry.id} /></div><div class="field"><label for={`product-state-${index}`}>{t("generate.editor_state")}</label><select id={`product-state-${index}`} bind:value={entry.state}><option value="in">{t("generate.editor_in")}</option><option value="out">{t("generate.editor_out")}</option></select></div><div class="field"><label for={`product-name-${index}`}>{t("generate.editor_product_name")}</label><input id={`product-name-${index}`} bind:value={entry.name} maxlength="200" /></div><div class="field"><label for={`product-identifiers-${index}`}>{t("generate.editor_identifiers")} <span class="u-normal">({t("common.optional")})</span></label><textarea id={`product-identifiers-${index}`} class="textarea-short" value={joinLines(entry.identifiers)} oninput={(event) => { const values = splitLines(event.currentTarget.value); if (values.length) entry.identifiers = values; else delete entry.identifiers; }}></textarea></div></div>
        <button class="btn btn-sm btn-quiet" type="button" onclick={() => removeProductScope(index)} disabled={scopeCount() <= 1}>{t("common.remove")}</button>
      </fieldset>
    {/each}
  </section>

  <section class="editor-section">
    <div class="editor-section-heading"><div><p class="editor-kicker">05</p><h2>{t("generate.editor_testing")}</h2></div><p class="help">{t("generate.editor_testing_help")}</p></div>
    <label class="inline-check"><input type="checkbox" checked={Boolean(policy.testing)} onchange={(event) => enableTesting(event.currentTarget.checked)} /> {t("generate.editor_testing_enable")}</label>
    {#if policy.testing}
      <div class="row u-mt6"><p class="help u-grow">{t("generate.editor_testing_notice")}</p><button class="btn btn-sm" type="button" onclick={addTestingRule}>{t("generate.editor_add_rule")}</button></div>
      {#each policy.testing.rules as rule, index (`rule-${index}`)}
        <fieldset class="editor-entry"><legend>{t("generate.editor_rule", { n: index + 1 })}</legend>
          <div class="form-grid"><div class="field"><label for={`rule-id-${index}`}>{t("generate.editor_id")}</label><input id={`rule-id-${index}`} bind:value={rule.id} /></div><div class="field"><label for={`rule-activity-${index}`}>{t("generate.editor_activity")}</label><select id={`rule-activity-${index}`} value={isCoreActivity(rule.activity) ? rule.activity : "custom"} onchange={(event) => setRuleActivity(rule, event.currentTarget.value === "custom" ? "https://example.com/testing/custom" : event.currentTarget.value)}>{#each activities as activity}<option value={activity}>{t(`activity.${activity}`)}</option>{/each}<option value="custom">{t("generate.editor_activity_custom")}</option></select>{#if !isCoreActivity(rule.activity)}<input class="u-mt1" type="url" aria-label={t("generate.editor_activity_uri")} value={rule.activity} oninput={(event) => setRuleActivity(rule, event.currentTarget.value)} />{/if}</div><div class="field"><label for={`rule-state-${index}`}>{t("generate.editor_rule_state")}</label><select id={`rule-state-${index}`} value={rule.state} onchange={(event) => setRuleState(rule, event.currentTarget.value === "permitted" ? "permitted" : "prohibited")}><option value="prohibited">{t("generate.editor_prohibited")}</option><option value="permitted" disabled={!canPermitTesting()}>{t("generate.editor_permitted")}</option></select>{#if !canPermitTesting()}<p class="help">{t("generate.editor_permitted_unavailable")}</p>{/if}</div><fieldset class="field"><legend>{t("generate.editor_target_ids")} {#if rule.state === "prohibited"}<span class="u-normal">({t("common.optional")})</span>{/if}</legend>{#if testingTargetIds().length}<div class="check-grid">{#each testingTargetIds() as targetId}<label class="inline-check"><input type="checkbox" checked={rule.target_ids?.includes(targetId) ?? false} onchange={(event) => setRuleTarget(rule, targetId, event.currentTarget.checked)} /> {targetId}</label>{/each}</div>{:else}<p class="help">{t("generate.editor_no_testing_targets")}</p>{/if}</fieldset></div>
          {#if rule.state === "permitted"}
            <label class="inline-check"><input type="checkbox" checked={Boolean(rule.conditions)} disabled={["automated_scanning", "fuzzing", "credential_testing"].includes(rule.activity)} onchange={(event) => enableConditions(rule, event.currentTarget.checked)} /> {t("generate.editor_conditions")}</label>
            {#if rule.conditions}
              <div class="form-grid u-mt6"><div class="field"><label for={`rule-rps-${index}`}>{t("generate.editor_rps")}</label><input id={`rule-rps-${index}`} type="number" min="0.000001" step="any" required={["automated_scanning", "fuzzing", "credential_testing"].includes(rule.activity)} value={rule.conditions.max_requests_per_second ?? ""} oninput={(event) => setCondition(rule, "max_requests_per_second", positiveNumber(event.currentTarget.value))} /></div><div class="field"><label for={`rule-concurrency-${index}`}>{t("generate.editor_concurrency")}</label><input id={`rule-concurrency-${index}`} type="number" min="1" step="1" required={["automated_scanning", "fuzzing", "credential_testing"].includes(rule.activity)} value={rule.conditions.max_concurrent_requests ?? ""} oninput={(event) => setCondition(rule, "max_concurrent_requests", positiveInteger(event.currentTarget.value))} /></div><div class="field"><label for={`rule-agent-${index}`}>{t("generate.editor_user_agent")} <span class="u-normal">({t("common.optional")})</span></label><input id={`rule-agent-${index}`} value={rule.conditions.required_user_agent_token ?? ""} oninput={(event) => setCondition(rule, "required_user_agent_token", event.currentTarget.value || undefined)} /></div><label class="inline-check"><input type="checkbox" checked={rule.conditions.test_accounts_only === true} disabled={rule.activity === "credential_testing"} onchange={(event) => setCondition(rule, "test_accounts_only", event.currentTarget.checked ? true : undefined)} /> {t("generate.editor_test_accounts")}</label></div>
            {/if}
          {/if}
          <button class="btn btn-sm btn-quiet" type="button" onclick={() => removeTestingRule(index)}>{t("common.remove")}</button>
        </fieldset>
      {/each}
    {/if}
  </section>

  <section class="editor-section">
    <div class="editor-section-heading"><div><p class="editor-kicker">06</p><h2>{t("generate.editor_reporting")}</h2></div><p class="help">{t("generate.editor_reporting_help")}</p></div>
    <fieldset><legend>{t("generate.editor_requested_fields")}</legend><div class="check-grid">{#each requestedFields as field}<label class="inline-check"><input type="checkbox" checked={policy.reporting.requested_fields.includes(field)} onchange={(event) => setRequestedField(field, event.currentTarget.checked)} /> {t(`generate.editor_requested_${field}`)}</label>{/each}</div></fieldset>
    <div class="field"><label for="proof">{t("generate.editor_proof")}</label><select id="proof" bind:value={policy.reporting.proof_of_exploitation}><option value="not_requested">{t("generate.editor_proof_not_requested")}</option><option value="requested_if_safe">{t("generate.editor_proof_requested")}</option><option value="prohibited">{t("generate.editor_proof_prohibited")}</option></select></div>
  </section>

  <section class="editor-section">
    <div class="editor-section-heading"><div><p class="editor-kicker">07</p><h2>{t("generate.editor_response")}</h2></div><p class="help">{t("generate.editor_response_help")}</p></div>
    <label class="inline-check"><input type="checkbox" checked={Boolean(policy.response_targets)} onchange={(event) => enableResponseTargets(event.currentTarget.checked)} /> {t("generate.editor_response_enable")}</label>
    {#if policy.response_targets}<div class="form-grid u-mt6"><div class="field"><label for="ack-days">{t("generate.editor_ack_days")}</label><input id="ack-days" type="number" min="1" step="1" value={policy.response_targets.acknowledgement_days ?? ""} oninput={(event) => setResponseTarget("acknowledgement_days", positiveInteger(event.currentTarget.value))} /></div><div class="field"><label for="assessment-days">{t("generate.editor_assessment_days")}</label><input id="assessment-days" type="number" min="1" step="1" value={policy.response_targets.initial_assessment_days ?? ""} oninput={(event) => setResponseTarget("initial_assessment_days", positiveInteger(event.currentTarget.value))} /></div><div class="field"><label for="update-days">{t("generate.editor_update_days")}</label><input id="update-days" type="number" min="1" step="1" value={policy.response_targets.update_interval_days ?? ""} oninput={(event) => setResponseTarget("update_interval_days", positiveInteger(event.currentTarget.value))} /></div></div>{/if}
  </section>

  <section class="editor-section">
    <div class="editor-section-heading"><div><p class="editor-kicker">08</p><h2>{t("generate.editor_disclosure")}</h2></div><p class="help">{t("generate.editor_disclosure_help")}</p></div>
    <label class="inline-check"><input type="checkbox" checked={Boolean(policy.disclosure)} onchange={(event) => enableDisclosure(event.currentTarget.checked)} /> {t("generate.editor_disclosure_enable")}</label>
    {#if policy.disclosure}<div class="form-grid u-mt6"><div class="field"><label for="disclosure-approach">{t("generate.editor_approach")}</label><select id="disclosure-approach" bind:value={policy.disclosure.approach}><option value="coordinated">{t("generate.editor_approach_coordinated")}</option><option value="case_by_case">{t("generate.editor_approach_case")}</option><option value="no_preference">{t("generate.editor_approach_none")}</option></select></div><div class="field"><label for="disclosure-days">{t("generate.editor_default_days")} <span class="u-normal">({t("common.optional")})</span></label><input id="disclosure-days" type="number" min="1" step="1" value={policy.disclosure.default_days ?? ""} oninput={(event) => { const value = positiveInteger(event.currentTarget.value); if (value) policy.disclosure!.default_days = value; else delete policy.disclosure!.default_days; }} /></div></div><div class="field"><label for="disclosure-statement">{t("generate.editor_disclosure_statement")} <span class="u-normal">({t("common.optional")})</span></label><textarea id="disclosure-statement" class="textarea-prose" maxlength="2000" value={policy.disclosure.statement ?? ""} oninput={(event) => event.currentTarget.value ? policy.disclosure!.statement = event.currentTarget.value : delete policy.disclosure!.statement}></textarea></div>{/if}
  </section>

  <section class="editor-section">
    <div class="editor-section-heading"><div><p class="editor-kicker">09</p><h2>{t("generate.editor_extensions")}</h2></div><p class="help">{t("generate.editor_extensions_help")}</p></div>
    {#each extensionRows as row, index (`extension-${index}`)}
      <fieldset class="editor-entry"><legend>{t("generate.editor_extension", { n: index + 1 })}</legend><div class="field"><label for={`extension-uri-${index}`}>{t("generate.editor_extension_uri")}</label><input id={`extension-uri-${index}`} type="url" value={row.uri} oninput={(event) => { row.uri = event.currentTarget.value; updateExtensions(); }} /></div><div class="field"><label for={`extension-value-${index}`}>{t("generate.editor_extension_value")}</label><textarea id={`extension-value-${index}`} class="textarea-short" value={row.value} oninput={(event) => { row.value = event.currentTarget.value; updateExtensions(); }}></textarea></div><label class="inline-check"><input type="checkbox" bind:checked={row.critical} onchange={updateExtensions} /> {t("generate.editor_extension_critical")}</label><button class="btn btn-sm btn-quiet" type="button" onclick={() => { extensionRows.splice(index, 1); updateExtensions(); }}>{t("common.remove")}</button></fieldset>
    {/each}
    {#if extensionError}<div class="issue error" role="alert" aria-live="polite"><p>{extensionError}</p></div>{/if}
    <button class="btn btn-sm" type="button" onclick={() => { extensionRows.push({ uri: `https://example.com/extensions/example-${extensionRows.length + 1}`, value: "{}", critical: false }); updateExtensions(); }}>{t("generate.editor_add_extension")}</button>
  </section>
</div>
