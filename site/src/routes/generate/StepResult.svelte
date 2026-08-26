<script lang="ts">
  import { cvdPolicyLine, humanPolicyUrl, mergeSecurityTxt, securityTxt } from "@cvd-policy/core";
  import type { CvdPolicyDocument, ValidationResult } from "@cvd-policy/core";
  import CodeBlock from "../../components/CodeBlock.svelte";
  import CopyButton from "../../components/CopyButton.svelte";
  import FileDrop from "../../components/FileDrop.svelte";
  import { downloadBytes, downloadText } from "../../lib/download.js";
  import { t } from "../../lib/i18n.svelte.js";
  import { policyHtml } from "../../lib/policyHtml.js";
  import { encodeDraft } from "../../lib/share.js";
  import { policyZip } from "../../lib/policyZip.js";
  import { wizard } from "../../lib/wizard.svelte.js";

  let { doc, result }: { doc: CvdPolicyDocument; result: ValidationResult } = $props();

  const json = $derived(JSON.stringify(doc, null, 2));

  // cvd.html is handed over on this very page, so the Policy field may
  // name it. Core never assumes that: see humanPolicyUrl.
  const policy = $derived(humanPolicyUrl(doc));
  const txt = $derived(securityTxt(doc, { policy }));
  const check = $derived(
    `curl -s ${doc.canonical || "https://example.com/.well-known/cvd.json"} | npx @cvd-policy/cli validate -`,
  );

  /**
   * The host's own security.txt: the one read in at the first step, or one
   * pasted here. Either way the file that gets published is theirs, not ours.
   */
  let pasted = $state("");
  const existing = $derived(pasted.trim() === "" ? wizard.securityTxt : pasted);
  const merged = $derived(
    existing.trim() === "" ? null : mergeSecurityTxt(existing, doc, { policy }),
  );

  /** What the second file is: their file updated, or a new one from scratch. */
  const securityTxtFile = $derived(merged ? merged.text : txt);

  // The readable page is built on demand: it is a whole HTML document, and
  // rebuilding it on every keystroke to fill a copy button earns nothing.
  const files = $derived([
    { name: "cvd.json", text: json, mime: "application/json", primary: false },
    { name: "security.txt", text: securityTxtFile, mime: "text/plain", primary: false },
  ]);

  let permalink = $state("");

  function downloadWellKnownZip() {
    downloadBytes(
      "cvd-policy.zip",
      policyZip({
        cvdJson: json,
        policyHtml: policyHtml(doc),
        securityTxt: securityTxtFile,
      }),
      "application/zip",
    );
  }

  async function makePermalink() {
    permalink = `${location.origin}/explain#${await encodeDraft(doc)}`;
  }
</script>

<div class="row">
  <h2 class="u-m0">{t("generate.result_title")}</h2>
  <span class="badge {result.valid ? 'badge-ok' : 'badge-err'}">
    {result.valid ? t("generate.result_valid") : t("generate.result_invalid")}
  </span>
</div>

<!--
  The archive first: security.txt names the readable page, so the three files
  belong together and taking them one at a time is how a publisher ends up
  advertising a page they never uploaded. It also carries the two directories
  already laid out, which is the part nobody gets right by hand. The singles
  stay for anyone who wants just one of them.
-->
<div class="card card-tight u-mt6">
  <div class="stack">
    <div class="row">
      <code class="u-grow">cvd-policy.zip</code>
      <button type="button" class="btn btn-sm btn-primary" onclick={downloadWellKnownZip}>
        {t("common.download")}
      </button>
    </div>

    <p class="help u-m0">{t("generate.result_zip_help")}</p>

    {#each files as file (file.name)}
      <div class="row">
        <code class="u-grow">{file.name}</code>
        <button
          type="button"
          class="btn btn-sm {file.primary ? 'btn-primary' : ''}"
          onclick={() => downloadText(file.name, file.text, file.mime)}
        >
          {t("common.download")}
        </button>
        <CopyButton text={file.text} />
      </div>
    {/each}

    <div class="row">
      <code class="u-grow">cvd.html</code>
      <button
        type="button"
        class="btn btn-sm"
        onclick={() => downloadText("cvd.html", policyHtml(doc), "text/html")}
      >
        {t("common.download")}
      </button>
    </div>
  </div>
</div>
<p class="help">
  {merged ? t("generate.result_files_merged") : t("generate.result_files_help")}
</p>

<h3>{t("generate.result_publish")}</h3>

<ol class="stack u-indent">
  <li>
    <p>{t("generate.result_step1")}</p>
    <CodeBlock code={doc.canonical || "https://example.com/.well-known/cvd.json"} />
  </li>

  <li>
    <p>{t("generate.result_step2")}</p>
    <CodeBlock code={cvdPolicyLine(doc)} title="security.txt" />

    {#if merged}
      <p class="row">
        <span class="badge {merged.change === 'unchanged' ? 'badge-ok' : ''}">
          {t(`generate.merge_${merged.change}`)}
        </span>
        {#if merged.previous}
          <span class="mute small">{t("generate.merge_previous")} {merged.previous}</span>
        {/if}
      </p>
      {#if merged.signed}
        <div class="notice">{t("generate.merge_signed")}</div>
      {/if}
    {:else}
      <p class="help">{t("generate.result_step2_help")}</p>
      <details>
        <summary class="small mute">{t("generate.merge_title")}</summary>
        <div class="stack u-mt1">
          <p class="help">{t("generate.merge_help")}</p>
          <div class="field">
            <label for="existing-security-txt">{t("generate.merge_paste")}</label>
            <textarea
              id="existing-security-txt"
              class="textarea-short"
              bind:value={pasted}
              spellcheck="false"
              placeholder="Contact: mailto:security@example.com"
            ></textarea>
          </div>
          <FileDrop
            onload={(text) => (pasted = text)}
            accept="text/plain,.txt"
            hintKey="generate.securitytxt_drop_hint"
          />
        </div>
      </details>
    {/if}

    <details>
      <summary class="small mute">{t("generate.result_securitytxt_preview")}</summary>
      <CodeBlock code={securityTxtFile} title="security.txt" />
    </details>
  </li>

  <li>
    <p>{t("generate.result_step3")}</p>
    <CodeBlock code={check} />
  </li>
</ol>

<div class="notice u-mt6">{t("generate.result_no_leak")}</div>

<div class="stack u-mt6">
  <div>
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

  <div>
    <div class="row">
      <button type="button" class="btn btn-sm" onclick={() => wizard.clear()}>
        {t("generate.clear_state")}
      </button>
    </div>
    <p class="help">{t("generate.clear_state_help")}</p>
  </div>
</div>
