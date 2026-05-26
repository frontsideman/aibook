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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Create New Book</h1>

      {/* Step indicators */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-2 rounded-full ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Select a Child Profile</h2>
          {profiles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No profiles yet</p>
              <a href="/profiles" className="text-blue-600 hover:underline">Create a profile first</a>
            </div>
          ) : (
            <>
              <ProfileSelector profiles={profiles} selectedId={selectedProfileId} onSelect={setSelectedProfileId} />
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedProfileId}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Choose Story Source</h2>
          <div className="space-y-4">
            <label className={`block p-4 rounded-lg border cursor-pointer ${storyType === 'AI_ADAPTED' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <input type="radio" name="storyType" value="AI_ADAPTED" checked={storyType === 'AI_ADAPTED'} onChange={() => setStoryType('AI_ADAPTED')} className="mr-2" />
              <span className="font-medium">Based on a known story</span>
              <p className="text-sm text-gray-500 mt-1">Adapt a classic fairy tale or enter your own story name</p>
            </label>
            {storyType === 'AI_ADAPTED' && (
              <div className="ml-6 space-y-2">
                <input
                  type="text"
                  placeholder="Search for a story or type your own..."
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                {storySuggestions.length > 0 && (
                  <div className="border rounded-lg max-h-40 overflow-y-auto">
                    {storySuggestions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStoryTitle(s.title)}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-b-0"
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <label className={`block p-4 rounded-lg border cursor-pointer ${storyType === 'MANUAL' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <input type="radio" name="storyType" value="MANUAL" checked={storyType === 'MANUAL'} onChange={() => setStoryType('MANUAL')} className="mr-2" />
              <span className="font-medium">My own story</span>
              <p className="text-sm text-gray-500 mt-1">Provide your own story content to create a book</p>
            </label>
            {storyType === 'MANUAL' && (
              <textarea
                placeholder="Paste your story here..."
                value={userContent}
                onChange={(e) => setUserContent(e.target.value)}
                rows={8}
                className="ml-6 w-full border rounded-lg px-3 py-2 text-sm"
              />
            )}
          </div>
          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Back</button>
            <button
              onClick={() => setStep(3)}
              disabled={storyType === 'AI_ADAPTED' ? !storyTitle : !userContent}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Configure & Generate</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Comments</label>
              <textarea
                placeholder="Tell us what to change about the story, what to emphasize, or any special requests..."
                value={parentComments}
                onChange={(e) => setParentComments(e.target.value)}
                rows={4}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
                <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  {TONES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  {STYLES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep(2)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Back</button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-blue-600 text-white px-8 py-2 rounded-lg disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Story'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
