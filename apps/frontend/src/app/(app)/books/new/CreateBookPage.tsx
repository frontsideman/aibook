'use client';

import { useEffect, useState } from 'react';
import { CreateBookForm } from '@/components/books/CreateBookForm';

type ChildProfile = {
  id: string;
  name: string;
  age: number;
};

export default function CreateBookPage() {
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [generationSettingsWarning, setGenerationSettingsWarning] = useState('');

  useEffect(() => {
    fetch('/api/child-profiles')
      .then((response) => response.json())
      .then((data) => setProfiles(data))
      .catch(() => setProfiles([]));
  }, []);

  useEffect(() => {
    fetch('/api/settings/generation')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load generation settings');
        }

        return response.json();
      })
      .catch(() => {
        setGenerationSettingsWarning(
          'Generation settings could not be loaded. The create flow will use the default values.',
        );
      });
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      <h1 className="section-heading">Create New Book</h1>
      <p className="section-subtitle">Choose profile and story to generate a book.</p>
      <CreateBookForm profiles={profiles} generationSettingsWarning={generationSettingsWarning} />
    </div>
  );
}
