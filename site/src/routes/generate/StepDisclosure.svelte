<script lang="ts">
  import type { Disclosure, WizardAnswers } from "@cvd-policy/core";
  import { t } from "../../lib/i18n.svelte.js";

  let { answers }: { answers: WizardAnswers } = $props();

  // The object has to exist before anything binds to it. Creating it inside
  // $derived would be a state change during a computation, which Svelte forbids.
  // svelte-ignore state_referenced_locally
  answers.disclosure ??= {};
  const disclosure = $derived(answers.disclosure);

  const models: Disclosure["model"][] = [
    "coordinated",
    "full_after_deadline",
    "vendor_only",
    "no_disclosure",
  ];
  const credits = ["offered", "on_request", "none"] as const;
</script>

<h2 class="u-mt0">{t("generate.step_disclosure")}</h2>

<div class="field">
  <label for="model">{t("generate.disclosure_model")}</label>
  <select id="model" bind:value={disclosure.model} class="u-w-xl">
    <option value={undefined}>—</option>
    {#each models as model (model)}
      <option value={model}>{t(`disclosure.${model}`)}</option>
    {/each}
  </select>
</div>

<div class="field">
  <label for="deadline">{t("generate.disclosure_deadline")}</label>
  <input
    id="deadline"
    type="number"
    min="1"
    class="u-w-sm"
    bind:value={disclosure.deadline_days}
  />
</div>

<div class="field">
  <label for="advisory">{t("generate.disclosure_advisory")}</label>
  <input id="advisory" type="url" placeholder="https://" bind:value={disclosure.advisory_url} />
</div>

<div class="field">
  <label for="credit">{t("generate.disclosure_credit")}</label>
  <select id="credit" bind:value={disclosure.credit} class="u-w-lg">
    <option value={undefined}>—</option>
    {#each credits as credit (credit)}
      <option value={credit}>{t(`generate.credit_${credit}`)}</option>
    {/each}
  </select>
</div>
