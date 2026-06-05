import { render, screen, waitFor } from '@testing-library/react';
import BookDetailPage from './page';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'book-1' }),
  useRouter: () => ({ replace, push: vi.fn() }),
}));

describe('BookDetailPage', () => {
  beforeEach(() => {
    replace.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders completed book details from the canonical book endpoint', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
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

    expect(screen.queryByRole('button', { name: 'Download PDF' })).not.toBeInTheDocument();
  });

  it('redirects review books to the preview route', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        book: {
          id: 'book-1',
          title: 'Review Book',
          status: 'REVIEW',
          style: 'CARTOON',
          pages: [],
        },
      }),
    } as Response);

    render(<BookDetailPage />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/books/book-1/preview');
    });
  });
});
