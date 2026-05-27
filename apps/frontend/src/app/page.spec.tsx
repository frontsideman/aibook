import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from './page';

describe('DashboardPage smoke', () => {
  it('renders dashboard heading', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ books: [], total: 0, page: 1, totalPages: 1 }),
    } as Response);

    render(<DashboardPage />);

    expect(screen.getByText('My Books')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('No books found')).toBeInTheDocument();
    });
  });
});
