<script lang="ts">
  import { explain } from "@cvd-policy/core";
  import type { CvdPolicyDocument, ExplainItem } from "@cvd-policy/core";
  import { formatDate, hasPlural, plural, t } from "../lib/i18n.svelte.js";

  let { doc }: { doc: CvdPolicyDocument } = $props();

  const sections = $derived(explain(doc));

  const isDate = (labelKey: string) =>
    labelKey === "explain.valid_until" || labelKey === "explain.updated";

  function value(item: ExplainItem): string {
    if (!item.valueIsKey) return isDate(item.labelKey) ? formatDate(item.value) : item.value;
    return item.value
      .split(",")
      .filter(Boolean)
      .map((key) =>
        hasPlural(key) ? plural(key, Number(item.params?.count ?? 0)) : t(key, item.params),
      )
      .join(", ");
  }
</script>

<article class="explain-card">
  {#each sections as section (section.key)}
    <section class="severity-{section.severity}">
      <p class="section-title">{t(`explain.section.${section.key}`)}</p>
      {#if section.key === "research"}
        <p class="posture-line">
          <span aria-hidden="true">●</span>
          <span>{t(section.items[0].value)}</span>
        </p>
        {#if section.items[1]}
          <p class="mute">{section.items[1].value}</p>
        {/if}
      {:else}
        <dl>
          {#each section.items as item, index (item.labelKey + index)}
            <dt>{t(item.labelKey)}</dt>
            <dd>{value(item)}</dd>
          {/each}
        </dl>
      {/if}
    </section>
  {/each}
</article>
