<script lang="ts">
  import CodeBlock from "../components/CodeBlock.svelte";
  import { t } from "../lib/i18n.svelte.js";
  import example from "../../vendor/spec/examples/01-manufacturer-report-only.json";

  const json = JSON.stringify(example, null, 2);
</script>

<div class="stack">
  <section class="prose">
    <h1>{t("home.title")}</h1>
    <p class="lead">{t("home.lead")}</p>
    <div class="row actions-primary">
      <a class="btn btn-primary" href="/generate">{t("home.cta_generate")}</a>
      <a class="btn" href="/validate">{t("home.cta_validate")}</a>
      <a class="btn" href="/spec">{t("home.cta_spec")}</a>
    </div>
  </section>

  <section class="split split-example-first">
    <div class="prose">
      <h2>{t("home.what_title")}</h2>
      <p>{t("home.what_body")}</p>

      <h2>{t("home.steps_title")}</h2>
      <ol>
        <li>{t("home.step_1")}</li>
        <li>{t("home.step_2")}</li>
        <li>{t("home.step_3")}</li>
      </ol>

      <h2>{t("home.privacy_title")}</h2>
      <p>{t("home.privacy_body")}</p>

      <h2>{t("home.not_title")}</h2>
      <ul>
        <li>{t("home.not_1")}</li>
        <li>{t("home.not_2")}</li>
        <li>{t("home.not_3")}</li>
        <li>{t("home.not_4")}</li>
      </ul>
    </div>

    <div class="stack">
      <h2>{t("home.example_title")}</h2>
      <p class="mute small">{t("home.example_caption")}</p>
      <CodeBlock code={json} title="cvd.json" />
    </div>
  </section>
</div>
