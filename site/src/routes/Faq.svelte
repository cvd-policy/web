<script lang="ts">
  import { t } from "../lib/i18n.svelte.js";

  // Deliberate order: the uncomfortable questions come first.
  const entries = [
    "prohibit",
    "legal",
    "cra",
    "who",
    "securitytxt",
    "others",
    "official",
    "without",
    "data",
  ];
</script>

<div class="stack prose">
  <h1>{t("faq.title")}</h1>

  {#each entries as entry (entry)}
    <section>
      <h2>{t(`faq.q_${entry}`)}</h2>
      <p>{t(`faq.a_${entry}`)}</p>
    </section>
  {/each}
</div>
