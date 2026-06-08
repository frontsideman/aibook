import { render, screen } from '@testing-library/react';
import BooksDataTable from './BooksDataTable';

describe('BooksDataTable', () => {
  it('routes statuses the same way as the card view', () => {
    render(
      <BooksDataTable
        books={[
          {
            id: 'draft',
            title: 'Draft Book',
            type: 'AI_ADAPTED',
            style: 'CARTOON',
            status: 'DRAFT',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'review',
            title: 'Review Book',
            type: 'AI_ADAPTED',
            style: 'WATERCOLOR',
            status: 'REVIEW',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'completed',
            title: 'Completed Book',
            type: 'AI_ADAPTED',
            style: 'PIXAR',
            status: 'COMPLETED',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'failed',
            title: 'Failed Book',
            type: 'AI_ADAPTED',
            style: 'SKETCH',
            status: 'FAILED',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ]}
      />
    );

    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/books/draft/generating');
    expect(links[1]).toHaveAttribute('href', '/books/draft/generating');
    expect(links[2]).toHaveAttribute('href', '/books/review/preview');
    expect(links[3]).toHaveAttribute('href', '/books/review/preview');
    expect(links[4]).toHaveAttribute('href', '/books/completed');
    expect(links[5]).toHaveAttribute('href', '/books/completed');
    expect(links[6]).toHaveAttribute('href', '/books/failed/generating');
    expect(links[7]).toHaveAttribute('href', '/books/failed/generating');
  });
});
