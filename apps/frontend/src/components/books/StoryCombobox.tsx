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

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

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
      <div className="relative flex items-center gap-2">
        <ComboboxInput
          aria-label="Story"
          placeholder="Search story ideas, themes, or prompts"
          className="h-12 rounded-xl bg-ab-input px-10 ring-3 ring-transparent transition-[box-shadow] focus:ring-ab-focus focus:outline-none"
        />
        <Search className="pointer-events-none absolute left-3 size-[17px] text-ab-muted" />
        <ComboboxTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute right-1 text-ab-muted hover:text-ab-text"
            aria-label="Toggle story suggestions"
          >
            <ChevronDown className="size-4" />
          </Button>
        </ComboboxTrigger>
      </div>
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem
              key={item}
              value={item}
              className="flex items-center gap-2.5 px-2.5 py-2.5"
            >
              <BookOpenIcon className="size-4 shrink-0 text-ab-muted" />
              <span className="flex-1 truncate">{item}</span>
              {value === item ? <Check className="size-4 shrink-0 text-ab-primary" /> : null}
            </ComboboxItem>
          )}
        </ComboboxList>
        {filtered.length > 0 && canLoadMore && onLoadMore ? (
          <Button type="button" variant="outline" className="mt-1 w-full" onClick={onLoadMore} disabled={loading}>
            {loading ? 'Loading...' : 'Load more'}
          </Button>
        ) : null}
      </ComboboxContent>
      <p className="text-sm text-ab-muted">
        {loading ? 'Loading story suggestions...' : 'Showing popular stories from the library.'}
      </p>
    </Combobox>
  );
}
