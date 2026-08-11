# Design Overhaul: Coding Problem Detail View

Overhaul the `CodingProblemDetail` page and its related sub-components to achieve a high-performance, minimalist, and high-density design. The goal is a professional, modern coding environment that maximizes screen real estate and minimizes visual noise while maintaining premium aesthetics (glassmorphism, subtle gradients, and sharp typography).

## User Review Required

> [!IMPORTANT]
> This overhaul will significantly change the layout density. Are you aiming for a specific IDE-like layout (e.g., VS Code style) or a platform-specific style (e.g., LeetCode 2026)?

## Proposed Changes

### 1. High-Density Layout & Typography
- **Core Layout**: Switch to a more aggressive high-density grid. Reduce padding in side panels and the main content area to fit more information without scrolling.
- **Typography**: Unified font system using a high-contrast sans-serif for UI and a custom monospace stack (JetBrains Mono/Fira Code) for all code-related content (examples, constraints, input/output).
- **Sticky Headers**: Refine the sticky navigation to be thinner and use a pure glass effect (`backdrop-blur-xl`) with a hairline border.

### 2. Component Modernization
- **Problem Detail Header**: Move from simple badges to a "Status Bar" style. Integrate the title, difficulty, and stats into a single, cohesive header block.
- **Markdown & Code Blocks**:
  - Replace current blocky `pre` tags with "Frameless" code blocks that blend into the background.
  - Add copy buttons that only appear on hover.
  - Implement syntax highlighting for constraints and examples.
- **MCQ & Hints**: Replace large, rounded cards with sleek, interactive "Action Tiles" that take up less vertical space.

### 3. Professional "IDE" Aesthetic
- **Color Palette**: Shift away from high-contrast ambers/emeralds to a more muted, professional palette using semantic tokens. Use glows only for active states (e.g., "Solved" status).
- **Interactivity**: Add subtle micro-animations for tab switching and panel resizing.
- **Floating Action Bar**: Refine the bottom bar to be even more compact, appearing only when the user scrolls away from the top actions.

### 4. Codeforces & Link Improvements
- **Uniform Link Styling**: Ensure all external links (Codeforces, etc.) use a consistent "Source" icon and professional external-link styling.
- **Deep Linking**: Improve the scroll-to-section logic for the TOC to account for varying panel heights.

## Technical Details

- **Tailwind Refactor**: Replace utility classes with scoped semantic variables where possible to maintain theme consistency.
- **Components to Update**:
  - `src/pages/library/CodingProblemDetail.tsx` (Main layout and logic)
  - `src/components/library/coding/ProblemDetailHeader.tsx` (Header density)
  - `src/components/library/coding/ProblemFormatSections.tsx` (Input/Output/Constraints)
  - `src/components/library/coding/ProblemMcqBlock.tsx` (MCQ styling)
  - `src/components/library/coding/ProblemFooterBar.tsx` (Footer density)
  - `src/components/library/coding/SubmissionDetailsDrawer.tsx` (Drawer aesthetic)
