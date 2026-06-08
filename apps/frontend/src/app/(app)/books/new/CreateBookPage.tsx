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
  const completedRequiredFields =
    Number(Boolean(selectedProfileId)) +
    Number(Boolean(storyQuery.trim())) +
    Number(Boolean(selectedStyle));
  const percent = Math.round((completedRequiredFields / 3) * 100);
  const currentStep = completedRequiredFields === 0 ? 1 : completedRequiredFields === 1 ? 2 : 3;

  const canSubmit = Boolean(
    selectedProfileId && storyQuery.trim() && selectedStyle && !isSubmitting
  );

  const normalizedStyle = selectedStyle.toUpperCase();
  const normalizedTone = selectedTone ? selectedTone.toUpperCase() : undefined;

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
          style: normalizedStyle,
          tone: normalizedTone,
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
    <div className='mx-auto flex flex-col gap-5'>
      <header className='space-y-2'>
        <p className='font-mono text-xs font-extrabold uppercase tracking-[0.18em] text-primary'>
          BOOK CREATION
        </p>
        <h1 className='font-display text-[48px] font-semibold text-foreground'>Create New Book</h1>
        <p className='max-w-2xl text-base text-muted-foreground'>
          Choose the essentials, then generate a first draft for review.
        </p>
      </header>

      <ProgressBar
        currentStep={currentStep}
        totalSteps={3}
        stepLabel={STEP_LABELS[currentStep - 1]}
        percent={percent}
      />

      <div className='flex gap-5'>
        <main className='flex-1 space-y-5'>
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

          {error && <p className='text-sm text-red-600'>{error}</p>}
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
