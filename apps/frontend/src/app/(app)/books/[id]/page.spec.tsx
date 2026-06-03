import { render, screen, waitFor } from '@testing-library/react';
import BookDetailPage from './page';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'book-1' }),
}));

describe('BookDetailPage', () => {
  it('renders book detail page for existing id', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        book: {
          id: 'book-1',
          title: 'Test Book',
          status: 'COMPLETED',
          style: 'CARTOON',
          pages: [],
        },
      }),
    } as Response);

    render(<BookDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
  });
});
