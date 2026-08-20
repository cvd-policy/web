<script lang="ts">
  import type { WizardAnswers } from "@cvd-policy/core";
  import { t } from "../../lib/i18n.svelte.js";

  let { answers }: { answers: WizardAnswers } = $props();

  // The object has to exist before anything binds to it. Creating it inside
  // $derived would be a state change during a computation, which Svelte forbids.
  // svelte-ignore state_referenced_locally
  answers.intake ??= {};
  const intake = $derived(answers.intake);
  const attachments = ["accepted", "after_contact", "not_accepted"] as const;
</script>

<h2 class="u-mt0">{t("generate.intake_question")}</h2>
<p class="notice">{t("generate.intake_note")}</p>

<div class="field">
  <label for="intake-url">{t("generate.intake_url")}</label>
  <input id="intake-url" type="url" placeholder="https://" bind:value={intake.url} />
  <p class="help">{t("generate.intake_url_help")}</p>
</div>

{#if intake.url}
  <div class="field">
    <label for="intake-schema">{t("generate.intake_schema")}</label>
    <input id="intake-schema" type="url" placeholder="https://" bind:value={intake.schema} />
  </div>

  <div class="field">
    <label for="intake-profile">{t("generate.intake_profile")}</label>
    <select id="intake-profile" bind:value={intake.profile} class="u-w-lg">
      <option value={undefined}>—</option>
      <option value="report-0.1">report-0.1</option>
    </select>
  </div>

  <div class="field">
    <label class="row u-normal">
      <input type="checkbox" bind:checked={intake.anonymous} />
      {t("generate.intake_anonymous")}
    </label>
  </div>

  <div class="field">
    <label for="intake-attachments">{t("generate.intake_attachments")}</label>
    <select id="intake-attachments" bind:value={intake.attachments} class="u-w-lg">
      <option value={undefined}>—</option>
      {#each attachments as option (option)}
        <option value={option}>{t(`generate.intake_attachments_${option}`)}</option>
      {/each}
    </select>
  </div>

  <div class="field">
    <label for="intake-max">{t("generate.intake_max_bytes")}</label>
    <input id="intake-max" type="number" min="1" class="u-w-md" bind:value={intake.maxBytes} />
  </div>
{/if}
