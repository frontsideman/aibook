import { render, screen, waitFor } from '@testing-library/react';
import PreviewPage from './page';

const replace = vi.fn();
const push = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'book-1' }),
  useRouter: () => ({ replace, push }),
}));

describe('PreviewPage smoke', () => {
  beforeEach(() => {
    replace.mockReset();
    push.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders preview page and actions for review books', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          book: {
            id: 'book-1',
            title: 'Test Book',
            status: 'REVIEW',
            style: 'CARTOON',
            tone: 'PLAYFUL',
            pages: [{ id: 'p1', pageNumber: 1, textContent: 'Hello', illustrations: [] }],
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          book: {
            id: 'book-1',
            title: 'Test Book',
            status: 'REVIEW',
            style: 'CARTOON',
            tone: 'PLAYFUL',
            pages: [{ id: 'p1', pageNumber: 1, textContent: 'Hello', illustrations: [] }],
          },
        }),
      } as Response);

    render(<PreviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Submit Changes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '✅ Approve Book' })).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('redirects completed books to the detail route', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        book: {
          id: 'book-1',
          title: 'Done Book',
          status: 'COMPLETED',
          style: 'CARTOON',
          pages: [],
        },
      }),
    } as Response);

    render(<PreviewPage />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/books/book-1');
    });
  });
});
