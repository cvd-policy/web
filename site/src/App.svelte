<script lang="ts">
  import { i18n, t } from "./lib/i18n.svelte.js";
  import { isInternalLink, router, ROUTES } from "./lib/router.svelte.js";
  import LangToggle from "./components/LangToggle.svelte";
  import Home from "./routes/Home.svelte";
  import Spec from "./routes/Spec.svelte";
  import Generate from "./routes/Generate.svelte";
  import Validate from "./routes/Validate.svelte";
  import Explain from "./routes/Explain.svelte";
  import Tools from "./routes/Tools.svelte";
  import Faq from "./routes/Faq.svelte";
  import Imprint from "./routes/Imprint.svelte";

  const PAGES = { "/": Home, "/spec": Spec, "/generate": Generate, "/validate": Validate, "/explain": Explain, "/tools": Tools, "/faq": Faq, "/imprint": Imprint };

  const NAV = ROUTES.filter((route) => route !== "/" && route !== "/imprint");

  const labelFor = (route: string) => t(`nav.${route.slice(1) || "home"}`);

  // One handler for every internal link, so routes stay plain anchors.
  function intercept(event: MouseEvent) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
    const anchor = (event.target as HTMLElement).closest("a");
    if (!anchor || !isInternalLink(anchor)) return;
    event.preventDefault();
    router.navigate(anchor.pathname, { fragment: anchor.hash.slice(1) });
  }

  $effect(() => {
    document.documentElement.lang = i18n.lang;
  });
</script>

<svelte:window onclick={intercept} />

<div class="shell">
  <a class="skip-link" href="#main">{t("nav.skip")}</a>

  <header class="site-header no-print">
    <div class="container">
      <a class="brand" href="/">CVD Policy Format</a>
      <nav class="nav" aria-label="Main">
        {#each NAV as route (route)}
          <a href={route} aria-current={router.path === route ? "page" : undefined}>
            {labelFor(route)}
          </a>
        {/each}
      </nav>
      <LangToggle />
    </div>
  </header>

  <main id="main">
    <div class="container">
      {#key router.path}
        {@const Page = PAGES[router.path]}
        <Page />
      {/key}
    </div>
  </main>

  <footer class="site-footer no-print">
    <div class="container">
      <p>{t("footer.funding")}</p>
      <p>{t("footer.privacy")}</p>
      <p class="small">
        {t("footer.licence")}
        · <a href="/imprint">{t("nav.imprint")}</a>
      </p>
    </div>
  </footer>
</div>
