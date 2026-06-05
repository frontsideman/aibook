'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Pagination from '@/components/Pagination';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import ViewModeToggle from '@/components/dashboard/ViewModeToggle';
import StatusSummary from '@/components/dashboard/StatusSummary';
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
  type DashboardBookStatus,
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

const EMPTY_COUNTS: Record<DashboardBookStatus, number> = {
  DRAFT: 0,
  GENERATING: 0,
  REVIEW: 0,
  COMPLETED: 0,
  FAILED: 0,
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
  const [type, setType] = useState('');
  const [profile, setProfile] = useState('');
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
    return applyDashboardBookFilterSort(mapped, { titleSearch: search, status, style, type, profile, sort });
  }, [data, profile, search, sort, status, style, type]);

  const profileOptions = useMemo(() => {
    const names = new Set<string>();
    if (!data) return [];
    for (const book of data.books) {
      if (book.child?.name) names.add(book.child.name);
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [data]);

  const statusCounts = useMemo(() => {
    if (!data) return EMPTY_COUNTS;
    const counts = { ...EMPTY_COUNTS };
    for (const book of data.books) {
      if (book.status in counts) {
        counts[book.status as DashboardBookStatus]++;
      }
    }
    return counts;
  }, [data]);

  return (
    <div className="flex flex-col gap-5">
      <div className="relative">
        <div>
          <p className="font-mono text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Your Library</p>
          <h1 className="mt-1 font-display text-4xl font-semibold text-foreground sm:text-5xl">My Books</h1>
          <p className="mt-2 max-w-2xl text-base text-muted-foreground">
            Curate, review, and publish each story from draft to finished keepsake.
          </p>
        </div>
        <div className="absolute right-0 top-12">
          <ViewModeToggle viewMode={viewMode} />
        </div>
      </div>

      <StatusSummary counts={statusCounts} />

      <DashboardFilters
        search={search}
        status={status}
        style={style}
        type={type}
        profile={profile}
        profiles={profileOptions}
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
        onTypeChange={(value) => {
          setType(value);
          setPage(1);
        }}
        onProfileChange={(value) => {
          setProfile(value);
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
          {data ? (
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalItems={data.total}
              onPageChange={setPage}
            />
          ) : null}
        </>
      ) : (
        <DashboardEmptyState />
      )}
    </div>
  );
}
