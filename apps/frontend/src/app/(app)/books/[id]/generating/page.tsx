'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

type Book = { id: string; title: string; status: string; style?: string };

const MAX_RETRIES = 150;
const POLL_INTERVAL_MS = 2000;

export default function GeneratingPage() {
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState('');
  const [pollingStopped, setPollingStopped] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [pollRun, setPollRun] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    setPollingStopped(false);

    const poll = async () => {
      if (cancelled) return;
      if (attempts >= MAX_RETRIES) {
        setPollingStopped(true);
        return;
      }
      attempts += 1;

      try {
        const res = await fetch(`/api/books/${params.id}`);
        if (!res.ok) throw new Error('Book not found');

        const json = await res.json();
        const currentBook: Book = json.book ?? json;
        if (cancelled) return;

        setBook(currentBook);
        setError('');

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
      } catch (fetchError) {
        if (cancelled) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Book status is unavailable');
      }

      if (!cancelled) {
        timer = setTimeout(() => {
          void poll();
        }, POLL_INTERVAL_MS);
      }
    };

    void poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [params.id, router, pollRun]);

  const handleRetry = async () => {
    setRetrying(true);
    setError('');

    try {
      if (book?.status !== 'FAILED') {
        setPollRun((run) => run + 1);
        return;
      }

      const response = await fetch(`/api/books/${params.id}/regenerate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentFeedback: '' }),
      });

      if (!response.ok) throw new Error('Failed to restart generation');

      setBook((current) => (current ? { ...current, status: 'GENERATING' } : current));
      setPollRun((run) => run + 1);
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : 'Failed to restart generation');
    } finally {
      setRetrying(false);
    }
  };

  const isFailed = book?.status === 'FAILED' || pollingStopped;

  return (
    <div className='mx-auto flex max-w-2xl flex-col items-center py-16 text-center'>
      <div className='paper-card w-full p-8'>
        <p className='mb-3 text-xs uppercase text-muted-foreground'>
          {isFailed ? 'Generation Failed' : 'Generating'}
        </p>
        <h1 className='section-heading text-3xl!'>
          {book?.title ?? 'Your book is being prepared'}
        </h1>
        {isFailed ? (
          <>
            <p className='mt-4 text-sm text-red-600'>
              {book?.status === 'FAILED'
                ? 'The generation process failed. You can try again or go back to the dashboard.'
                : 'Generation is taking longer than expected. You can keep waiting or restart it.'}
            </p>
            {error && <p className='mt-4 text-sm text-red-600'>{error}</p>}
            <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center'>
              <button
                onClick={handleRetry}
                disabled={retrying}
                className='rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60'
              >
                {retrying ? 'Restarting...' : 'Try Again'}
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
