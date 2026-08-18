<script lang="ts">
  import { canonicalFor } from "@cvd-policy/core";
  import type { WizardAnswers } from "@cvd-policy/core";
  import { t } from "../../lib/i18n.svelte.js";

  let { answers }: { answers: WizardAnswers } = $props();

  // svelte-ignore state_referenced_locally
  let domain = $state(
    answers.canonical.replace(/^https:\/\//, "").replace(/\/\.well-known\/cvd\.json$/, ""),
  );

  // The domain drives both the file location and a first scope entry.
  function applyDomain() {
    answers.canonical = canonicalFor(domain);
    const host = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!host) return;
    answers.scope ??= { precedence: "out_overrides_in", web: [], products: [] };
    answers.scope.web ??= [];
    if (answers.scope.web.length === 0) answers.scope.web.push({ pattern: host, state: "in" });
  }

  const roles = ["manufacturer", "operator", "both", "other"] as const;
</script>

<h2 class="u-mt0">{t("generate.step_org")}</h2>

<div class="field">
  <label for="org-name">{t("generate.org_name")}</label>
  <input id="org-name" type="text" bind:value={answers.organization.name} required />
</div>

<div class="field">
  <label for="org-domain">{t("generate.domain")}</label>
  <input
    id="org-domain"
    type="text"
    bind:value={domain}
    oninput={applyDomain}
    placeholder="example.com"
  />
  <p class="help">{t("generate.domain_help")}</p>
</div>

<div class="field">
  <label for="org-canonical">{t("generate.canonical")}</label>
  <input id="org-canonical" type="url" bind:value={answers.canonical} />
</div>

<div class="field">
  <label for="org-country">{t("generate.org_country")} <span class="mute">({t("common.optional")})</span></label>
  <input
    id="org-country"
    type="text"
    maxlength="2"
    class="u-w-xs"
    value={answers.organization.country ?? ""}
    oninput={(event) =>
      (answers.organization.country = event.currentTarget.value.toUpperCase() || undefined)}
  />
</div>

<div class="field">
  <label for="org-role">{t("generate.org_role")} <span class="mute">({t("common.optional")})</span></label>
  <select id="org-role" bind:value={answers.organization.role}>
    <option value={undefined}>—</option>
    {#each roles as role (role)}
      <option value={role}>{t(`generate.role_${role}`)}</option>
    {/each}
  </select>
</div>

<div class="field">
  <label for="org-url">{t("generate.org_url")} <span class="mute">({t("common.optional")})</span></label>
  <input id="org-url" type="url" bind:value={answers.organization.url} placeholder="https://" />
</div>
