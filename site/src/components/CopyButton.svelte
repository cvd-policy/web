<script lang="ts">
  import { copyText } from "../lib/download.js";
  import { t } from "../lib/i18n.svelte.js";

  let { text, label = "" }: { text: string; label?: string } = $props();
  let copied = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function copy() {
    copied = await copyText(text);
    clearTimeout(timer);
    timer = setTimeout(() => (copied = false), 2000);
  }
</script>

<button type="button" class="btn btn-sm" onclick={copy} aria-live="polite">
  {copied ? t("common.copied") : label || t("common.copy")}
</button>
