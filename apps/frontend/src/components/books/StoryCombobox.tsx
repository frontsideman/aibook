'use client';

import { useMemo } from 'react';
import { Check, ChevronDown } from 'lucide-react';
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
      <div className="flex items-center gap-2">
        <ComboboxInput
          aria-label="Story"
          placeholder="Search for a story or type your own"
        />
        <ComboboxTrigger asChild>
          <Button type="button" variant="outline" size="icon-sm" aria-label="Toggle story suggestions">
            <ChevronDown className="size-4" />
          </Button>
        </ComboboxTrigger>
      </div>
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item} value={item}>
              {item}
              {value === item ? <Check className="size-4" /> : null}
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
