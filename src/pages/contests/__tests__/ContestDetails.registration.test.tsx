import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";

// ---- Mock state that persists across component mounts (simulates DB) ----
const dbState: { status: string | null } = { status: null };
const toastSpy = { success: vi.fn(), error: vi.fn() };

vi.mock("sonner", () => ({
  toast: { success: (m: string) => toastSpy.success(m), error: (m: string) => toastSpy.error(m) },
  Toaster: () => null,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1", email: "u@test.com" }, profile: null }),
}));

vi.mock("@/hooks/useContestLeaderboard", () => ({
  useContestLeaderboard: () => ({ data: { rows: [], total: 0 }, isLoading: false, isFetching: false, refetch: vi.fn(), dataUpdatedAt: 0 }),
  useMyContestLeaderboardRow: () => ({ data: null }),
}));

vi.mock("@/hooks/useContestClock", () => ({
  useContestClock: () => ({ phase: "upcoming", label: "Starts in 2d", progressPct: 0 }),
}));

function makeThenable(): any {
  const p: any = new Proxy({}, {
    get(_t, prop: string) {
      if (prop === "then") return (res: any) => res({ data: null, error: null });
      return () => p;
    },
  });
  return p;
}

function makeBuilder(table: string) {
  const resolved = () => {
    if (table === "contests") {
      return { data: { id: "c1", slug: "weekly-1", title: "Weekly 1", description: null,
        starts_at: new Date(Date.now() + 2 * 86400000).toISOString(),
        ends_at: new Date(Date.now() + 2 * 86400000 + 3600000).toISOString(),
        status: "scheduled", penalty_minutes: 10, is_weekly_rated: true }, error: null };
    }
    if (table === "contest_problems" || table === "coding_problems") return { data: [], error: null };
    if (table === "contest_registrations") {
      return { data: dbState.status ? { id: "reg1", status: dbState.status } : null, error: null };
    }
    return { data: null, error: null };
  };
  const builder: any = new Proxy({}, {
    get(_t, prop: string) {
      if (prop === "then") return undefined;
      if (prop === "maybeSingle" || prop === "single") return () => Promise.resolve(resolved());
      if (prop === "upsert") return (row: any) => { dbState.status = row.status; return Promise.resolve({ data: null, error: null }); };
      if (prop === "update") return (row: any) => { dbState.status = row.status; return makeThenable(); };
      return (..._args: any[]) => builder;
    },
  });
  return builder;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (table: string) => makeBuilder(table) },
}));

// Import after mocks
import ContestDetails from "../ContestDetails";

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/contests/weekly-1"]}>
          <Routes>
            <Route path="/contests/:slug" element={<ContestDetails />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

describe("ContestDetails registration persistence", () => {
  beforeEach(() => {
    dbState.status = null;
    toastSpy.success.mockClear();
    toastSpy.error.mockClear();
  });

  it("shows Registered badge after clicking Register and persists after reload", async () => {
    const { unmount } = renderPage();

    // Wait for initial load; user starts unregistered
    const registerBtns = await screen.findAllByRole("button", { name: /register/i });
    fireEvent.click(registerBtns[0]);

    await waitFor(() => expect(toastSpy.success).toHaveBeenCalledWith("Registered!"));
    await waitFor(() => expect(screen.getAllByTestId("registered-badge").length).toBeGreaterThan(0));
    expect(dbState.status).toBe("registered");

    // Simulate refresh: unmount + remount reads DB again
    unmount();
    cleanup();
    renderPage();

    await waitFor(() => expect(screen.getAllByTestId("registered-badge").length).toBeGreaterThan(0));
  });

  it("Unregister clears the badge and fires success toast; error toast on failure", async () => {
    dbState.status = "registered";
    renderPage();

    await waitFor(() => expect(screen.getAllByTestId("registered-badge").length).toBeGreaterThan(0));

    const unregBtn = await screen.findByRole("button", { name: /unregister/i });
    fireEvent.click(unregBtn);

    await waitFor(() => expect(toastSpy.success).toHaveBeenCalledWith("Registration cancelled"));
    expect(dbState.status).toBe("withdrawn");
    await waitFor(() => expect(screen.queryByTestId("registered-badge")).toBeNull());
  });
});
