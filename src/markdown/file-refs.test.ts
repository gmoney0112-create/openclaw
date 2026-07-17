import { describe, expect, it } from "vitest";
import { isAutoLinkedFileRef } from "./file-refs.js";

describe("isAutoLinkedFileRef", () => {
  it("suppresses plain file references auto-linked as http://<label>", () => {
    expect(isAutoLinkedFileRef("http://README.md", "README.md")).toBe(true);
    expect(isAutoLinkedFileRef("http://config.js", "config.js")).toBe(true);
  });

  it("does not suppress real domain TLDs excluded from the extension set", () => {
    expect(isAutoLinkedFileRef("http://vercel.io", "vercel.io")).toBe(false);
    expect(isAutoLinkedFileRef("http://x.ai", "x.ai")).toBe(false);
  });

  it("only matches when href is exactly http://<label>", () => {
    expect(isAutoLinkedFileRef("https://README.md", "README.md")).toBe(false);
    expect(isAutoLinkedFileRef("http://example.com/README.md", "README.md")).toBe(false);
  });

  it("rejects labels with no extension or an empty extension", () => {
    expect(isAutoLinkedFileRef("http://README", "README")).toBe(false);
    expect(isAutoLinkedFileRef("http://README.", "README.")).toBe(false);
  });
});
