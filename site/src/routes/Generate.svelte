<script lang="ts">
  import { assessSecurityTxtAuthority, mergeSecurityTxt, parsePolicyText, securityTxt } from "@cvd-policy/core/v1";
  import CodeBlock from "../components/CodeBlock.svelte";
  import FileDrop from "../components/FileDrop.svelte";
  import { downloadBytes, downloadText } from "../lib/download.js";
  import { policyHtml } from "../lib/policyHtml.js";
  import { humanPolicyFilename, policyFilename, policyZip } from "../lib/policyZip.js";

  const now = new Date();
  const expires = new Date(now);
  expires.setUTCMonth(expires.getUTCMonth() + 6);
  const initialPolicy = {
    cvd_policy: 1,
    last_updated: now.toISOString(),
    expires: expires.toISOString(),
    organization: { name: "Example Organization", uri: "https://example.com" },
    contact: { channels: ["mailto:security@example.com"], preferred_languages: ["en"] },
    research: { posture: "report_only" },
    reporting_scope: {
      web: [{ id: "main-web", state: "in", host: "example.com", schemes: ["https"], path_prefix: "/", include_subdomains: false }],
    },
    reporting: { requested_fields: ["affected_asset", "description"], proof_of_exploitation: "not_requested" },
  };

  let raw = $state(JSON.stringify(initialPolicy, null, 2));
  let policyUri = $state("https://example.com/cvd-policy.json");
  let securityTxtUri = $state("https://example.com/.well-known/security.txt");
  let humanPolicyUri = $state("https://example.com/security/cvd-policy.html");
  let existingSecurityTxt = $state("");

  const result = $derived(parsePolicyText(raw));
  const document = $derived(result.policy);
  const publication = $derived.by(() => {
    if (!document) return { securityTxt: "", html: "", error: "", archive: null };
    try {
      const discovery = new URL(securityTxtUri);
      if (
        discovery.protocol !== "https:" || discovery.username || discovery.password ||
        discovery.pathname !== "/.well-known/security.txt" || discovery.search || discovery.hash
      ) throw new Error("security.txt URI must be an exact HTTPS /.well-known/security.txt URL");
      const generated = securityTxt(document, { policyUri, securityTxtUri, humanPolicyUris: [humanPolicyUri] });
      const merged = existingSecurityTxt.trim() ? mergeSecurityTxt(existingSecurityTxt, policyUri) : generated;
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
        archive: policyZip({ policyJson: raw, policyHtml: html, securityTxt: merged, policyUri, securityTxtUri, humanPolicyUri }),
      };
    } catch (error) {
      return { securityTxt: "", html: "", error: error instanceof Error ? error.message : String(error), archive: null };
    }
  });

  function downloadArchive() {
    if (publication.archive) downloadBytes("cvd-policy.zip", publication.archive, "application/zip");
  }
</script>

<div class="stack">
  <div class="prose">
    <h1>Generate a V1 CVD Policy</h1>
    <p class="lead">Edit or upload a policy, validate it locally, and prepare files for the exact locations you control.</p>
    <div class="notice">
      Experimental implementation of
      <a href="https://datatracker.ietf.org/doc/html/draft-behring-cvd-policy-00">draft-behring-cvd-policy-00</a>.
      The proposed field name and media type may change.
    </div>
  </div>

  <div class="split">
    <div class="stack">
      <div class="field">
        <label for="policy-uri">Policy URI</label>
        <input id="policy-uri" type="url" bind:value={policyUri} />
        <p class="help">Required, explicit HTTPS URI. There is no standardized default JSON path.</p>
      </div>
      <div class="field">
        <label for="security-txt-uri">security.txt URI</label>
        <input id="security-txt-uri" type="url" bind:value={securityTxtUri} />
      </div>
      <div class="field">
        <label for="human-policy-uri">Human-readable Policy URI</label>
        <input id="human-policy-uri" type="url" bind:value={humanPolicyUri} />
      </div>
      <div class="field">
        <label for="policy-json">V1 policy JSON</label>
        <textarea id="policy-json" bind:value={raw} spellcheck="false"></textarea>
      </div>
      <FileDrop onload={(text) => (raw = text)} accept="application/cvd-policy+json,application/json,.json" />
      <details>
        <summary>Merge into an existing security.txt</summary>
        <p class="help">Comments and existing fields are preserved. Every old CVD-Policy field is replaced by exactly one value. Clearsigned files are refused.</p>
        <textarea bind:value={existingSecurityTxt} spellcheck="false" placeholder="Contact: mailto:security@example.com"></textarea>
        <FileDrop onload={(text) => (existingSecurityTxt = text)} accept="text/plain,.txt" />
      </details>
    </div>

    <div class="stack">
      <div class="row">
        <h2 class="u-m0">Local validation</h2>
        <span class="badge {result.valid ? 'badge-ok' : 'badge-err'}">{result.valid ? "Valid V1" : "Invalid"}</span>
      </div>
      {#if result.issues.length}
        {#each result.issues as issue (issue.code + issue.path)}
          <div class="issue error"><p class="issue-path">{issue.path || "/"}</p><p>{issue.message}</p></div>
        {/each}
      {/if}
      {#if publication.error}<div class="notice">{publication.error}</div>{/if}

      {#if document && !publication.error}
        <div class="card card-tight stack">
          <div class="row">
            <code class="u-grow">{policyFilename(policyUri)}</code>
            <button class="btn btn-sm" onclick={() => downloadText(policyFilename(policyUri), raw, "application/cvd-policy+json")}>Download</button>
          </div>
          <div class="row">
            <code class="u-grow">security.txt</code>
            <button class="btn btn-sm" onclick={() => downloadText("security.txt", publication.securityTxt, "text/plain")}>Download</button>
          </div>
          <div class="row">
            <code class="u-grow">{humanPolicyFilename(humanPolicyUri)}</code>
            <button class="btn btn-sm" onclick={() => downloadText(humanPolicyFilename(humanPolicyUri), publication.html, "text/html")}>Download</button>
          </div>
          {#if publication.archive}
            <div class="row">
              <code class="u-grow">cvd-policy.zip</code>
              <button class="btn btn-sm btn-primary" onclick={downloadArchive}>Download exact web-root layout</button>
            </div>
          {:else}
            <p class="help">No ZIP: all three safe paths must share one HTTPS origin and contain no query, fragment, credentials, or parent segments.</p>
          {/if}
        </div>
        <CodeBlock code={publication.securityTxt} title="security.txt" />
        <CodeBlock code={`npx @cvd-policy/cli@0.5.0-rc.1 check ${new URL(securityTxtUri).host}`} title="Network check after deployment" />
        <p class="help">This browser performs local validation only. Remote discovery belongs to the CLI or a backend because CORS may block browser requests.</p>
      {/if}
    </div>
  </div>
</div>
