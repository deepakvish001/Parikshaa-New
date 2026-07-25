import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  validateAttachment,
  isSafeImageUrl,
  MAX_IMAGE_BYTES,
} from "../discussionAttachments";
import { SafeMarkdown } from "../ProblemDiscussion";

const mk = (opts: Partial<{ name: string; type: string; size: number }>) => ({
  name: "a.png",
  type: "image/png",
  size: 1000,
  ...opts,
});

describe("validateAttachment", () => {
  it("accepts allowed image types with sane size", () => {
    expect(validateAttachment(mk({}))).toEqual({ ok: true, ext: "png" });
    expect(validateAttachment(mk({ name: "x.JPEG", type: "image/jpeg" }))).toMatchObject({ ok: true });
    expect(validateAttachment(mk({ name: "x.webp", type: "image/webp" }))).toMatchObject({ ok: true });
    expect(validateAttachment(mk({ name: "x.gif", type: "image/gif" }))).toMatchObject({ ok: true });
  });

  it("rejects disallowed mime types (svg, pdf, exe)", () => {
    for (const type of ["image/svg+xml", "application/pdf", "application/x-msdownload"]) {
      const res = validateAttachment(mk({ type, name: "f.bin" }));
      expect(res.ok).toBe(false);
    }
  });

  it("rejects empty files", () => {
    expect(validateAttachment(mk({ size: 0 })).ok).toBe(false);
  });

  it("rejects files exceeding the 5MB size limit", () => {
    expect(validateAttachment(mk({ size: MAX_IMAGE_BYTES + 1 })).ok).toBe(false);
  });

  it("falls back to the mime-derived extension when filename ext is missing", () => {
    const res = validateAttachment(mk({ name: "noext", type: "image/png" }));
    expect(res).toMatchObject({ ok: true, ext: "png" });
  });
});

describe("isSafeImageUrl", () => {
  it("accepts http(s) URLs only", () => {
    expect(isSafeImageUrl("https://example.com/a.png")).toBe(true);
    expect(isSafeImageUrl("http://example.com/a.png")).toBe(true);
  });
  it("rejects javascript:, data:, blob:, file:, and empty", () => {
    for (const bad of [
      "javascript:alert(1)",
      "data:image/png;base64,AAAA",
      "blob:https://x/y",
      "file:///etc/passwd",
      "",
      undefined,
      null,
    ]) {
      expect(isSafeImageUrl(bad as any)).toBe(false);
    }
  });
});

describe("SafeMarkdown sanitization", () => {
  it("strips <script> and does not execute injected HTML", () => {
    render(<SafeMarkdown content={'hi <script>window.__x=1</script> there'} highlight="" />);
    // The paragraph text renders but the script tag is stripped from the DOM.
    expect(document.querySelector("script")).toBeNull();
    expect((window as any).__x).toBeUndefined();
  });

  it("does not render images with javascript: or data: URLs", () => {
    render(
      <SafeMarkdown
        content={"![x](javascript:alert(1))\n\n![y](data:image/png;base64,AAAA)"}
        highlight=""
      />,
    );
    expect(document.querySelector("img")).toBeNull();
  });

  it("renders http(s) images with lazy loading and no-referrer", () => {
    render(<SafeMarkdown content={"![ok](https://example.com/a.png)"} highlight="" />);
    const img = document.querySelector("img")!;
    expect(img).toBeTruthy();
    expect(img.getAttribute("loading")).toBe("lazy");
    expect(img.getAttribute("referrerpolicy")).toBe("no-referrer");
  });

  it("adds rel=noopener noreferrer nofollow ugc to links", () => {
    render(<SafeMarkdown content={"[x](https://example.com)"} highlight="" />);
    const a = screen.getByRole("link");
    expect(a.getAttribute("rel")).toContain("noopener");
    expect(a.getAttribute("rel")).toContain("noreferrer");
    expect(a.getAttribute("rel")).toContain("nofollow");
    expect(a.getAttribute("target")).toBe("_blank");
  });
});
