'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Pagination from '@/components/Pagination';
import BooksDataTable from '@/components/dashboard/BooksDataTable';
import { LibraryTopHeader } from '@/components/dashboard/LibraryTopHeader';
import ViewModeToggle from '@/components/dashboard/ViewModeToggle';
import StatusSummary from '@/components/dashboard/StatusSummary';
import BooksListGrid from '@/components/dashboard/BooksListGrid';
import LibraryFilterBar from '@/components/dashboard/LibraryFilterBar';
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
import { useHeader } from '@/components/app-shell/HeaderContext';

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
    if (type) params.set('type', type);
    if (profile) params.set('childName', profile);
    params.set('page', String(page));
    params.set('limit', '10');

    try {
      const res = await fetch(`/api/books?${params}`, {
        signal: controller.signal,
      });
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
  }, [search, status, style, type, profile, page]);

  useEffect(() => {
    fetchBooks();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchBooks]);

  const visibleBooks = useMemo(() => {
    if (!data) return [];
    const mapped = data.books.map(toDashboardBookViewModel);
    return applyDashboardBookFilterSort(mapped, {
      titleSearch: search,
      status,
      style,
      sort,
    });
  }, [data, search, sort, status, style]);

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

  const { setHeader } = useHeader();
  React.useEffect(() => {
    setHeader(<LibraryTopHeader />);
    return () => setHeader(null);
  }, [setHeader]);

  return (
    <div className='flex flex-col gap-[20px]'>
      <div className='relative'>
        <div className='max-w-[780px] space-y-2'>
          <p className='font-mono text-[12px] font-semibold uppercase text-primary'>YOUR LIBRARY</p>
          <h1 className='font-display text-[48px] font-semibold text-foreground'>My Books</h1>
          <p className='font-sans text-[16px] font-normal text-muted-foreground'>
            Curate, review, and publish each story from draft to finished keepsake.
          </p>
        </div>
      </div>

      <StatusSummary counts={statusCounts} />

      <div className='flex items-center justify-end'>
        <ViewModeToggle viewMode={viewMode} />
      </div>

      <LibraryFilterBar
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
          {viewMode === 'grid' ? (
            <section className='flex flex-col gap-[14px]'>
              <div className='flex h-[34px] items-center justify-between'>
                <p className='text-[15px] font-extrabold text-foreground'>Table view</p>
                <p className='text-[13px] text-muted-foreground'>
                  Dense scanning for status and action queues
                </p>
              </div>

              <BooksDataTable books={visibleBooks} />

              {data ? (
                <Pagination
                  page={data.page}
                  totalPages={data.totalPages}
                  totalItems={data.total}
                  onPageChange={setPage}
                />
              ) : null}
            </section>
          ) : (
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
          )}
        </>
      ) : (
        <DashboardEmptyState />
      )}
    </div>
  );
}
