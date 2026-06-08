'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

type Book = { id: string; title: string; status: string; style?: string };

const MAX_RETRIES = 60;

export default function GeneratingPage() {
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [pollingStopped, setPollingStopped] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let retries = 0;

    const poll = async () => {
      if (cancelled || retries >= MAX_RETRIES) {
        if (!cancelled) setPollingStopped(true);
        return;
      }

      try {
        const res = await fetch(`/api/books/${params.id}`);
        if (!res.ok) throw new Error('Book not found');
        const json = await res.json();
        const currentBook = json.book ?? json;

        if (cancelled) return;
        setBook(currentBook);
        setRetryCount(++retries);

        if (currentBook.status === 'FAILED') {
          setPollingStopped(true);
          return;
        }

        if (currentBook.status === 'REVIEW') {
          router.replace(`/books/${params.id}/preview`);
          return;
        }

        if (currentBook.status === 'COMPLETED') {
          router.replace(`/books/${params.id}`);
          return;
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message);
          setRetryCount(++retries);
        }
      }
    };

    void poll();
    const interval = window.setInterval(() => {
      void poll();
    }, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [params.id, router]);

  const handleRetry = () => {
    setPollingStopped(false);
    setRetryCount(0);
    setError('');
    void fetch(`/api/books/${params.id}/regenerate`, { method: 'PATCH' })
      .then(() => {
        // re-fetch will happen via the polling interval
      })
      .catch(() => {
        setError('Failed to trigger regeneration');
      });
  };

  const isFailed = book?.status === 'FAILED' || pollingStopped;

  return (
    <div className='mx-auto flex max-w-2xl flex-col items-center py-16 text-center'>
      <div className='paper-card w-full p-8'>
        <p className='mb-3 text-xs uppercase text-muted-foreground'>
          {isFailed ? 'Generation Failed' : 'Generating'}
        </p>
        <h1 className='section-heading !text-3xl'>
          {book?.title ?? 'Your book is being prepared'}
        </h1>
        {isFailed ? (
          <>
            <p className='mt-4 text-sm text-red-600'>
              The generation process failed. You can try again or go back to the dashboard.
            </p>
            {error && <p className='mt-4 text-sm text-red-600'>{error}</p>}
            <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center'>
              <button
                onClick={handleRetry}
                className='rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90'
              >
                Try Again
              </button>
              <Link
                href='/'
                className='rounded-xl border border-primary px-5 py-2 text-sm font-medium text-primary hover:bg-primary/10'
              >
                Go to Dashboard
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className='mt-4 text-sm text-muted-foreground'>
              This page checks for the latest book status and will redirect when the book is ready.
            </p>
            {error && <p className='mt-4 text-sm text-red-600'>{error}</p>}
            <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center'>
              <Link
                href='/'
                className='rounded-xl border border-primary px-5 py-2 text-sm font-medium text-primary hover:bg-primary/10'
              >
                Go to Dashboard
              </Link>
              <Link
                href='/books/new'
                className='rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90'
              >
                Create Another Book
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
