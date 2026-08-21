import { describe, expect, it } from "vitest";
import { decodeDraft, encodeDraft } from "../src/lib/share.js";

const draft = {
  cvd_policy: "0.2",
  canonical: "https://example.com/.well-known/cvd.json",
  organization: { name: "Example Ltd." },
  note: "umlauts and an em dash — ä ö ü ß",
};

describe("encodeDraft / decodeDraft", () => {
  it("round-trips a document through the fragment", async () => {
    expect(await decodeDraft(await encodeDraft(draft))).toEqual(draft);
  });

  it("compresses where the browser can, and says which form it used", async () => {
    const fragment = await encodeDraft(draft);
    expect(fragment.startsWith("s=") || fragment.startsWith("p=")).toBe(true);
  });

  it("produces a fragment safe to put in a URL unescaped", async () => {
    const fragment = await encodeDraft(draft);
    expect(fragment.slice(2)).toMatch(/^[A-Za-z0-9_-]*$/);
  });

  it("returns null rather than throwing on rubbish", async () => {
    for (const fragment of ["", "s=not-base64!!", "p=////", "nothing=here", "s="]) {
      expect(await decodeDraft(fragment), fragment).toBeNull();
    }
  });

  it("returns null for valid base64 that is not a document", async () => {
    expect(await decodeDraft(`p=${btoa("not json").replace(/=+$/, "")}`)).toBeNull();
  });

  it("refuses a fragment that inflates far beyond any real draft", async () => {
    // Valid JSON on purpose: a payload that merely fails to parse would be
    // rejected with or without a cap, and would prove nothing about the cap.
    // This one decodes cleanly if it is allowed to finish.
    const padded = JSON.stringify({ cvd_policy: "0.2", pad: "a".repeat(4 * 1024 * 1024) });
    const bomb = await new Response(
      new Blob([padded]).stream().pipeThrough(new CompressionStream("deflate-raw")),
    ).arrayBuffer();

    const bytes = new Uint8Array(bomb);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    const base64 = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    // A few kilobytes of link asking for four megabytes of memory.
    expect(bomb.byteLength).toBeLessThan(64 * 1024);
    expect(JSON.parse(padded)).toBeTruthy();
    expect(await decodeDraft(`s=${base64}`)).toBeNull();
  });

  it("still accepts a draft of ordinary size", async () => {
    const big = { ...draft, statement: "x".repeat(20_000) };
    expect(await decodeDraft(await encodeDraft(big))).toEqual(big);
  });
});
