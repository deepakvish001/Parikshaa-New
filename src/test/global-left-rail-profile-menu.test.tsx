import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import GlobalLeftRail from "@/components/GlobalLeftRail";

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

// The rail may pull XP badge data — stub if present.
vi.mock("@/components/XPLevelBadge", () => ({
  default: () => null,
}));

describe("GlobalLeftRail profile menu", () => {
  const openMenu = () => {
    render(
      <MemoryRouter>
        <GlobalLeftRail />
      </MemoryRouter>,
    );
    // The avatar trigger opens the popover
    const trigger = screen.getByRole("button", { name: /open profile menu|profile/i });
    fireEvent.click(trigger);
  };

  it("does NOT render Buganizer, Troubleshooting, or New Features", () => {
    openMenu();
    expect(screen.queryByText("Buganizer")).not.toBeInTheDocument();
    expect(screen.queryByText("Troubleshooting")).not.toBeInTheDocument();
    expect(screen.queryByText("New Features")).not.toBeInTheDocument();
  });
});
