// Encodes a draft into the URL fragment. Browsers never send the fragment to a
// server, so a shared link carries the draft without any storage on our side.

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (value: string): Uint8Array<ArrayBuffer> => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
};

async function through(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

const supportsCompression = typeof CompressionStream !== "undefined";

/** Returns a fragment value such as `s=…` for a document. */
export async function encodeDraft(value: unknown): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(value));
  if (!supportsCompression) return `p=${toBase64Url(json)}`;

  const compressed = await through(
    new Blob([json]).stream().pipeThrough(new CompressionStream("deflate-raw")),
  );
  return `s=${toBase64Url(compressed)}`;
}

/** Reads a document back out of a fragment. Returns null if there is none. */
export async function decodeDraft(fragment: string): Promise<unknown | null> {
  const params = new URLSearchParams(fragment);
  const plain = params.get("p");
  const compressed = params.get("s");

  try {
    if (plain) return JSON.parse(new TextDecoder().decode(fromBase64Url(plain)));
    if (compressed && typeof DecompressionStream !== "undefined") {
      const bytes = await through(
        new Blob([fromBase64Url(compressed)])
          .stream()
          .pipeThrough(new DecompressionStream("deflate-raw")),
      );
      return JSON.parse(new TextDecoder().decode(bytes));
    }
  } catch {
    return null;
  }
  return null;
}
