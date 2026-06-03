import { render, screen, waitFor } from '@testing-library/react';
import PreviewPage from './page';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'book-1' }),
  useRouter: () => ({ replace, push: vi.fn() }),
}));

describe('PreviewPage smoke', () => {
  it('renders preview page and actions', async () => {
    global.fetch = vi.fn().mockResolvedValue({
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
});
