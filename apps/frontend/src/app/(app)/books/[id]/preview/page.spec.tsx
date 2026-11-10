import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    const reviewBookResponse = {
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
    } as Response;

    vi.mocked(fetch).mockImplementation(async () => reviewBookResponse);

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

  it('combines page notes with global feedback before regenerating', async () => {
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.endsWith('/regenerate') && init?.method === 'PATCH') {
        return { ok: true, json: async () => ({ status: 'REGENERATING' }) } as Response;
      }

      if (url.endsWith('/preview')) {
        return {
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
        } as Response;
      }

      return {
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
      } as Response;
    });

    render(<PreviewPage />);

    await screen.findByText('Test Book');

    fireEvent.change(screen.getByLabelText('Feedback for page 1'), {
      target: { value: 'Add a dragon' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('Describe changes that affect the whole book...'),
      {
        target: { value: 'Make it shorter' },
      }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Submit Changes' }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/books/book-1/generating');
    });

    const regenerateCall = vi
      .mocked(fetch)
      .mock.calls.find(([input]) => String(input).endsWith('/regenerate'));
    const body = JSON.parse(String((regenerateCall?.[1] as RequestInit | undefined)?.body));

    expect(body.parentFeedback).toContain('Make it shorter');
    expect(body.parentFeedback).toContain('Page 1: Add a dragon');
  });
});
