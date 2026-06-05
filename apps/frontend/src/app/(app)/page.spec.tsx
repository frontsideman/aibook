import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DashboardPage from './page';
import { HeaderProvider } from '@/components/app-shell/HeaderContext';

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

  it('defaults to table mode when query is missing', async () => {
    render(<HeaderProvider><DashboardPage /></HeaderProvider>);

    await waitFor(() => {
      expect(screen.getByTestId('books-table-mode')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('books-cards-mode')).not.toBeInTheDocument();
  });

  it('renders cards mode when view=list', async () => {
    viewParam = 'list';
    render(<HeaderProvider><DashboardPage /></HeaderProvider>);

    await waitFor(() => {
      expect(screen.getByTestId('books-cards-mode')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('books-table-mode')).not.toBeInTheDocument();
  });

  it('renders table mode when view=grid', async () => {
    viewParam = 'grid';
    render(<HeaderProvider><DashboardPage /></HeaderProvider>);

    await waitFor(() => {
      expect(screen.getByTestId('books-table-mode')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('books-cards-mode')).not.toBeInTheDocument();
  });

  it('falls back to table mode for invalid view values', async () => {
    viewParam = 'cards';
    render(<HeaderProvider><DashboardPage /></HeaderProvider>);

    await waitFor(() => {
      expect(screen.getByTestId('books-table-mode')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('books-cards-mode')).not.toBeInTheDocument();
  });

  it('updates URL query via replace when toggling mode', async () => {
    render(<HeaderProvider><DashboardPage /></HeaderProvider>);

    await waitFor(() => {
      expect(screen.getByTestId('books-table-mode')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cards' }));
    expect(replace).toHaveBeenCalledWith('/?view=list');

    fireEvent.click(screen.getByRole('button', { name: 'Table' }));
    expect(replace).toHaveBeenCalledWith('/?view=grid');
  });

  it('renders the status summary with book counts', async () => {
    render(<HeaderProvider><DashboardPage /></HeaderProvider>);

    await waitFor(() => {
      expect(screen.getByTestId('status-summary')).toBeInTheDocument();
    });
    expect(screen.getByTestId('status-card-DRAFT')).toBeInTheDocument();
    expect(screen.getByTestId('status-card-GENERATING')).toBeInTheDocument();
    expect(screen.getByTestId('status-card-REVIEW')).toBeInTheDocument();
    expect(screen.getByTestId('status-card-COMPLETED')).toBeInTheDocument();
  });
});
