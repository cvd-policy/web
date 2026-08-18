<script lang="ts">
  import { i18n, LANGS, t } from "../lib/i18n.svelte.js";

  const labels: Record<string, string> = { en: "EN", de: "DE" };
</script>

<div class="lang-toggle" role="group" aria-label={t("lang.switch")}>
  {#each LANGS as lang (lang)}
    <button
      type="button"
      aria-pressed={i18n.lang === lang}
      onclick={() => i18n.set(lang)}
      lang={lang}
    >
      {labels[lang] ?? lang.toUpperCase()}
    </button>
  {/each}
</div>
