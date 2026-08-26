<script lang="ts">
  import { generate, humanPolicyUrl, securityTxt, validate } from "@cvd-policy/core";
  import type { ValidationIssue } from "@cvd-policy/core";
  import { tick } from "svelte";
  import CodeBlock from "../components/CodeBlock.svelte";
  import IssueList from "../components/IssueList.svelte";
  import { t } from "../lib/i18n.svelte.js";
  import { issueTarget } from "../lib/issueTarget.js";
  import { wizard } from "../lib/wizard.svelte.js";
  import StepOrganization from "./generate/StepOrganization.svelte";
  import StepPosture from "./generate/StepPosture.svelte";
  import StepContact from "./generate/StepContact.svelte";
  import StepScope from "./generate/StepScope.svelte";
  import StepTesting from "./generate/StepTesting.svelte";
  import StepReport from "./generate/StepReport.svelte";
  import StepIntake from "./generate/StepIntake.svelte";
  import StepDisclosure from "./generate/StepDisclosure.svelte";
  import StepValidity from "./generate/StepValidity.svelte";
  import StepResult from "./generate/StepResult.svelte";

  const ALL_STEPS = [
    { key: "org", labelKey: "generate.step_org", component: StepOrganization, quick: true },
    { key: "posture", labelKey: "generate.step_posture", component: StepPosture, quick: true },
    { key: "contact", labelKey: "generate.step_contact", component: StepContact, quick: true },
    { key: "scope", labelKey: "generate.step_scope", component: StepScope, quick: false },
    { key: "testing", labelKey: "generate.step_testing", component: StepTesting, quick: false },
    { key: "report", labelKey: "generate.step_report", component: StepReport, quick: false },
    { key: "intake", labelKey: "generate.step_intake", component: StepIntake, quick: false },
    { key: "disclosure", labelKey: "generate.step_disclosure", component: StepDisclosure, quick: false },
    { key: "validity", labelKey: "generate.step_validity", component: StepValidity, quick: true },
    { key: "result", labelKey: "generate.step_result", component: StepResult, quick: true },
  ];

  let index = $state(0);

  // Both files at once made the preview column twice the height of the form
  // beside it. One at a time, chosen here.
  const PREVIEW_FILES = ["cvd.json", "security.txt"] as const;
  let shown = $state<(typeof PREVIEW_FILES)[number]>("cvd.json");

  // Fixed reference time, so a relative `expires` does not drift while typing.
  const now = new Date();

  const steps = $derived(wizard.mode === "quick" ? ALL_STEPS.filter((step) => step.quick) : ALL_STEPS);
  const step = $derived(steps[Math.min(index, steps.length - 1)]);
  const doc = $derived(generate(wizard.answers, { now }));
  const result = $derived(validate(doc));
  const json = $derived(JSON.stringify(doc, null, 2));
  // The generator hands over cvd.html alongside, so the Policy field it
  // writes points at a page the publisher actually has.
  const txt = $derived(securityTxt(doc, { policy: humanPolicyUrl(doc) }));

  // Answers live in this tab only; a reload should not lose them.
  $effect(() => {
    JSON.stringify(wizard.answers);
    wizard.securityTxt;
    wizard.save();
  });

  function go(next: number) {
    index = Math.max(0, Math.min(next, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /**
   * Opens the step an issue came from and puts the cursor in the field.
   *
   * A quick-mode wizard hides most steps, so an issue in one of them would have
   * nowhere to go: the mode is widened first rather than the click doing
   * nothing. The flash is what makes the jump legible when the field is one of
   * several on screen.
   */
  async function showIssue(issue: ValidationIssue) {
    const target = issueTarget(issue.path);
    if (!target) return;

    if (!steps.some((entry) => entry.key === target.step)) wizard.setMode("full");
    await tick();

    const position = steps.findIndex((entry) => entry.key === target.step);
    if (position === -1) return;
    index = position;
    await tick();

    const field = target.field ? document.getElementById(target.field) : null;
    if (!field) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    field.scrollIntoView({ behavior: "smooth", block: "center" });
    field.focus({ preventScroll: true });

    const box = field.closest(".field") ?? field;
    box.classList.remove("field-flash");
    // Reading offsetWidth restarts the animation when the same field is
    // clicked twice: without it the class is re-added in the same frame.
    void (box as HTMLElement).offsetWidth;
    box.classList.add("field-flash");
  }

  function setMode(mode: "quick" | "full") {
    const currentKey = step.key;
    wizard.setMode(mode);
    const nextSteps = mode === "quick" ? ALL_STEPS.filter((entry) => entry.quick) : ALL_STEPS;
    const found = nextSteps.findIndex((entry) => entry.key === currentKey);
    index = found === -1 ? 0 : found;
  }
</script>

<div class="stack">
  <div class="prose">
    <h1>{t("generate.title")}</h1>
    <p class="lead">{t("generate.lead")}</p>
  </div>

  <div class="row no-print">
    {#each [{ id: "quick", labelKey: "generate.mode_quick", helpKey: "generate.mode_quick_help" }, { id: "full", labelKey: "generate.mode_full", helpKey: "generate.mode_full_help" }] as option (option.id)}
      <button
        type="button"
        class="btn {wizard.mode === option.id ? 'btn-primary' : ''}"
        aria-pressed={wizard.mode === option.id}
        onclick={() => setMode(option.id as "quick" | "full")}
        title={t(option.helpKey)}
      >
        {t(option.labelKey)}
      </button>
    {/each}
    <span class="mute small">{t(`generate.mode_${wizard.mode}_help`)}</span>
  </div>

  <div class="split">
    <div class="stack wizard-form">
      <ol class="steps">
        {#each steps as entry, position (entry.key)}
          <li>
            <button
              type="button"
              class:done={position < index}
              aria-current={entry.key === step.key ? "step" : undefined}
              onclick={() => go(position)}
            >
              {position + 1}. {t(entry.labelKey)}
            </button>
          </li>
        {/each}
      </ol>

      <div class="card">
        {#key step.key}
          {@const StepComponent = step.component}
          {#if StepComponent === StepValidity}
            <StepValidity {doc} />
          {:else if StepComponent === StepResult}
            <StepResult {doc} {result} />
          {:else}
            {@const FormStep = StepComponent as typeof StepOrganization}
            <FormStep />
          {/if}
        {/key}

        <div class="row u-mt6">
          <button type="button" class="btn" onclick={() => go(index - 1)} disabled={index === 0}>
            {t("common.back")}
          </button>
          <button
            type="button"
            class="btn btn-primary"
            onclick={() => go(index + 1)}
            disabled={index === steps.length - 1}
          >
            {t("common.next")}
          </button>
          <span class="mute small">{index + 1} {t("common.of")} {steps.length}</span>
        </div>
      </div>

      <p class="small mute">{t("generate.unsaved_warning")}</p>
    </div>

    <div class="stack preview no-print">
      <div class="row">
        <h2 class="u-m0">{t("generate.preview")}</h2>
        <span class="badge {result.valid ? 'badge-ok' : 'badge-err'}">
          {result.valid ? t("validate.result_valid") : t("validate.result_invalid")}
        </span>
      </div>
      <p class="small mute">{t("generate.preview_note")}</p>
      <div class="row">
        {#each PREVIEW_FILES as file (file)}
          <button
            type="button"
            class="btn btn-sm {shown === file ? 'btn-primary' : ''}"
            aria-pressed={shown === file}
            onclick={() => (shown = file)}
          >
            {file}
          </button>
        {/each}
      </div>
      <CodeBlock code={shown === "cvd.json" ? json : txt} title={shown} />
      {#if result.issues.length > 0}
        <div class="card card-tight">
          <IssueList issues={result.issues} onselect={showIssue} />
        </div>
      {/if}
    </div>
  </div>
</div>
