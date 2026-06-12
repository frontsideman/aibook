'use client';

import Link from 'next/link';
import type { DashboardBookViewModel } from '@/lib/books-view-model';

type BooksDataTableProps = {
  books: DashboardBookViewModel[];
};

const STATUS_BADGE: Record<string, { text: string; border: string; label: string }> = {
  DRAFT: {
    text: 'text-muted-foreground',
    border: 'border-muted-foreground',
    label: 'DRAFT',
  },
  GENERATING: { text: 'text-info', border: 'border-info', label: 'GENERATING' },
  REVIEW: { text: 'text-warning', border: 'border-warning', label: 'REVIEW' },
  COMPLETED: {
    text: 'text-success',
    border: 'border-success',
    label: 'COMPLETED',
  },
  FAILED: {
    text: 'text-destructive',
    border: 'border-destructive',
    label: 'FAILED',
  },
};

function getStatusHref(status: string, id: string) {
  if (status === 'COMPLETED') return `/books/${id}`;
  if (status === 'REVIEW') return `/books/${id}/preview`;
  return `/books/${id}/generating`;
}

function getActionLabel(status: string) {
  if (status === 'REVIEW') return 'Review';
  if (status === 'DRAFT') return 'Edit';
  return 'Open';
}

function isPrimaryAction(status: string) {
  return status === 'REVIEW';
}

function formatDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString();
}

export default function BooksDataTable({ books }: BooksDataTableProps) {
  return (
    <div
      className='overflow-hidden rounded-[16px] border border-border bg-card'
      data-testid='books-table-mode'
    >
      {/* Desktop table view */}
      <table className='hidden w-full min-w-[680px] border-collapse text-sm md:table'>
        <caption className='sr-only'>Books in table view</caption>
        <thead>
          <tr className='border-b border-border bg-[var(--dashboard-table-header)] text-left text-[12px] font-extrabold uppercase tracking-wider text-muted-foreground'>
            <th scope='col' className='px-3 py-3 font-extrabold'>
              Title
            </th>
            <th scope='col' className='w-[120px] px-3 py-3 font-extrabold'>
              Profile
            </th>
            <th scope='col' className='w-[122px] px-3 py-3 font-extrabold'>
              Type
            </th>
            <th scope='col' className='w-[150px] px-3 py-3 font-extrabold'>
              Style
            </th>
            <th scope='col' className='w-[154px] px-3 py-3 font-extrabold'>
              Status
            </th>
            <th scope='col' className='w-[104px] px-3 py-3 font-extrabold'>
              Updated
            </th>
            <th scope='col' className='w-[98px] px-3 py-3 text-right font-extrabold'>
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {books.map((book, index) => {
            const href = getStatusHref(book.status, book.id);
            const badge = STATUS_BADGE[book.status] ?? STATUS_BADGE.DRAFT;
            const actionLabel = getActionLabel(book.status);
            const primary = isPrimaryAction(book.status);
            const isEven = index % 2 === 1;

            return (
              <tr
                key={book.id}
                className={`h-[62px] border-b border-border ${isEven ? 'bg-[var(--dashboard-table-row-alt)]' : 'bg-transparent'} last:border-b-0`}
              >
                <td className='px-3 py-3'>
                  <Link
                    href={href}
                    className='text-[13px] font-extrabold text-foreground hover:underline'
                  >
                    {book.title}
                  </Link>
                </td>
                <td className='px-3 py-3 text-[13px] font-bold text-foreground'>
                  {book.childName ?? '-'}
                </td>
                <td className='px-3 py-3 text-[13px] font-medium text-foreground'>{book.type}</td>
                <td className='px-3 py-3 text-[13px] font-medium text-foreground'>{book.style}</td>
                <td className='px-3 py-3'>
                  <span
                    className={`inline-flex h-7 items-center rounded-full border bg-[var(--dashboard-badge-bg)] px-2.5 text-[11px] font-extrabold ${badge.text} ${badge.border}`}
                  >
                    {badge.label}
                  </span>
                </td>
                <td className='px-3 py-3 text-[13px] font-medium text-foreground'>
                  {formatDate(book.updatedAt)}
                </td>
                <td className='px-3 py-3 text-right'>
                  {primary ? (
                    <Link
                      href={href}
                      className='inline-flex h-[34px] items-center rounded-4xl bg-primary px-2.5 text-[12px] font-extrabold text-primary-foreground transition hover:opacity-90'
                    >
                      {actionLabel}
                    </Link>
                  ) : (
                    <Link
                      href={href}
                      className='inline-flex h-[34px] items-center rounded-4xl border border-border bg-transparent px-2.5 text-[12px] font-extrabold text-foreground transition hover:bg-(--dashboard-table-header)'
                    >
                      {actionLabel}
                    </Link>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Mobile card view */}
      <div className='flex flex-col gap-3 p-3 md:hidden'>
        {books.map((book) => {
          const href = getStatusHref(book.status, book.id);
          const badge = STATUS_BADGE[book.status] ?? STATUS_BADGE.DRAFT;
          const actionLabel = getActionLabel(book.status);
          const primary = isPrimaryAction(book.status);

          return (
            <div
              key={book.id}
              className='flex flex-col gap-2 rounded-[12px] border border-border bg-background p-3'
            >
              <div className='flex items-start justify-between gap-2'>
                <Link
                  href={href}
                  className='text-[14px] font-extrabold text-foreground hover:underline'
                >
                  {book.title}
                </Link>
                <span
                  className={`inline-flex h-6 shrink-0 items-center rounded-full border bg-[var(--dashboard-badge-bg)] px-2 text-[10px] font-extrabold ${badge.text} ${badge.border}`}
                >
                  {badge.label}
                </span>
              </div>
              <div className='flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground'>
                <span>{book.childName ?? '-'}</span>
                <span>{book.type}</span>
                <span>{book.style}</span>
                <span>{formatDate(book.updatedAt)}</span>
              </div>
              <Link
                href={href}
                className={`inline-flex h-[34px] w-full items-center justify-center rounded-4xl text-[12px] font-extrabold transition ${
                  primary
                    ? 'bg-primary text-primary-foreground hover:opacity-90'
                    : 'border border-border bg-transparent text-foreground hover:bg-(--dashboard-table-header)'
                }`}
              >
                {actionLabel}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
