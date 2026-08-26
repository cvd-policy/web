<script module lang="ts">
  /**
   * The codes a reporting contact is most likely to need. Not a complete list
   * of ISO 639-1: anything already in the document is offered too, so a code
   * missing here can still be kept and removed, and the schema is what decides
   * what is valid.
   */
  export const COMMON_LANGUAGES = [
    "en", "de", "fr", "es", "it", "nl", "pt", "pl", "cs", "sv",
    "da", "no", "fi", "tr", "ro", "hu", "el", "bg", "uk", "ru",
    "ja", "zh", "ko", "ar", "hi",
  ];
</script>

<script lang="ts">
  import { i18n, t } from "../lib/i18n.svelte.js";

  // Optional in the document, so optional here: binding to a field that may be
  // absent is the normal case, not something the caller has to guard.
  let {
    selected = $bindable<string[] | undefined>(undefined),
    id,
  }: { selected?: string[]; id: string } = $props();

  // Derived, not captured: `id` is a prop and a plain const would freeze its
  // first value. It is already unique per page, so it needs no counter.
  const panelId = $derived(`${id}-panel`);
  let open = $state(false);
  let root = $state<HTMLElement>();

  const chosen = $derived(selected ?? []);

  // A code the document already carries but the shortlist omits still has to be
  // visible, or it could never be taken off again.
  const options = $derived([...new Set([...COMMON_LANGUAGES, ...chosen])]);

  /**
   * The endonym-free name in the interface language. Intl carries the whole
   * table, so no dictionary entry is needed for any of these.
   */
  function nameOf(code: string): string {
    try {
      return new Intl.DisplayNames([i18n.lang], { type: "language" }).of(code) ?? code;
    } catch {
      return code;
    }
  }

  /** Order is meaningful — it is the order the document lists them in. */
  function toggle(code: string, on: boolean) {
    selected = on ? [...chosen, code] : chosen.filter((entry) => entry !== code);
  }

  function onWindowPointerDown(event: PointerEvent) {
    if (open && root && !root.contains(event.target as Node)) open = false;
  }

  // On the window rather than the panel: a group of checkboxes is not an
  // interactive element and should carry no key handler of its own, and this
  // also closes the panel while focus is still on the toggle.
  function onWindowKeyDown(event: KeyboardEvent) {
    if (!open || event.key !== "Escape") return;
    open = false;
    document.getElementById(id)?.focus();
  }
</script>

<svelte:window onpointerdown={onWindowPointerDown} onkeydown={onWindowKeyDown} />

<div class="multiselect" bind:this={root}>
  <button
    type="button"
    {id}
    class="multiselect-toggle"
    aria-expanded={open}
    aria-controls={panelId}
    onclick={() => (open = !open)}
  >
    <span class="multiselect-value" class:mute={chosen.length === 0}>
      {chosen.length === 0 ? t("generate.languages_none") : chosen.join(", ")}
    </span>
    <span class="multiselect-caret" aria-hidden="true">▾</span>
  </button>

  <div id={panelId} class="multiselect-panel" hidden={!open} role="group" aria-labelledby={id}>
    {#each options as code (code)}
      <label class="multiselect-option u-normal">
        <input
          type="checkbox"
          checked={chosen.includes(code)}
          onchange={(event) => toggle(code, event.currentTarget.checked)}
        />
        <code>{code}</code>
        <span class="mute">{nameOf(code)}</span>
      </label>
    {/each}
  </div>
</div>
