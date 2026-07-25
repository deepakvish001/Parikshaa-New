import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProblemNoteQuickEdit } from "../ProblemNoteQuickEdit";

const KEY = "parikshaa:coding-problem-notes:v1";

describe("ProblemNoteQuickEdit — Clear button visibility", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("hides the Clear button and keeps the empty trigger state when there is no note", async () => {
    const user = userEvent.setup();
    render(<ProblemNoteQuickEdit slug="two-sum" title="Two Sum" />);

    // Empty-state trigger uses the "Add" aria-label.
    const trigger = screen.getByRole("button", {
      name: /add personal note for two sum/i,
    });
    await user.click(trigger);

    // Popover is open, but no Clear/Delete action is available.
    expect(
      screen.getByRole("dialog", { name: /two sum/i }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: /delete note for two sum/i }),
    ).not.toBeInTheDocument();

    // Trigger stays in empty state (still "Add", not "Edit").
    expect(
      screen.queryByRole("button", { name: /edit personal note for two sum/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the Clear button once a note exists", async () => {
    localStorage.setItem(KEY, JSON.stringify({ "two-sum": "hello" }));
    const user = userEvent.setup();
    render(<ProblemNoteQuickEdit slug="two-sum" title="Two Sum" />);

    const trigger = screen.getByRole("button", {
      name: /edit personal note for two sum/i,
    });
    await user.click(trigger);

    expect(
      screen.getByRole("button", { name: /delete note for two sum/i }),
    ).toBeInTheDocument();
  });

  it("hides the Clear button again after the note is cleared from another tab", async () => {
    localStorage.setItem(KEY, JSON.stringify({ "two-sum": "hello" }));
    const user = userEvent.setup();
    render(<ProblemNoteQuickEdit slug="two-sum" title="Two Sum" />);

    await user.click(
      screen.getByRole("button", { name: /edit personal note for two sum/i }),
    );
    expect(
      screen.getByRole("button", { name: /delete note for two sum/i }),
    ).toBeInTheDocument();

    // Simulate other-tab clear.
    act(() => {
      localStorage.setItem(KEY, JSON.stringify({}));
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: KEY,
          newValue: JSON.stringify({}),
          oldValue: JSON.stringify({ "two-sum": "hello" }),
        }),
      );
    });

    // Clear button disappears; trigger falls back to empty "Add" state.
    expect(
      screen.queryByRole("button", { name: /delete note for two sum/i }),
    ).not.toBeInTheDocument();
    // Trigger button is aria-hidden by the open dialog (Radix), so we
    // verify the empty state via its label text instead of role query.
    expect(
      document.querySelector(
        'button[aria-label="Add personal note for Two Sum"]',
      ),
    ).not.toBeNull();


  });
});
