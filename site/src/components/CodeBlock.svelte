<script lang="ts">
  import CopyButton from "./CopyButton.svelte";

  let {
    code,
    title = "",
    copyable = true,
  }: { code: string; title?: string; copyable?: boolean } = $props();
</script>

<div class="codeblock">
  {#if title || copyable}
    <div class="codeblock-bar">
      <span>{title}</span>
      {#if copyable}<CopyButton text={code} />{/if}
    </div>
  {/if}
  <pre><code>{code}</code></pre>
</div>
