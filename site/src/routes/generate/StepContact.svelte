<script lang="ts">
  import type { ContactChannel, WizardAnswers } from "@cvd-policy/core";
  import { t } from "../../lib/i18n.svelte.js";

  let { answers }: { answers: WizardAnswers } = $props();

  // All four rank equally. Nothing here is pre-filled or recommended.
  const types: ContactChannel["type"][] = ["email", "form", "service", "postal"];

  function valueOf(type: ContactChannel["type"]): string {
    return answers.contact.channels.find((channel) => channel.type === type)?.value ?? "";
  }

  function setValue(type: ContactChannel["type"], value: string) {
    const existing = answers.contact.channels.find((channel) => channel.type === type);
    if (existing) {
      existing.value = value;
      return;
    }
    answers.contact.channels.push({ type, value });
  }

  function setPreferred(type: ContactChannel["type"]) {
    for (const channel of answers.contact.channels) channel.preferred = channel.type === type;
  }

  const filled = $derived(answers.contact.channels.filter((channel) => channel.value.trim() !== ""));

  // svelte-ignore state_referenced_locally
  let languages = $state((answers.contact.languages ?? []).join(", "));
  function applyLanguages() {
    answers.contact.languages = languages
      .split(/[,\s]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
</script>

<h2 class="u-mt0">{t("generate.contact_question")}</h2>
<p class="notice">{t("generate.contact_equal_note")}</p>

{#each types as type (type)}
  <div class="field">
    <label for={`channel-${type}`}>{t(`generate.channel_${type}`)}</label>
    <div class="row">
      <input
        id={`channel-${type}`}
        type="text"
        class="u-grow"
        value={valueOf(type)}
        oninput={(event) => setValue(type, event.currentTarget.value)}
      />
      {#if filled.length > 1}
        <label class="small mute u-normal">
          <input
            type="radio"
            name="preferred"
            checked={answers.contact.channels.find((channel) => channel.type === type)?.preferred}
            onchange={() => setPreferred(type)}
          />
          {t("generate.channel_preferred")}
        </label>
      {/if}
    </div>
    {#if type === "service"}
      <p class="help">{t("generate.channel_service_help")}</p>
    {/if}
  </div>
{/each}

<fieldset>
  <legend>{t("common.optional")}</legend>

  <div class="field">
    <label for="languages">{t("generate.languages")}</label>
    <input id="languages" type="text" bind:value={languages} oninput={applyLanguages} placeholder="en, de" />
  </div>

  <div class="field">
    <label for="pgp-url">{t("generate.pgp_url")}</label>
    <input id="pgp-url" type="url" bind:value={answers.contact.pgpUrl} placeholder="https://" />
  </div>

  <div class="field">
    <label for="pgp-fp">{t("generate.pgp_fingerprint")}</label>
    <input id="pgp-fp" type="text" bind:value={answers.contact.pgpFingerprint} />
  </div>

  <div class="field">
    <label for="ack-hours">{t("generate.ack_hours")}</label>
    <input
      id="ack-hours"
      type="number"
      min="1"
      class="u-w-sm"
      bind:value={answers.contact.acknowledgeWithinHours}
    />
  </div>

  <div class="field">
    <label for="update-days">{t("generate.update_days")}</label>
    <input
      id="update-days"
      type="number"
      min="1"
      class="u-w-sm"
      bind:value={answers.contact.updateIntervalDays}
    />
  </div>
</fieldset>
