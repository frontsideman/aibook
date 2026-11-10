import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AuthProvider } from '@/components/auth/AuthProvider';
import { AppShell } from './AppShell';
import { HeaderProvider } from './HeaderContext';
import { navItems } from './nav-items';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('AppShell', () => {
  it('renders MVP navigation links', () => {
    const { container } = render(
      <AuthProvider>
        <HeaderProvider>
          <AppShell>
            <div>content</div>
          </AppShell>
        </HeaderProvider>
      </AuthProvider>
    );

    for (const item of navItems) {
      const matchingLinks = screen.getAllByRole('link', {
        name: item.label,
      });
      expect(matchingLinks.some((link) => link.getAttribute('href') === item.href)).toBe(true);
    }

    expect(screen.getByRole('button', { name: 'Light' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dark' })).toBeInTheDocument();
    expect(screen.getByText('Parent')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Logout' })).toBeInTheDocument();

    const sidebar = container.querySelector('[data-slot="sidebar"]');
    expect(sidebar).not.toBeNull();
    expect(sidebar?.className).toContain('md:sticky');
    expect(sidebar?.className).toContain('md:h-screen');
    expect(container.querySelector('[data-slot="sidebar-footer"]')).toBeInTheDocument();
  });
});
