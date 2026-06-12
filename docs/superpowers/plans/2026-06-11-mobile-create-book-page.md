# Mobile Create Book Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a 480px wide mobile version of the "Create Book" page in `aibook.pen` using a vertical layout and 2-column grids for selections.

**Architecture:** A top-level frame with `layout: "vertical"`, containing an instance of the Mobile Header, section headers, and nested 2-column grid frames for profile/theme selections.

**Tech Stack:** Pencil MCP (batch_design), Design Tokens ($ab-*).

---

### Task 1: Initialize Mobile Frame & Header

**Files:**
- Modify: `docs/design/aibook.pen` (via batch_design)

- [ ] **Step 1: Find empty space and insert the root frame**
Find space for a 480x1200 frame. Insert it with `placeholder: true`, `clip: true`, and `$ab-bg` background.

- [ ] **Step 2: Insert Mobile Header instance**
Use the `MZQ6S` component ID to insert a `ref` at the top of the frame. Set its width to `fill_container`.

- [ ] **Step 3: Add Hero Title**
Insert a text node "Создать новую сказку" using `$ab-font-display` and `fontSize: 32`.

---

### Task 2: Implement Child Selection Section

**Files:**
- Modify: `docs/design/aibook.pen` (via batch_design)

- [ ] **Step 1: Add Section Title**
Insert text "Для кого история?" (18px, Semi-bold).

- [ ] **Step 2: Create 2-column Grid Container**
Insert a frame with `layout: "vertical"` (to hold rows) or use a horizontal layout with specific widths. Since Pencil layout doesn't wrap, I'll create row frames manually.

- [ ] **Step 3: Insert Profile Card Mockups**
Add 2-3 rows of profile cards (using 2-column layout). Each card should have `$ab-surface` background and `$ab-radius-md`.

---

### Task 3: Implement Story Prompt Section

**Files:**
- Modify: `docs/design/aibook.pen` (via batch_design)

- [ ] **Step 1: Add Section Title**
Insert text "О чем будет сказка?" (18px, Semi-bold).

- [ ] **Step 2: Create Textarea Input**
Insert a frame with height ~120, `fill_container` width, `$ab-input` fill, and `$ab-border` stroke. Add a placeholder text inside.

---

### Task 4: Implement Theme Selection Section

**Files:**
- Modify: `docs/design/aibook.pen` (via batch_design)

- [ ] **Step 1: Add Section Title**
Insert text "Выберите тему" (18px, Semi-bold).

- [ ] **Step 2: Create 2-column Grid for Themes**
Insert 2-3 rows of theme cards. Each card with a placeholder image/icon and label.

---

### Task 5: Implement Language & Action Button

**Files:**
- Modify: `docs/design/aibook.pen` (via batch_design)

- [ ] **Step 1: Add Language Selection**
Insert a label "Язык сказки" and a selection field (instance or styled frame).

- [ ] **Step 2: Add Primary Action Button**
Insert a full-width button "Создать книгу" using `$ab-primary` background, `$ab-radius-lg`, and centered white text.

- [ ] **Step 3: Final Polish & Unset Placeholder**
Review the layout, adjust gaps/paddings (e.g., `gap: 32` between sections), and set `placeholder: false`.

---

### Verification
- [ ] Check 480px width constraint.
- [ ] Verify 2-column grid layout for profiles and themes.
- [ ] Ensure all design tokens ($ab-*) are correctly applied.
- [ ] Take a screenshot of the new mobile frame and compare with the desktop version for functional parity.
