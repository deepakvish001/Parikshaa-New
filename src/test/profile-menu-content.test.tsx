import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProfileMenuContent } from "@/components/profile/ProfileMenuContent";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "test@example.com" },
    profile: { full_name: "Test User", avatar_url: null },
    extendedProfile: { username: "testuser" },
    signOut: vi.fn(),
  }),
}));

vi.mock("@/hooks/useThemeSync", () => ({
  useThemeSync: () => ({ resolvedTheme: "dark", setTheme: vi.fn() }),
}));

describe("ProfileMenuContent", () => {
  const setup = () =>
    render(
      <MemoryRouter>
        <ProfileMenuContent />
      </MemoryRouter>,
    );

  it("renders My Profile and Account (options 1 & 2)", () => {
    setup();
    expect(screen.getByText("My Profile")).toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();
  });

  it("does NOT render Buganizer, Troubleshooting, or New Features (options 3-5)", () => {
    setup();
    expect(screen.queryByText("Buganizer")).not.toBeInTheDocument();
    expect(screen.queryByText("Troubleshooting")).not.toBeInTheDocument();
    expect(screen.queryByText("New Features")).not.toBeInTheDocument();
  });
});
