'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StoryCombobox } from './StoryCombobox';

type ChildProfile = {
  id: string;
  name: string;
  age: number;
};

type CreateBookFormProps = {
  profiles: ChildProfile[];
};

const STORIES_PAGE_SIZE = 10;

export function CreateBookForm({ profiles }: CreateBookFormProps) {
  const router = useRouter();
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [storyQuery, setStoryQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [storySuggestions, setStorySuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [storiesOffset, setStoriesOffset] = useState(0);
  const [canLoadMoreStories, setCanLoadMoreStories] = useState(false);
  const latestQueryRef = useRef('');

  const canSubmit = useMemo(
    () => Boolean(selectedProfileId && storyQuery.trim() && !isSubmitting),
    [selectedProfileId, storyQuery, isSubmitting],
  );

  const loadStories = async ({
    query,
    append,
  }: {
    query: string;
    append: boolean;
  }) => {
    const offset = append ? storiesOffset : 0;
    setLoadingSuggestions(true);
    try {
      const response = await fetch(
        `/api/stories?search=${encodeURIComponent(query)}&limit=${STORIES_PAGE_SIZE}&offset=${offset}`,
      );
      if (!response.ok) {
        throw new Error('Failed to load stories');
      }
      const data = (await response.json()) as Array<{ title: string }>;
      const titles = data.map((item) => item.title);
      if (append) {
        setStorySuggestions((prev) => [...prev, ...titles]);
      } else {
        setStorySuggestions(titles);
      }
      setStoriesOffset(offset + titles.length);
      setCanLoadMoreStories(titles.length === STORIES_PAGE_SIZE);
    } catch {
      if (!append) {
        setStorySuggestions([]);
      }
      setCanLoadMoreStories(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    const query = storyQuery.trim();
    latestQueryRef.current = query;
    const timeoutId = setTimeout(() => {
      void loadStories({ query, append: false });
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [storyQuery]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create book');
      }

      const { bookId } = (await response.json()) as { bookId: string };
      router.push(`/books/${bookId}/preview`);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Failed to create book';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <section className="space-y-3" aria-label="Profiles">
        <h2 className="text-xl font-semibold">Select a Child Profile</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {profiles.map((profile) => {
            const isSelected = selectedProfileId === profile.id;
            return (
              <Card
                key={profile.id}
                data-selected={isSelected}
                className={isSelected ? 'ring-2 ring-primary' : ''}
              >
                <CardHeader>
                  <CardTitle className="text-base">{profile.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">Age: {profile.age}</p>
                  <Button type="button" variant={isSelected ? 'default' : 'outline'} onClick={() => setSelectedProfileId(profile.id)}>
                    {isSelected ? 'Selected' : 'Select'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-3" aria-label="Story source">
        <h2 className="text-xl font-semibold">Choose Story</h2>
        <StoryCombobox
          value={storyQuery}
          onChange={setStoryQuery}
          suggestions={storySuggestions}
          loading={loadingSuggestions}
          canLoadMore={canLoadMoreStories}
          onLoadMore={() => loadStories({ query: latestQueryRef.current, append: true })}
        />
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" disabled={!canSubmit}>
        {isSubmitting ? 'Creating...' : 'Create Book'}
      </Button>
    </form>
  );
}
