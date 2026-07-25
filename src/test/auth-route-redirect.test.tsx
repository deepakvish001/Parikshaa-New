import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";

/**
 * Guardrail: legacy /auth links must redirect to /login (the real page).
 * If someone re-introduces a <Route path="/auth" /> pointing elsewhere,
 * or removes the redirect, this test fails.
 */
describe("/auth legacy redirect", () => {
  const renderAt = (path: string) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<div>LOGIN_PAGE</div>} />
          <Route path="/auth/callback" element={<div>CALLBACK_PAGE</div>} />
          <Route path="/auth" element={<Navigate to="/login" replace />} />
          <Route path="/auth/*" element={<Navigate to="/login" replace />} />
        </Routes>
      </MemoryRouter>,
    );

  it("redirects /auth to /login", () => {
    renderAt("/auth");
    expect(screen.getByText("LOGIN_PAGE")).toBeInTheDocument();
  });

  it("redirects unknown /auth/* to /login", () => {
    renderAt("/auth/signin");
    expect(screen.getByText("LOGIN_PAGE")).toBeInTheDocument();
  });

  it("keeps /auth/callback working", () => {
    renderAt("/auth/callback");
    expect(screen.getByText("CALLBACK_PAGE")).toBeInTheDocument();
  });
});
