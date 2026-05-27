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
  if (viewMode === 'list') {
    return <BooksDataTable books={books} />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="books-grid-mode">
      {books.map((book) => (
        <BookCard
          key={book.id}
          id={book.id}
          title={book.title}
          style={book.style}
          status={book.status}
          childName={book.childName}
          createdAt={book.createdAt}
        />
      ))}
    </div>
  );
}
