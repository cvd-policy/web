<script lang="ts">
  import { answersFromSecurityTxt, isSignedSecurityTxt } from "@cvd-policy/core";
  import FileDrop from "./FileDrop.svelte";
  import { t } from "../lib/i18n.svelte.js";
  import { wizard } from "../lib/wizard.svelte.js";

  /** Which fields the last import used. Empty after a reload, which is fine. */
  let applied = $state<string[]>([]);

  // Read from the file itself rather than remembered, so it survives a reload.
  const signed = $derived(isSignedSecurityTxt(wizard.securityTxt));

  function take(raw: string) {
    if (raw.trim() === "") return;
    const result = answersFromSecurityTxt(raw, wizard.answers);
    wizard.replace(result.answers);
    wizard.setSecurityTxt(raw);
    wizard.save();
    applied = result.applied;
  }

  function forget() {
    wizard.setSecurityTxt("");
    wizard.save();
    applied = [];
  }
</script>

<div class="card card-tight">
  <p class="section-title small mute">{t("generate.import_title")}</p>

  {#if wizard.securityTxt}
    <p class="row">
      <span class="badge badge-ok">{t("generate.import_done")}</span>
      {#if applied.length > 0}
        <span class="mute small">{applied.join(", ")}</span>
      {/if}
    </p>
    <p class="small">{t("generate.import_done_help")}</p>
    {#if signed}
      <div class="notice">{t("generate.import_signed")}</div>
    {/if}
    <div class="row">
      <button type="button" class="btn btn-sm" onclick={forget}>
        {t("generate.import_forget")}
      </button>
    </div>
  {:else}
    <p class="small">{t("generate.import_help")}</p>
    <FileDrop
      onload={take}
      accept="text/plain,.txt"
      hintKey="generate.securitytxt_drop_hint"
    />
  {/if}
</div>
