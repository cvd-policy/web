<script lang="ts">
  import type { Precedence, ScopeState } from "@cvd-policy/core";
  import Hint from "../../components/Hint.svelte";
  import { t } from "../../lib/i18n.svelte.js";
  import { wizard } from "../../lib/wizard.svelte.js";

  const answers = $derived(wizard.answers);

  // The object has to exist before anything binds to it. Creating it inside
  // $derived would be a state change during a computation, which Svelte forbids.
  // svelte-ignore state_referenced_locally
  answers.scope ??= { precedence: "out_overrides_in", web: [], products: [] };
  const scope = $derived(answers.scope);

  const states: ScopeState[] = ["in", "out"];
  const reasons = ["third_party", "legacy", "not_operated", "other"] as const;
  const precedences: Precedence[] = ["out_overrides_in", "explicit_order"];

  /**
   * A reason explains an exclusion, so putting an entry back in scope drops it.
   * Left behind it would keep the disabled select showing a stale answer the
   * reader could no longer change, and would still reach the document.
   */
  function setState(entry: { state: ScopeState; reason?: string }, next: ScopeState) {
    entry.state = next;
    if (next === "in") entry.reason = undefined;
  }
</script>

<h2 class="u-mt0">{t("generate.step_scope")}</h2>

<fieldset>
  <legend>{t("generate.scope_web")}</legend>

  {#each scope.web ?? [] as entry, index (index)}
    <div class="entry-row entry-row-wide">
      <div class="field">
        <label for={`pattern-${index}`}>{t("generate.scope_pattern")}</label>
        <Hint k="generate.hint_scope_pattern" example="*.example.com" />
        <input id={`pattern-${index}`} type="text" bind:value={entry.pattern} placeholder="*.example.com" />
      </div>
      <div class="field">
        <label for={`state-${index}`}>{t("generate.scope_state")}</label>
        <select
          id={`state-${index}`}
          value={entry.state}
          onchange={(event) => setState(entry, event.currentTarget.value as ScopeState)}
        >
          {#each states as state (state)}
            <option value={state}>{t(`scope.state.${state}`)}</option>
          {/each}
        </select>
      </div>
      <div class="field">
        <label for={`reason-${index}`}>{t("generate.scope_reason")}</label>
        <Hint k="generate.hint_scope_reason" />
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
    <div class="entry-row entry-row-wide">
      <div class="field">
        <label for={`product-name-${index}`}>{t("generate.product_name")}</label>
        <Hint k="generate.hint_product_name" example="Example Router X100" />
        <input id={`product-name-${index}`} type="text" bind:value={product.name} />
      </div>
      <div class="field">
        <label for={`product-versions-${index}`}>{t("generate.product_versions")}</label>
        <Hint k="generate.hint_product_versions" example=">=2.0.0 <3.0.0" />
        <input id={`product-versions-${index}`} type="text" bind:value={product.versions} placeholder=">=2.0.0" />
      </div>
      <div class="field">
        <label for={`product-until-${index}`}>{t("generate.product_supported")}</label>
        <Hint k="generate.hint_product_supported" example="2027-12-31" />
        <input id={`product-until-${index}`} type="date" bind:value={product.supported_until} />
      </div>
      <button type="button" class="btn btn-sm" onclick={() => scope.products?.splice(index, 1)}>
        {t("common.remove")}
      </button>
    </div>
    <div class="entry-row">
      <div class="field">
        <label for={`product-purl-${index}`}>{t("generate.product_purl")}</label>
        <Hint k="generate.hint_product_purl" example="pkg:npm/example@1.2.3" />
        <input id={`product-purl-${index}`} type="text" bind:value={product.purl} placeholder="pkg:generic/…" />
      </div>
      <div class="field">
        <label for={`product-sbom-${index}`}>{t("generate.product_sbom")}</label>
        <Hint k="generate.hint_product_sbom" example="https://example.com/sbom/x100.json" />
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
