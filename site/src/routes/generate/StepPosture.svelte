<script lang="ts">
  import type { Posture } from "@cvd-policy/core";
  import { t } from "../../lib/i18n.svelte.js";
  import { wizard } from "../../lib/wizard.svelte.js";

  const answers = $derived(wizard.answers);

  // report_only first: the path most organisations can honestly take.
  const postures: Posture[] = ["report_only", "prohibited", "limited", "open"];
</script>

<h2 class="u-mt0">{t("generate.posture_question")}</h2>

{#each postures as posture (posture)}
  <label class="choice" class:selected={answers.posture === posture}>
    <input type="radio" value={posture} bind:group={answers.posture} name="posture" />
    <span>
      <span class="choice-title">
        <code>{posture}</code> — {t(`posture.${posture}.headline`)}
      </span>
      {#if posture === "report_only"}
        <span class="badge badge-ok u-ml2">
          {t("posture.recommended")}
        </span>
      {/if}
      <span class="choice-body u-block u-mt1">
        {t(`posture.${posture}.body`)}
      </span>
    </span>
  </label>
{/each}

<div class="field u-mt6">
  <label for="statement">{t("generate.statement")} <span class="mute">({t("common.optional")})</span></label>
  <textarea
    id="statement"
    class="textarea-prose"
    maxlength="1000"
    bind:value={answers.statement}
  ></textarea>
  <p class="help">{t("generate.statement_help")}</p>
</div>
