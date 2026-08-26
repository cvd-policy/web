<script module lang="ts">
  // Ids have to be stable per instance and unique per page: the button points
  // at its own panel through aria-controls.
  let seq = 0;
</script>

<script lang="ts">
  import { t } from "../lib/i18n.svelte.js";

  /**
   * A question mark beside a field label, opening one short line saying what
   * belongs in the field. `example` is shown verbatim and is not translated:
   * these are hosts, URLs and dates, which read the same in either language.
   */
  let { k, example = "" }: { k: string; example?: string } = $props();

  const id = `hint-${(seq += 1)}`;
  let open = $state(false);
</script>

<button
  type="button"
  class="hint"
  aria-controls={id}
  aria-expanded={open}
  aria-label={t("common.hint_label")}
  onclick={() => (open = !open)}
>
  ?
</button>

<!-- Rendered even when closed, so aria-controls always resolves. -->
<p class="help hint-body" {id} hidden={!open}>
  {t(k)}
  {#if example}
    <span class="hint-example">{t("common.hint_example")} <code>{example}</code></span>
  {/if}
</p>
