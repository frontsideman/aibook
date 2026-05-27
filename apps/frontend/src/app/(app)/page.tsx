'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Pagination from '@/components/Pagination';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import ViewModeToggle from '@/components/dashboard/ViewModeToggle';
import BooksListGrid from '@/components/dashboard/BooksListGrid';
import {
  DashboardLoadingState,
  DashboardErrorState,
  DashboardEmptyState,
} from '@/components/dashboard/DashboardStates';
import {
  applyDashboardBookFilterSort,
  toDashboardBookViewModel,
  type DashboardBookApiModel,
} from '@/lib/books-view-model';

type PaginatedResponse = {
  books: DashboardBookApiModel[];
  total: number;
  page: number;
  totalPages: number;
};

type ViewMode = 'grid' | 'list';

const isPaginatedResponse = (value: unknown): value is PaginatedResponse => {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Record<string, unknown>;
  return (
    Array.isArray(payload.books) &&
    typeof payload.total === 'number' &&
    typeof payload.page === 'number' &&
    typeof payload.totalPages === 'number'
  );
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const requestedView = searchParams.get('view');
  const viewMode: ViewMode = requestedView === 'list' ? 'list' : 'grid';

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [style, setStyle] = useState('');
  const [sort, setSort] = useState<'updated' | 'title'>('updated');
  const [page, setPage] = useState(1);
  const latestRequestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchBooks = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++latestRequestIdRef.current;

    setLoading(true);
    setError(false);

    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (style) params.set('style', style);
    params.set('page', String(page));
    params.set('limit', '10');

    try {
      const res = await fetch(`/api/books?${params}`, { signal: controller.signal });
      if (requestId !== latestRequestIdRef.current) return;
      if (!res.ok) {
        setData(null);
        setError(true);
        return;
      }

      const json = await res.json();
      if (requestId !== latestRequestIdRef.current) return;
      if (isPaginatedResponse(json)) {
        setData(json);
      } else {
        setData(null);
        setError(true);
      }
    } catch {
      if (controller.signal.aborted || requestId !== latestRequestIdRef.current) {
        return;
      }
      setData(null);
      setError(true);
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [search, status, style, page]);

  useEffect(() => {
    fetchBooks();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchBooks]);

  const visibleBooks = useMemo(() => {
    if (!data) return [];
    const mapped = data.books.map(toDashboardBookViewModel);
    return applyDashboardBookFilterSort(mapped, { sort });
  }, [data, sort]);

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Your Library</p>
        <h1 className="section-heading">My Books</h1>
        <p className="section-subtitle">
          Curate, review, and publish each story from draft to finished keepsake.
        </p>
      </div>

      <div className="mb-4 flex justify-end">
        <ViewModeToggle viewMode={viewMode} />
      </div>

      <DashboardFilters
        search={search}
        status={status}
        style={style}
        sort={sort}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        onStyleChange={(value) => {
          setStyle(value);
          setPage(1);
        }}
        onSortChange={setSort}
      />

      {loading ? (
        <DashboardLoadingState />
      ) : error ? (
        <DashboardErrorState onRetry={fetchBooks} />
      ) : visibleBooks.length > 0 ? (
        <>
          <BooksListGrid books={visibleBooks} viewMode={viewMode} />
          {data ? <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} /> : null}
        </>
      ) : (
        <DashboardEmptyState />
      )}
    </div>
  );
}
