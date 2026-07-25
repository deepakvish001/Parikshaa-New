import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RouteSeo from "@/components/RouteSeo";

const getMeta = () => ({
  canonical: document.head
    .querySelector('link[rel="canonical"]')
    ?.getAttribute("href"),
  ogUrl: document.head
    .querySelector('meta[property="og:url"]')
    ?.getAttribute("content"),
  twitterUrl: document.head
    .querySelector('meta[name="twitter:url"]')
    ?.getAttribute("content"),
});

describe("RouteSeo", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });
  afterEach(() => {
    document.head.innerHTML = "";
  });

  it("strips ?tab=description from canonical/og:url/twitter:url", () => {
    render(
      <MemoryRouter
        initialEntries={["/library/problems/two-sum?tab=description"]}
      >
        <RouteSeo />
      </MemoryRouter>,
    );
    const m = getMeta();
    for (const v of [m.canonical, m.ogUrl, m.twitterUrl]) {
      expect(v).toBeTruthy();
      expect(v!).not.toContain("?");
      expect(v!).not.toContain("tab=");
      expect(v!.endsWith("/library/problems/two-sum")).toBe(true);
    }
  });

  it("strips all query params (including non-tab) from meta URLs", () => {
    render(
      <MemoryRouter
        initialEntries={[
          "/library/problems/two-sum?ref=share&tab=description&utm_source=x",
        ]}
      >
        <RouteSeo />
      </MemoryRouter>,
    );
    const m = getMeta();
    for (const v of [m.canonical, m.ogUrl, m.twitterUrl]) {
      expect(v).toBeTruthy();
      expect(v!).not.toContain("?");
      expect(v!).not.toContain("tab=");
      expect(v!).not.toContain("ref=");
      expect(v!).not.toContain("utm_");
    }
  });

  it("keeps meta URLs query-free on plain routes", () => {
    render(
      <MemoryRouter initialEntries={["/library/problems/two-sum"]}>
        <RouteSeo />
      </MemoryRouter>,
    );
    const m = getMeta();
    for (const v of [m.canonical, m.ogUrl, m.twitterUrl]) {
      expect(v!.endsWith("/library/problems/two-sum")).toBe(true);
      expect(v!).not.toContain("?");
    }
  });
});
