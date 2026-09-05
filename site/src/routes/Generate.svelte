<script lang="ts">
  import type { CvdPolicyDocument } from "@cvd-policy/core/v1";
  import { assessSecurityTxtAuthority, mergeSecurityTxt, parsePolicyText, securityTxt } from "@cvd-policy/core/v1";
  import CodeBlock from "../components/CodeBlock.svelte";
  import FileDrop from "../components/FileDrop.svelte";
  import V1PolicyEditor from "../components/V1PolicyEditor.svelte";
  import { downloadBytes, downloadText } from "../lib/download.js";
  import { policyHtml } from "../lib/policyHtml.js";
  import { humanPolicyFilename, policyFilename, policyZip } from "../lib/policyZip.js";
  import { t } from "../lib/i18n.svelte.js";
  import { createInitialV1Policy } from "../lib/v1Editor.js";

  const initialPolicy = createInitialV1Policy();
  let policy = $state<CvdPolicyDocument>(initialPolicy);
  let raw = $state(JSON.stringify(initialPolicy, null, 2));
  let editorMode = $state<"guided" | "json">("guided");
  let editorRevision = $state(0);
  let editorValid = $state(true);
  const guidedRaw = $derived(JSON.stringify(policy, null, 2));
  const activeRaw = $derived(editorMode === "guided" ? guidedRaw : raw);
  const editorReady = $derived(editorValid);
  let policyUri = $state("https://example.com/cvd-policy.json");
  let securityTxtUri = $state("https://example.com/.well-known/security.txt");
  let humanPolicyUri = $state("https://example.com/security/cvd-policy.html");
  let existingSecurityTxt = $state("");

  const result = $derived(parsePolicyText(activeRaw));
  const document = $derived(result.policy);
  const publication = $derived.by(() => {
    if (!editorReady) return { securityTxt: "", html: "", error: t("generate.editor_invalid"), archive: null };
    if (!document) return { securityTxt: "", html: "", error: "", archive: null };
    try {
      const discovery = new URL(securityTxtUri);
      if (
        discovery.protocol !== "https:" || discovery.username || discovery.password ||
        discovery.pathname !== "/.well-known/security.txt" || discovery.search || discovery.hash
      ) throw new Error(t("generate.security_txt_uri_error"));
      const merged = existingSecurityTxt.trim()
        ? mergeSecurityTxt(existingSecurityTxt, policyUri)
        : securityTxt(document, { policyUri, securityTxtUri, humanPolicyUris: [humanPolicyUri] });
      const authority = assessSecurityTxtAuthority(merged, {
        requestedUri: discovery.href,
        finalUri: discovery.href,
        redirectChain: [],
        retrievedAt: new Date(),
      });
      if (!authority.established) throw new Error(authority.issues.map((issue) => issue.code).join(", "));
      const html = policyHtml(document);
      return {
        securityTxt: merged,
        html,
        error: "",
        archive: policyZip({ policyJson: activeRaw, policyHtml: html, securityTxt: merged, policyUri, securityTxtUri, humanPolicyUri }),
      };
    } catch (error) {
      return { securityTxt: "", html: "", error: error instanceof Error ? error.message : String(error), archive: null };
    }
  });

  function downloadArchive() {
    if (publication.archive) downloadBytes("cvd-policy.zip", publication.archive, "application/zip");
  }

  function showJson() {
    if (!editorValid) return;
    raw = guidedRaw;
    editorMode = "json";
  }

  function showGuided() {
    if (!result.policy) return;
    const nextPolicy = structuredClone(result.policy);
    if (JSON.stringify(nextPolicy, null, 2) !== guidedRaw) {
      policy = nextPolicy;
      editorRevision += 1;
    }
    editorValid = true;
    editorMode = "guided";
  }
</script>

