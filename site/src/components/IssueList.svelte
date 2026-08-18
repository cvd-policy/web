<script lang="ts">
  import type { ValidationIssue } from "@cvd-policy/core";
  import { has, t } from "../lib/i18n.svelte.js";

  let {
    issues,
    onfix,
  }: { issues: ValidationIssue[]; onfix?: (issue: ValidationIssue) => void } = $props();

  const groups = $derived([
    { level: "error" as const, titleKey: "validate.errors" },
    { level: "warning" as const, titleKey: "validate.warnings" },
    { level: "info" as const, titleKey: "validate.infos" },
  ]);

  const hintKey = (issue: ValidationIssue) => `${issue.message}.hint`;
</script>

{#each groups as group (group.level)}
  {@const list = issues.filter((issue) => issue.level === group.level)}
  {#if list.length > 0}
    <h3>{t(group.titleKey)}</h3>
    {#each list as issue (issue.code + issue.path)}
      <div class="issue {issue.level}">
        <p class="issue-path">{issue.path || "/"}</p>
        <p>{t(issue.message, issue.params)}</p>
        {#if has(hintKey(issue))}
          <p class="issue-hint">→ {t(hintKey(issue), issue.params)}</p>
        {/if}
        {#if onfix && issue.level === "error"}
          <button type="button" class="btn btn-sm" onclick={() => onfix(issue)}>
            {t("validate.fix_in_generator")}
          </button>
        {/if}
      </div>
    {/each}
  {/if}
{/each}
