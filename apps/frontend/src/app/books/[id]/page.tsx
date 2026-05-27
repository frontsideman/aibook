'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function BookDetailPage() {
  const params = useParams();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/books/${params.id}/preview`)
      .then((r) => r.json())
      .then((json) => {
        setBook(json.book || json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleDownload = () => {
    fetch(`/api/books/${params.id}/pdf`)
      .then((r) => r.json())
      .then(({ pdfUrl }) => {
        window.open(pdfUrl, '_blank');
      })
      .catch(console.error);
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (!book) return <p className="text-red-600">Book not found</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <a href="/" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">← Back to Dashboard</a>

      <div className="paper-card mb-6 flex aspect-[1.414/1] items-center justify-center overflow-hidden bg-gradient-to-br from-amber-100/80 via-orange-50 to-rose-100/70">
        <div className="text-center">
          <div className="text-6xl mb-4">📖</div>
          <p className="text-sm text-muted-foreground">{book.style}</p>
        </div>
      </div>

      <h1 className="section-heading !text-3xl mb-2">{book.title}</h1>

      <div className="flex gap-2 mb-6">
        <span className="rounded bg-primary/15 px-2 py-1 text-xs font-medium text-primary">{book.status}</span>
        {book.style && <span className="rounded bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">{book.style}</span>}
        {book.tone && <span className="rounded bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">{book.tone}</span>}
      </div>

      {book.status === 'COMPLETED' && (
        <button
          onClick={handleDownload}
          className="w-full rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90"
        >
          Download PDF
        </button>
      )}

      {book.pages && (
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Pages</h2>
          {book.pages.map((page: any) => (
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
