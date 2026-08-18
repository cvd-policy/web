<script lang="ts">
  import { readFile } from "../lib/download.js";
  import { t } from "../lib/i18n.svelte.js";

  let { onload }: { onload: (text: string, name: string) => void } = $props();
  let over = $state(false);
  let input: HTMLInputElement;

  async function take(file: File | undefined) {
    if (!file) return;
    onload(await readFile(file), file.name);
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
  <p>{t("validate.drop_hint")}</p>
  <input
    bind:this={input}
    type="file"
    accept="application/json,.json"
    hidden
    onchange={(event) => take(event.currentTarget.files?.[0])}
  />
</div>
