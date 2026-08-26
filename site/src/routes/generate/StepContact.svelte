<script lang="ts">
  import type { ContactChannel } from "@cvd-policy/core";
  import Hint from "../../components/Hint.svelte";
  import LanguageSelect from "../../components/LanguageSelect.svelte";
  import { t } from "../../lib/i18n.svelte.js";
  import { wizard } from "../../lib/wizard.svelte.js";

  const answers = $derived(wizard.answers);

  // All four rank equally. Nothing here is pre-filled or recommended.
  const types: ContactChannel["type"][] = ["email", "form", "service", "postal"];

  // Service carries its own help line already, so it gets no hint.
  const channelExamples: Partial<Record<ContactChannel["type"], string>> = {
    email: "security@example.com",
    form: "https://example.com/report",
    postal: "Example GmbH, Musterstraße 1, 23966 Wismar",
  };

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

  // The array has to exist before the picker binds to it.
  // svelte-ignore state_referenced_locally
  answers.contact.languages ??= [];
</script>

<h2 class="u-mt0">{t("generate.contact_question")}</h2>
<p class="notice">{t("generate.contact_equal_note")}</p>

{#each types as type (type)}
  <div class="field">
    <label for={`channel-${type}`}>{t(`generate.channel_${type}`)}</label>
    {#if channelExamples[type]}
      <Hint k={`generate.hint_channel_${type}`} example={channelExamples[type]} />
    {/if}
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
    <Hint k="generate.hint_languages" example="en, de" />
    <LanguageSelect id="languages" bind:selected={answers.contact.languages} />
  </div>

  <div class="field">
    <label for="pgp-url">{t("generate.pgp_url")}</label>
    <Hint
      k="generate.hint_pgp_url"
      example="https://example.com/.well-known/pgp-key.txt"
    />
    <input id="pgp-url" type="url" bind:value={answers.contact.pgpUrl} placeholder="https://" />
  </div>

  <div class="field">
    <label for="pgp-fp">{t("generate.pgp_fingerprint")}</label>
    <Hint
      k="generate.hint_pgp_fingerprint"
      example="A1B2 C3D4 E5F6 0718 2938 4A5B 6C7D 8E9F A0B1 C2D3"
    />
    <input id="pgp-fp" type="text" bind:value={answers.contact.pgpFingerprint} />
  </div>

  <div class="field">
    <label for="ack-hours">{t("generate.ack_hours")}</label>
    <Hint k="generate.hint_ack_hours" example="72" />
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
    <Hint k="generate.hint_update_days" example="14" />
    <input
      id="update-days"
      type="number"
      min="1"
      class="u-w-sm"
      bind:value={answers.contact.updateIntervalDays}
    />
  </div>
</fieldset>
