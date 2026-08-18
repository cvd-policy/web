<script lang="ts">
  import { t } from "../lib/i18n.svelte.js";
  import { operator } from "../lib/operator.js";
</script>

<div class="stack prose">
  <h1>{t("imprint.title")}</h1>

  <section>
    <h2>{t("imprint.tmg")}</h2>
    <p>
      {operator.legalName}<br />
      {#each operator.address as line (line)}
        {line}<br />
      {/each}
    </p>
  </section>

  <section>
    <h2>{t("imprint.represented_by")}</h2>
    <p>
      {t("imprint.managing_directors")}:
      {#each operator.managingDirectors as person (person)}
        <br />{person}
      {/each}
    </p>
  </section>

  <section>
    <h2>{t("imprint.contact")}</h2>
    <p>
      {t("imprint.email")}: {operator.email}<br />
      {t("imprint.phone")}: {operator.phone}
    </p>
    <p class="small mute">{t("imprint.contact_note")}</p>
  </section>

  <section>
    <h2>{t("imprint.register")}</h2>
    <p>
      {t("imprint.register_court")}: {operator.court}<br />
      {t("imprint.register_number")}: {operator.registerNumber}
    </p>
  </section>

  <section>
    <h2>{t("imprint.vat_title")}</h2>
    <p>{t("imprint.vat_body")}: {operator.vatId}</p>
  </section>

  <section>
    <h2>{t("imprint.rstv")}</h2>
    <p>
      {#each operator.responsible as person (person)}
        {person}<br />
      {/each}
      {#each operator.address as line (line)}
        {line}<br />
      {/each}
    </p>
  </section>

  <section>
    <h2>{t("imprint.funding_title")}</h2>
    <p>{t("footer.funding")}</p>
  </section>

  <section>
    <h2>{t("imprint.privacy_title")}</h2>
    <p>{t("imprint.privacy_body")}</p>
    <h3>{t("imprint.hosting_title")}</h3>
    <p>{t("imprint.hosting_body")}</p>
  </section>

  <section>
    <h2>{t("imprint.licence_title")}</h2>
    <p>{t("footer.licence")}</p>
  </section>
</div>
