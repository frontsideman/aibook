import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CreateBookPage from './page';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('CreateBookPage', () => {
  it('disables submit until profile and story are selected', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: async () => [{ id: 'p1', name: 'Nina', age: 7 }],
    } as Response);

    render(<CreateBookPage />);

    const submit = await screen.findByRole('button', { name: 'Create Book' });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Select' }));
    fireEvent.change(screen.getByLabelText('Story'), { target: { value: 'Cinderella' } });

    expect(screen.getByRole('button', { name: 'Create Book' })).toBeEnabled();
  });

  it('supports preset selection and free text in combobox', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ json: async () => [{ id: 'p1', name: 'Nina', age: 7 }] } as Response)
      .mockResolvedValue({ ok: true, json: async () => ({ bookId: 'b1' }) } as Response);

    render(<CreateBookPage />);

    await screen.findByText('Nina');
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));

    const storyInput = screen.getByLabelText('Story') as HTMLInputElement;

    fireEvent.change(storyInput, { target: { value: 'Little Red Riding Hood' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Book' }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/books/b1/preview');
    });

    fireEvent.change(storyInput, { target: { value: 'My custom bedtime story' } });
    expect(storyInput.value).toBe('My custom bedtime story');
  });
});
