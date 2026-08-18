<script lang="ts">
  import { KNOWN_ACTIVITIES } from "@cvd-policy/core";
  import type { TestingState, WizardAnswers } from "@cvd-policy/core";
  import { t } from "../../lib/i18n.svelte.js";

  let { answers }: { answers: WizardAnswers } = $props();

  const invitesTesting = $derived(answers.posture === "open" || answers.posture === "limited");
  const testing = $derived((answers.testing ??= { default: "prohibited", rules: [] }));
  const states: TestingState[] = ["allowed", "prohibited"];

  function addRule() {
    testing.rules = [...(testing.rules ?? []), { activity: "manual_testing", state: "allowed" }];
  }

  function targetsOf(index: number): string {
    return (testing.rules?.[index]?.conditions?.targets ?? []).join("\n");
  }

  function setTargets(index: number, value: string) {
    const rule = testing.rules?.[index];
    if (!rule) return;
    rule.conditions ??= {};
    rule.conditions.targets = value.split("\n").map((line) => line.trim()).filter(Boolean);
  }
</script>

<h2 class="u-mt0">{t("generate.step_testing")}</h2>

{#if !invitesTesting}
  <p class="notice">{t("generate.testing_skip_note")}</p>
{:else}
  <div class="field">
    <label for="testing-default">{t("generate.testing_default")}</label>
    <select id="testing-default" bind:value={testing.default} class="u-w-lg">
      {#each states as state (state)}
        <option value={state}>{t(`testing.default.${state}`)}</option>
      {/each}
    </select>
  </div>

  {#each testing.rules ?? [] as rule, index (index)}
    <fieldset>
      <legend>{index + 1}. {t("generate.testing_activity")}</legend>

      <div class="entry-row">
        <div class="field">
          <label for={`activity-${index}`}>{t("generate.testing_activity")}</label>
          <select id={`activity-${index}`} bind:value={rule.activity}>
            {#each KNOWN_ACTIVITIES as activity (activity)}
              <option value={activity}>{t(`activity.${activity}`)}</option>
            {/each}
          </select>
        </div>
        <div class="field">
          <label for={`rule-state-${index}`}>{t("generate.testing_state")}</label>
          <select id={`rule-state-${index}`} bind:value={rule.state}>
            {#each states as state (state)}
              <option value={state}>{t(`testing.state.${state}`)}</option>
            {/each}
          </select>
        </div>
        <button type="button" class="btn btn-sm" onclick={() => testing.rules?.splice(index, 1)}>
          {t("common.remove")}
        </button>
      </div>

      {#if rule.state === "allowed"}
        <div class="field">
          <label for={`rps-${index}`}>{t("generate.testing_rps")}</label>
          <input
            id={`rps-${index}`}
            type="number"
            min="1"
            class="u-w-sm"
            value={rule.conditions?.max_requests_per_second ?? ""}
            oninput={(event) => {
              rule.conditions ??= {};
              rule.conditions.max_requests_per_second = event.currentTarget.value
                ? Number(event.currentTarget.value)
                : undefined;
            }}
          />
        </div>

        <div class="field">
          <label for={`ua-${index}`}>{t("generate.testing_ua")}</label>
          <input
            id={`ua-${index}`}
            type="text"
            value={rule.conditions?.user_agent_contains ?? ""}
            oninput={(event) => {
              rule.conditions ??= {};
              rule.conditions.user_agent_contains = event.currentTarget.value || undefined;
            }}
          />
        </div>

        <div class="field">
          <label for={`targets-${index}`}>{t("generate.testing_targets")}</label>
          <textarea
            id={`targets-${index}`}
            class="textarea-short"
            value={targetsOf(index)}
            oninput={(event) => setTargets(index, event.currentTarget.value)}
          ></textarea>
        </div>

        <div class="field">
          <label for={`account-${index}`}>{t("generate.testing_account")}</label>
          <input
            id={`account-${index}`}
            type="url"
            placeholder="https://"
            value={rule.conditions?.account_request ?? ""}
            oninput={(event) => {
              rule.conditions ??= {};
              rule.conditions.account_request = event.currentTarget.value || undefined;
            }}
          />
        </div>
      {/if}

      <div class="field">
        <label for={`note-${index}`}>{t("generate.testing_note")}</label>
        <input id={`note-${index}`} type="text" bind:value={rule.note} />
      </div>
    </fieldset>
  {/each}

  <button type="button" class="btn btn-sm" onclick={addRule}>{t("common.add")}</button>
{/if}
