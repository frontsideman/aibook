'use client';

import Link from 'next/link';
import type { DashboardBookViewModel } from '@/lib/books-view-model';

type BooksDataTableProps = {
  books: DashboardBookViewModel[];
};

const STATUS_BADGE: Record<string, { text: string; border: string; label: string }> = {
  DRAFT: { text: 'text-muted-foreground', border: 'border-muted-foreground', label: 'DRAFT' },
  GENERATING: { text: 'text-info', border: 'border-info', label: 'GENERATING' },
  REVIEW: { text: 'text-warning', border: 'border-warning', label: 'REVIEW' },
  COMPLETED: { text: 'text-success', border: 'border-success', label: 'COMPLETED' },
  FAILED: { text: 'text-destructive', border: 'border-destructive', label: 'FAILED' },
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
    <div data-testid="books-table-mode">
      <div className="mb-3.5 flex items-center justify-between">
        <div>
          <p className="text-[15px] font-extrabold text-foreground">Table view</p>
          <p className="text-[13px] text-muted-foreground">Dense scanning for status and action queues</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <caption className="sr-only">Books in table view</caption>
          <thead>
            <tr className="border-b border-border bg-secondary text-left text-[12px] font-extrabold uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-3 py-3 font-extrabold">Title</th>
              <th scope="col" className="w-[120px] px-3 py-3 font-extrabold">Profile</th>
              <th scope="col" className="w-[122px] px-3 py-3 font-extrabold">Type</th>
              <th scope="col" className="w-[150px] px-3 py-3 font-extrabold">Style</th>
              <th scope="col" className="w-[154px] px-3 py-3 font-extrabold">Status</th>
              <th scope="col" className="w-[104px] px-3 py-3 font-extrabold">Updated</th>
              <th scope="col" className="w-[98px] px-3 py-3 text-right font-extrabold">Action</th>
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
                  className={`border-b border-border/60 ${isEven ? 'bg-secondary/50' : ''}`}
                >
                  <td className="px-3 py-3">
                    <Link href={href} className="text-[13px] font-extrabold text-foreground hover:underline">
                      {book.title}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-[13px] font-bold text-foreground">
                    {book.childName ?? '-'}
                  </td>
                  <td className="px-3 py-3 text-[13px] font-medium text-foreground">
                    {book.type}
                  </td>
                  <td className="px-3 py-3 text-[13px] font-medium text-foreground">
                    {book.style}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex h-7 items-center rounded-full border px-2.5 text-[11px] font-extrabold ${badge.text} ${badge.border} bg-secondary`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[13px] font-medium text-foreground">
                    {formatDate(book.updatedAt)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {primary ? (
                      <Link
                        href={href}
                        className="inline-flex h-[34px] items-center rounded-[9px] bg-primary px-2.5 text-[12px] font-extrabold text-primary-foreground transition hover:opacity-90"
                      >
                        {actionLabel}
                      </Link>
                    ) : (
                      <Link
                        href={href}
                        className="inline-flex h-[34px] items-center rounded-[9px] border border-border bg-transparent px-2.5 text-[12px] font-extrabold text-foreground transition hover:bg-secondary"
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
      </div>
    </div>
  );
}
