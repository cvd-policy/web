<script lang="ts">
  import { t } from "../lib/i18n.svelte.js";
  import { ROUTES } from "../lib/router.svelte.js";

  const suggestions = ROUTES.filter((route) => route !== "/imprint");
  const labelFor = (route: string) => t(`nav.${route.slice(1) || "home"}`);
</script>

<div class="stack">
  <div class="prose">
    <h1>{t("notfound.title")}</h1>
    <p class="lead">{t("notfound.lead")}</p>
  </div>

  <div class="row">
    {#each suggestions as route (route)}
      <a class="btn btn-sm" href={route}>{labelFor(route)}</a>
    {/each}
  </div>
</div>
