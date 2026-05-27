import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DashboardPage from './page';

const replace = vi.fn();
let viewParam: string | null = null;
const originalFetch = global.fetch;

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => ({
    get: (key: string) => (key === 'view' ? viewParam : null),
    toString: () => (viewParam ? `view=${viewParam}` : ''),
  }),
}));

const makePayload = () => ({
  books: [
    {
      id: 'book-1',
      title: 'My Story',
      status: 'DRAFT',
      style: 'CARTOON',
      child: { name: 'Sam' },
      createdAt: '2026-05-20T10:00:00.000Z',
      updatedAt: '2026-05-20T10:00:00.000Z',
    },
  ],
  total: 1,
  page: 1,
  totalPages: 1,
});

describe('DashboardPage view modes', () => {
  beforeEach(() => {
    viewParam = null;
    replace.mockReset();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makePayload(),
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it('defaults to grid mode when query is missing', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('books-grid-mode')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('books-list-mode')).not.toBeInTheDocument();
  });

  it('renders list mode when view=list', async () => {
    viewParam = 'list';
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('books-list-mode')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('books-grid-mode')).not.toBeInTheDocument();
  });

  it('renders grid mode when view=grid', async () => {
    viewParam = 'grid';
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('books-grid-mode')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('books-list-mode')).not.toBeInTheDocument();
  });

  it('falls back to grid mode for invalid view values', async () => {
    viewParam = 'cards';
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('books-grid-mode')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('books-list-mode')).not.toBeInTheDocument();
  });

  it('updates URL query via replace when toggling mode', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('books-grid-mode')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'List' }));
    expect(replace).toHaveBeenCalledWith('/?view=list');

    fireEvent.click(screen.getByRole('button', { name: 'Grid' }));
    expect(replace).toHaveBeenCalledWith('/?view=grid');
  });
});
