<script lang="ts">
  import Hint from "../../components/Hint.svelte";
  import { t } from "../../lib/i18n.svelte.js";
  import { wizard } from "../../lib/wizard.svelte.js";

  let { doc }: { doc: { expires: string } } = $props();
  const answers = $derived(wizard.answers);

  // The date input works in days; the document stores an RFC 3339 timestamp.
  const asDate = $derived((answers.expires ?? doc.expires).slice(0, 10));

  function setDate(value: string) {
    answers.expires = value ? `${value}T00:00:00Z` : undefined;
  }

  function setMonths(months: number) {
    answers.expires = undefined;
    answers.expiresInMonths = months;
  }
</script>

<h2 class="u-mt0">{t("generate.step_validity")}</h2>

<div class="field">
  <label for="expires">{t("generate.expires")}</label>
  <Hint k="generate.hint_expires" example="2027-06-30" />
  <input
    id="expires"
    type="date"
    class="u-w-md"
    value={asDate}
    oninput={(event) => setDate(event.currentTarget.value)}
  />
  <p class="help">{t("generate.expires_help")}</p>
</div>

<div class="row">
  {#each [6, 12, 24] as months (months)}
    <button type="button" class="btn btn-sm" onclick={() => setMonths(months)}>
      {months} {t("generate.expires_months")}
    </button>
  {/each}
</div>
