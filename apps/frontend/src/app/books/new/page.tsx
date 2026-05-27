'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProfileSelector from '@/components/ProfileSelector';

type ChildProfile = {
  id: string;
  name: string;
  age: number;
  gender: string;
  interests: string[];
};

const TONES = ['WARM', 'EDUCATIONAL', 'PLAYFUL', 'MAGICAL', 'ADVENTUROUS'];
const STYLES = ['WATERCOLOR', 'CARTOON', 'REALISTIC', 'PIXAR', 'SKETCH', 'MANGA', 'COMIC'];

export default function CreateBookPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [storyType, setStoryType] = useState<'AI_ADAPTED' | 'MANUAL'>('AI_ADAPTED');
  const [storyTitle, setStoryTitle] = useState('');
  const [storySuggestions, setStorySuggestions] = useState<{ id: string; title: string }[]>([]);
  const [userContent, setUserContent] = useState('');
  const [parentComments, setParentComments] = useState('');
  const [tone, setTone] = useState('WARM');
  const [style, setStyle] = useState('WATERCOLOR');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/child-profiles')
      .then((r) => r.json())
      .then(setProfiles)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (storyTitle.length < 2) {
      setStorySuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/stories?search=${encodeURIComponent(storyTitle)}`)
        .then((r) => r.json())
        .then(setStorySuggestions)
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [storyTitle]);

  const handleGenerate = async () => {
    if (!selectedProfileId) return;
    setGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/books/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedProfileId,
          type: storyType,
          storyTitle: storyType === 'AI_ADAPTED' ? storyTitle : undefined,
          userContent: storyType === 'MANUAL' ? userContent : undefined,
          parentComments: parentComments || undefined,
          tone,
          style,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create book');
      }

      const { bookId } = await res.json();
      router.push(`/books/${bookId}/preview`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">New Story</p>
      <h1 className="section-heading mb-3">Create New Book</h1>
      <p className="section-subtitle mb-8">Shape tone, style, and source to generate a story your child will love.</p>

      {/* Step indicators */}
      <div className="mb-8 flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full ${step >= s ? 'bg-primary' : 'bg-secondary'}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="paper-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Select a Child Profile</h2>
          {profiles.length === 0 ? (
            <div className="text-center py-8">
              <p className="mb-4 text-muted-foreground">No profiles yet</p>
              <a href="/profiles" className="text-primary hover:underline">Create a profile first</a>
            </div>
          ) : (
            <>
              <ProfileSelector profiles={profiles} selectedId={selectedProfileId} onSelect={setSelectedProfileId} />
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedProfileId}
                  className="rounded-xl bg-primary px-6 py-2 text-primary-foreground disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="paper-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Choose Story Source</h2>
          <div className="space-y-4">
            <label className={`block cursor-pointer rounded-xl border p-4 ${storyType === 'AI_ADAPTED' ? 'border-primary/60 bg-secondary' : 'border-border/80'}`}>
              <input type="radio" name="storyType" value="AI_ADAPTED" checked={storyType === 'AI_ADAPTED'} onChange={() => setStoryType('AI_ADAPTED')} className="mr-2" />
              <span className="font-medium">Based on a known story</span>
              <p className="mt-1 text-sm text-muted-foreground">Adapt a classic fairy tale or enter your own story name</p>
            </label>
            {storyType === 'AI_ADAPTED' && (
              <div className="ml-6 space-y-2">
                <input
                  type="text"
                  placeholder="Search for a story or type your own..."
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm"
                />
                {storySuggestions.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-border/80 bg-card">
                    {storySuggestions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStoryTitle(s.title)}
                        className="block w-full border-b border-border/50 px-3 py-2 text-left text-sm hover:bg-secondary last:border-b-0"
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <label className={`block cursor-pointer rounded-xl border p-4 ${storyType === 'MANUAL' ? 'border-primary/60 bg-secondary' : 'border-border/80'}`}>
              <input type="radio" name="storyType" value="MANUAL" checked={storyType === 'MANUAL'} onChange={() => setStoryType('MANUAL')} className="mr-2" />
              <span className="font-medium">My own story</span>
              <p className="mt-1 text-sm text-muted-foreground">Provide your own story content to create a book</p>
            </label>
            {storyType === 'MANUAL' && (
              <textarea
                placeholder="Paste your story here..."
                value={userContent}
                onChange={(e) => setUserContent(e.target.value)}
                rows={8}
                className="ml-6 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm"
              />
            )}
          </div>
          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Back</button>
            <button
              onClick={() => setStep(3)}
              disabled={storyType === 'AI_ADAPTED' ? !storyTitle : !userContent}
              className="rounded-xl bg-primary px-6 py-2 text-primary-foreground disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="paper-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Configure & Generate</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Parent Comments</label>
              <textarea
                placeholder="Tell us what to change about the story, what to emphasize, or any special requests..."
                value={parentComments}
                onChange={(e) => setParentComments(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Tone</label>
                <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm">
                  {TONES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Style</label>
                <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm">
                  {STYLES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep(2)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Back</button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="rounded-xl bg-primary px-8 py-2 text-primary-foreground disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Story'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
