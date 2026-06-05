# Create Book Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Create Book page to match the Pencil design, implementing a two-column layout with progress bar, style/tone selectors, and summary panel.

**Architecture:** Restructure CreateBookPage into a two-column flex layout (workspace left, summary panel right). Extract sub-components: ProgressBar, ProfileSelector, StoryStep, StyleToneSelector, SummaryPanel. Use design tokens (`ab-*`) from globals.css consistently.

**Tech Stack:** React, Next.js, Tailwind CSS, lucide-react icons

---

## File Map

| File | Responsibility |
|------|---------------|
| `apps/frontend/src/app/(app)/books/new/CreateBookPage.tsx` | Page layout shell (two-column), state management |
| `apps/frontend/src/components/books/create-book/ProgressBar.tsx` | Progress indicator component |
| `apps/frontend/src/components/books/create-book/ProfileSelector.tsx` | Child profile cards with avatars |
| `apps/frontend/src/components/books/create-book/StoryStep.tsx` | Story search combobox wrapper |
| `apps/frontend/src/components/books/create-book/StyleToneSelector.tsx` | Pill-style style/tone selectors |
| `apps/frontend/src/components/books/create-book/SummaryPanel.tsx` | Fixed right sidebar with summary + CTA |
| `apps/frontend/src/components/books/StoryCombobox.tsx` | Update input styles to match design |
| `apps/frontend/src/app/globals.css` | Add design token utility classes if needed |

---

### Task 1: Create ProgressBar Component

**Files:**
- Create: `apps/frontend/src/components/books/create-book/ProgressBar.tsx`

- [ ] **Step 1: Create ProgressBar component**

```tsx
type ProgressBarProps = {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
  percent: number;
};

export function ProgressBar({ currentStep, totalSteps, stepLabel, percent }: ProgressBarProps) {
  return (
    <div className="rounded-2xl border border-ab-border bg-ab-card p-3.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[13px] font-extrabold text-ab-text">
          Book creation progress
        </span>
        <span className="text-xs font-bold text-ab-primary">{percent}%</span>
      </div>
      <div className="mt-2.5 h-3 overflow-hidden rounded-lg bg-ab-surface ring-1 ring-ab-border">
        <div
          className="h-full rounded-lg bg-ab-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[11px] font-bold text-ab-muted">Current: {stepLabel}</span>
        <span className="text-[11px] font-bold text-ab-muted">
          {currentStep} of {totalSteps}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify component renders**

Run: `npm run typecheck` from root
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/books/create-book/ProgressBar.tsx
git commit -m "feat(create-book): add ProgressBar component"
```

---

### Task 2: Create ProfileSelector Component

**Files:**
- Create: `apps/frontend/src/components/books/create-book/ProfileSelector.tsx`

- [ ] **Step 1: Create ProfileSelector component**

```tsx
import { User } from 'lucide-react';

type ChildProfile = {
  id: string;
  name: string;
  age: number;
};

type ProfileSelectorProps = {
  profiles: ChildProfile[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function ProfileSelector({ profiles, selectedId, onSelect }: ProfileSelectorProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-ab-text">1. Select child profile</h2>
        <button
          type="button"
          className="rounded-[9px] border border-ab-border px-3 py-2 text-[13px] font-extrabold text-ab-primary transition-colors hover:bg-ab-card"
        >
          Create Child Profile
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="flex items-center gap-3 rounded-[14px] border border-ab-border bg-[#FFF7E8] p-3.5">
          <User className="size-[22px] text-ab-primary" />
          <span className="text-sm font-extrabold text-ab-text">No child profiles yet</span>
          <button
            type="button"
            className="ml-auto rounded-[9px] bg-ab-primary px-3 py-2 text-[13px] font-extrabold text-white"
          >
            Create Child Profile
          </button>
        </div>
      ) : (
        <div className="flex gap-3.5">
          {profiles.map((profile) => {
            const isSelected = selectedId === profile.id;
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => onSelect(profile.id)}
                className={`flex flex-1 items-center gap-3.5 rounded-2xl p-4 transition-all ${
                  isSelected
                    ? 'border-2 border-ab-primary bg-[#FFF7E8] shadow-[0_8px_18px_-14px_#9B5E1A18]'
                    : 'border border-ab-border bg-ab-surface'
                }`}
              >
                <div className="flex size-[58px] shrink-0 items-center justify-center rounded-full bg-ab-accent text-sm font-bold text-white ring-1 ring-[#B98F4B]">
                  {profile.name.charAt(0)}
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-sm font-bold text-ab-text">{profile.name}</span>
                  <span className="text-xs text-ab-muted">age {profile.age}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Verify component renders**

Run: `npm run typecheck` from root
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/books/create-book/ProfileSelector.tsx
git commit -m "feat(create-book): add ProfileSelector component"
```

