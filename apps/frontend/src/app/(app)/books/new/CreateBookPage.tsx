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

  useEffect(() => {
    fetch('/api/child-profiles')
      .then((response) => response.json())
      .then((data) => setProfiles(data))
      .catch(() => setProfiles([]));
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      <h1 className="section-heading">Create New Book</h1>
      <p className="section-subtitle">Choose profile and story to generate a book.</p>
      <CreateBookForm profiles={profiles} />
    </div>
  );
}
