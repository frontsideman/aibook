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
    fetch(`/api/books/${params.id}/preview`)
      .then((r) => {
        if (!r.ok) throw new Error('Preview not available');
        return r.json();
      })
      .then((json) => {
        if (json.redirectToDetail) {
          router.replace(`/books/${params.id}`);
          return;
        }
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
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
          fetch(`/api/books/${params.id}/preview`)
            .then((r) => r.json())
            .then((json) => {
              if (json.redirectToDetail) {
                router.replace(`/books/${params.id}`);
                return;
              }
              setData(json);
              setLoading(false);
            })
            .catch(() => setLoading(false));
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

  if (loading) return <p className="text-gray-500">Loading preview...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-gray-500">No preview available</p>;

  const hasFeedback = Object.values(pageFeedback).some((f) => f.trim()) || globalFeedback.trim();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{data.book.title}</h1>
          <p className="text-sm text-gray-500">
            {data.book.style} · {data.book.tone?.toLowerCase()}
            <span className="ml-2 text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-800 rounded">REVIEW</span>
          </p>
        </div>
        <a href="/" className="text-sm text-gray-600 hover:text-gray-900">← Back to Dashboard</a>
      </div>

      <SpreadViewer pages={data.book.pages} />

      <div className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold">Suggest Changes</h2>
        {data.book.pages.map((page) => (
          <div key={page.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Page {page.pageNumber}</span>
              {pageFeedback[page.pageNumber]?.trim() && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Pending edit</span>
              )}
            </div>
            <button
              onClick={() => {
                const el = document.getElementById(`feedback-${page.pageNumber}`);
                el?.classList.toggle('hidden');
              }}
              className="text-sm text-blue-600 hover:underline mb-2 inline-block"
            >
              ✏️ Edit this page
            </button>
            <textarea
              id={`feedback-${page.pageNumber}`}
              placeholder="Describe what to change on this page..."
              value={pageFeedback[page.pageNumber] || ''}
              onChange={(e) => setPageFeedback((prev) => ({ ...prev, [page.pageNumber]: e.target.value }))}
              rows={2}
              className="hidden w-full border rounded-lg px-3 py-2 text-sm mt-2"
            />
          </div>
        ))}
      </div>

      <div className="mt-6 border rounded-lg p-4">
        <h3 className="text-sm font-medium mb-2">✏️ Global Changes</h3>
        <textarea
          placeholder="Describe changes that affect the whole book..."
          value={globalFeedback}
          onChange={(e) => setGlobalFeedback(e.target.value)}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

      <div className="mt-6 flex gap-4">
        <button
          onClick={handleSubmitChanges}
          disabled={submitting || !hasFeedback}
          className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm disabled:opacity-50 hover:bg-blue-50"
        >
          {submitting ? 'Submitting...' : 'Submit Changes'}
        </button>
        <button
          onClick={handleApprove}
          disabled={submitting}
          className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-green-700"
        >
          ✅ Approve Book
        </button>
      </div>
    </div>
  );
}
