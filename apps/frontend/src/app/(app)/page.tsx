'use client';

import React, { useEffect, useState, useCallback } from 'react';
import BookCard from '@/components/BookCard';
import Pagination from '@/components/Pagination';

type Book = {
  id: string;
  title: string;
  style: string;
  status: string;
  child?: { name: string };
  createdAt: string;
};

type PaginatedResponse = {
  books: Book[];
  total: number;
  page: number;
  totalPages: number;
};

const STATUSES = ['', 'DRAFT', 'GENERATING', 'REVIEW', 'COMPLETED'];
const STYLES = ['', 'WATERCOLOR', 'CARTOON', 'REALISTIC', 'PIXAR', 'SKETCH', 'MANGA', 'COMIC'];

export default function DashboardPage() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [style, setStyle] = useState('');
  const [page, setPage] = useState(1);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (style) params.set('style', style);
    params.set('page', String(page));
    params.set('limit', '10');

    try {
      const res = await fetch(`/api/books?${params}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch books:', err);
    } finally {
      setLoading(false);
    }
  }, [search, status, style, page]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Your Library</p>
        <h1 className="section-heading">My Books</h1>
        <p className="section-subtitle">
          Curate, review, and publish each story from draft to finished keepsake.
        </p>
      </div>

      <div className="paper-card mb-8 flex flex-wrap gap-3 p-4">
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[220px] rounded-xl border border-border/80 bg-background px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-xl border border-border/80 bg-background px-3 py-2 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s || 'All Status'}</option>
          ))}
        </select>
        <select
          value={style}
          onChange={(e) => { setStyle(e.target.value); setPage(1); }}
          className="rounded-xl border border-border/80 bg-background px-3 py-2 text-sm"
        >
          {STYLES.map((s) => (
            <option key={s} value={s}>{s || 'All Styles'}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading books...</p>
      ) : data && data.books.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.books.map((book) => (
              <BookCard
                key={book.id}
                id={book.id}
                title={book.title}
                style={book.style}
                status={book.status}
                childName={book.child?.name}
                createdAt={book.createdAt}
              />
            ))}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      ) : (
        <div className="paper-card text-center py-16">
          <p className="mb-4 text-muted-foreground">No books found</p>
          <a href="/books/new" className="inline-block rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Create your first book
          </a>
        </div>
      )}
    </div>
  );
}
