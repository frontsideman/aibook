'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Book = {
  id: string;
  title: string;
  status: string;
  style: string;
  tone?: string;
  pages?: Array<{ id: string; pageNumber: number; textContent: string }>;
};

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/books/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Book not found');
        return r.json();
      })
      .then((json) => {
        const currentBook = json.book ?? json;
        if (currentBook.status === 'REVIEW') {
          router.replace(`/books/${params.id}/preview`);
          return;
        }
        if (currentBook.status === 'DRAFT' || currentBook.status === 'GENERATING' || currentBook.status === 'FAILED') {
          router.replace(`/books/${params.id}/generating`);
          return;
        }
        setBook(currentBook);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id, router]);

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (!book) return <p className="text-red-600">Book not found</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <a href="/" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Back to Dashboard
      </a>

      <div className="paper-card mb-6 flex aspect-[1.414/1] items-center justify-center overflow-hidden bg-gradient-to-br from-amber-100/80 via-orange-50 to-rose-100/70">
        <div className="text-center">
          <div className="mb-4 text-6xl">📖</div>
          <p className="text-sm text-muted-foreground">{book.style}</p>
        </div>
      </div>

      <h1 className="section-heading !text-3xl mb-2">{book.title}</h1>

      <div className="mb-6 flex gap-2">
        <span className="rounded bg-primary/15 px-2 py-1 text-xs font-medium text-primary">{book.status}</span>
        {book.style && <span className="rounded bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">{book.style}</span>}
        {book.tone && <span className="rounded bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">{book.tone}</span>}
      </div>

      {book.pages && (
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Pages</h2>
          {book.pages.map((page) => (
            <div key={page.id} className="paper-card p-4">
              <p className="mb-1 text-xs text-muted-foreground">Page {page.pageNumber}</p>
              <p className="text-sm">{page.textContent}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
