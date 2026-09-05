<script lang="ts">
  import { validateText as validateLegacyText } from "@cvd-policy/core";
  import { parsePolicyText } from "@cvd-policy/core/v1";
  import FileDrop from "../components/FileDrop.svelte";
  import { t } from "../lib/i18n.svelte.js";

  let raw = $state("");
  let filename = $state("");
  let legacy = $state(false);
  const result = $derived(raw.trim() ? (legacy ? validateLegacyText(raw) : parsePolicyText(raw)) : null);
</script>

<div class="stack">
  <div class="prose">
    <h1>{t("validate.v1_title")}</h1>
    <p class="lead">{t("validate.v1_lead")}</p>
    <div class="notice">{t("validate.v1_notice")} <a href="https://datatracker.ietf.org/doc/html/draft-behring-cvd-policy-00">draft-behring-cvd-policy-00</a>.</div>
  </div>
  <div class="split">
    <div class="stack">
      <label class="choice"><input type="checkbox" bind:checked={legacy} /><span><span class="choice-title">{t("validate.legacy_title")}</span><br /><span class="choice-body">{t("validate.legacy_body")}</span></span></label>
      <div class="field"><label for="policy-input">{t("validate.policy_json")}</label><textarea id="policy-input" bind:value={raw} spellcheck="false" placeholder={"{"}></textarea></div>
      <FileDrop onload={(text, name) => { raw = text; filename = name; }} accept="application/cvd-policy+json,application/json,.json" />
    </div>
    <div class="stack">
      {#if result}
        <div class="card">
          <p class="row"><span class="badge {result.valid ? 'badge-ok' : 'badge-err'}">{result.valid ? (legacy ? t("validate.result_valid") : t("validate.result_valid_local_v1")) : t("validate.result_invalid")}</span>{#if filename}<span class="small mute">{filename}</span>{/if}</p>
          {#if result.issues.length === 0}<p>{t("validate.v1_no_issues")}</p>{/if}
          {#if !legacy}<p class="help">{t("validate.local_scope")}</p>{/if}
          {#each result.issues as issue (issue.code + issue.path)}
            <div class="issue {issue.level}"><p class="issue-path"><code>{issue.code}</code> · {issue.path || "/"}</p><p>{issue.message}</p></div>
          {/each}
        </div>
      {/if}
      <div class="card"><h2 class="u-mt0">{t("validate.deployed_title")}</h2><code>npx @cvd-policy/cli@0.5.0-rc.1 check example.com</code><p class="help">{t("validate.deployed_help")}</p></div>
    </div>
  </div>
</div>
