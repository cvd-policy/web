function downloadUrl(filename: string, url: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Offers text as a file download. The blob never leaves the browser. */
export function downloadText(
  filename: string,
  text: string,
  mime = "application/json",
): void {
  downloadUrl(
    filename,
    URL.createObjectURL(new Blob([text], { type: mime === "application/cvd-policy+json" ? mime : `${mime};charset=utf-8` })),
  );
}

/** Offers binary data as a file download. */
export function downloadBytes(
  filename: string,
  bytes: Uint8Array<ArrayBuffer>,
  mime: string,
): void {
  downloadUrl(filename, URL.createObjectURL(new Blob([bytes], { type: mime })));
}

/** Copies text to the clipboard, falling back to a hidden textarea. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  }
}

/** Reads a dropped or chosen file as text. */
export function readFile(file: File): Promise<string> {
  return file.arrayBuffer().then((bytes) =>
    new TextDecoder("utf-8", { fatal: true }).decode(bytes),
  );
}
