'use client';

import { useEffect, useRef, useState } from 'react';
import { StoryCombobox } from '@/components/books/StoryCombobox';

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
        `/api/stories?search=${encodeURIComponent(query)}&limit=${STORIES_PAGE_SIZE}&offset=${currentOffset}`
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
    <section className='space-y-3'>
      <h2 className='text-base font-extrabold text-foreground'>2. Choose story</h2>
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
