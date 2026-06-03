'use client';

import Link from 'next/link';
import type { DashboardBookViewModel } from '@/lib/books-view-model';

type BooksDataTableProps = {
  books: DashboardBookViewModel[];
};

export default function BooksDataTable({ books }: BooksDataTableProps) {
  return (
    <div className="overflow-x-auto" data-testid="books-grid-mode">
      <table className="w-full min-w-[680px] border-collapse text-sm">
        <caption className="sr-only">Books in grid table view</caption>
        <thead>
          <tr className="border-b border-border/80 text-left text-muted-foreground">
            <th scope="col" className="px-4 py-3 font-medium">Title</th>
            <th scope="col" className="px-4 py-3 font-medium">Profile</th>
            <th scope="col" className="px-4 py-3 font-medium">Type</th>
            <th scope="col" className="px-4 py-3 font-medium">Style</th>
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
            <th scope="col" className="px-4 py-3 font-medium">Updated</th>
            <th scope="col" className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => {
            const href = book.status === 'COMPLETED' ? `/books/${book.id}` : `/books/${book.id}/preview`;

            return (
              <tr key={book.id} className="border-b border-border/60">
                <td className="px-4 py-3 font-medium">
                  <Link href={href} className="hover:underline">
                    {book.title}
                  </Link>
                </td>
                <td className="px-4 py-3">{book.childName ?? '-'}</td>
                <td className="px-4 py-3">{book.type}</td>
                <td className="px-4 py-3">{book.style}</td>
                <td className="px-4 py-3">{book.status}</td>
                <td className="px-4 py-3">{new Date(book.updatedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Link href={href} className="hover:underline">
                    Open
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
