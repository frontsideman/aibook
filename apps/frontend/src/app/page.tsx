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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">My Books</h1>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s || 'All Status'}</option>
          ))}
        </select>
        <select
          value={style}
          onChange={(e) => { setStyle(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          {STYLES.map((s) => (
            <option key={s} value={s}>{s || 'All Styles'}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading books...</p>
      ) : data && data.books.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">No books found</p>
          <a href="/books/new" className="text-blue-600 hover:underline">Create your first book</a>
        </div>
      )}
    </div>
  );
}
