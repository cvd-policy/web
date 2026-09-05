<script lang="ts">
  import { validateText } from "@cvd-policy/core";
  import type { CvdPolicyDocument } from "@cvd-policy/core";
  import CodeBlock from "../components/CodeBlock.svelte";
  import ExplainCard from "../components/ExplainCard.svelte";
  import FileDrop from "../components/FileDrop.svelte";
  import { examples } from "../lib/examples.js";
  import { t } from "../lib/i18n.svelte.js";
  import { router } from "../lib/router.svelte.js";
  import { decodeDraft } from "../lib/share.js";

  let raw = $state("");
  let showRaw = $state(false);

  // A document may arrive in the fragment, which browsers never send to a server.
  $effect(() => {
    const fragment = router.fragment;
    if (!fragment) return;
    decodeDraft(fragment).then((doc) => {
      if (doc) raw = JSON.stringify(doc, null, 2);
    });
  });

  const parsed = $derived.by(() => {
    if (raw.trim() === "") return null;
    const result = validateText(raw);
    try {
      return { doc: JSON.parse(raw) as CvdPolicyDocument, valid: result.valid };
    } catch {
      return null;
    }
  });
</script>

<div class="stack">
  <div class="prose no-print">
    <h1>{t("explain.title")}</h1>
    <p class="lead">{t("explain.lead")}</p>
    <p class="notice">{t("explain.legacy_notice")}</p>
  </div>

  {#if parsed}
    <div class="stack">
      {#if !parsed.valid}
        <p class="notice">{t("validate.result_invalid")}</p>
      {/if}

      <ExplainCard doc={parsed.doc} />

      <p class="small mute">{t("explain.no_rating")}</p>

      <div class="row no-print">
        <button type="button" class="btn btn-sm" onclick={() => (showRaw = !showRaw)}>
          {showRaw ? t("explain.hide_raw") : t("explain.show_raw")}
        </button>
        <button type="button" class="btn btn-sm" onclick={() => window.print()}>
          {t("common.print")}
        </button>
      </div>

      {#if showRaw}
        <CodeBlock code={raw} title="legacy-cvd.json" />
      {/if}
    </div>
  {:else}
    <div class="stack no-print">
      <div class="field">
        <label for="explain-input">{t("explain.paste_hint")}</label>
        <textarea id="explain-input" bind:value={raw} spellcheck="false"></textarea>
      </div>
      <FileDrop onload={(text) => (raw = text)} />
      <div class="row">
        {#each examples as example (example.name)}
          <button
            type="button"
            class="btn btn-sm"
            onclick={() => (raw = JSON.stringify(example.doc, null, 2))}
          >
            {example.name}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
