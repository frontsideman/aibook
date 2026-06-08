import { render, screen, waitFor } from '@testing-library/react';
import GeneratingPage from './page';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'book-1' }),
  useRouter: () => ({ replace }),
}));

describe('GeneratingPage', () => {
  beforeEach(() => {
    replace.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('redirects review books to the preview route', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        book: {
          id: 'book-1',
          title: 'Test Book',
          status: 'REVIEW',
          style: 'CARTOON',
        },
      }),
    } as Response);

    render(<GeneratingPage />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/books/book-1/preview');
    });
  });

  it('shows the generating state while polling', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        book: {
          id: 'book-1',
          title: 'Test Book',
          status: 'GENERATING',
          style: 'CARTOON',
        },
      }),
    } as Response);

    render(<GeneratingPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
    });
  });

  it('renders dashboard and create-another-book actions', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        book: {
          id: 'book-1',
          title: 'Test Book',
          status: 'GENERATING',
          style: 'CARTOON',
        },
      }),
    } as Response);

    render(<GeneratingPage />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Go to Dashboard' })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: 'Create Another Book' })).toHaveAttribute(
        'href',
        '/books/new'
      );
    });
  });
});
