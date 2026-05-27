import { render, screen, waitFor } from '@testing-library/react';
import CreateBookPage from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('CreateBookPage smoke', () => {
  it('renders create book heading', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => [],
    } as Response);

    render(<CreateBookPage />);

    expect(screen.getByText('Create New Book')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Select a Child Profile')).toBeInTheDocument();
    });
  });
});
