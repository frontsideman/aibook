import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppShell } from './AppShell';
import { navItems } from './nav-items';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('AppShell', () => {
  it('renders MVP navigation links', () => {
    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    for (const item of navItems) {
      const matchingLinks = screen.getAllByRole('link', {
        name: item.label,
      });
      expect(matchingLinks.some((link) => link.getAttribute('href') === item.href)).toBe(true);
    }
  });
});
