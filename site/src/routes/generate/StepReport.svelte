<script lang="ts">
  import type { ReportField } from "@cvd-policy/core";
  import { t } from "../../lib/i18n.svelte.js";
  import { wizard } from "../../lib/wizard.svelte.js";

  const answers = $derived(wizard.answers);

  // The object has to exist before anything binds to it. Creating it inside
  // $derived would be a state change during a computation, which Svelte forbids.
  // svelte-ignore state_referenced_locally
  answers.reportRequirements ??= { required_fields: [] };
  const requirements = $derived(answers.reportRequirements);

  const fields: ReportField[] = [
    "affected_asset",
    "description",
    "reproduction_steps",
    "impact",
    "discovery_date",
    "reporter_contact",
    "proposed_fix",
  ];

  const formats = ["text", "markdown", "pdf", "csaf", "cvrf", "vex"] as const;
  const proofs = ["required", "optional", "prohibited"] as const;

  function toggleField(field: ReportField, on: boolean) {
    const current = requirements.required_fields ?? [];
    requirements.required_fields = on
      ? [...current, field]
      : current.filter((entry) => entry !== field);
  }

  function toggleFormat(format: (typeof formats)[number], on: boolean) {
    const current = requirements.formats ?? [];
    requirements.formats = on ? [...current, format] : current.filter((entry) => entry !== format);
  }
</script>

<h2 class="u-mt0">{t("generate.step_report")}</h2>

<fieldset>
  <legend>{t("generate.report_fields")}</legend>
  {#each fields as field (field)}
    <label class="row u-normal">
      <input
        type="checkbox"
        checked={(requirements.required_fields ?? []).includes(field)}
        onchange={(event) => toggleField(field, event.currentTarget.checked)}
      />
      {t(`field.${field}`)}
    </label>
  {/each}
</fieldset>

<div class="field">
  <label for="proof">{t("generate.report_proof")}</label>
  <select id="proof" bind:value={requirements.proof_of_exploitation} class="u-w-lg">
    <option value={undefined}>—</option>
    {#each proofs as proof (proof)}
      <option value={proof}>{t(`proof.${proof}`)}</option>
    {/each}
  </select>
</div>

<fieldset>
  <legend>{t("generate.report_formats")}</legend>
  {#each formats as format (format)}
    <label class="row u-normal">
      <input
        type="checkbox"
        checked={(requirements.formats ?? []).includes(format)}
        onchange={(event) => toggleFormat(format, event.currentTarget.checked)}
      />
      <code>{format}</code>
    </label>
  {/each}
</fieldset>

<div class="field">
  <label for="max-mb">{t("generate.report_max_mb")}</label>
  <input
    id="max-mb"
    type="number"
    min="1"
    class="u-w-sm"
    bind:value={requirements.max_attachment_mb}
  />
</div>

<div class="field">
  <label for="template">{t("generate.report_template")}</label>
  <input id="template" type="url" placeholder="https://" bind:value={requirements.template} />
</div>
