'use client';

import BookCard from '@/components/BookCard';
import BooksDataTable from '@/components/dashboard/BooksDataTable';
import type { DashboardBookViewModel } from '@/lib/books-view-model';

type ViewMode = 'grid' | 'list';

type BooksListGridProps = {
  books: DashboardBookViewModel[];
  viewMode: ViewMode;
};

export default function BooksListGrid({ books, viewMode }: BooksListGridProps) {
  if (viewMode === 'grid') {
    return <BooksDataTable books={books} />;
  }

  return (
    <section className="flex flex-wrap gap-4" data-testid="books-list-mode">
      {books.map((book) => (
        <div key={book.id} className="w-full md:w-[320px]">
          <BookCard
            id={book.id}
            title={book.title}
            style={book.style}
            status={book.status}
            childName={book.childName}
            createdAt={book.createdAt}
          />
        </div>
      ))}
    </section>
  );
}
