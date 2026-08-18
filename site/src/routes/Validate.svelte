<script lang="ts">
  import { answersFrom, validateText } from "@cvd-policy/core";
  import type { CvdPolicyDocument } from "@cvd-policy/core";
  import CodeBlock from "../components/CodeBlock.svelte";
  import FileDrop from "../components/FileDrop.svelte";
  import IssueList from "../components/IssueList.svelte";
  import { examples } from "../lib/examples.js";
  import { plural, t } from "../lib/i18n.svelte.js";
  import { router } from "../lib/router.svelte.js";
  import { wizard } from "../lib/wizard.svelte.js";
  import { encodeDraft } from "../lib/share.js";

  let raw = $state("");
  let filename = $state("");

  const result = $derived(raw.trim() === "" ? null : validateText(raw));
  const counts = $derived({
    errors: result?.issues.filter((issue) => issue.level === "error").length ?? 0,
    warnings: result?.issues.filter((issue) => issue.level === "warning").length ?? 0,
    infos: result?.issues.filter((issue) => issue.level === "info").length ?? 0,
  });

  const checkCommand =
    "curl -s https://example.com/.well-known/cvd.json | npx @cvd-policy/cli validate -";

  function load(text: string, name = "") {
    raw = text;
    filename = name;
  }

  function openInGenerator() {
    try {
      wizard.replace(answersFrom(JSON.parse(raw) as Partial<CvdPolicyDocument>));
      wizard.save();
      router.navigate("/generate");
    } catch {
      // Unparsable input cannot be carried over; the error list already says so.
    }
  }

  async function openInExplain() {
    router.navigate("/explain", { fragment: await encodeDraft(JSON.parse(raw)) });
  }
</script>

<div class="stack">
  <div class="prose">
    <h1>{t("validate.title")}</h1>
    <p class="lead">{t("validate.lead")}</p>
  </div>

  <div class="split">
    <div class="stack">
      <div class="field">
        <label for="policy-input">{t("validate.paste")}</label>
        <textarea id="policy-input" bind:value={raw} spellcheck="false" placeholder={"{"}></textarea>
      </div>

      <FileDrop onload={load} />

      <div class="card card-tight">
        <p class="section-title small mute">{t("validate.examples")}</p>
        <div class="row">
          {#each examples as example (example.name)}
            <button
              type="button"
              class="btn btn-sm"
              onclick={() => load(JSON.stringify(example.doc, null, 2), example.name)}
            >
              {example.name}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <div class="stack">
      {#if result}
        <div class="card">
          <p class="row">
            <span class="badge {result.valid ? 'badge-ok' : 'badge-err'}">
              {result.valid ? t("validate.result_valid") : t("validate.result_invalid")}
            </span>
            <span class="mute small">
              {plural("validate.count_errors", counts.errors)} ·
              {plural("validate.count_warnings", counts.warnings)} ·
              {plural("validate.count_notes", counts.infos)}
            </span>
          </p>
          {#if filename}<p class="small mute">{filename}</p>{/if}

          {#if result.issues.length === 0}
            <p>{t("validate.no_issues")}</p>
          {:else}
            <IssueList issues={result.issues} onfix={openInGenerator} />
          {/if}

          <div class="row">
            <button type="button" class="btn" onclick={openInGenerator}>
              {t("validate.fix_in_generator")}
            </button>
            {#if result.valid}
              <button type="button" class="btn" onclick={openInExplain}>
                {t("validate.explain_this")}
              </button>
            {/if}
          </div>
        </div>
      {/if}

      <div class="card">
        <h2 class="u-mt0">{t("validate.url_title")}</h2>
        <p class="small">{t("validate.url_body")}</p>
        <CodeBlock code={checkCommand} />
      </div>
    </div>
  </div>
</div>
