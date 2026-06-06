import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CreateBookPage from './page';

const createFetchMock = (responses: Record<string, Response>) =>
  vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    const pathname = new URL(url, 'http://localhost').pathname;
    const response = responses[pathname];

    if (!response) {
      throw new Error(`Unexpected fetch request: ${pathname}`);
    }

    return response;
  });

describe('CreateBookPage', () => {
  it('disables submit until profile and story are selected', async () => {
    global.fetch = createFetchMock({
      '/api/child-profiles': {
        ok: true,
        json: async () => [{ id: 'p1', name: 'Nina', age: 7 }],
      } as Response,
    });

    render(<CreateBookPage />);

    const submit = await screen.findByRole('button', { name: 'Disabled' });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Nina/ }));
    fireEvent.change(screen.getByLabelText('Story'), { target: { value: 'Cinderella' } });

    const createButton = screen.getByRole('button', { name: 'Create Book' });
    expect(createButton).toBeEnabled();
  });

  it('supports preset selection and free text in combobox', async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      const pathname = new URL(url, 'http://localhost').pathname;

      if (pathname === '/api/child-profiles') {
        return {
          ok: true,
          json: async () => [{ id: 'p1', name: 'Nina', age: 7 }],
        } as Response;
      }

      if (pathname === '/api/stories') {
        return {
          ok: true,
          json: async () => [{ title: 'Little Red Riding Hood' }],
        } as Response;
      }

      if (pathname === '/api/books/generate') {
        return {
          ok: true,
          json: async () => ({ bookId: 'b1' }),
        } as Response;
      }

      throw new Error(`Unexpected fetch request: ${pathname}`);
    });

    render(<CreateBookPage />);

    await screen.findByRole('button', { name: /Nina/ });
    fireEvent.click(screen.getByRole('button', { name: /Nina/ }));

    const storyInput = screen.getByLabelText('Story') as HTMLInputElement;

    fireEvent.change(storyInput, { target: { value: 'Little Red Riding Hood' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Book' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/books/generate',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    fireEvent.change(storyInput, { target: { value: 'My custom bedtime story' } });
    expect(storyInput.value).toBe('My custom bedtime story');
  });

  it('shows an error message when book generation fails', async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      const pathname = new URL(url, 'http://localhost').pathname;

      if (pathname === '/api/child-profiles') {
        return {
          ok: true,
          json: async () => [{ id: 'p1', name: 'Nina', age: 7 }],
        } as Response;
      }

      if (pathname === '/api/books/generate') {
        return {
          ok: false,
          json: async () => ({ message: 'Generation failed' }),
        } as Response;
      }

      throw new Error(`Unexpected fetch request: ${pathname}`);
    });

    render(<CreateBookPage />);

    fireEvent.click(await screen.findByRole('button', { name: /Nina/ }));
    fireEvent.change(screen.getByLabelText('Story'), { target: { value: 'Broken Story' } });

    fireEvent.click(screen.getByRole('button', { name: 'Create Book' }));

    expect(await screen.findByText('Failed to create book')).toBeInTheDocument();
  });

  it('uses semantic theme-safe surfaces for selectable cards, chips, and summary panel', async () => {
    global.fetch = createFetchMock({
      '/api/child-profiles': {
        ok: true,
        json: async () => [{ id: 'p1', name: 'Nina', age: 7 }],
      } as Response,
    });

    render(<CreateBookPage />);

    const profileButton = await screen.findByRole('button', { name: /Nina/ });
    fireEvent.click(profileButton);
    fireEvent.click(screen.getByRole('button', { name: 'Watercolor' }));

    expect(profileButton).toHaveClass('bg-secondary', 'border-primary');
    expect(screen.getByRole('button', { name: 'Cartoon' })).toHaveClass(
      'bg-card',
      'text-foreground',
    );

    const summaryHeading = screen.getByRole('heading', { name: 'Summary' });
    const summaryPanel = summaryHeading.parentElement?.parentElement;
    expect(summaryPanel).toHaveClass('paper-card');
    expect(screen.getByText('First Draft').parentElement).toHaveClass('bg-secondary');
  });
});
