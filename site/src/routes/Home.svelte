<script lang="ts">
  import CodeBlock from "../components/CodeBlock.svelte";
  import { t } from "../lib/i18n.svelte.js";
  const json = JSON.stringify({
    cvd_policy: 1,
    last_updated: "2026-09-03T00:00:00Z",
    expires: "2027-03-03T00:00:00Z",
    organization: { name: "Example Organization" },
    contact: { channels: ["mailto:security@example.com"] },
    research: { posture: "report_only" },
    reporting_scope: { web: [{ id: "main", state: "in", host: "example.com", schemes: ["https"], path_prefix: "/", include_subdomains: false }] },
    reporting: { requested_fields: ["affected_asset", "description"], proof_of_exploitation: "not_requested" },
  }, null, 2);
</script>

<div class="stack">
  <section class="prose">
    <h1>{t("home.title")}</h1>
    <p class="lead">{t("home.lead")}</p>
    <p class="notice">{t("home.v1_notice_intro")} <a href="https://datatracker.ietf.org/doc/html/draft-behring-cvd-policy-00">draft-behring-cvd-policy-00</a>. {t("home.v1_notice_change")}</p>
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
      <CodeBlock code={json} title="cvd-policy.json" />
    </div>
  </section>
</div>
