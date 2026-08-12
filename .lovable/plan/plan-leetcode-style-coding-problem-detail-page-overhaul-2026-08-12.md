# Plan - LeetCode-style Coding Problem Detail Page Overhaul

## Goals
Transform `CodingProblemDetail.tsx` into a high-density, high-performance, professional coding environment that matches the LeetCode "v2" aesthetic.

## Technical Details

### 1. Unified Sticky Header
- Move `ProblemTopBar` integration to the top of `CodingProblemDetail.tsx`.
- Ensure it contains the back button, problem title (simplified), and global actions.

### 2. High-Density Layout Overhaul
- Use `ResizablePanelGroup` to create a 3-column or 2-column layout (Left: Description/Submissions, Right Top: Editor, Right Bottom: Console/TestCases).
- Switch to a "Dark Mode First" aesthetic with a deep gray/black palette (`#0a0a0c`).

### 3. Integrated Compiler & Workbench
- **Editor**: Use `MonacoEditor` with `JetBrains Mono`.
- **TestCaseWorkbench**: Integrate the console at the bottom of the right panel.
- **Compiler Logic**:
    - Implement `handleRun` and `handleSubmit` using existing `code-trace` or specialized edge functions if available.
    - Wire up `useCodeRuns` to track progress in real-time.
    - Add a "Console" drawer that slides up from the bottom right.

### 4. Component Updates
- **ProblemDetailHeader**: Refine to be even more compact, showing only essential metadata (Difficulty, Solved Status, CPU/Memory limits).
- **Tabs**: Ensure "Description", "Submissions", and "Editorial" are easily accessible in the left panel.
- **Markdown Styling**: Unified high-contrast styling for problem statements, examples, and constraints.

## User Interface

### Left Panel (Problem Details)
- High-density Markdown statement.
- Examples rendered as simple monospace blocks.
- Constraints in a compact grid.
- Bottom footer with navigation (Prev/Next).

### Right Panel (IDE)
- **Top Bar**: Language selection, Settings, Format, Fullscreen.
- **Middle**: Large Monaco Editor.
- **Bottom Bar**: Run, Submit, and a toggle for the "Console" (Test Cases).

### Console (Overlay/Bottom Section)
- Test Case input (Stdin).
- Result view (Stdout, Stderr, Expected vs Got).
- Run History.

---
Approved? (Approved)