---

### Task 3: Create StyleToneSelector Component

**Files:**
- Create: `apps/frontend/src/components/books/create-book/StyleToneSelector.tsx`

- [ ] **Step 1: Create StyleToneSelector component**

```tsx
const STYLES = ['Watercolor', 'Cartoon', 'Realistic', 'Pixar', 'Sketch', 'Manga', 'Comic'] as const;
const TONES = ['Warm', 'Educational', 'Playful', 'Magical', 'Adventurous'] as const;

type StyleToneSelectorProps = {
  selectedStyle: string;
  selectedTone: string;
  onStyleChange: (style: string) => void;
  onToneChange: (tone: string) => void;
};

function PillOption({
  label,
  isSelected,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[18px] px-3 py-2 text-[13px] font-extrabold transition-colors ${
        isSelected
          ? 'bg-ab-primary text-white ring-1 ring-ab-primary'
          : 'bg-ab-surface text-ab-text ring-1 ring-ab-border'
      }`}
    >
      {label}
    </button>
  );
}

export function StyleToneSelector({
  selectedStyle,
  selectedTone,
  onStyleChange,
  onToneChange,
}: StyleToneSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2.5">
        <h2 className="text-base font-extrabold text-ab-text">3. Select style</h2>
        <div className="flex flex-wrap gap-2">
          {STYLES.map((style) => (
            <PillOption
              key={style}
              label={style}
              isSelected={selectedStyle === style}
              onClick={() => onStyleChange(style)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <h2 className="text-base font-extrabold text-ab-text">3. Select tone</h2>
        <div className="flex flex-wrap gap-2">
          {TONES.map((tone) => (
            <PillOption
              key={tone}
              label={tone}
              isSelected={selectedTone === tone}
              onClick={() => onToneChange(tone)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify component renders**

Run: `npm run typecheck` from root
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/books/create-book/StyleToneSelector.tsx
git commit -m "feat(create-book): add StyleToneSelector component"
```

---

### Task 4: Create SummaryPanel Component

**Files:**
- Create: `apps/frontend/src/components/books/create-book/SummaryPanel.tsx`

- [ ] **Step 1: Create SummaryPanel component**

```tsx
type SummaryPanelProps = {
  profileName: string;
  profileAge: number;
  storyTitle: string;
  style: string;
  tone: string;
  isSubmitting: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-ab-border pb-3">
      <span className="font-mono text-[11px] font-extrabold text-ab-muted">{label}</span>
      <span className="text-[15px] font-bold text-ab-text">{value}</span>
    </div>
  );
}

export function SummaryPanel({
  profileName,
  profileAge,
  storyTitle,
  style,
  tone,
  isSubmitting,
  canSubmit,
  onSubmit,
}: SummaryPanelProps) {
  return (
    <div className="flex w-[340px] shrink-0 flex-col gap-4 rounded-[18px] border border-ab-border bg-ab-surface p-5 shadow-[0_12px_24px_#3A281418]">
      <div>
        <h2 className="font-[var(--font-display)] text-[32px] font-semibold text-ab-text">
          Summary
        </h2>
        <p className="mt-1 text-[13px] text-ab-muted">
          Confirm the choices before generation.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <SummaryRow label="Profile" value={`${profileName}, age ${profileAge}`} />
        <SummaryRow label="Story" value={storyTitle || '—'} />
        <SummaryRow label="Style" value={style || '—'} />
        <SummaryRow label="Tone" value={tone || '—'} />
      </div>

      <div className="flex flex-col gap-2 rounded-[14px] border border-ab-border bg-ab-card p-3.5">
        <span className="font-mono text-[10px] font-extrabold text-ab-primary">FIRST DRAFT</span>
        <span className="font-[var(--font-display)] text-[25px] leading-tight font-semibold text-ab-text">
          {profileName && storyTitle ? `${profileName} and the ${storyTitle}` : 'Your Book Title'}
        </span>
        <div className="h-[54px] rounded-[10px] bg-[#E9C989] ring-1 ring-[#C59B58]" />
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          className="flex h-[46px] items-center justify-center rounded-xl bg-ab-primary text-[15px] font-extrabold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? 'Creating...' : 'Create Book'}
        </button>
        {!canSubmit && !isSubmitting && (
          <div className="flex h-[38px] items-center justify-center rounded-[10px] bg-[#E1D6C8]">
            <span className="text-xs font-extrabold text-[#8D8172]">Disabled</span>
          </div>
        )}
        {isSubmitting && (
          <div className="flex h-[38px] items-center justify-center gap-2 rounded-[10px] bg-ab-primary">
            <div className="size-2.5 animate-pulse rounded-full bg-white/70" />
            <span className="text-xs font-extrabold text-white">Creating</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify component renders**

Run: `npm run typecheck` from root
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/books/create-book/SummaryPanel.tsx
git commit -m "feat(create-book): add SummaryPanel component"
```

---

### Task 5: Update StoryCombobox Styles

**Files:**
- Modify: `apps/frontend/src/components/books/StoryCombobox.tsx`

- [ ] **Step 1: Update StoryCombobox input styles**

Replace the ComboboxInput wrapper and trigger with styled versions:

```tsx
'use client';

import { useMemo } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/components/ui/combobox';

type StoryComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  loading?: boolean;
  canLoadMore?: boolean;
  onLoadMore?: () => void;
};

export function StoryCombobox({
  value,
  onChange,
  suggestions,
  loading = false,
  canLoadMore = false,
  onLoadMore,
}: StoryComboboxProps) {
  const filtered = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return suggestions;
    return suggestions.filter((item) => item.toLowerCase().includes(query));
  }, [suggestions, value]);

  return (
    <Combobox items={filtered} value={value} onValueChange={onChange}>
      <div className="flex h-12 items-center gap-2.5 rounded-xl bg-ab-input px-3.5 ring-3 ring-ab-focus">
        <Search className="size-[17px] shrink-0 text-ab-muted" />
        <ComboboxInput
          aria-label="Story"
          placeholder="Search story ideas, themes, or prompts"
          className="h-full flex-1 bg-transparent text-sm text-ab-text placeholder:text-ab-muted"
        />
        <ComboboxTrigger asChild>
          <Button type="button" variant="ghost" size="icon-sm" className="text-ab-muted" aria-label="Toggle story suggestions">
            <ChevronDown className="size-4" />
          </Button>
        </ComboboxTrigger>
      </div>
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item} value={item} className="gap-2.5 px-2.5 py-2.5">
              <span className="flex size-4 shrink-0 items-center justify-center text-ab-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </span>
              {item}
              {value === item ? <Check className="size-4 ml-auto" /> : null}
            </ComboboxItem>
          )}
        </ComboboxList>
        {filtered.length > 0 && canLoadMore && onLoadMore ? (
          <Button type="button" variant="outline" className="mt-1 w-full" onClick={onLoadMore} disabled={loading}>
            {loading ? 'Loading...' : 'Load more'}
          </Button>
        ) : null}
      </ComboboxContent>
      <p className="text-sm text-muted-foreground">
        {loading ? 'Loading story suggestions...' : 'Showing popular stories from the library.'}
      </p>
    </Combobox>
  );
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npm run typecheck` from root
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/books/StoryCombobox.tsx
git commit -m "feat(create-book): update StoryCombobox to match design tokens"
```

---

### Task 6: Refactor CreateBookPage to Two-Column Layout

**Files:**
- Modify: `apps/frontend/src/app/(app)/books/new/CreateBookPage.tsx`
- Modify: `apps/frontend/src/components/books/CreateBookForm.tsx`

- [ ] **Step 1: Update CreateBookPage with layout and state**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { ProgressBar } from '@/components/books/create-book/ProgressBar';
import { ProfileSelector } from '@/components/books/create-book/ProfileSelector';
import { StoryStep } from '@/components/books/create-book/StoryStep';
import { StyleToneSelector } from '@/components/books/create-book/StyleToneSelector';
import { SummaryPanel } from '@/components/books/create-book/SummaryPanel';

type ChildProfile = {
  id: string;
  name: string;
  age: number;
};

const STEP_LABELS = ['Select child profile', 'Choose story', 'Select style & tone'];

export default function CreateBookPage() {
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [storyQuery, setStoryQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedTone, setSelectedTone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/child-profiles')
      .then((r) => r.json())
      .then((data) => setProfiles(data))
      .catch(() => setProfiles([]));
  }, []);

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);
  const currentStep = selectedProfileId ? (storyQuery ? 3 : 2) : 1;
  const percent = Math.round(((currentStep - 1) / 3) * 100);

  const canSubmit = Boolean(selectedProfileId && storyQuery.trim() && !isSubmitting);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/books/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedProfileId,
          type: 'AI_ADAPTED',
          storyTitle: storyQuery.trim(),
          style: selectedStyle || undefined,
          tone: selectedTone || undefined,
        }),
      });
      if (!response.ok) throw new Error('Failed to create book');
      const { bookId } = (await response.json()) as { bookId: string };
      window.location.href = `/books/${bookId}/generating`;
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create book');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex flex-col gap-5">
      <header className="space-y-2">
        <span className="font-mono text-xs font-extrabold uppercase text-ab-primary">
          Book creation
        </span>
        <h1 className="font-[var(--font-display)] text-[48px] font-semibold leading-tight text-ab-text">
          Create New Book
        </h1>
        <p className="max-w-2xl text-base text-ab-muted">
          Choose the essentials, then generate a first draft for review.
        </p>
      </header>

      <ProgressBar
        currentStep={currentStep}
        totalSteps={3}
        stepLabel={STEP_LABELS[currentStep - 1]}
        percent={percent}
      />

      <div className="flex gap-5">
        <main className="flex-1 space-y-5">
          <ProfileSelector
            profiles={profiles}
            selectedId={selectedProfileId}
            onSelect={setSelectedProfileId}
          />

          <StoryStep value={storyQuery} onChange={setStoryQuery} />

          <StyleToneSelector
            selectedStyle={selectedStyle}
            selectedTone={selectedTone}
            onStyleChange={setSelectedStyle}
            onToneChange={setSelectedTone}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
        </main>

        <SummaryPanel
          profileName={selectedProfile?.name ?? '—'}
          profileAge={selectedProfile?.age ?? 0}
          storyTitle={storyQuery}
          style={selectedStyle}
          tone={selectedTone}
          isSubmitting={isSubmitting}
          canSubmit={canSubmit}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create StoryStep wrapper component**

```tsx
// apps/frontend/src/components/books/create-book/StoryStep.tsx
import { StoryCombobox } from '@/components/books/StoryCombobox';
import { useEffect, useRef, useState } from 'react';

const STORIES_PAGE_SIZE = 10;

type StoryStepProps = {
  value: string;
  onChange: (value: string) => void;
};

export function StoryStep({ value, onChange }: StoryStepProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [canLoadMore, setCanLoadMore] = useState(false);
  const latestQueryRef = useRef('');

  const loadStories = async ({ query, append }: { query: string; append: boolean }) => {
    const currentOffset = append ? offset : 0;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/stories?search=${encodeURIComponent(query)}&limit=${STORIES_PAGE_SIZE}&offset=${currentOffset}`,
      );
      if (!response.ok) throw new Error('Failed to load stories');
      const data = (await response.json()) as Array<{ title: string }>;
      const titles = data.map((item) => item.title);
      if (append) {
        setSuggestions((prev) => [...prev, ...titles]);
      } else {
        setSuggestions(titles);
      }
      setOffset(currentOffset + titles.length);
      setCanLoadMore(titles.length === STORIES_PAGE_SIZE);
    } catch {
      if (!append) setSuggestions([]);
      setCanLoadMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const query = value.trim();
    latestQueryRef.current = query;
    const timeoutId = setTimeout(() => {
      void loadStories({ query, append: false });
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [value]);

  return (
    <section className="space-y-3">
      <h2 className="text-base font-extrabold text-ab-text">2. Choose story</h2>
      <StoryCombobox
        value={value}
        onChange={onChange}
        suggestions={suggestions}
        loading={loading}
        canLoadMore={canLoadMore}
        onLoadMore={() => loadStories({ query: latestQueryRef.current, append: true })}
      />
    </section>
  );
}
```

- [ ] **Step 3: Remove old CreateBookForm (now replaced by inline state in CreateBookPage)**

Delete: `apps/frontend/src/components/books/CreateBookForm.tsx`

- [ ] **Step 4: Verify no type errors**

Run: `npm run typecheck` from root
Expected: No errors

- [ ] **Step 5: Run existing tests, update as needed**

Run: `npm run test` from root
Expected: Existing page.spec.tsx tests will need updates for new component structure

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/app/\(app\)/books/new/CreateBookPage.tsx \
       apps/frontend/src/components/books/create-book/ \
       apps/frontend/src/components/books/CreateBookForm.tsx
git commit -m "feat(create-book): implement two-column layout matching Pencil design"
```

---

### Task 7: Update Page Tests

**Files:**
- Modify: `apps/frontend/src/app/(app)/books/new/page.spec.tsx`

- [ ] **Step 1: Update tests for new component structure**

Update test queries to match new text content (e.g., `"1. Select child profile"`, `"2. Choose story"`, `"3. Select style"` instead of old section headings).

- [ ] **Step 2: Run tests**

Run: `npm run test` from `apps/frontend`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/app/\(app\)/books/new/page.spec.tsx
git commit -m "test(create-book): update tests for redesigned Create Book page"
```

---

### Task 8: Full Verification

- [ ] **Step 1: Run typecheck from root**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 2: Run lint from root**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Run all tests**

Run: `npm run test`
Expected: All tests pass

- [ ] **Step 4: Visual verification**

Start dev server and verify the page matches the Pencil design visually.
