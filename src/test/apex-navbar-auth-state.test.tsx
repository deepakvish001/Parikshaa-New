import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// jsdom polyfills used by the navbar
class ROStub { observe() {} unobserve() {} disconnect() {} }
const g = globalThis as unknown as { ResizeObserver?: unknown; IntersectionObserver?: unknown };
g.ResizeObserver ??= ROStub;
g.IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };

// Mock analytics + smooth-scroll (avoid side effects)
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/smoothScroll", () => ({
  scrollToHash: vi.fn(),
  HEADER_OFFSET_PX: 72,
  resolveHeaderOffset: (h: number) => h,
}));

// Mockable auth
const authState: { user: unknown; profile: unknown } = { user: null, profile: null };
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authState,
}));

import { ApexNavbar } from "@/components/landing/ApexNavbar";

const renderNav = () =>
  render(
    <MemoryRouter>
      <ApexNavbar />
    </MemoryRouter>,
  );

describe("ApexNavbar auth state", () => {
  beforeEach(() => {
    authState.user = null;
    authState.profile = null;
  });

  it("shows Sign In / Get Started when logged out", () => {
    renderNav();
    expect(screen.getAllByText(/Sign In/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Get Started/i).length).toBeGreaterThan(0);
    expect(screen.queryByLabelText(/Go to your dashboard/i)).toBeNull();
  });

  it("shows profile avatar + Dashboard link when logged in (desktop & mobile)", () => {
    authState.user = { id: "u1", email: "a@b.com" };
    authState.profile = { full_name: "Ada Lovelace", avatar_url: null };
    renderNav();

    // Two dashboard links rendered: desktop + mobile header
    const dashLinks = screen.getAllByLabelText(/Go to your dashboard/i);
    expect(dashLinks.length).toBeGreaterThanOrEqual(2);
    dashLinks.forEach((link) => expect(link).toHaveAttribute("href", "/learn"));

    // No Sign In / Get Started while authed
    expect(screen.queryByText(/^Sign In$/i)).toBeNull();
    expect(screen.queryByText(/^Get Started$/i)).toBeNull();
  });

  it("reverts to Sign In / Get Started after logout", () => {
    authState.user = { id: "u1", email: "a@b.com" };
    authState.profile = { full_name: "Ada", avatar_url: null };
    const { rerender } = renderNav();
    expect(screen.getAllByLabelText(/Go to your dashboard/i).length).toBeGreaterThan(0);

    // Simulate signOut clearing context
    authState.user = null;
    authState.profile = null;
    rerender(
      <MemoryRouter>
        <ApexNavbar />
      </MemoryRouter>,
    );

    expect(screen.queryByLabelText(/Go to your dashboard/i)).toBeNull();
    expect(screen.getAllByText(/Sign In/i).length).toBeGreaterThan(0);
  });
});
