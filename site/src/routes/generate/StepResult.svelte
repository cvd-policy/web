<script lang="ts">
  import { cvdPolicyLine, securityTxtLines } from "@cvd-policy/core";
  import type { CvdPolicyDocument, ValidationResult } from "@cvd-policy/core";
  import CodeBlock from "../../components/CodeBlock.svelte";
  import CopyButton from "../../components/CopyButton.svelte";
  import { downloadText } from "../../lib/download.js";
  import { i18n, t } from "../../lib/i18n.svelte.js";
  import { policyHtml } from "../../lib/policyHtml.js";
  import { encodeDraft } from "../../lib/share.js";
  import { wizard } from "../../lib/wizard.svelte.js";

  let { doc, result }: { doc: CvdPolicyDocument; result: ValidationResult } = $props();

  const json = $derived(JSON.stringify(doc, null, 2));
  const txtLines = $derived(securityTxtLines(doc).join("\n"));
  const check = $derived(
    `curl -s ${doc.canonical || "https://example.com/.well-known/cvd.json"} | npx @cvd-policy/cli validate -`,
  );

  let permalink = $state("");

  async function makePermalink() {
    permalink = `${location.origin}/explain#${await encodeDraft(doc)}`;
  }
</script>

<h2 class="u-mt0">{t("generate.result_title")}</h2>

<p class="row">
  <span class="badge {result.valid ? 'badge-ok' : 'badge-err'}">
    {result.valid ? t("generate.result_valid") : t("generate.result_invalid")}
  </span>
</p>

<div class="row actions-primary u-mb6">
  <button type="button" class="btn btn-primary" onclick={() => downloadText("cvd.json", json)}>
    {t("common.download")} cvd.json
  </button>
  <CopyButton text={json} />
  <button
    type="button"
    class="btn"
    onclick={() => downloadText("cvd-policy.html", policyHtml(doc, i18n.lang), "text/html")}
  >
    {t("generate.result_human")}
  </button>
</div>
<p class="help">{t("generate.result_human_help")}</p>

<ol class="stack u-indent">
  <li>
    <p>{t("generate.result_step1")}</p>
    <CodeBlock code={doc.canonical || "https://example.com/.well-known/cvd.json"} />
  </li>
  <li>
    <p>{t("generate.result_step2")}</p>
    <CodeBlock code={cvdPolicyLine(doc)} title="security.txt" />
    <details>
      <summary class="small mute">security.txt</summary>
      <CodeBlock code={txtLines} />
    </details>
  </li>
  <li>
    <p>{t("generate.result_step3")}</p>
    <CodeBlock code={check} />
  </li>
</ol>

<div class="notice u-mt6">{t("generate.result_no_leak")}</div>

<div class="stack u-mt6">
  <div class="row">
    <button type="button" class="btn btn-sm" onclick={makePermalink}>
      {t("generate.result_permalink")}
    </button>
    {#if permalink}
      <CopyButton text={permalink} />
    {/if}
  </div>
  <p class="help">{t("generate.result_permalink_help")}</p>
  {#if permalink}
    <CodeBlock code={permalink} copyable={false} />
  {/if}
</div>

<div class="stack u-mt6">
  <div>
    <button type="button" class="btn btn-sm" onclick={() => wizard.clear()}>
      {t("generate.clear_state")}
    </button>
  </div>
  <p class="help">{t("generate.clear_state_help")}</p>
</div>
