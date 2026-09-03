<script lang="ts">
  import { validateText as validateLegacyText } from "@cvd-policy/core";
  import { parsePolicyText } from "@cvd-policy/core/v1";
  import FileDrop from "../components/FileDrop.svelte";

  let raw = $state("");
  let filename = $state("");
  let legacy = $state(false);
  const result = $derived(raw.trim() ? (legacy ? validateLegacyText(raw) : parsePolicyText(raw)) : null);
</script>

<div class="stack">
  <div class="prose">
    <h1>Validate a CVD Policy</h1>
    <p class="lead">Paste or upload JSON. Validation runs locally in your browser.</p>
    <div class="notice">V1 is an experimental implementation of <a href="https://datatracker.ietf.org/doc/html/draft-behring-cvd-policy-00">draft-behring-cvd-policy-00</a>.</div>
  </div>
  <div class="split">
    <div class="stack">
      <label class="choice"><input type="checkbox" bind:checked={legacy} /><span><span class="choice-title">Legacy 0.x validation</span><br /><span class="choice-body">Opt in only for existing 0.1/0.2 documents.</span></span></label>
      <div class="field"><label for="policy-input">Policy JSON</label><textarea id="policy-input" bind:value={raw} spellcheck="false" placeholder={"{"}></textarea></div>
      <FileDrop onload={(text, name) => { raw = text; filename = name; }} accept="application/cvd-policy+json,application/json,.json" />
    </div>
    <div class="stack">
      {#if result}
        <div class="card">
          <p class="row"><span class="badge {result.valid ? 'badge-ok' : 'badge-err'}">{result.valid ? "Valid" : "Invalid"}</span>{#if filename}<span class="small mute">{filename}</span>{/if}</p>
          {#if result.issues.length === 0}<p>No issues found.</p>{/if}
          {#each result.issues as issue (issue.code + issue.path)}
            <div class="issue {issue.level}"><p class="issue-path">{issue.path || "/"}</p><p>{issue.message}</p></div>
          {/each}
        </div>
      {/if}
      <div class="card"><h2 class="u-mt0">Check a deployed policy</h2><code>npx @cvd-policy/cli@0.5.0-rc.1 check example.com</code><p class="help">The CLI follows /.well-known/security.txt to its announced CVD-Policy URI. The browser validator does not perform network discovery.</p></div>
    </div>
  </div>
</div>
