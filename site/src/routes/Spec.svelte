<script lang="ts">
  import { i18n, t } from "../lib/i18n.svelte.js";

  // The specification text and the markdown renderer are loaded on demand, so
  // they do not weigh on every other page.
  const rendered = $derived.by(async () => {
    const [{ marked }, source] = await Promise.all([
      import("marked"),
      i18n.lang === "de"
        ? import("../../vendor/spec/v1/SPEC.de.md?raw")
        : import("../../vendor/spec/v1/SPEC.md?raw"),
    ]);
    return marked.parse(source.default, { async: false });
  });
</script>

<div class="stack">
  <div class="prose">
    <h1>{t("spec.title")}</h1>
    <p class="lead">{t("spec.lead")}</p>
    <p class="notice">{t("spec.v1_notice_intro")} <a href="https://datatracker.ietf.org/doc/html/draft-behring-cvd-policy-00">draft-behring-cvd-policy-00</a>. {t("spec.v1_notice_change")}</p>
    {#if i18n.lang === "de"}<p class="notice">{t("spec.translation_notice")}</p>{/if}
    <p class="row small">
      <a href="/schema/cvd-policy-1.schema.json">{t("spec.schema")} V1</a>
      <a href="/spec/v1.md">English Markdown</a>
      <a href="/spec/v1.de.md">Deutsch (informativ)</a>
    </p>
    <p class="small mute">{t("spec.package_versions_note")}</p>

    <h2>{t("spec.legacy_title")}</h2>
    <p>{t("spec.legacy_body")}</p>
    <p class="row small">
      <a href="/spec/0.2.md">0.2 English</a>
      <a href="/spec/0.2.de.md">0.2 Deutsch</a>
      <a href="/schema/0.2/cvd-policy.schema.json">{t("spec.schema")} 0.2</a>
      <a href="/schema/0.1/cvd-policy.schema.json">{t("spec.schema")} 0.1</a>
      <a href="/schema/profiles/report-0.1.schema.json">report-0.1</a>
    </p>
  </div>

  {#await rendered then html}
    <!--
      Unescaped on purpose. The source is the specification vendored into this
      repository and committed, never anything a visitor supplies, and marked
      does not sanitise. Two things keep that safe and both have to hold: the
      text stays trusted, and the CSP forbids inline scripts. If SPEC.md ever
      comes from somewhere less trusted, sanitise here first.
    -->
    <article class="prose spec-body">
      {@html html}
    </article>
  {/await}
</div>

<style lang="scss">
  .spec-body :global(pre) {
    background: var(--c-surface-mute);
    border: 1px solid var(--c-border);
    border-radius: var(--r-md);
    padding: var(--sp-4);
    overflow-x: auto;
    font-size: 0.85rem;
  }

  .spec-body :global(table) {
    display: block;
    overflow-x: auto;
  }

  .spec-body :global(hr) {
    border: 0;
    border-top: 1px solid var(--c-border);
    margin-block: var(--sp-8);
  }
</style>
