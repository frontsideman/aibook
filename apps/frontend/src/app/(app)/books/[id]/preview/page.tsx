'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SpreadViewer from '@/components/SpreadViewer';

type Illustration = { id: string; url?: string; prompt: string };
type Page = { id: string; pageNumber: number; textContent: string; illustrations: Illustration[] };
type BookData = {
  book: { id: string; title: string; status: string; tone?: string; style: string; pages: Page[] };
  pdfUrl?: string;
  redirectToDetail?: boolean;
};

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageFeedback, setPageFeedback] = useState<Record<number, string>>({});
  const [globalFeedback, setGlobalFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const bookResponse = await fetch(`/api/books/${params.id}`);
        if (!bookResponse.ok) throw new Error('Book not found');
        const bookJson = await bookResponse.json();
        const currentBook = bookJson.book ?? bookJson;

        if (currentBook.status !== 'REVIEW') {
          if (currentBook.status === 'COMPLETED') {
            router.replace(`/books/${params.id}`);
            return;
          }
          router.replace(`/books/${params.id}/generating`);
          return;
        }

        const previewResponse = await fetch(`/api/books/${params.id}/preview`);
        if (!previewResponse.ok) throw new Error('Preview not available');
        const previewJson = await previewResponse.json();

        if (previewJson.redirectToDetail) {
          router.replace(`/books/${params.id}`);
          return;
        }

        setData(previewJson);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    void loadPreview();
  }, [params.id, router]);

  const handleSubmitChanges = async () => {
    setSubmitting(true);
    setError('');

    for (const [pageNum, feedback] of Object.entries(pageFeedback)) {
      if (!feedback.trim()) continue;
      await fetch(`/api/books/${params.id}/pages/${pageNum}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
    }

    if (globalFeedback.trim()) {
      const res = await fetch(`/api/books/${params.id}/regenerate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentFeedback: globalFeedback }),
      });

      if (res.ok) {
        setGlobalFeedback('');
        setPageFeedback({});
        setSubmitting(false);
        setTimeout(() => {
          setLoading(true);
          void (async () => {
            try {
              const bookResponse = await fetch(`/api/books/${params.id}`);
              const bookJson = await bookResponse.json();
              const currentBook = bookJson.book ?? bookJson;
              if (currentBook.status !== 'REVIEW') {
                router.replace(`/books/${params.id}/generating`);
                return;
              }

              const previewResponse = await fetch(`/api/books/${params.id}/preview`);
              if (!previewResponse.ok) throw new Error('Preview not available');
              const previewJson = await previewResponse.json();
              if (previewJson.redirectToDetail) {
                router.replace(`/books/${params.id}`);
                return;
              }
              setData(previewJson);
            } catch {
              // Leave the current preview in place if refresh fails.
            } finally {
              setLoading(false);
            }
          })();
        }, 2000);
        return;
      }
    }

    setSubmitting(false);
  };

  const handleApprove = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/books/${params.id}/approve`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to approve book');
      router.push(`/books/${params.id}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading preview...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-muted-foreground">No preview available</p>;

  const hasFeedback = Object.values(pageFeedback).some((f) => f.trim()) || globalFeedback.trim();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="section-heading !text-3xl">{data.book.title}</h1>
          <p className="text-sm text-muted-foreground">
            {data.book.style} · {data.book.tone?.toLowerCase()}
            <span className="ml-2 rounded bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">REVIEW</span>
          </p>
        </div>
        <a href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Dashboard
        </a>
      </div>

      <SpreadViewer pages={data.book.pages} />

      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">Suggest Changes</h2>
        {data.book.pages.map((page) => (
          <div key={page.id} className="paper-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Page {page.pageNumber}</span>
              {pageFeedback[page.pageNumber]?.trim() && (
                <span className="rounded bg-accent/40 px-2 py-0.5 text-xs text-foreground">Pending edit</span>
              )}
            </div>
            <button
              onClick={() => {
                const el = document.getElementById(`feedback-${page.pageNumber}`);
                el?.classList.toggle('hidden');
              }}
              className="mb-2 inline-block text-sm text-primary hover:underline"
            >
              ✏️ Edit this page
            </button>
            <textarea
              id={`feedback-${page.pageNumber}`}
              placeholder="Describe what to change on this page..."
              value={pageFeedback[page.pageNumber] || ''}
              onChange={(e) => setPageFeedback((prev) => ({ ...prev, [page.pageNumber]: e.target.value }))}
              rows={2}
              className="mt-2 hidden w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm"
            />
          </div>
        ))}
      </div>

      <div className="paper-card mt-6 p-4">
        <h3 className="mb-2 text-sm font-medium">✏️ Global Changes</h3>
        <textarea
          placeholder="Describe changes that affect the whole book..."
          value={globalFeedback}
          onChange={(e) => setGlobalFeedback(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex gap-4">
        <button
          onClick={handleSubmitChanges}
          disabled={submitting || !hasFeedback}
          className="rounded-xl border border-primary px-6 py-2 text-sm text-primary disabled:opacity-50 hover:bg-primary/10"
        >
          {submitting ? 'Submitting...' : 'Submit Changes'}
        </button>
        <button
          onClick={handleApprove}
          disabled={submitting}
          className="rounded-xl bg-primary px-6 py-2 text-sm text-primary-foreground disabled:opacity-50 hover:opacity-90"
        >
          ✅ Approve Book
        </button>
      </div>
    </div>
  );
}
