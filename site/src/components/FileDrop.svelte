<script lang="ts">
  import { readFile } from "../lib/download.js";
  import { t } from "../lib/i18n.svelte.js";

  let {
    onload,
    accept = "application/json,.json",
    hintKey = "validate.drop_hint",
  }: {
    onload: (text: string, name: string) => void;
    accept?: string;
    hintKey?: string;
  } = $props();
  let over = $state(false);
  let error = $state("");
  let input: HTMLInputElement;

  async function take(file: File | undefined) {
    if (!file) return;
    try {
      onload(await readFile(file), file.name);
      error = "";
    } catch {
      error = "The selected file is not valid UTF-8.";
    }
  }
</script>

<div
  class="dropzone"
  class:over
  role="button"
  tabindex="0"
  ondragover={(event) => {
    event.preventDefault();
    over = true;
  }}
  ondragleave={() => (over = false)}
  ondrop={(event) => {
    event.preventDefault();
    over = false;
    take(event.dataTransfer?.files[0]);
  }}
  onclick={() => input.click()}
  onkeydown={(event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      input.click();
    }
  }}
>
  <p>{t(hintKey)}</p>
  <input
    bind:this={input}
    type="file"
    {accept}
    hidden
    onchange={(event) => take(event.currentTarget.files?.[0])}
  />
</div>
{#if error}<p class="issue error" role="alert">{error}</p>{/if}
