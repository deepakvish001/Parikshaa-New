import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useProblemNotes, readAllProblemNotes } from "../useProblemNotes";

const KEY = "parikshaa:coding-problem-notes:v1";

describe("useProblemNotes — clear/delete", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("clear() removes the note from storage and resets state to empty", () => {
    localStorage.setItem(KEY, JSON.stringify({ "two-sum": "hello" }));

    const { result } = renderHook(() => useProblemNotes("two-sum"));
    expect(result.current.note).toBe("hello");
    expect(result.current.savedAt).not.toBeNull();

    act(() => {
      result.current.clear();
    });

    expect(result.current.note).toBe("");
    expect(result.current.savedAt).toBeNull();
    expect(readAllProblemNotes()["two-sum"]).toBeUndefined();
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    expect(raw["two-sum"]).toBeUndefined();
  });

  it("clear() in one hook instance immediately syncs to another instance for the same slug", () => {
    localStorage.setItem(KEY, JSON.stringify({ "two-sum": "shared" }));

    const a = renderHook(() => useProblemNotes("two-sum"));
    const b = renderHook(() => useProblemNotes("two-sum"));

    expect(a.result.current.note).toBe("shared");
    expect(b.result.current.note).toBe("shared");

    act(() => {
      a.result.current.clear();
    });

    // Both instances should reflect the cleared state right away.
    expect(a.result.current.note).toBe("");
    expect(b.result.current.note).toBe("");
    expect(a.result.current.savedAt).toBeNull();
    expect(b.result.current.savedAt).toBeNull();
  });

  it("clear() does not affect notes for other slugs", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ "two-sum": "a", "add-two-numbers": "b" }),
    );

    const { result } = renderHook(() => useProblemNotes("two-sum"));
    act(() => {
      result.current.clear();
    });

    const all = readAllProblemNotes();
    expect(all["two-sum"]).toBeUndefined();
    expect(all["add-two-numbers"]).toBe("b");
  });
});

describe("useProblemNotes — dirty/autosave reset & cross-tab", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("clear() resets note text and savedAt so UI shows no 'Autosaved' or stale content", () => {
    localStorage.setItem(KEY, JSON.stringify({ "two-sum": "draft" }));
    const { result } = renderHook(() => useProblemNotes("two-sum"));

    // Simulate user typing (dirty state + autosave timestamp populated).
    act(() => {
      result.current.setNote("edited content");
    });
    expect(result.current.note).toBe("edited content");

    act(() => {
      result.current.clear();
    });

    // No stale text, no "Autosaved" indicator.
    expect(result.current.note).toBe("");
    expect(result.current.savedAt).toBeNull();
  });

  it("cross-tab: storage event for cleared key resets a mounted Notes panel instantly", () => {
    localStorage.setItem(KEY, JSON.stringify({ "two-sum": "from-other-tab" }));
    const { result } = renderHook(() => useProblemNotes("two-sum"));
    expect(result.current.note).toBe("from-other-tab");

    // Another tab clears the note — simulate the resulting storage event.
    act(() => {
      localStorage.setItem(KEY, JSON.stringify({}));
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: KEY,
          newValue: JSON.stringify({}),
          oldValue: JSON.stringify({ "two-sum": "from-other-tab" }),
        }),
      );
    });

    expect(result.current.note).toBe("");
    expect(result.current.savedAt).toBeNull();
  });
});

