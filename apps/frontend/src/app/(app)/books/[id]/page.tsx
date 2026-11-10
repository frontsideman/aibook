'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Book = {
  id: string;
  title: string;
  status: string;
  style: string;
  tone?: string;
  approvedAt?: string | null;
  pages?: Array<{ id: string; pageNumber: number; textContent: string }>;
};

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');

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
        if (
          currentBook.status === 'DRAFT' ||
          currentBook.status === 'GENERATING' ||
          currentBook.status === 'FAILED'
        ) {
          router.replace(`/books/${params.id}/generating`);
          return;
        }
        setBook(currentBook);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id, router]);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    setPdfError('');

    try {
      const response = await fetch(`/api/books/${params.id}/pdf`, { method: 'POST' });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? 'PDF could not be created');
      }

      const { pdfUrl } = (await response.json()) as { pdfUrl?: string };
      if (!pdfUrl) throw new Error('PDF link is missing');

      const link = document.createElement('a');
      link.href = pdfUrl;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : 'PDF could not be created');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) return <p className='text-muted-foreground'>Loading...</p>;
  if (!book) return <p className='text-red-600'>Book not found</p>;

  return (
    <div className='mx-auto max-w-3xl'>
      <a href='/' className='mb-4 inline-block text-sm text-muted-foreground hover:text-foreground'>
        ← Back to Dashboard
      </a>

      <div className='paper-card mb-6 flex aspect-[1.414/1] items-center justify-center overflow-hidden bg-linear-to-br from-amber-100/80 via-orange-50 to-rose-100/70'>
        <div className='text-center'>
          <div className='mb-4 text-6xl'>📖</div>
          <p className='text-sm text-muted-foreground'>{book.style}</p>
        </div>
      </div>

      <h1 className='section-heading text-3xl! mb-2'>{book.title}</h1>

      <div className='mb-6 flex flex-wrap items-center gap-2'>
        <span className='rounded bg-primary/15 px-2 py-1 text-xs font-medium text-primary'>
          {book.status}
        </span>
        {book.style && (
          <span className='rounded bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground'>
            {book.style}
          </span>
        )}
        {book.tone && (
          <span className='rounded bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground'>
            {book.tone}
          </span>
        )}
        {book.status === 'COMPLETED' && (
          <button
            type='button'
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className='ml-auto rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60'
          >
            {downloadingPdf ? 'Creating PDF...' : 'Download PDF'}
          </button>
        )}
      </div>

      {pdfError && <p className='mb-4 text-sm text-red-600'>{pdfError}</p>}

      {book.approvedAt && (
        <p className='mb-6 text-sm text-muted-foreground'>
          Approved {new Date(book.approvedAt).toLocaleDateString()}
        </p>
      )}

      {book.pages && (
        <div className='mt-8 space-y-4'>
          <h2 className='text-xl font-semibold'>Pages</h2>
          {book.pages.map((page) => (
            <div key={page.id} className='paper-card p-4'>
              <p className='mb-1 text-xs text-muted-foreground'>Page {page.pageNumber}</p>
              <p className='text-sm'>{page.textContent}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
