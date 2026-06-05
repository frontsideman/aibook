import { render, screen } from '@testing-library/react';
import BookCard from './BookCard';

describe('BookCard', () => {
  it('routes generating and draft books to the generating page', () => {
    render(
      <BookCard
        id="book-1"
        title="Draft Book"
        style="CARTOON"
        status="DRAFT"
        createdAt="2026-01-01T00:00:00.000Z"
      />,
    );

    expect(screen.getByRole('link')).toHaveAttribute('href', '/books/book-1/generating');
  });

  it('routes review books to the preview page and completed books to detail', () => {
    const { rerender } = render(
      <BookCard
        id="book-1"
        title="Review Book"
        style="CARTOON"
        status="REVIEW"
        createdAt="2026-01-01T00:00:00.000Z"
      />,
    );

    expect(screen.getByRole('link')).toHaveAttribute('href', '/books/book-1/preview');

    rerender(
      <BookCard
        id="book-1"
        title="Completed Book"
        style="CARTOON"
        status="COMPLETED"
        createdAt="2026-01-01T00:00:00.000Z"
      />,
    );

    expect(screen.getByRole('link')).toHaveAttribute('href', '/books/book-1');
  });
});
