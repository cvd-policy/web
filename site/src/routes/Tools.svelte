<script lang="ts">
  import CodeBlock from "../components/CodeBlock.svelte";
  import { examples } from "../lib/examples.js";
  import { t } from "../lib/i18n.svelte.js";

  const cli = `npx @cvd-policy/cli validate cvd.json
npx @cvd-policy/cli validate -              # from stdin
npx @cvd-policy/cli check https://example.com
npx @cvd-policy/cli explain cvd.json
npx @cvd-policy/cli report incoming.json    # against the report profile`;

  const action = `- name: Check the CVD policy
  run: npx @cvd-policy/cli validate .well-known/cvd.json`;
</script>

<div class="stack">
  <div class="prose">
    <h1>{t("tools.title")}</h1>
    <p class="lead">{t("tools.lead")}</p>
  </div>

  <section class="card">
    <h2 class="u-mt0">{t("tools.for_implementers")}</h2>
    <table>
      <tbody>
        <tr>
          <th scope="row">{t("tools.schema")}</th>
          <td>
            <a href="/schema/0.2/cvd-policy.schema.json">0.2</a>
            <span aria-hidden="true"> · </span>
            <a href="/schema/0.1/cvd-policy.schema.json">0.1</a>
            <span class="mute small"> — {t("tools.schema_frozen")}</span>
          </td>
        </tr>
        <tr>
          <th scope="row">{t("tools.report_profile")}</th>
          <td>
            <a href="/schema/profiles/report-0.1.schema.json">report-0.1</a>
            <span class="mute small"> — {t("tools.report_profile_note")}</span>
          </td>
        </tr>
        <tr>
          <th scope="row">{t("tools.library")}</th>
          <td><code>npm i @cvd-policy/core</code></td>
        </tr>
        <tr>
          <th scope="row">{t("tools.cli")}</th>
          <td><code>npx @cvd-policy/cli</code></td>
        </tr>
        <tr>
          <th scope="row">{t("tools.examples")}</th>
          <td>
            {#each examples as example, index (example.name)}
              {#if index > 0}<span aria-hidden="true"> · </span>{/if}
              <a href={`/examples/${example.name}`}>{example.name}</a>
            {/each}
          </td>
        </tr>
        <tr>
          <th scope="row">{t("tools.corpus")}</th>
          <td>github.com/cvd-policy/spec/tree/main/tests</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section class="stack">
    <h2>{t("tools.cli")}</h2>
    <CodeBlock code={cli} />
    <p class="small mute">{t("tools.cli_body")}</p>
  </section>

  <section class="stack">
    <h2>{t("tools.action")}</h2>
    <CodeBlock code={action} title=".github/workflows/security.yml" />
  </section>

  <section class="card">
    <h2 class="u-mt0">{t("tools.third_party")}</h2>
    <p class="mute">[ {t("tools.third_party_empty")} ]</p>
  </section>
</div>
