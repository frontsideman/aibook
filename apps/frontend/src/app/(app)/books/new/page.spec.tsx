import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CreateBookPage from './page';

const push = vi.fn();

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

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('CreateBookPage', () => {
  it('disables submit until profile and story are selected', async () => {
    global.fetch = createFetchMock({
      '/api/child-profiles': {
        ok: true,
        json: async () => [{ id: 'p1', name: 'Nina', age: 7 }],
      } as Response,
      '/api/settings/generation': {
        ok: true,
        json: async () => ({ llmModel: 'openai:gpt-5.4-mini', reasoningEffort: 'MEDIUM' }),
      } as Response,
      '/api/stories': {
        ok: true,
        json: async () => [],
      } as Response,
    });

    render(<CreateBookPage />);

    const submit = await screen.findByRole('button', { name: 'Create Book' });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Select' }));
    fireEvent.change(screen.getByLabelText('Story'), { target: { value: 'Cinderella' } });

    expect(screen.getByRole('button', { name: 'Create Book' })).toBeEnabled();
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

      if (pathname === '/api/settings/generation') {
        return {
          ok: true,
          json: async () => ({ llmModel: 'openai:gpt-5.4-mini', reasoningEffort: 'MEDIUM' }),
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

    await screen.findByText('Nina');
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));

    const storyInput = screen.getByLabelText('Story') as HTMLInputElement;

    fireEvent.change(storyInput, { target: { value: 'Little Red Riding Hood' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Book' }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/books/b1/generating');
    });

    fireEvent.change(storyInput, { target: { value: 'My custom bedtime story' } });
    expect(storyInput.value).toBe('My custom bedtime story');
  });

  it('shows a fallback warning when generation settings fail to load', async () => {
    global.fetch = createFetchMock({
      '/api/child-profiles': {
        ok: true,
        json: async () => [{ id: 'p1', name: 'Nina', age: 7 }],
      } as Response,
      '/api/stories': {
        ok: true,
        json: async () => [],
      } as Response,
    });

    render(<CreateBookPage />);

    expect(
      await screen.findByText('Generation settings could not be loaded. The create flow will use the default values.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Using default generation settings')).toBeInTheDocument();
  });
});