<div class="stack">
  <div class="prose">
    <h1>{t("generate.v1_title")}</h1>
    <p class="lead">{t("generate.v1_lead")}</p>
    <div class="notice">
      {t("generate.v1_notice_intro")}
      <a href="https://datatracker.ietf.org/doc/html/draft-behring-cvd-policy-00">draft-behring-cvd-policy-00</a>.
      {t("generate.v1_notice_change")}
    </div>
  </div>

  <div class="split">
    <div class="stack">
      <div class="field">
        <label for="policy-uri">{t("generate.policy_uri")}</label>
        <input id="policy-uri" type="url" bind:value={policyUri} />
        <p class="help">{t("generate.policy_uri_help")}</p>
      </div>
      <div class="field">
        <label for="security-txt-uri">{t("generate.security_txt_uri")}</label>
        <input id="security-txt-uri" type="url" bind:value={securityTxtUri} />
      </div>
      <div class="field">
        <label for="human-policy-uri">{t("generate.human_policy_uri")}</label>
        <input id="human-policy-uri" type="url" bind:value={humanPolicyUri} />
        <p class="help">{t("generate.human_policy_uri_help")}</p>
        {#if existingSecurityTxt.trim()}<p class="notice">{t("generate.human_policy_merge_note")}</p>{/if}
      </div>
      <div class="editor-tabs" role="group" aria-label={t("generate.editor_mode")}>
        <button class="btn {editorMode === 'guided' ? 'btn-primary' : ''}" type="button" onclick={showGuided} disabled={editorMode === "json" && !result.policy} aria-pressed={editorMode === "guided"}>{t("generate.editor_guided")}</button>
        <button class="btn {editorMode === 'json' ? 'btn-primary' : ''}" type="button" onclick={showJson} disabled={editorMode === "guided" && !editorValid} aria-pressed={editorMode === "json"}>{t("generate.editor_json")}</button>
      </div>
      <div hidden={editorMode !== "guided"}>
        {#key editorRevision}<V1PolicyEditor bind:policy bind:valid={editorValid} />{/key}
      </div>
      {#if editorMode === "json"}
        <div class="field">
          <label for="policy-json">{t("generate.v1_policy_json")}</label>
          <textarea id="policy-json" bind:value={raw} spellcheck="false"></textarea>
          <p class="help">{t("generate.editor_json_help")}</p>
        </div>
        <FileDrop onload={(text) => (raw = text)} accept="application/cvd-policy+json,application/json,.json" />
        <button class="btn" type="button" onclick={showGuided} disabled={!result.policy}>{t("generate.editor_apply_json")}</button>
      {/if}
      <details>
        <summary>{t("generate.merge_existing")}</summary>
        <p class="help">{t("generate.merge_existing_help")}</p>
        <textarea bind:value={existingSecurityTxt} spellcheck="false" placeholder="Contact: mailto:security@example.com"></textarea>
        <FileDrop onload={(text) => (existingSecurityTxt = text)} accept="text/plain,.txt" />
      </details>
    </div>

    <div class="stack">
      <div class="row">
        <h2 class="u-m0">{t("generate.local_validation")}</h2>
        <span class="badge {result.valid && editorReady ? 'badge-ok' : 'badge-err'}">{result.valid && editorReady ? t("generate.valid_v1") : t("validate.result_invalid")}</span>
      </div>
      <p class="help">{t("generate.local_scope")}</p>
      {#if result.issues.length}
        {#each result.issues as issue (issue.code + issue.path)}
          <div class="issue error"><p class="issue-path"><code>{issue.code}</code> · {issue.path || "/"}</p><p>{issue.message}</p></div>
        {/each}
      {/if}
      {#if publication.error}<div class="notice">{publication.error}</div>{/if}

      {#if document && !publication.error}
        <div class="card card-tight stack">
          <div class="row">
            <code class="u-grow">{policyFilename(policyUri)}</code>
            <button class="btn btn-sm" onclick={() => downloadText(policyFilename(policyUri), activeRaw, "application/cvd-policy+json")}>{t("common.download")}</button>
          </div>
          <div class="row">
            <code class="u-grow">security.txt</code>
            <button class="btn btn-sm" onclick={() => downloadText("security.txt", publication.securityTxt, "text/plain")}>{t("common.download")}</button>
          </div>
          <div class="row">
            <code class="u-grow">{humanPolicyFilename(humanPolicyUri)}</code>
            <button class="btn btn-sm" onclick={() => downloadText(humanPolicyFilename(humanPolicyUri), publication.html, "text/html")}>{t("common.download")}</button>
          </div>
          {#if publication.archive}
            <div class="row">
              <code class="u-grow">cvd-policy.zip</code>
              <button class="btn btn-sm btn-primary" onclick={downloadArchive}>{t("generate.download_layout")}</button>
            </div>
          {:else}
            <p class="help">{t("generate.zip_unavailable")}</p>
          {/if}
        </div>
        <CodeBlock code={publication.securityTxt} title="security.txt" />
        <CodeBlock code={`npx @cvd-policy/cli@0.5.0-rc.1 check ${new URL(securityTxtUri).host}`} title={t("generate.network_check")} />
        <p class="help">{t("generate.local_only")}</p>
      {/if}
    </div>
  </div>
</div>
