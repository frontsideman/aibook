import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    vi.restoreAllMocks();
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

    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
  });

  it('creates a PDF on click and opens the stored URL', async () => {
    let openedUrl = '';
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      openedUrl = this.href;
    });

    vi.mocked(fetch).mockImplementation(async (_input, init) => {
      if (init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ pdfUrl: 'http://localhost:9000/aibook/books/book-1/book.pdf' }),
        } as Response;
      }

      return {
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
      } as Response;
    });

    render(<BookDetailPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Download PDF' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/books/book-1/pdf', { method: 'POST' });
    });
    expect(clickSpy).toHaveBeenCalled();
    expect(openedUrl).toBe('http://localhost:9000/aibook/books/book-1/book.pdf');
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
