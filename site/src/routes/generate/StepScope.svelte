<script lang="ts">
  import type { Precedence, ScopeState, WizardAnswers } from "@cvd-policy/core";
  import { t } from "../../lib/i18n.svelte.js";

  let { answers }: { answers: WizardAnswers } = $props();

  // The object has to exist before anything binds to it. Creating it inside
  // $derived would be a state change during a computation, which Svelte forbids.
  // svelte-ignore state_referenced_locally
  answers.scope ??= { precedence: "out_overrides_in", web: [], products: [] };
  const scope = $derived(answers.scope);

  const states: ScopeState[] = ["in", "out"];
  const reasons = ["third_party", "legacy", "not_operated", "other"] as const;
  const precedences: Precedence[] = ["out_overrides_in", "explicit_order"];
</script>

<h2 class="u-mt0">{t("generate.step_scope")}</h2>

<fieldset>
  <legend>{t("generate.scope_web")}</legend>

  {#each scope.web ?? [] as entry, index (index)}
    <div class="entry-row">
      <div class="field">
        <label for={`pattern-${index}`}>{t("generate.scope_pattern")}</label>
        <input id={`pattern-${index}`} type="text" bind:value={entry.pattern} placeholder="*.example.com" />
      </div>
      <div class="field">
        <label for={`state-${index}`}>{t("generate.scope_state")}</label>
        <select id={`state-${index}`} bind:value={entry.state}>
          {#each states as state (state)}
            <option value={state}>{t(`scope.state.${state}`)}</option>
          {/each}
        </select>
      </div>
      <div class="field">
        <label for={`reason-${index}`}>{t("generate.scope_reason")}</label>
        <select id={`reason-${index}`} bind:value={entry.reason} disabled={entry.state === "in"}>
          <option value={undefined}>—</option>
          {#each reasons as reason (reason)}
            <option value={reason}>{t(`scope.reason.${reason}`)}</option>
          {/each}
        </select>
      </div>
      <button
        type="button"
        class="btn btn-sm"
        onclick={() => scope.web?.splice(index, 1)}
        aria-label={t("common.remove")}
      >
        {t("common.remove")}
      </button>
    </div>
  {/each}

  <button
    type="button"
    class="btn btn-sm"
    onclick={() => (scope.web = [...(scope.web ?? []), { pattern: "", state: "in" }])}
  >
    {t("common.add")}
  </button>
  <p class="help">{t("generate.scope_pattern_help")}</p>
</fieldset>

<fieldset>
  <legend>{t("generate.scope_products")}</legend>

  {#each scope.products ?? [] as product, index (index)}
    <div class="entry-row">
      <div class="field">
        <label for={`product-name-${index}`}>{t("generate.product_name")}</label>
        <input id={`product-name-${index}`} type="text" bind:value={product.name} />
      </div>
      <div class="field">
        <label for={`product-versions-${index}`}>{t("generate.product_versions")}</label>
        <input id={`product-versions-${index}`} type="text" bind:value={product.versions} placeholder=">=2.0.0" />
      </div>
      <div class="field">
        <label for={`product-until-${index}`}>{t("generate.product_supported")}</label>
        <input id={`product-until-${index}`} type="date" bind:value={product.supported_until} />
      </div>
      <button type="button" class="btn btn-sm" onclick={() => scope.products?.splice(index, 1)}>
        {t("common.remove")}
      </button>
    </div>
    <div class="entry-row">
      <div class="field">
        <label for={`product-purl-${index}`}>{t("generate.product_purl")}</label>
        <input id={`product-purl-${index}`} type="text" bind:value={product.purl} placeholder="pkg:generic/…" />
      </div>
      <div class="field">
        <label for={`product-sbom-${index}`}>{t("generate.product_sbom")}</label>
        <input id={`product-sbom-${index}`} type="url" bind:value={product.sbom} placeholder="https://" />
      </div>
    </div>
  {/each}

  <button
    type="button"
    class="btn btn-sm"
    onclick={() => (scope.products = [...(scope.products ?? []), { name: "" }])}
  >
    {t("common.add")}
  </button>
</fieldset>

<div class="field">
  <label for="precedence">{t("generate.scope_precedence")}</label>
  <select id="precedence" bind:value={scope.precedence}>
    {#each precedences as precedence (precedence)}
      <option value={precedence}>{t(`precedence.${precedence}`)}</option>
    {/each}
  </select>
</div>
