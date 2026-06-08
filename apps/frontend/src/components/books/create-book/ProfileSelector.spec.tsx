import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProfileSelector } from './ProfileSelector';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('ProfileSelector redirection', () => {
  it("redirects to /profiles?new=true when 'Create Child Profile' button is clicked", () => {
    render(<ProfileSelector profiles={[]} selectedId='' onSelect={() => {}} />);

    const headerBtn = screen.getByRole('button', { name: /Create Child Profile/i });
    fireEvent.click(headerBtn);
    expect(push).toHaveBeenCalledWith('/profiles?new=true');
  });

  it("shows 'Create First Profile' button in empty state and redirects", () => {
    render(<ProfileSelector profiles={[]} selectedId='' onSelect={() => {}} />);

    const emptyStateBtn = screen.getByRole('button', { name: /Create First Profile/i });
    fireEvent.click(emptyStateBtn);
    expect(push).toHaveBeenCalledWith('/profiles?new=true');
  });
});
